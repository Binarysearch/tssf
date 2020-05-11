import { Injectable } from "@piros/ioc";

@Injectable
export class Logger {

    constructor() { }

    public log(message?: any, ...optionalParams: any[]): void {
        console.log(message, optionalParams);
    }
}