import express = require('express');

import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws';

import { Observable } from 'rxjs';
import { last } from 'rxjs/operators';
import { Type, Injector } from '../injection/injector';
import { WebsocketService } from './websocket-service';
import { WsAuthService, Session } from './ws-auth-service';

export const controllers: Map<Object, any> = new Map();


const app: express.Application = express();
app.use(express.json());

const server = http.createServer(app);

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws: WebSocket, session: Session) {
    const websocketService = Injector.resolve(WebsocketService);
    websocketService.onConnection(ws, session);
    ws.on('message', function message(msg) {
        if (typeof msg === 'string') {
            websocketService.onMessage(msg, session);
        } else {
            console.log('Message format not supported yet');
        }
    });
    ws.on('close', (code: number, reason: string) => {
        websocketService.onClose(code, reason, session);
    })
});


server.on('upgrade', function upgrade(request: http.IncomingMessage, socket: net.Socket, upgradeHead: Buffer) {

    authenticate(request, (err: Error | null, client?: Session) => {
        if (err || !client) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, upgradeHead, function done(ws) {
            wss.emit('connection', ws, client);
        });
    });
});

function authenticate(request: http.IncomingMessage, callback: (err: Error | null, session?: Session) => void) {
    const wsAuthService = Injector.resolve(WsAuthService);

    let token = undefined;

    const slashPos = request.url?.indexOf('/');
    if (slashPos !== undefined) {
        token = request.url?.slice(slashPos + 1);
    }
    
    if (token) {
        wsAuthService.auth(token).subscribe((session) => {
            callback(null, session);
        }, (err)=>{
            console.error(err);
            callback(new Error('Token no valido'));
        });
    } else {
        callback(new Error('Token no valido'));
    }
}


server.listen(3000, () => {
    console.log(`Server started on port 3000 :)`);
});


export function Controller<U extends Type<any>>(constructor: U) {
    return constructor;
}


export function Post(path: string) {
    return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {

        app.post(path, (req, res) => {

            const result = descriptor.value.call(controllers.get(target), req.body);

            if (result instanceof Promise) {

                result.then((x: any) => {
                    res.send(x);
                });

            } else if (result instanceof Observable) {

                result.pipe(last()).subscribe((x: any) => {
                    res.send(x);
                });

            } else {

                res.send(JSON.stringify(result));

            }


        });

        return descriptor;
    };
}