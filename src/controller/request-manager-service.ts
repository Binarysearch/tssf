import { Injectable } from "../injection/injectable";

import express = require('express');
import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws';

import { Observable } from 'rxjs';
import { last } from 'rxjs/operators';
import { Injector } from '../injection/injector';
import { WebsocketService } from './websocket-service';
import { WsAuthService, Session } from './ws-auth-service';

@Injectable
export class RequestManagerService {

    private app: express.Application;

    constructor() {

        this.app = express();
        this.app.use(express.json());
        
        const server = http.createServer(this.app);
        
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
    }

    public registerRequest(name: string, method: Function) {
        this.app.post(name, (req, res) => {

            const result = method(req.body);

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
    }
    
}