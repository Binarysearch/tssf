import { Type } from '../injection/injector';

export const REQUEST_MAPPINGS: Map<string, RequestMapping> = new Map();

export interface RequestMapping {
    controller: Object;
    name: string;
    method: Function;
}

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

        REQUEST_MAPPINGS.set(name, requestMapping);

        return descriptor;
    };
}