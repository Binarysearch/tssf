import * as ts from "typescript";
import { ServiceSourceGenerator } from "./service-source-generator";
import { Service, ServiceMethod, Dto } from "./interfaces";
import { camelCaseToDash } from "./util";
import { ProgramAnalizer } from "./program-analizer";
const FS = require('fs');

const PATH = require('path');

const file = process.argv[2];
const outputDir = process.argv[3];

if (FS.existsSync(outputDir)) {
  deleteFolderRecursive(outputDir);
}

FS.mkdirSync(outputDir);
FS.mkdirSync(outputDir + '/services');
FS.mkdirSync(outputDir + '/dtos');

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
  const programAnalizer = new ProgramAnalizer(program);

  const services = programAnalizer.getServices();

  const dtos = programAnalizer.getDtos();

  generateFrontCode(services, dtos);
}

function generateFrontCode(services: Service[], dtos: Map<string, Dto>) {
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