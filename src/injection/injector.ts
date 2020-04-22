import 'reflect-metadata';

export type Type<T> = { new(...constructorArgs: any[]): T };

const injectableDeps: Map<Type<any>, Type<any>[]> = new Map();

export interface Provider {
    provide: Type<any>;
    useClass: Type<any>;
}

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

    private static injectables: Map<Type<any>, Object> = new Map();

    static resolve<T>(type: Type<T>): T {
        const result = Injector.injectables.get(type);
        if (result) {
            return <T>result;
        } else {
            return this.create(type);
        }
    }

    private static create<T>(type: Type<T>): T {
        console.log('CREATE INJECTABLE', type);
        const dfs = (dep: Type<any>) => {
            if (Injector.injectables.has(dep)) {
                return;
            }
            const depDeps = injectableDeps.get(dep);
            if (depDeps) {
                depDeps.forEach(dfs);

                if (depDeps.length === 0) {
                    Injector.injectables.set(dep, new dep());
                } else if (depDeps.length === 1) {
                    Injector.injectables.set(dep, new dep(Injector.injectables.get(depDeps[0])));
                } else {
                    Injector.injectables.set(dep, new dep(depDeps.map(d => Injector.injectables.get(d))));
                }

                
            } else {
                throw new Error(`No se puede resulver el tipo '${dep}'`);
            }
    
        };
    
        dfs(type);

        const result = Injector.injectables.get(type);
        if (result) {
            return <T>result;
        } else {
            throw new Error(`No se puede resulver el tipo '${type}'`);
        } 
    }

}