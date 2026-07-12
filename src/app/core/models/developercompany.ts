import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { LeadFilter } from '../../feature/dashboard/leads/leadfilter';

@Injectable({
  providedIn: 'root',
})
export class Developercompanyy {
   private httpClient = inject(HttpClient);

list(filters: any ={}): Observable<any> {
  let params = new HttpParams()
    .set('pageNumber', filters.pageNumber.toString())
    .set('pageSize', filters.pageSize.toString());

  if (filters.search) {
    params = params.set('name', filters.search); 
  }

  return this.httpClient.get(
    `${environment.baseUrl}DeveloperCompany/List`,
    { params }
  );
}
 

  create(payload: object): Observable<any> {
    return this.httpClient.post(`${environment.baseUrl}DeveloperCompany/Create`, payload);
  }
 
 
  update(id: string, payload: object): Observable<any> {
    return this.httpClient.put(`${environment.baseUrl}DeveloperCompany/Update/${id}`, payload);
  }
 
 
  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${environment.baseUrl}DeveloperCompany/Delete/${id}`);
  }
}
