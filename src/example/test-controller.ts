import { Controller, Request } from "../controller/controller";
import { NotificationService } from "../controller/notification-service";


@Controller
export class TestController {

    constructor(private notificationService: NotificationService) {}

    @Request('/hello')
    public async a(): Promise<string> {
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });
        return 'Hello world';
    }
}