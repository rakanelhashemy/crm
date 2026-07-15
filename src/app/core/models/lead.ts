import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class Lead {
   private httpClient = inject(HttpClient);
 
getLeadList(filters: any = {}): Observable<any> {
  let params = new HttpParams();

  // تحويل كل الفلاتر المرسلة إلى HttpParams تلقائياً
  Object.keys(filters).forEach(key => {
   
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      params = params.set(key, filters[key].toString());
    }
  });

  // إرسال الطلب مع الـ params في الـ URL
  return this.httpClient.get(environment.baseUrl + `lead/list`, { params });
}
 
  getLeadById(id: string): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `lead/${id}`);
  }
 
  createLead(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `lead/create`, data);
  }
 
  updateLead(id: string, data: object): Observable<any> {
    return this.httpClient.put(environment.baseUrl + `lead/update/${id}`, data);
  }
 
  deleteLead(id: string): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `lead/delete/${id}`);
  }
 

 
  convertLead(id: string): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `lead/${id}/convert`, {});
  }
importLeadsExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return this.httpClient.post(`${environment.baseUrl}Lead/ImportExcel`, formData);
}
}
