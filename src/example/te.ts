import { Injectable } from "../injection/injector";
import { Ti } from "./ti";


@Injectable
export class Te {

    constructor(private ti: Ti) {

    }

    saySomething(){
        console.log('Soy Te');
        console.log('Ti dice: ');
        this.ti.saySomething();
    }
}


