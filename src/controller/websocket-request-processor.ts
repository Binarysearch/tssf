import { Session } from "./ws-auth-service";
import { Observable } from "rxjs";
import { WsConnection } from "./websocket-service";
import { last } from "rxjs/operators";


export class WebsocketRequestProcessor {

    constructor(
        private method: (session: Session, body: any) => Observable<any>,
        private connection: WsConnection,
        private requestId: string,
        private requestPayload: any
    ) {}

    private get session(): Session {
        return this.connection.session;
    }

    public process(): void {
        try {
            const result = this.method(this.session, this.requestPayload);
            result.pipe(last()).subscribe(
                (result: any) => {
                    this.sendResult(result);
                },
                (error) => {
                    this.handleErrorResult(error);
                }
            );
        } catch (error) {
            this.handleUncaughtError();
        }
    }
    
    private sendResult(result: any): void {
        console.log('sendResult', result);
    }

    private handleErrorResult(error: any): void {
        console.log('handleErrorResult', error);
    }
    
    private handleUncaughtError(): void {
        console.log('handleUncaughtError', this);
    }
}