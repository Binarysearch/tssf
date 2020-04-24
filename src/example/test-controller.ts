import { Controller, Request } from "../controller/controller";
import { NotificationService } from "../controller/notification-service";
import { Session } from "../controller/ws-auth-service";


@Controller
export class TestController {

    constructor(private notificationService: NotificationService) {}

    @Request('/hello')
    public async hello(session: Session, body: any): Promise<string> {
        console.log('session', session);
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });
        return 'Hello world';
    }
}