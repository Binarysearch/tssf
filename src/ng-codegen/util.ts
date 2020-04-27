const FS = require('fs');
const PATH = require('path');

export function camelCaseToDash(str: string) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

export function dashToCamelCase(str: string) {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

export function deleteFolderRecursive(filePath: string) {
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

export function format(str: string, ...args: any) {
    let i = 0;
    return str.replace(/%s/g, () => args[i++]);
}