import { Controller, Request } from "../controller/controller";
import { NotificationService } from "../controller/notification-service";
import { Session } from "../controller/ws-auth-service";
import { Observable, of, throwError } from "rxjs";
import { ExampleResult, ExampleResult2 } from "./example-result";
import { ExapleBodyDto, ExapleBodyDto2 } from "./example-body-dto";


@Controller
export class TestController {

    constructor(private notificationService: NotificationService) {}

    @Request('echo-message')
    public echo(session: Session, body: string): Observable<string> {
        return of(body + '-2');
    }

    @Request('get-animals')
    public getFruits(session: Session, body: string): Observable<string> {
        return of('animals');
    }


    @Request('hello')
    public hello(session: Session, body: ExapleBodyDto): Observable<ExampleResult> {
        console.log('session', session);
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });
        return of({ something: 'body -> ' + body.something });
    }


    @Request('hello3')
    public hello3(session: Session, body: ExapleBodyDto2): Observable<ExampleResult2> {
        console.log('session', session);
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });
        return of({ something: 'body -> ' + body.something });
    }
}


@Controller
export class TestController2 {

    constructor(private notificationService: NotificationService) {}

    @Request('hello2')
    public hello2(session: Session, body: ExapleBodyDto2): Observable<ExampleResult2> {
        console.log('session', session);
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });
        return of({ something: 'body -> ' + body.something });
    }
}