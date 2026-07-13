import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Users {
     private httpClient = inject(HttpClient);
 getUsers(filters:any={}): Observable<any> {
   let params = new HttpParams()
    .set('pageNumber', filters.pageNumber)
    .set('pageSize', filters.pageSize);

  if (filters.search) {
    params = params.set('name', filters.search); 
  }
    return this.httpClient.get(environment.baseUrl + 'User/List' ,{params});
  }
 
  getUsersDropdown(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'User/Dropdown');
  }
 
  getUserById(id: string): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `User/${id}`);
  }
 
  updateProfile(data: object): Observable<any> {
    return this.httpClient.put(environment.baseUrl + 'User/Profile', data);
  }

  changeStatusesOfUser(id: string ,newStatus:object): Observable<any> {
    return this.httpClient.patch(environment.baseUrl + `User/${id}/Status`, newStatus);
  }
 getUsersDropdownStatuses(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/User/Statuses');
  }
}
