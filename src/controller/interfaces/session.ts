import 'reflect-metadata';

export interface Session {
    id: string;
    authToken: string;
    user: any;
}