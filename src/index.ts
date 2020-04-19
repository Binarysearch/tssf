import { TestController } from './example/test-controller';


const controllers = [
    //TestController
];



var fs = require('fs');

fs.readFile('./src/example/test-controller.ts', {encoding: 'utf-8'}, function(err: any,data: string){
    if (!err) {
        analize(data);
    } else {
        console.log(err);
    }
});

function analize(fileContents: string) {
    const size = fileContents.length;
    let position = 0;
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

        console.log('path:', path);
        console.log('methodSignature:', methodSignature);

        position = methodSignatureEnd;
    }
    
    //console.log(fileContents);
}