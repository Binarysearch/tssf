import 'reflect-metadata';
import { Injectable } from '@piros/ioc';
import { WebsocketService } from './websocket-service';
import { SecurityService } from './security-service';
import { Logger } from './logger';

export interface NotificationMessage {
    id: string;
    payload: any;
}

@Injectable
export class NotificationService {

    constructor(
        private websocketService: WebsocketService,
        private securityService: SecurityService,
        private logger: Logger,
    ) { }

    public sendNotification(channel: string, payload: any): void {
        this.logger.log('sendNotification', channel);
        this.websocketService.forEachSubscription(channel, s => {
            if (this.securityService.canListenChannel(s.wsConnection.session, channel)) {
                const message: NotificationMessage = {
                    id: s.id,
                    payload: payload
                }
                s.wsConnection.ws.send(JSON.stringify(message));
            }
        });
    }

}