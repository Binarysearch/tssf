import { Controller, Post } from './controller/controller';

export { Injectable, Injector, Type } from './injection/injector';
export { Controller, Post } from './controller/controller';


@Controller
class Test {

    @Post('/hello')
    public async a(): Promise<string> {
        return 'Hello world';
    }
}