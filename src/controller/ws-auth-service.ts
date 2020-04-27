import { Injectable } from '../injection/injectable';
import { Observable, of } from 'rxjs';
import * as uuid from 'uuid';

export interface Session {
    id: string;
    authToken: string;
    user: number;
}

@Injectable
export class WsAuthService {

    public authWithToken(authToken: string): Observable<Session> {
        return of({
            id: uuid.v4(),
            authToken: authToken,
            user: 1
        });
    }
    
    public login(username: string, password: string): Observable<Session> {
        return of({
            id: uuid.v4(),
            authToken: uuid.v4(),
            user: 1
        });
    }
    
}