

export enum ClientMessageType {
    CREATE_SUBSCRIPTION = 'CREATE_SUBSCRIPTION',
    REMOVE_SUBSCRIPTION = 'REMOVE_SUBSCRIPTION',
    REQUEST = 'REQUEST',
}

export interface CreateSubscriptionPayload {
    channel: string;
}

export interface CloseSubscriptionPayload {
    subscriptionId: string;
    channel: string;
}

export interface RequestPayload {
    type: string;
    payload: any;
}

export interface ClientMessage {
    id: string;
    type: ClientMessageType;
    payload: CreateSubscriptionPayload | CloseSubscriptionPayload | RequestPayload;
}