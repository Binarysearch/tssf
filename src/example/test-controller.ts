import { Controller, Request } from "../controller/controller";
import { NotificationService } from "../controller/notification-service";
import { Session } from "../controller/ws-auth-service";
import { Observable, of, throwError } from "rxjs";
import { ExampleResult } from "./example-result";
import { ExapleBodyDto } from "./example-body-dto";


@Controller
export class TestController {

    constructor(private notificationService: NotificationService) {}

    @Request('hello')
    public hello(session: Session, body: ExapleBodyDto): Observable<ExampleResult> {
        console.log('session', session);
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });        
        return of({ something: 'body -> ' + body.something });
    }
}