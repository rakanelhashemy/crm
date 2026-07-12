import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LeadFilter } from '../../feature/dashboard/leads/leadfilter';


@Injectable({
  providedIn: 'root',
})
export class Taskss {


  private readonly  httpClient= inject(HttpClient)

   getTasks(filters:any ={}): Observable<any> {
 let params = new HttpParams()
    .set('pageNumber', filters.pageNumber.toString())
    .set('pageSize', filters.pageSize.toString())
    .set('search', filters.search || '');

    return this.httpClient.get(`${environment.baseUrl}Task/List`,{ params });
  
  }

  getTaskById(id: string): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `Task/${id}`);
  }

  createTask(task: any): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Task/Create`, task);
  }

  updateTask(id: string, task: any): Observable<any> {
    return this.httpClient.put(environment.baseUrl + `Task/Update/${id}`, task);
  }

  deleteTask(id: string): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `Task/Delete/${id}`);
  }

  updateTaskStatus(id: string, newStatus: number): Observable<any> {
    return this.httpClient.patch(environment.baseUrl + `Task/${id}/Status`, { newStatus });
  }
}
