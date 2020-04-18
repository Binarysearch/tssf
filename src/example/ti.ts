import { Injectable } from "../injection/injector";


@Injectable
export class Ti{

    constructor() {

    }

    saySomething() {
        console.log('Soy Ti');
    }
}