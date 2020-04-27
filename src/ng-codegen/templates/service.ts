
export const SERVICE_TEMPLATE = `
%s
import { Injectable } from '@angular/core';
import { PirosApiService } from '@piros/api';
import { Observable } from 'rxjs';
    
@Injectable({ providedIn: 'root' })
export class %s {

    constructor(private api: PirosApiService) { }

    %s
}
`;