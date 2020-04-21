import { Controller, Post } from './controller/controller';
import { NotificationService } from './controller/notification-service';

export { Injectable, Injector, Type } from './injection/injector';
export { Controller, Post } from './controller/controller';


@Controller
class Test {

    constructor(private notificationService: NotificationService) {}

    @Post('/hello')
    public async a(): Promise<string> {
        this.notificationService.sendNotification('users', { id: 1, prueba: 'Funciona' });
        return 'Hello world';
    }
}