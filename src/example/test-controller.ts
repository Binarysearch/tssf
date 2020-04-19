import { Post, Controller } from "../controller/controller";
import { Observable, Subject } from "rxjs";
import { Ta } from "./ta";


@Controller
export class TestController {

    r = '111';
    
    constructor(private ta: Ta){
        
    }

    @Post('/hola')
    public async handleRequest(body: any): Promise<any> {
        return {
            body: body,
            r: this.r
        };
    }


    @Post('/hola2')
    public handleRequest2(body: any): Observable<any> {
        this.ta.saySomething();
        const s = new Subject();

        setTimeout(() => {
            
            s.next({
                body: body,
                r: this.r
            });

            s.complete();

        }, 100);

        return s.asObservable();
    }


    @Post('/hola3')
    public handleRequest3(body: any): any {
        return {
            body: body,
            r: this.r
        };
    }


}