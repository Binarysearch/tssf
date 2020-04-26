import * as ts from "typescript";
import { ServiceSourceGenerator } from "./service-source-generator";
import { Service, ServiceMethod } from "./interfaces";
import { camelCaseToDash } from "./util";
const FS = require('fs');

const PATH = require('path');

const file = process.argv[2];
const outputDir = process.argv[3];

if (FS.existsSync(outputDir)) {
    deleteFolderRecursive(outputDir);
}

FS.mkdirSync(outputDir);
FS.mkdirSync(outputDir+'/services');
FS.mkdirSync(outputDir+'/dtos');

function compile(fileNames: string[], options: ts.CompilerOptions): void {
  let program = ts.createProgram(fileNames, options);

  generateServices(program);


  let allDiagnostics = ts
    .getPreEmitDiagnostics(program);


  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });

  process.exit(0);
}

compile(process.argv.slice(2), {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
  experimentalDecorators: true,
  emitDecoratorMetadata: true
});

function generateServices(program: ts.Program) {
  const classes = getControllerClasses(program);

  const services: Service[] = classes.map(c => {
    return createService(c.class, c.file);
  });

  const dtos: Map<string, { name: string, sourceCode: string }> = new Map();

  services.forEach(s => {
    s.dtos.forEach(dto => {
      const source = program.getSourceFile(dto.location+'.ts');
      source?.forEachChild(node => {
        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
          const name = (<ts.InterfaceDeclaration>node).name.text.toString();
          if (name === dto.name) {
            const id = dto.id;
            const dtoSourceCode = source.text.slice(node.pos, node.end);
            dtos.set(id, {name: dto.name, sourceCode: dtoSourceCode });
          }
        }
      })
    });
  });
  
  generateFrontCode(services, dtos);
}

function generateFrontCode(services: Service[], dtos: Map<string, { name: string, sourceCode: string }>){
  services.forEach(s => {
    writeService(s);
  });
  dtos.forEach(dto => {
    writeDto(dto);
  });

}

function writeDto(dto: { name: string; sourceCode: string; }) {
  FS.writeFileSync(outputDir + '/dtos/' + camelCaseToDash(dto.name) + '.ts', dto.sourceCode);
}

function writeService(service: Service) {
  const codeGen = new ServiceSourceGenerator(service);
  FS.writeFileSync(outputDir + '/services/' + camelCaseToDash(service.name) + '.ts', codeGen.generate());
}



function createService(cls: ts.ClassElement, file: ts.SourceFile): Service {
  const imports = getImports(file);
  
  const controllerName = (<ts.Identifier>cls.name).escapedText.toString();
  const serviceName = getServiceName(controllerName);
  
  const classChildren: ts.Node[] = [];

  cls.forEachChild(child => {
    classChildren.push(child);
  });

  const serviceMethods: ServiceMethod[] = classChildren
  
    .filter(node => node.kind === ts.SyntaxKind.MethodDeclaration)
    .filter(node => isRequestProcessor(node))
    .map(node => {
      const method = (<ts.MethodDeclaration>node);
      return createServiceMethod(method);
    });

  const dtos: Map<string, { name: string, location: string, id: string }> = new Map();

  serviceMethods.forEach(m => {
    if (m.bodyTypeName) {
      const bodyDtoName = m.bodyTypeName;
      const bodyDtoLocation = PATH.join(file.fileName, '..', imports.get(m.bodyTypeName)?.path);
      const bodyDtoId = bodyDtoName + ':' + bodyDtoLocation;
      const bodyDto = { name: m.bodyTypeName, location: bodyDtoLocation, id: bodyDtoId };
      dtos.set(bodyDtoId, bodyDto);
    }
    const returnDtoName = m.returnTypeName;
    const returnDtoLocation = PATH.join(file.fileName, '..', imports.get(m.returnTypeName)?.path);
    const returnDtoId = returnDtoName + ':' + returnDtoLocation;
    const returnDto = { name: returnDtoName, location: returnDtoLocation, id: returnDtoId };
    dtos.set(returnDtoId, returnDto);
  });

  return {
    name: serviceName,
    methods: serviceMethods,
    dtos: dtos
  }
}

