import 'reflect-metadata';
import { Type } from '@piros/ioc';

export const REQUEST_MAPPINGS: Map<string, RequestMapping> = new Map();
export const POST_MAPPINGS: Map<string, PostMapping> = new Map();

export interface RequestMapping {
    controller: Object;
    name: string;
    method: Function;
}

export interface PostMapping {
    controller: Object;
    path: string;
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

export function Post(path: string) {
    return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {

        const postMapping: PostMapping = {
            controller: target,
            path: path,
            method: descriptor.value
        };

        POST_MAPPINGS.set(path, postMapping);

        return descriptor;
    };
}
