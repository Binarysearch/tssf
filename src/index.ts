import { Application } from './application/application';
import { TestController } from './example/test-controller';
import { WsAuthService, Session } from './controller/ws-auth-service';
import { Observable, of, throwError } from 'rxjs';

export { Type } from './injection/injector';
export { Injectable } from './injection/injectable';
export { Controller, Request as Post } from './controller/controller';

import * as uuid from 'uuid';

class MyAuthService extends WsAuthService {

    public authWithToken(authToken: string): Observable<Session> {
        if (authToken === '12345') {
            return of({
                id: uuid.v4(),
                authToken: authToken,
                user: 2
            });
        } else {
            return throwError('Invalid token');
        }
    }
    
    public login(username: string, password: string): Observable<Session> {
        if (password === '12345') {
            return of({
                id: uuid.v4(),
                authToken: uuid.v4(),
                user: 2
            });
        } else {
            return throwError('Invalid token');
        }
    }
    
}

new Application({
    controllers: [
        TestController
    ],
    providers: [
        { provide: WsAuthService, useClass: MyAuthService }
    ]
}).start();