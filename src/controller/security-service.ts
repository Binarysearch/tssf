import 'reflect-metadata';
import { Injectable } from '@piros/ioc';
import { Session } from './interfaces/session';

@Injectable
export class SecurityService {

    constructor() { }

    public canMakeRequest(session: Session, requestType: string): boolean {
        return true;
    }

    public canListenChannel(session: Session, channelName: string): boolean {
        return true;
    }
    
}