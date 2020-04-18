import express = require('express');
import { Observable, Subject } from 'rxjs';
import { last } from 'rxjs/operators';



const requestHandlers: Map<string, (req: any, rs: any) => void> = new Map();
const controllers: Map<Object, any> = new Map();

const app: express.Application = express();
app.use(express.json());


app.listen(3000, function () {

    console.log('App is listening in port 3000');

});

@Controller
class Test {

    r = '111';
    

    @Handler('/hola')
    public async handleRequest(body: any): Promise<any> {
        return {
            body: body,
            r: this.r
        };
    }


    @Handler('/hola2')
    public handleRequest2(body: any): Observable<any> {
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


    @Handler('/hola3')
    public handleRequest3(body: any): any {
        return {
            body: body,
            r: this.r
        };
    }


}



function Controller<T extends {new(...args:any[]):{}}>(constructor:T) {
    
    controllers.set(constructor.prototype, new constructor());
    
    return class extends constructor {
        
    }
}


function Handler(path: string) {
    return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
        
        requestHandlers.set(path, (req, res) => {
            
            const result = descriptor.value.call(controllers.get(target), req.body);

            if (result instanceof Promise) {
                
                result.then((x: any) => {
                    res.send(x);
                });

            } else if(result instanceof Observable) {

                result.pipe(last()).subscribe((x: any) => {
                    res.send(x);
                });

            } else {

                res.send(JSON.stringify(result));

            }


        });

        return descriptor;
    };
}


requestHandlers.forEach((v, k)=>{
    app.post(k, <any>v);
});

