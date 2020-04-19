import express = require('express');
import { Observable } from 'rxjs';
import { last } from 'rxjs/operators';
import { Type, Injector } from '../injection/injector';

const controllers: Map<Object, any> = new Map();

const app: express.Application = express();
app.use(express.json());


app.listen(3000, function () {

    console.log('App is listening in port 3000');

});


export function Controller<U extends Type<any>>(constructor: U) {
    
    const params: Type<any>[] = Reflect.getOwnMetadata('design:paramtypes', constructor);

    if (!params || params.length === 0) {
        controllers.set(constructor.prototype, new constructor());
    } else if (params.length === 1) {
        controllers.set(constructor.prototype, new constructor(Injector.resolve(params[0])));
    } else {
        controllers.set(constructor.prototype, new constructor(params.map(dep => Injector.resolve(dep))));
    }
    
    
    return constructor;
}


export function Post(path: string) {
    return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
        
        app.post(path, (req, res) => {
            
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


