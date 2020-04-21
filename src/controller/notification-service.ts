import { Injectable } from '../injection/injector';
import { WebsocketService } from './websocket-service';

export interface NotificationMessage {
    channel: string;
    payload: any;
}

@Injectable
export class NotificationService {

    constructor(private websocketService: WebsocketService) { }

    public sendNotification(channel: string, payload: any): void {
        console.log('sendNotification', channel);
        this.websocketService.forEachSubscription(channel, s => {
            const message: NotificationMessage = {
                channel: channel,
                payload: payload
            }
            s.wsConnection.ws.send(JSON.stringify(message));
        });
    }
    
}