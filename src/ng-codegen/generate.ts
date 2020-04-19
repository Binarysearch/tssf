
var fs = require('fs');

const file = process.argv[2];

interface MethodDef {
    name: string;
    path: string;
    paramName: string;
    paramType: string;
    returnType: string;
}


fs.readFile(file, {encoding: 'utf-8'}, function(err: any,data: string){
    if (!err) {
        console.log(analize(data));
    } else {
        console.log(err);
    }
});

function analize(fileContents: string): string {
    const size = fileContents.length;
    let position = 0;

    const controllerStart = fileContents.indexOf('@Controller', position);
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
        const returnType = methodSignature.slice(returnTypeStart).trim();


        methods.push({
            name: methodName,
            path: path,
            paramName: paramName,
            paramType: paramType,
            returnType: returnType
        });

        position = methodSignatureEnd;
    }

    return createAngularService(className, methods);
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

    let returnType = method.returnType + 'END';
    if (returnType.includes('Observable')) {
        returnType = returnType.replace('Observable<', '').replace('>END', '');
    } else if (returnType.includes('Promise')) {
        returnType = returnType.replace('Promise<', '').replace('>END', '');
    } else {
        returnType = returnType.replace('END', '');
    }

    return `
    public ${method.name}(${method.paramName}: ${method.paramType}): Observable<${returnType}> {
        const path = '${method.path}';
    }`;
}