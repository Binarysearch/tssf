import { Injectable } from "../injection/injectable";

import express = require('express');
import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws';

import { Observable, throwError } from 'rxjs';
import { last } from 'rxjs/operators';
import { Injector } from '../injection/injector';
import { WebsocketService } from './websocket-service';
import { WsAuthService, Session } from './ws-auth-service';

enum WsCloseCode {
    INVALID_CREDENTIALS = 4001
}

@Injectable
export class RequestManagerService {

    private app: express.Application;

    constructor(
        private authService: WsAuthService,
        private websocketService: WebsocketService
    ) {

        this.app = express();
        this.app.use(express.json());
        
        const server = http.createServer(this.app);
        
        const wss = new WebSocket.Server({ noServer: true });
        
        wss.on('connection', (ws: WebSocket, session: Session) => {
            this.websocketService.onConnection(ws, session);
            ws.on('message', (msg) => {
                if (typeof msg === 'string') {
                    this.websocketService.onMessage(msg, session);
                } else {
                    console.log('Message format not supported yet');
                }
            });
            ws.on('close', (code: number, reason: string) => {
                this.websocketService.onClose(code, reason, session);
            })
        });
        
        
        server.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, upgradeHead: Buffer) => {
        
            this.authenticate(request).subscribe(
                (session) => {
                    wss.handleUpgrade(request, socket, upgradeHead, (ws) => {
                        wss.emit('connection', ws, session);
                    });
                },
                (error) => {
                    wss.handleUpgrade(request, socket, upgradeHead, (ws) => {
                        ws.close(WsCloseCode.INVALID_CREDENTIALS);
                    });
                }
            );

        });
        
        server.listen(3000, () => {
            console.log(`Server started on port 3000 :)`);
        });
    }

    private authenticate(request: http.IncomingMessage): Observable<Session> {
        let token = undefined;
        
        const slashPos = request.url?.indexOf('/');
        if (slashPos !== undefined) {
            token = request.url?.slice(slashPos + 1);
        }
        
        if (token) {
            const parsedToken = JSON.parse(decodeURIComponent(token));
            if (parsedToken.username && parsedToken.password) {
                return this.authService.login(parsedToken.username, parsedToken.password);
            } else if (parsedToken.token) {
                return this.authService.authWithToken(parsedToken.token);
            } else {
                return throwError(new Error('Token no valido'));
            }
        } else {
            return throwError(new Error('Token no valido'));
        }
    }

    public registerRequest(name: string, method: (session: Session, body: any) => Observable<any>) {
        this.websocketService.registerRequest(name, method);
    }
    
}