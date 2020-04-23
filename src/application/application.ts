import { Type, Injector, Provider } from "../injection/injector";
import { RequestManagerService } from "../controller/request-manager-service";
import { RequestManager } from "../controller/request-manager";

export interface ApplicationConfig {
    controllers: Type<any>[],
    providers?: Provider[];
}

export class Application {
    
    private controllers: Map<Object, any> = new Map();

    constructor(config: ApplicationConfig) {

        Injector.setProviders(config.providers);

        config.controllers.forEach((controller) => {

            const params: Type<any>[] = Reflect.getOwnMetadata('design:paramtypes', controller);

            if (!params || params.length === 0) {
                this.controllers.set(controller.prototype, new controller());
            } else if (params.length === 1) {
                this.controllers.set(controller.prototype, new controller(Injector.resolve(params[0])));
            } else {
                this.controllers.set(controller.prototype, new controller(params.map(dep => Injector.resolve(dep))));
            }

        });

    }
    
    public start(): void {
        const requestManagerService: RequestManagerService = Injector.resolve(RequestManagerService);
        RequestManager.getRequestMappings().forEach(m => {
            const target = this.controllers.get(m.controller);
            const method = m.method.bind(target);
            requestManagerService.registerRequest(m.name, method);
        });
        
    }
}