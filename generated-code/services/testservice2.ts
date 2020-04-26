

import { ExapleBodyDto2 } from '../dtos/exaplebodydto2';
import { ExampleResult2 } from '../dtos/exampleresult2';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
  
@Injectable({ providedIn: 'root' })
export class TestService2 {
  
        
        
  public hello2(body: ExapleBodyDto2): Observable<ExampleResult2> {
      const path = 'hello2';
  }
    
}