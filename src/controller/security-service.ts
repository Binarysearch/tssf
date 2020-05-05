import 'reflect-metadata';
import { Injectable } from '../injection/injectable';
import { Session } from './interfaces/session';

@Injectable
export class SecurityService {

    constructor() { }

    public canMakeRequest(session: Session, requestType: string): boolean {
        return true;
    }
    
}