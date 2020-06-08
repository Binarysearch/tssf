import { Injectable } from "@piros/ioc";

import express = require('express');
import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws';

import { Observable, throwError } from 'rxjs';
import { WebsocketService } from './websocket-service';
import { WsAuthService } from './ws-auth-service';
import { Session } from "./interfaces/session";

enum WsCloseCode {
    INVALID_CREDENTIALS = 4001
}

@Injectable
export class RequestManagerService {

    private app?: express.Application;
    private postMappings: Map<string, (body: any) => Observable<any>> = new Map();

    constructor(
        private authService: WsAuthService,
        private websocketService: WebsocketService
    ) {

    }

    private authenticate(request: http.IncomingMessage): Observable<Session> {
        let token = undefined;
        
        if (request.url) {
            const slashPos = request.url.indexOf('/');
            if (slashPos !== undefined) {
                token = request.url.slice(slashPos + 1);
            }
        }
        
        if (token) {
            const parsedToken = JSON.parse(decodeURIComponent(token));
            if (parsedToken.username && parsedToken.password) {
                return this.authService.login(parsedToken.username, parsedToken.password, parsedToken.authToken);
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

    public registerPost(name: string, method: (body: any) => Observable<any>) {
        this.postMappings.set(name, method);
    }

    public registerChannel(name: string) {
        this.websocketService.registerChannel(name);
    }
    
    public start(port: number): void {
        this.app = express();
        this.app.use(express.json({ strict: false }));
        this.app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
        
        const server = http.createServer(this.app);

        this.registerAppPostRequestMappings();
        
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
                        console.log('CLOSED');
                        ws.close(WsCloseCode.INVALID_CREDENTIALS);
                    });
                }
            );

        });
        
        server.listen(port, () => {
            console.log(`Server started on port ${port} :)`);
        });
    }

    private registerAppPostRequestMappings() {
        this.postMappings.forEach((method, path) => {
            this.app.post('/' + path, (req, res) => {
                method(req.body).subscribe(
                    (result) => {
                        res.json(result);
                    },
                    (err) => {
                        res.status(500),
                        res.json(err);
                    }
                );
            });
        });
    }
}