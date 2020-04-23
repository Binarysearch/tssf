import { Type } from "./injector";


export function Injectable<U extends Type<any>>(constructorFunction: U) {

    const params: Type<any>[] = Reflect.getOwnMetadata('design:paramtypes', constructorFunction);

    if (params) {
        params.forEach(p => {
            if (!p) {
                console.error('Se ha detectado un ciclo de dependencias: ', constructorFunction);
                throw new Error('Ciclo.');
            }
        });
    }
    
    return constructorFunction;
}