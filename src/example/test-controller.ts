import { Controller, Request } from "../controller/controller";
import { Session } from "../controller/ws-auth-service";
import { Observable, of } from "rxjs";
import { NotificationService } from "../controller/notification-service";


@Controller
export class TestController {

    constructor(
        private notification: NotificationService
    ) {}

    @Request('echo-message')
    public echo(session: Session, body: string): Observable<string> {
        return of(body + '-1');
    }

    @Request('delayed-echo-message')
    public echo2(session: Session, body: string): Observable<string> {
        return new Observable(obs=>{
            setTimeout(() => {
                obs.next(body + '-1');
                obs.complete();
            }, 2000);
        });
    }
    
    @Request('send-something-for-valid-channel')
    public send(session: Session, body: string): Observable<string> {
        this.notification.sendNotification('valid-channel', 'hola');
        return of(body + '-1');
    }

    @Request('get-fruits')
    public getFruits(session: Session, body: string): Observable<string> {
        return of('fruits');
    }
    
}