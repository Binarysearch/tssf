import * as WebSocket from 'ws';
import { Injectable } from '@piros/ioc';
import * as uuid from 'uuid';
import { Observable } from 'rxjs';
import { WebsocketRequestProcessor } from './websocket-request-processor';
import { ClientMessage, ClientMessageType, CreateSubscriptionPayload, CloseSubscriptionPayload, RequestPayload } from './interfaces/client-messages';
import { CreateSubscriptionResponse, ErrorResponseMessage, ErrorResponseMessageType } from './interfaces/server-messages';
import { SecurityService } from './security-service';
import { Session } from './interfaces/session';

export interface Subscription {
    id: string;
    channel: string;
    wsConnection: WsConnection;
}

export interface WsConnection {
    session: Session;
    ws: WebSocket;
}

@Injectable
export class WebsocketService {

    id: string = uuid.v4();

    // Mapa: id sesion -> WsConnection
    private connections: Map<string, WsConnection> = new Map();

    // Mapa: Canal -> Lista de Subscripciones
    private channelSubscriptions: Map<string, Subscription[]> = new Map();

    private requestMappings: Map<string, (session: Session, body: any) => Observable<any>> = new Map();

    constructor(
        private security: SecurityService
    ) {}

    public onMessage(msg: string, session: Session) {
        try {
            const message: ClientMessage = JSON.parse(msg);
            if (message.type === ClientMessageType.REQUEST) {
                this.handleRequestMessage(session, message.id, (<RequestPayload>message.payload));
            } else if (message.type === ClientMessageType.CREATE_SUBSCRIPTION) {
                this.handleCreateSubscriptionMessage(session, message.id, (<CreateSubscriptionPayload>message.payload));
            } else if (message.type === ClientMessageType.REMOVE_SUBSCRIPTION) {
                this.handleRemoveSubscriptionMessage(session, message.id, (<CloseSubscriptionPayload>message.payload));
            } else {
                this.handleBadRequestMessage(session, message);
            }
        } catch (err) {
            console.error('Invalid message format, session:', session);
            console.error(err);
        }
    }

    public onConnection(ws: WebSocket, session: Session) {
        ws.send(JSON.stringify({
            sessionId: session.id,
            authToken: session.authToken
        }));
        const connection = { session, ws };
        this.connections.set(session.id, connection);
        console.log('Cliente conectado.', session);
    }
    
    public onClose(code: number, reason: string, session: Session) {
        this.connections.delete(session.id);

        // Eliminamos todas las subscripciones de la conexion
        const channelSubscriptions = new Map();
        this.channelSubscriptions.forEach((v, k) => {
            v = v.filter(subscription => subscription.wsConnection.session.id !== session.id);
            channelSubscriptions.set(k, v);
        });
        this.channelSubscriptions = channelSubscriptions;
        console.log('Cliente desconectado.', session, code, reason);
    }

    private handleCreateSubscriptionMessage(session: Session, messageId: string, payload: CreateSubscriptionPayload) {
        console.log('handleCreateSubscriptionMessage', session, messageId, payload);
        
        if (!this.channelSubscriptions.has(payload.channel)) {
            this.handleChannelNotFound(session, messageId, payload);
        }

        const subscriptionId = messageId;

        const subscription: Subscription = {
            id: subscriptionId,
            channel: payload.channel,
            wsConnection: <WsConnection>this.connections.get(session.id)
        };

        if (this.channelSubscriptions.get(payload.channel)) {
            this.channelSubscriptions.get(payload.channel).push(subscription);
        }

        const connection = this.connections.get(session.id);

        const message: CreateSubscriptionResponse = {
            id: messageId,
            payload: { subscriptionId: subscriptionId }
        }
        connection.ws.send(JSON.stringify(message));
    }

    private handleRemoveSubscriptionMessage(session: Session, messageId: string, payload: CloseSubscriptionPayload) {
        console.log('handleRemoveSubscriptionMessage', session, messageId, payload);

        let subscriptionList = this.channelSubscriptions.get(payload.channel);
        if (subscriptionList) {
            subscriptionList = subscriptionList.filter(subscription => subscription.id !== payload.subscriptionId);
            this.channelSubscriptions.set(payload.channel, subscriptionList);
        }
    }
    
    private handleRequestMessage(session: Session, messageId: string, payload: RequestPayload): void {
        if (!this.security.canMakeRequest(session, payload.type)) {
            this.handleSecurityCheckNotPassed(session, messageId, payload);
            return;
        }

        const method = this.requestMappings.get(payload.type);
        if (method) {
            const connection = this.connections.get(session.id);

            if (connection) {
                new WebsocketRequestProcessor(
                    method,
                    connection,
                    messageId,
                    payload.payload
                ).process();
            } else {
                throw new Error('No hay conexion');
            }
            
        } else {
            this.handleMessageTypeNotFound(session, messageId, payload);
        }
    }

    private handleChannelNotFound(session: Session, messageId: string, payload: CreateSubscriptionPayload) {
        const connection = this.connections.get(session.id);
        const errorMessage: ErrorResponseMessage = {
            id: messageId,
            error: {
                type: ErrorResponseMessageType.CHANNEL_NAME_NOT_FOUND,
                channel: payload.channel,
                description: `Channel '${payload.channel}' does not exist.`
            }
        };
        connection.ws.send(JSON.stringify(errorMessage));
        console.log(errorMessage.error);
    }

    private handleSecurityCheckNotPassed(session: Session, messageId: string, payload: RequestPayload) {
        const connection = this.connections.get(session.id);
        if (!connection) {
            return;
        }
        const errorMessage: ErrorResponseMessage = {
            id: messageId,
            error: {
                type: ErrorResponseMessageType.UNAUTHORIZED,
                requestType: payload.type,
                description: `User cannot perform request type '${payload.type}'.`
            }
        };
        connection.ws.send(JSON.stringify(errorMessage));
    }

    private handleMessageTypeNotFound(session: Session, messageId: string, payload: RequestPayload) {
        const connection = this.connections.get(session.id);
        if (!connection) {
            return;
        }
        const errorMessage: ErrorResponseMessage = {
            id: messageId,
            error: {
                type: ErrorResponseMessageType.MESSAGE_TYPE_NOT_FOUND,
                requestType: payload.type,
                description: `Message type '${payload.type}' does not exist.`
            }
        };
        connection.ws.send(JSON.stringify(errorMessage));
        console.log(errorMessage.error);
    }

    private handleBadRequestMessage(session: Session, message: ClientMessage) {
        console.log('handleBadRequestMessage', message);
    }

    public forEachSubscription(channel: string, callback: (subscription: Subscription) => void) {
        const channels = this.channelSubscriptions.get(channel);
        if (!channels) {
            return;
        }
        channels.forEach(callback);
    }
    
    public registerRequest(name: string, method: (session: Session, body: any) => Observable<any>): void {
        this.requestMappings.set(name, method);
    }
    
    public registerChannel(name: string): void {
        this.channelSubscriptions.set(name, []);
    }

}