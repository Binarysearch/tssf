import 'reflect-metadata';

export type Type<T> = { new(...constructorArgs: any[]): T };

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
    
    return constructorFunction;
}

export class Injector {

    private static injectables: Map<Type<any>, Object> = new Map();
    private static providers: Provider[];

    static resolve<T>(type: Type<T>): T {
        const result = this.getInjectable(type);
        if (result) {
            return <T>result;
        } else {
            return this.create(type);
        }
    }

    public static setProviders(providers?: Provider[]) {
        console.log('SET providers', providers);
        if (providers) {
            this.providers = providers;
        }
    }

    private static create<T>(type: Type<T>): T {
        console.log('CREATE INJECTABLE', type);
        const dfs = (dep: Type<any>) => {
            if (this.hasInjectable(dep)) {
                return;
            }
            
            const depDeps = this.getDependencies(dep);

            if (depDeps) {
                depDeps.forEach(dfs);

                if (depDeps.length === 0) {
                    this.setInjectable(dep, new dep());
                } else if (depDeps.length === 1) {
                    this.setInjectable(dep, new dep(this.getInjectable(depDeps[0])));
                } else {
                    this.setInjectable(dep, new dep(depDeps.map(d => this.getInjectable(d))));
                }

                
            } else {
                throw new Error(`No se puede resulver el tipo '${dep}'`);
            }
    
        };
    
        dfs(this.translateType(type));

        const result = this.getInjectable(type);
        if (result) {
            return <T>result;
        } else {
            throw new Error(`No se puede resulver el tipo '${type}'`);
        } 
    }

    private static translateType<T>(type: Type<T>): Type<T> {
        const replacement = this.providers?.find(p => p.provide === type);
        if (replacement) {
            return <Type<T>>replacement.useClass;
        } else {
            return type;
        }
    }

    private static hasInjectable<T>(type: Type<T>): boolean {
        return this.injectables.has(this.translateType(type));
    }

    private static setInjectable<T>(type: Type<T>, injectable: T): void {
        this.injectables.set(this.translateType(type), injectable);
    }

    private static getInjectable<T>(type: Type<T>): T {
        return <T>this.injectables.get(this.translateType(type));
    }

    private static getDependencies(type: Type<any>): Type<any>[] {
        const declaredDependencies: Type<any>[] = Reflect.getOwnMetadata('design:paramtypes', type) || [];
        if (this.providers) {
            return declaredDependencies.map(declared => this.translateType(declared));
        } else {
            return declaredDependencies;
        }
    }

}