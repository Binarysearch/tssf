

export interface ResponseMessage {
    id: string;
    payload: any;
}

export enum ErrorResponseMessageType {
    UNAUTHORIZED = 'UNAUTHORIZED',
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