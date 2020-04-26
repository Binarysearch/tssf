

import { ExapleBodyDto } from '../dtos/exaplebodydto';
import { ExampleResult } from '../dtos/exampleresult';
import { ExapleBodyDto2 } from '../dtos/exaplebodydto2';
import { ExampleResult2 } from '../dtos/exampleresult2';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
  
@Injectable({ providedIn: 'root' })
export class TestService {
  
        
        
        
  public hello(body: ExapleBodyDto): Observable<ExampleResult> {
      const path = 'hello';
  }
    
        
  public hello3(body: ExapleBodyDto2): Observable<ExampleResult2> {
      const path = 'hello3';
  }
    
}