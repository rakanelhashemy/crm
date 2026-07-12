import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Custmor {
   private httpClient = inject(HttpClient);

   getCustomers(filters: any = {}): Observable<any> {
      let params = new HttpParams();

  Object.keys(filters).forEach(key => {
   
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      params = params.set(key, filters[key].toString());
    }
  });
    return this.httpClient.get(environment.baseUrl + 'Customer/List', { params });
  }
 
  getCustomerById(id: string): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `Customer/${id}`);
  }
 
  createCustomer(data: any): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Customer/Create', data);
  }
 
  updateCustomer(id: string, data: any): Observable<any> {
    return this.httpClient.put(environment.baseUrl + `Customer/Update/${id}`, data);
  }
 
  deleteCustomer(id: string): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `Customer/Delete/${id}`);
  }
 
  reassignCustomer(id: string, data: { assignedToId: string }): Observable<any> {
    return this.httpClient.patch(environment.baseUrl + `Customer/${id}/Reassign`, data);
  }
}
