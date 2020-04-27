import * as ts from "typescript";
import { ServiceSourceGenerator } from "./service-source-generator";
import { Service, Dto } from "./interfaces";
import { camelCaseToDash, deleteFolderRecursive } from "./util";
import { ProgramAnalizer } from "./program-analizer";
const FS = require('fs');

const file = process.argv[2];
const outputDir = process.argv[3];

if (FS.existsSync(outputDir)) {
  deleteFolderRecursive(outputDir);
}

FS.mkdirSync(outputDir);
FS.mkdirSync(outputDir + '/services');
FS.mkdirSync(outputDir + '/dtos');


createProgram(file, {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
  experimentalDecorators: true,
  emitDecoratorMetadata: true
});

function createProgram(fileName: string, options: ts.CompilerOptions): void {
  const program = ts.createProgram([fileName], options);

  const programAnalizer = new ProgramAnalizer(program);

  const services = programAnalizer.getServices();
  services.forEach(s => {
    writeService(s);
  });

  const dtos = programAnalizer.getDtos();
  dtos.forEach(dto => {
    writeDto(dto);
  });

  printDiagnostics(program);
}

function writeDto(dto: Dto) {
  FS.writeFileSync(outputDir + '/dtos/' + camelCaseToDash(dto.name) + '.ts', dto.sourceCode);
}

function writeService(service: Service) {
  const codeGen = new ServiceSourceGenerator(service);
  FS.writeFileSync(outputDir + '/services/' + camelCaseToDash(service.name) + '.ts', codeGen.generate());
}

function printDiagnostics(program: ts.Program) {
  let allDiagnostics = ts
    .getPreEmitDiagnostics(program);
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    }
    else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });
}