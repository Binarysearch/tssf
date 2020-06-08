import 'reflect-metadata';
import { Type, Injector } from "@piros/ioc";
import { RequestManagerService } from "../controller/request-manager-service";
import { REQUEST_MAPPINGS, POST_MAPPINGS } from "../controller/controller";

export interface ApplicationConfig {
    controllers: Type<any>[],
    channels: string[]
}

export class Application {
    
    private controllers: Map<Object, any> = new Map();

    constructor(private config: ApplicationConfig, private injector: Injector) {

        config.controllers.forEach((controller) => {

            const params: Type<any>[] = Reflect.getOwnMetadata('design:paramtypes', controller);

            if (!params || params.length === 0) {
                this.controllers.set(controller.prototype, new controller());
            } else if (params.length === 1) {
                this.controllers.set(controller.prototype, new controller(injector.resolve(params[0])));
            } else {
                this.controllers.set(controller.prototype, new controller(...(params.map(dep => this.injector.resolve(dep)) )));
            }

        });

    }
    
    public start(port: number): void {
        const requestManagerService: RequestManagerService = this.injector.resolve(RequestManagerService);
        REQUEST_MAPPINGS.forEach((m) => {
            const target = this.controllers.get(m.controller);
            const method = m.method.bind(target);
            requestManagerService.registerRequest(m.name, method);
        });
        POST_MAPPINGS.forEach((m) => {
            const target = this.controllers.get(m.controller);
            const method = m.method.bind(target);
            requestManagerService.registerPost(m.path, method);
        });
        this.config.channels.forEach((channel) => {
            requestManagerService.registerChannel(channel);
        });
        requestManagerService.start(port);
    }
}