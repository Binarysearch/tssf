import { Application } from './application/application';
import { TestController } from './example/test-controller';
import { WsAuthService, Session } from './controller/ws-auth-service';
import { Observable, of } from 'rxjs';

export { Injectable, Injector, Type } from './injection/injector';
export { Controller, Post } from './controller/controller';


class MyAuthService extends WsAuthService {

    public auth(authToken: string): Observable<Session> {
        return of({
            id: 'uuid.v4()',
            authToken: authToken,
            user: 2
        });
    }
    
}

new Application({
    controllers: [
        TestController
    ],
    providers: [
        { provide: WsAuthService, useClass: MyAuthService }
    ]
});