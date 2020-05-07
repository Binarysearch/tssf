import 'reflect-metadata';
import { Injectable } from '@piros/ioc';
import { Observable, of } from 'rxjs';
import * as uuid from 'uuid';
import { Session } from './interfaces/session';

@Injectable
export class WsAuthService {

    public authWithToken(authToken: string): Observable<Session> {
        return of({
            id: uuid.v4(),
            authToken: authToken,
            user: 1
        });
    }
    
    public login(username: string, password: string, authToken: string): Observable<Session> {
        return of({
            id: uuid.v4(),
            authToken: authToken,
            user: 1
        });
    }
    
}