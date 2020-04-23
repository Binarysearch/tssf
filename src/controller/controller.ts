import { Type } from '../injection/injector';
import { RequestManager, RequestMapping } from './request-manager';

export function Controller<U extends Type<any>>(constructor: U) {
    return constructor;
}

export function Request(name: string) {
    return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {

        const requestMapping: RequestMapping = {
            controller: target,
            name: name,
            method: descriptor.value
        };

        RequestManager.addRequestMapping(requestMapping);

        return descriptor;
    };
}