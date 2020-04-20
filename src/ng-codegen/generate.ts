
var fs = require('fs');
const path = require('path');

const file = process.argv[2];
const outputDir = process.argv[3];

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
} else {
    deleteFolderRecursive(outputDir);
    fs.mkdirSync(outputDir);
}

interface MethodDef {
    name: string;
    path: string;
    paramName: string;
    paramType: string;
    returnType: string;
}


fs.readFile(file, { encoding: 'utf-8' }, function (err: any, data: string) {
    if (!err) {
        const files: Set<string> = new Set();
        files.add(data);
        analizeImports(data, './src/', files);

        const dtoNames: Set<string> = new Set();
        const interfaces: Map<string, string> = new Map();
        files.forEach(f => {
            const result = analizeForControllers(f, dtoNames);
            analizeForInterfaces(f, interfaces);
            if (result) {
                console.log('   ');
                console.log('   ');
                console.log('-----------------------------------------------');
                console.log(result.content);
                fs.writeFileSync(outputDir + '/services.ts', result.content);
                console.log('-----------------------------------------------');
            }
        });

        // Eliminamos los tipos basicos
        [
            'string',
            'number',
            'boolean'
        ].forEach(e => {
            dtoNames.delete(e);
        });


        dtoNames.forEach(dtoName => {
            console.log('-----------------------------------------------');
            fs.writeFileSync(outputDir + '/dtos.ts', interfaces.get(dtoName));
            console.log(interfaces.get(dtoName));
            console.log('-----------------------------------------------');
        });

    } else {
        console.log(err);
    }
});

function analizeForInterfaces(fileContents: string, interfaces: Map<string, string>) {
    let position = 0;

    while (true) {
        const interfaceStart = fileContents.indexOf('interface ', position);

        if (interfaceStart < 0) {
            break;
        }

        const interfaceNameStart = interfaceStart + 9;
        const interfaceNameEnd = fileContents.indexOf('{', interfaceNameStart);
        const interfaceName = fileContents.slice(interfaceNameStart, interfaceNameEnd).trim();

        let interfaceEnd = interfaceNameEnd;
        let count = 1;
        let char = fileContents.charAt(interfaceEnd);
        while (count > 0) {
            interfaceEnd++;
            char = fileContents.charAt(interfaceEnd);

            if (char === '}') {
                count--;
            } else if (char === '{') {
                count++;
            }
        }

        const interfaceCode = fileContents.slice(interfaceStart, interfaceEnd + 1);
        interfaces.set(interfaceName, 'export ' + interfaceCode);


        position = interfaceEnd;
    }
}

function analizeImports(fileContents: string, currentPath: string, files: Set<string>): void {
    let position = 0;

    while (true) {
        const importStart = fileContents.indexOf('import', position);
        if (importStart < 0) {
            break;
        }
        const importEnd = fileContents.indexOf(';', importStart);
        const fromTokenStart = fileContents.indexOf('from', importStart);

        let quoteStart = fileContents.indexOf(`"`, fromTokenStart);
        let quoteEnd = fileContents.indexOf(`"`, quoteStart + 1);
        if (quoteStart < 0) {
            quoteStart = fileContents.indexOf(`'`, fromTokenStart);
            quoteEnd = fileContents.indexOf(`'`, quoteStart + 1);
        }

        const fileName = fileContents.slice(quoteStart + 1, quoteEnd);

        if (fileName.startsWith('.')) {

            const file = path.join(currentPath, fileName);
            const newPath = path.join(currentPath, fileName, '..');

            const data = fs.readFileSync(file + '.ts');

            files.add(data.toString());
            analizeImports(data.toString(), newPath, files);

        }

        position = importEnd;
    }
}

function analizeForControllers(fileContents: string, dtoNames: Set<string>): { content: string, name: string } | null{
    let position = 0;

    const controllerStart = fileContents.indexOf('@Controller', position);
    if (controllerStart < 0) {
        return null;
    }
    const classNameStart = fileContents.indexOf('class', controllerStart) + 5;
    const classNameEnd = fileContents.indexOf(`{`, classNameStart);
    const className = fileContents.slice(classNameStart, classNameEnd).trim();

    const methods: MethodDef[] = [];

    while (true) {
        const postStart = fileContents.indexOf('@Post', position);
        if (postStart < 0) {
            break;
        }

        // Obtenemos la ruta 
        const pathStart = fileContents.indexOf(`('`, postStart);
        const pathEnd = fileContents.indexOf(`')`, postStart);
        const path = fileContents.slice(pathStart + 2, pathEnd);

        // Obtenemos la signatura del metodo 
        const methodSignatureStart = pathEnd + 2;
        const methodSignatureEnd = fileContents.indexOf(`{`, methodSignatureStart);
        const methodSignature = fileContents.slice(methodSignatureStart, methodSignatureEnd).trim();

        // Obtenemos el nombre del metodo
        const methodNameEnd = methodSignature.indexOf(`(`);
        const methodName = methodSignature.slice(0, methodNameEnd).replace('public ', '').replace('async ', '');

        // Obtenemos el nombre del parametro
        const paramNameStart = methodNameEnd + 1;
        const paramNameEnd = methodSignature.indexOf(`:`, paramNameStart);
        const paramName = methodSignature.slice(paramNameStart, paramNameEnd).trim();

        // Obtenemos el tipo del parametro
        const paramTypeStart = paramNameEnd + 1;
        const paramTypeEnd = methodSignature.indexOf(`)`, paramTypeStart);
        const paramType = methodSignature.slice(paramTypeStart, paramTypeEnd).trim();

        // Obtenemos el tipo de retorno
        const returnTypeStart = methodSignature.indexOf(`:`, paramTypeEnd) + 1;
        let returnType = methodSignature.slice(returnTypeStart).trim();

        returnType = returnType + 'END';
        if (returnType.includes('Observable')) {
            returnType = returnType.replace('Observable<', '').replace('>END', '');
        } else if (returnType.includes('Promise')) {
            returnType = returnType.replace('Promise<', '').replace('>END', '');
        } else {
            returnType = returnType.replace('END', '');
        }

        methods.push({
            name: methodName,
            path: path,
            paramName: paramName,
            paramType: paramType,
            returnType: returnType
        });

        dtoNames.add(paramType);
        dtoNames.add(returnType);

        position = methodSignatureEnd;
    }

    return {
        content: createAngularService(className, methods),
        name: className
    };
}

function createAngularService(className: string, methods: MethodDef[]): string {
    const serviceName = className.includes('Controller') ? className.replace('Controller', 'Service') : className + 'Service';

    let methodsCode = methods.map(method => createMethodCode(method)).reduce((prev, curr) => {
        return `
            ${prev}
            ${curr}
        `;
    }, '');



    return `
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ${serviceName} {
    ${methodsCode}
}
    `;
}

function createMethodCode(method: MethodDef): string {



    return `
    public ${method.name}(${method.paramName}: ${method.paramType}): Observable<${method.returnType}> {
        const path = '${method.path}';
    }`;
}


function deleteFolderRecursive(filePath: string) {
    if (fs.existsSync(filePath)) {
        fs.readdirSync(filePath).forEach((file: string) => {
            const curPath = path.join(filePath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(filePath);
    }
};