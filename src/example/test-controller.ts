import { Controller, Request } from "../controller/controller";
import { NotificationService } from "../controller/notification-service";
import { Session } from "../controller/ws-auth-service";
import { Observable, of, throwError } from "rxjs";


@Controller
export class TestController {

    constructor(private notificationService: NotificationService) {}

    @Request('hello')
    public hello(session: Session, body: any): Observable<string> {
        console.log('session', session);
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });
        throw "error muy grave";
        
        return of('Hello world');
    }
}