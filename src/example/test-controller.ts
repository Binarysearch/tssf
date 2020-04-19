import { Post, Controller } from "../controller/controller";
import { Observable, Subject } from "rxjs";
import { Ta } from "./ta";

interface SomeDto {

}

interface SomeResultType {

}

@Controller
export class TestController {

    r = '111';
    
    constructor(private ta: Ta){
        
    }

    @Post('/hola')
    public async handleRequest(body: SomeDto): Promise<SomeResultType> {
        return {
            body: body,
            r: this.r
        };
    }


    @Post('/hola2')
    public handleRequest2(body: SomeDto): Observable<SomeResultType> {
        this.ta.saySomething();
        const s: Subject<SomeResultType> = new Subject();

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
    public handleRequest3(body: SomeDto): SomeResultType {
        return {
            body: body,
            r: this.r
        };
    }


}