import ts from "typescript";
import { Service, ServiceMethod, Dto } from "./interfaces";
const PATH = require('path');

export class ProgramAnalizer {

    private services: Service[] = [];
    private dtos: Map<string, { name: string, sourceCode: string }> = new Map();

    constructor(private program: ts.Program) {
        this.analize();
    }

    private analize(): void {
        this.extractServices();
        this.extractDtos();
    }

    private extractServices() {
        const classes = this.getControllerClasses();
        this.services = classes.map(c => {
            return this.createService(c.class, c.file);
        });
    }

    private extractDtos() {
        this.services.forEach(s => {
            s.importedDtos.forEach(dto => {
                const source = this.program.getSourceFile(dto.location + '.ts');
                if (source) {
                    source.forEachChild(node => {
                        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
                            const name = (<ts.InterfaceDeclaration>node).name.text.toString();
                            if (name === dto.name) {
                                const id = dto.id;
                                const dtoSourceCode = source.text.slice(node.pos, node.end);
                                this.dtos.set(id, { name: dto.name, sourceCode: dtoSourceCode });
                            }
                        }
                    });
                }
            });
        });
    }

    public getServices(): Service[] {
        return this.services;
    }

    public getDtos(): Map<string, Dto> {
        return this.dtos;
    }

    private getControllerClasses(): { class: ts.ClassElement, file: ts.SourceFile }[] {
        const result: { class: ts.ClassElement, file: ts.SourceFile }[] = [];

        this.program.getSourceFiles().forEach(file => {
            file.forEachChild(node => {
                if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                    if (this.isController(<ts.ClassElement>node)) {
                        result.push({ class: <ts.ClassElement>node, file: file });
                    }
                }
            });
        });


        return result;
    }

    private isController(node: ts.ClassElement): boolean {
        if (!node.decorators) {
            return false;
        }
        return node.decorators.some(d => (<ts.Identifier>d.expression).escapedText === 'Controller') === true;
    }

    private createService(cls: ts.ClassElement, file: ts.SourceFile): Service {
        const imports = this.getImports(file);

        const controllerName = (<ts.Identifier>cls.name).escapedText.toString();
        const serviceName = this.getServiceName(controllerName);

        const classChildren: ts.Node[] = [];

        cls.forEachChild(child => {
            classChildren.push(child);
        });

        const serviceMethods: ServiceMethod[] = classChildren

            .filter(node => node.kind === ts.SyntaxKind.MethodDeclaration)
            .filter(node => this.isRequestProcessor(node))
            .map(node => {
                const method = (<ts.MethodDeclaration>node);
                return this.createServiceMethod(method);
            });

        const dtos: Map<string, { name: string, location: string, id: string }> = new Map();

        serviceMethods.forEach(m => {
            if (m.bodyTypeName) {
                const impor = imports.get(m.bodyTypeName);
                if (impor) {
                    const bodyDtoName = m.bodyTypeName;
                    const bodyDtoLocation = PATH.join(file.fileName, '..', impor.path);
                    const bodyDtoId = bodyDtoName + ':' + bodyDtoLocation;
                    const bodyDto = { name: m.bodyTypeName, location: bodyDtoLocation, id: bodyDtoId };
                    dtos.set(bodyDtoId, bodyDto);
                }
            }
            const returnDtoName = m.returnTypeName;
            const impor = imports.get(m.returnTypeName);
            if (impor) {
                const returnDtoLocation = PATH.join(file.fileName, '..', impor.path);
                const returnDtoId = returnDtoName + ':' + returnDtoLocation;
                const returnDto = { name: returnDtoName, location: returnDtoLocation, id: returnDtoId };
                dtos.set(returnDtoId, returnDto);
            }
        });

        return {
            name: serviceName,
            methods: serviceMethods,
            importedDtos: dtos
        }
    }

    private createServiceMethod(method: ts.MethodDeclaration): ServiceMethod {

        const methodName = (<ts.Identifier>method.name).escapedText.toString();
        const path = this.extractRequestProcessorPath(method);
        const bodyTypeName = this.extractBodyTypeName(method);
        const bodyParameterName = this.extractBodyParameterName(method);
        const returnTypeName = this.extractReturnTypeName(method);


        return {
            name: methodName,
            path: path,
            bodyTypeName: bodyTypeName,
            bodyParameterName: bodyParameterName,
            returnTypeName: returnTypeName,
        }
    }


    private extractBodyParameterName(method: ts.MethodDeclaration): string | null {
        if (method.parameters.length === 1) {
            return null;
        }

        const parameter: ts.ParameterDeclaration = method.parameters[1];

        return (<ts.Identifier>parameter.name).escapedText.toString();
    }

    private extractBodyTypeName(method: ts.MethodDeclaration): string | null {
        if (method.parameters.length === 1) {
            return null;
        }

        const parameter: ts.ParameterDeclaration = method.parameters[1];
        const typeName = (<ts.TypeReferenceNode>parameter.type).typeName;

        return (<ts.Identifier>typeName).escapedText.toString();
    }

    private extractReturnTypeName(method: ts.MethodDeclaration): string {

        const typeName = (<ts.TypeReferenceNode>method.type).typeName;
        const isObservable = (<ts.Identifier>typeName).escapedText.toString() === 'Observable';

        const typeArguments = (<ts.TypeReferenceNode>method.type).typeArguments;
        if (!typeArguments || !isObservable) {
            throw "El tipo de retorno de un metodo controlador debe ser un observable";
        }

        const argumentType = (<ts.TypeReferenceNode>typeArguments[0]);
        const argumentTypeName = (<ts.TypeReferenceNode>argumentType).typeName;

        return (<ts.Identifier>argumentTypeName).escapedText.toString();
    }

    private extractRequestProcessorPath(method: ts.MethodDeclaration): string {
        if (!method.decorators) {
            throw "El metodo no tiene decorator 'Request'";
        }
        const decorator = method.decorators.find(d => (<any>d.expression).expression.escapedText === 'Request');
        if (!decorator) {
            throw "El metodo no tiene decorator 'Request'";
        }

        const decoratorExpression = <ts.CallExpression>decorator.expression;
        const decoratorArgument = <ts.StringLiteral>decoratorExpression.arguments[0];

        return decoratorArgument.text;
    }

    private getServiceName(controllerName: string): string {
        if (controllerName.includes('Controller')) {
            return controllerName.replace('Controller', 'Service');
        } else {
            return controllerName + 'Service';
        }
    }

    private getImports(file: ts.SourceFile): Map<string, { name: string, path: string }> {
        const result: Map<string, { name: string, path: string }> = new Map();

        file.forEachChild(node => {
            if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                const importExpression = <ts.ImportDeclaration>node;
                if (importExpression.importClause && importExpression.importClause.namedBindings) {
                    if (importExpression.importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
                        const path = (<ts.StringLiteral>importExpression.moduleSpecifier).text;
                        if (importExpression.importClause) {
                            importExpression.importClause.namedBindings.elements.forEach(e => {
                                const name = e.name.escapedText.toString();
                                result.set(name, {
                                    name: name,
                                    path: path
                                });
                            });
                        }
                    }
                }
            }
        });

        return result;
    }

    private isRequestProcessor(node: ts.Node): boolean {
        if (!node.decorators) {
            return false;
        }
        return node.decorators.some(d => (<any>d.expression).expression.escapedText === 'Request') === true;
    }
}