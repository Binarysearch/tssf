import * as ts from "typescript";

interface Dto {
  name: string;
}

interface ServiceMethod {
  name: string;
  path: string;
  bodyTypeName: string | null;
  bodyParameterName: string | null;
  returnTypeName: string;
}

interface Service {
  name: string;
  methods: ServiceMethod[];
}

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
    return createService(c);
  });

  console.log(JSON.stringify(services, null, 2));
  
}

function createService(cls: ts.ClassElement): Service {
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

  return {
    name: serviceName,
    methods: serviceMethods
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

function getControllerClasses(program: ts.Program): ts.ClassElement[] {
  const result: ts.ClassElement[] = [];


  program.getSourceFiles().forEach(file => {
    file.forEachChild(node => {
      if (node.kind === ts.SyntaxKind.ClassDeclaration) {
        if (isController(<ts.ClassElement>node)) {
          result.push(<ts.ClassElement>node);
        }
      }
    });
  });


  return result;
}

function isController(node: ts.ClassElement): boolean {
  return node.decorators?.some(d => (<ts.Identifier>d.expression).escapedText === 'Controller') === true;
}

function isRequestProcessor(node: ts.Node): boolean {
  return node.decorators?.some(d => (<any>d.expression).expression.escapedText === 'Request') === true;
}
