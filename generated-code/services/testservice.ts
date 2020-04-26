

import { ExapleBodyDto } from '../dtos/exaplebodydto';
import { ExampleResult } from '../dtos/exampleresult';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
  
@Injectable({ providedIn: 'root' })
export class TestService {
  
        
        
  public hello(body: ExapleBodyDto): Observable<ExampleResult> {
      const path = 'hello';
  }
    
}