import 'reflect-metadata';
import { Injectable } from '../injection/injectable';
import { WebsocketService } from './websocket-service';

export interface NotificationMessage {
    id: string;
    payload: any;
}

@Injectable
export class NotificationService {

    constructor(private websocketService: WebsocketService) { }

    public sendNotification(channel: string, payload: any): void {
        console.log('sendNotification', channel);
        this.websocketService.forEachSubscription(channel, s => {
            const message: NotificationMessage = {
                id: s.id,
                payload: payload
            }
            s.wsConnection.ws.send(JSON.stringify(message));
        });
    }
    
}