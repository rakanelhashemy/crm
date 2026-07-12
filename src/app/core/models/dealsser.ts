import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Dealsser {
   private httpClient = inject(HttpClient);

    getDeals(filters:any = {}): Observable<any> {
        let params = new HttpParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      params = params.set(key, filters[key].toString());
    }
  });

    return this.httpClient.get(environment.baseUrl + 'Deal/List' ,{params});
  }
 
  getDeal(id: string): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Deal/' + id);
  }
 
  createDeal(deal: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Deal/Create', deal);
  }
 
  updateDeal(id: string, deal: object): Observable<any> {
    return this.httpClient.put(environment.baseUrl + 'Deal/Update/' + id, deal);
  }
 
  deleteDeal(id: string): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + 'Deal/Delete/' + id);
  }
}
