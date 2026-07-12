import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { KpiData, ApiResponse, PagedResult, RevenuePoint, LabeledCount, DealStageCount, PropertyStatusCount, PropertyTypeRevenue, TopAgent, AgentPerformance } from '../../feature/dashboard/dashboard/dashboardinterface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Dashboardser {
   private http = inject(HttpClient);


  getKpis(agentId?: string): Observable<KpiData> {
    return this.http.get<ApiResponse<KpiData>>(`${environment.baseUrl}Dashboard/Kpis`, { params: this.params({ agentId }) })
      .pipe(map(r => r.data));
  }

  getRevenueByMonth(months = 6, agentId?: string): Observable<RevenuePoint[]> {
    return this.http.get<ApiResponse<PagedResult<RevenuePoint>>>(`${environment.baseUrl}Dashboard/Revenue/ByMonth`, {
        params: this.params({ months, agentId }),
      })
      .pipe(map(r => r.data.data));
  }
 
  getLeadsByStage(agentId?: string): Observable<LabeledCount[]> {
    return this.http.get<ApiResponse<LabeledCount[]>>(`${environment.baseUrl}Dashboard/Leads/ByStage`, { params: this.params({ agentId }) })
      .pipe(map(r => r.data));
  }
 
  getLeadsBySource(agentId?: string): Observable<LabeledCount[]> {
    return this.http.get<ApiResponse<LabeledCount[]>>(`${environment.baseUrl}Dashboard/Leads/BySource`, { params: this.params({ agentId }) })
      .pipe(map(r => r.data));
  }
 
  getDealsByStage(agentId?: string): Observable<DealStageCount[]> {
    return this.http.get<ApiResponse<DealStageCount[]>>(`${environment.baseUrl}Dashboard/Deals/ByStage`, { params: this.params({ agentId }) })
      .pipe(map(r => r.data));
  }
 
  getPropertiesByStatus(): Observable<PropertyStatusCount[]> {
    return this.http
      .get<ApiResponse<PropertyStatusCount[]>>(`${environment.baseUrl}Dashboard/Properties/ByStatus`)
      .pipe(map(r => r.data));
  }
 
  getRevenueByPropertyType(agentId?: string): Observable<PropertyTypeRevenue[]> {
    return this.http
      .get<ApiResponse<PropertyTypeRevenue[]>>(`${environment.baseUrl}Dashboard/Revenue/ByPropertyType`, {
        params: this.params({ agentId }),
      })
      .pipe(map(r => r.data));
  }
 
  getTopAgents(top = 5): Observable<TopAgent[]> {
    return this.http
      .get<ApiResponse<TopAgent[]>>(`${environment.baseUrl}Dashboard/Agents/Top`, { params: this.params({ top }) })
      .pipe(map(r => r.data));
  }
 
  getAgentsPerformance(): Observable<AgentPerformance[]> {
    return this.http
      .get<ApiResponse<AgentPerformance[]>>(`${environment.baseUrl}Dashboard/Agents/Performance`)
      .pipe(map(r => r.data));
  }
 
  private params(obj: Record<string, string | number | undefined>): HttpParams {
    let p = new HttpParams();
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        p = p.set(key, String(value));
      }
    }
    return p;
  }
}
