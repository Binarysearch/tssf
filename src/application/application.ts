import { Type, Injector, Provider } from "../injection/injector";
import { controllers } from "../controller/controller";

export interface ApplicationConfig {
    controllers: Type<any>[],
    providers?: Provider[];
}

export function Application(config: ApplicationConfig) {
    return function Application<U extends Type<any>>(constructor: U) {

        // Creamos los controllers
        config.controllers.forEach((controller) => {

            const params: Type<any>[] = Reflect.getOwnMetadata('design:paramtypes', controller);

            if (!params || params.length === 0) {
                controllers.set(controller.prototype, new controller());
            } else if (params.length === 1) {
                controllers.set(controller.prototype, new controller(Injector.resolve(params[0])));
            } else {
                controllers.set(controller.prototype, new controller(params.map(dep => Injector.resolve(dep))));
            }

        });

        return constructor;
    }
}