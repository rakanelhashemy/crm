import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class Lookup {

   private httpClient = inject(HttpClient);

   getLeadStatuses(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Lead/Statuses');
  }
 
  getLeadSources(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Lead/Sources');
  }
 
  getCustomerTags(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Customer/Tags');
  }
 
  getPropertyStatuses(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Property/Statuses');
  }
 getPropertyTypes(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/PropertyTypes');
  }
  getConstructionStages(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Property/ConstructionStages');
  }
 
 getAddresses(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Addresses');
  }

  getRegions(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Regions');
  }
  
  getDealStages(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Deal/Stages');
  }

 
 getDeveloperCompanies(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/DeveloperCompanies');
  }
 
 gettasksStatuses(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Task/Statuses');
  }
  gettasksPriorities(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + 'Lookup/Task/Priorities');
  }
 
 

 
  // getAddressesByRegion(regionId: number): Observable<any> {
  //   return this.httpClient.get(environment.baseUrl + `Lookup/Regions/${regionId}/Addresses`);
  // }
  
   createRegion(body: { name: string }): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Lookup/Regions/Create', body);
  }
  
  deleteRegion(id: number): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `Lookup/Regions/${id}/Delete`);
  }

  createAddress(body: any): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Lookup/Addresses/Create', body);
  }
 
  deleteAddress(id: number): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `Lookup/Addresses/${id}/Delete`);
  }
 
  
 
  createPropertyType(body: { name: string }): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Lookup/PropertyTypes/Create', body);
  }
 
  deletePropertyType(id: number): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `Lookup/PropertyTypes/${id}/Delete`);
  }
 

   
   createDeveloperCompanies(body: { name: string }): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Lookup/DeveloperCompanies/Create', body);
  }
  deleteDeveloperCompanies(id: number): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `Lookup/DeveloperCompanies/${id}/Delete`);
  }
}
