

export enum WsMessageType {
    CREATE_SUBSCRIPTION = 'CREATE_SUBSCRIPTION',
    REMOVE_SUBSCRIPTION = 'REMOVE_SUBSCRIPTION',
    REQUEST = 'REQUEST',
}

export interface SubscriptionRequestPayload {
    channel: string;
}

export interface SubscriptionClosePayload {
    subscriptionId: string;
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

export enum ErrorResponseMessageType {
    MESSAGE_TYPE_NOT_FOUND = 'MESSAGE_TYPE_NOT_FOUND',
    CHANNEL_NAME_NOT_FOUND = 'CHANNEL_NAME_NOT_FOUND'
}

export interface ErrorResponseMessage {
    id: string;
    error: {
        type: ErrorResponseMessageType;
        requestType?: string;
        channel?: string;
        description: string;
    }
}

export interface CreateSubscriptionResponse {
    id: string;
    payload: { subscriptionId: string; };
}