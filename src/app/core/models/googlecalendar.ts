import { inject, Injectable } from '@angular/core';

import {  Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class Googlecalendar {
   private readonly http = inject(HttpClient);
 authgoogle():Observable<any>  {
 return this.http.get(environment.baseUrl+`GoogleAuth/login-url`); }

  getStatus():Observable<any> {
    return this.http.get(environment.baseUrl + `GoogleAuth/status`);
  }
 
  revoke():Observable<any> {
    return this.http.post(environment.baseUrl +`GoogleAuth/revoke`, {});
  }
 
}
