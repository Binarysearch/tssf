import * as ts from "typescript";

function compile(fileNames: string[], options: ts.CompilerOptions): void {
  let program = ts.createProgram(fileNames, options);

  extractControllers(program);


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

function extractControllers(program: ts.Program) {
  
  const classes = getControllerClasses(program);

  classes.forEach(c => {
    console.log('Controller:  >>>>>  ', (<ts.Identifier>c.name).escapedText);
    c.forEachChild(node => {
      if (node.kind === ts.SyntaxKind.MethodDeclaration) {
        const method = (<ts.MethodDeclaration>node);
        if (isRequestProcessor(method)) {
          

          console.log('   Request:  >>> ', (<ts.Identifier>method.name).escapedText);
        }
      }
    });
  });

  
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

function isRequestProcessor(node: ts.MethodDeclaration): boolean {
  return node.decorators?.some(d => (<any>d.expression).expression.escapedText === 'Request') === true;
}
