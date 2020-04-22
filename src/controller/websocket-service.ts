import * as WebSocket from 'ws';
import { Injectable } from '../injection/injector';
import { Session } from './ws-auth-service';
import * as uuid from 'uuid';

export interface Subscription {
    channel: string;
    wsConnection: WsConnection;
}

export interface WsConnection {
    session: Session;
    ws: WebSocket;
}

export enum WsMessageType {
    CREATE_SUBSCRIPTION = 'CREATE_SUBSCRIPTION',
    REMOVE_SUBSCRIPTION = 'REMOVE_SUBSCRIPTION',
    REQUEST = 'REQUEST',
}

export interface SubscriptionRequestPayload {
    channel: string;
}

export interface MessageRequestPayload {
    type: string;
    payload: any;
}

export interface WsMessage {
    id: string;
    type: WsMessageType;
    payload: any;
}

@Injectable
export class WebsocketService {

    id: string = uuid.v4();

    // Mapa: id sesion -> WsConnection
    private connections: Map<string, WsConnection> = new Map();

    // Mapa: Canal -> Lista de Subscripciones
    private channelSubscriptions: Map<string, Subscription[]> = new Map();

    public onMessage(msg: string, session: Session) {
        try {
            const message: WsMessage = JSON.parse(msg);
            if (message.type === WsMessageType.REQUEST) {
                this.handleRequestMessage(session, message.id, message.payload);
            } else if (message.type === WsMessageType.CREATE_SUBSCRIPTION) {
                this.handleCreateSubscriptionMessage(session, message.id, message.payload);
            } else if (message.type === WsMessageType.REMOVE_SUBSCRIPTION) {
                this.handleRemoveSubscriptionMessage(session, message.id, message.payload);
            } else {
                this.handleBadRequestMessage(session, message);
            }
        } catch (err) {
            console.error('Invalid message format, session:', session);
            console.error(err);
        }
    }

    public onConnection(ws: WebSocket, session: Session) {
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
            if (v.length > 0) {
                channelSubscriptions.set(k, v);
            }
        });
        this.channelSubscriptions = channelSubscriptions;
        console.log('Cliente desconectado.', session, code, reason);
    }

    private handleCreateSubscriptionMessage(session: Session, messageId: string, payload: SubscriptionRequestPayload) {
        console.log('handleCreateSubscriptionMessage', session, messageId, payload);
        
        const subscription: Subscription = {
            channel: payload.channel,
            wsConnection: <WsConnection>this.connections.get(session.id)
        };

        if (!this.channelSubscriptions.has(payload.channel)) {
            this.channelSubscriptions.set(payload.channel, []);
        }
        this.channelSubscriptions.get(payload.channel)?.push(subscription);
    }

    private handleRemoveSubscriptionMessage(session: Session, messageId: string, payload: SubscriptionRequestPayload) {
        console.log('handleRemoveSubscriptionMessage', session, messageId, payload);

        let subscriptionList = this.channelSubscriptions.get(payload.channel);
        if (subscriptionList) {
            subscriptionList = subscriptionList.filter(subscription => subscription.wsConnection.session.id !== session.id);
            if (subscriptionList.length === 0) {
                this.channelSubscriptions.delete(payload.channel);
            } else {
                this.channelSubscriptions.set(payload.channel, subscriptionList);
            }
        }
    }
    
    private handleRequestMessage(session: Session, messageId: string, payload: MessageRequestPayload) {
        console.log('handleRequestMessage', session, messageId, payload);
    }
    
    private handleBadRequestMessage(session: Session, message: WsMessage) {
        console.log('handleBadRequestMessage', message);
    }

    public forEachSubscription(channel: string, callback: (subscription: Subscription) => void) {
        this.channelSubscriptions.get(channel)?.forEach(callback);
    }
    
}