import 'reflect-metadata';

export type Type<T> = { new(...constructorArgs: any[]): T };

const injectableDeps: Map<Type<any>, Type<any>[]> = new Map();

const injectables: Map<Type<any>, Object> = new Map();

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

    injectableDeps.set(constructorFunction, params || []);
    
    return constructorFunction;
}

export class Injector {

    static resolve<T>(type: Type<T>): T {
        const result = injectables.get(type);
        if (result) {
            return <T>result;
        } else {
            return this.create(type);
        }
    }

    static create<T>(type: Type<T>): T {
        console.log('CREATE INJECTABLE', type);
        const dfs = (dep: Type<any>) => {
            if (injectables.has(dep)) {
                return;
            }
            const depDeps = injectableDeps.get(dep);
            if (depDeps) {
                depDeps.forEach(dfs);

                if (depDeps.length === 0) {
                    injectables.set(dep, new dep());
                } else if (depDeps.length === 1) {
                    injectables.set(dep, new dep(injectables.get(depDeps[0])));
                } else {
                    injectables.set(dep, new dep(depDeps.map(d => injectables.get(d))));
                }

                
            } else {
                throw new Error(`No se puede resulver el tipo '${dep}'`);
            }
    
        };
    
        dfs(type);

        const result = injectables.get(type);
        if (result) {
            return <T>result;
        } else {
            throw new Error(`No se puede resulver el tipo '${type}'`);
        } 
    }

}