function createServiceMethod(method: ts.MethodDeclaration): ServiceMethod {
  
  const methodName = (<ts.Identifier>method.name).escapedText.toString();
  const path = extractRequestProcessorPath(method);
  const bodyTypeName = extractBodyTypeName(method);
  const bodyParameterName = extractBodyParameterName(method);
  const returnTypeName = extractReturnTypeName(method);
  

  return {
    name: methodName,
    path: path,
    bodyTypeName: bodyTypeName,
    bodyParameterName: bodyParameterName,
    returnTypeName: returnTypeName,
  }
}

function extractBodyParameterName(method: ts.MethodDeclaration): string | null {
  if (method.parameters.length === 1) {
    return null;
  }

  const parameter: ts.ParameterDeclaration = method.parameters[1];

  return (<ts.Identifier>parameter.name).escapedText.toString();
}

function extractBodyTypeName(method: ts.MethodDeclaration): string | null {
  if (method.parameters.length === 1) {
    return null;
  }

  const parameter: ts.ParameterDeclaration = method.parameters[1];
  const typeName = (<ts.TypeReferenceNode>parameter.type).typeName;

  return (<ts.Identifier>typeName).escapedText.toString();
}

function extractReturnTypeName(method: ts.MethodDeclaration): string {
  
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

function extractRequestProcessorPath(method: ts.MethodDeclaration): string {
  const decorator = method.decorators?.find(d => (<any>d.expression).expression.escapedText === 'Request');
  if (!decorator) {
    throw "El metodo no tiene decorator 'Request'";
  }

  const decoratorExpression = <ts.CallExpression>decorator.expression;
  const decoratorArgument = <ts.StringLiteral>decoratorExpression.arguments[0];

  return decoratorArgument.text;
}

function getServiceName(controllerName: string): string {
  if (controllerName.includes('Controller')) {
    return controllerName.replace('Controller', 'Service');
  } else {
    return controllerName + 'Service';
  }
}

function getControllerClasses(program: ts.Program): { class: ts.ClassElement, file: ts.SourceFile }[] {
  const result: { class: ts.ClassElement, file: ts.SourceFile }[] = [];

  program.getSourceFiles().forEach(file => {
    file.forEachChild(node => {
      if (node.kind === ts.SyntaxKind.ClassDeclaration) {
        if (isController(<ts.ClassElement>node)) {
          result.push({ class: <ts.ClassElement>node, file: file});
        }
      }
    });
  });


  return result;
}

function getInterfaces(program: ts.Program): ts.InterfaceDeclaration[] {
  const result: ts.InterfaceDeclaration[] = [];


  program.getSourceFiles().forEach(file => {
    file.forEachChild(node => {
      if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        result.push(<ts.InterfaceDeclaration>node);
      }
    });
  });


  return result;
}

function getImports(file: ts.SourceFile): Map<string, { name: string, path: string }> {
  const result: Map<string, { name: string, path: string }> = new Map();

  file.forEachChild(node => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      const importExpression = <ts.ImportDeclaration>node;
      if (importExpression.importClause?.namedBindings?.kind === ts.SyntaxKind.NamedImports) {
        const path = (<ts.StringLiteral>importExpression.moduleSpecifier).text;
        importExpression.importClause?.namedBindings.elements.forEach(e => {
          const name = e.name.escapedText.toString();
          result.set(name, {
            name: name,
            path: path
          });
        });
      }
    }
  });

  return result;
}

function isController(node: ts.ClassElement): boolean {
  return node.decorators?.some(d => (<ts.Identifier>d.expression).escapedText === 'Controller') === true;
}

function isRequestProcessor(node: ts.Node): boolean {
  return node.decorators?.some(d => (<any>d.expression).expression.escapedText === 'Request') === true;
}

function deleteFolderRecursive(filePath: string) {
  if (FS.existsSync(filePath)) {
    FS.readdirSync(filePath).forEach((file: string) => {
          const curPath = PATH.join(filePath, file);
          if (FS.lstatSync(curPath).isDirectory()) {
              deleteFolderRecursive(curPath);
          } else {
            FS.unlinkSync(curPath);
          }
      });
      FS.rmdirSync(filePath);
  }
};