import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Propertiess {

     private httpClient = inject(HttpClient);
  getProperties(filters: any = {}): Observable<any> {
     let params = new HttpParams();

  // تحويل كل الفلاتر المرسلة إلى HttpParams تلقائياً
  Object.keys(filters).forEach(key => {
   
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      params = params.set(key, filters[key].toString());
    }
  });
    return this.httpClient.get(environment.baseUrl + 'Property/List' , { params });
  }
 
  getPropertyById(id: string): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `Property/${id}`);
  }
 
  createProperty(body: any): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Property/Create', body);
  }
 
  updateProperty(id: string, body: any): Observable<any> {
    return this.httpClient.put(environment.baseUrl + `Property/Update/${id}`, body);
  }
 
  deleteProperty(id: string): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `Property/Delete/${id}`);
  }
 

}
