import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Lookup } from '../../../core/models/lookup';
  import {  Propertiess } from './../../../core/models/properties';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { LeadFilter } from '../leads/leadfilter';
import { ProperityModal } from "./properity-modal/properity-modal";
import { LookupItem } from '../leads/leads';
import { FormsModule } from '@angular/forms';
interface LookupItemv2 {
  id: string;
  name?: string;
  fullName?:string;
}
@Component({
  selector: 'component-properties',
  imports: [DecimalPipe, DatePipe, ProperityModal, NgClass ,FormsModule],
templateUrl: './properties.html',
  styleUrl: './properties.css',
})
export class Properties  implements OnInit{
 

private LookupService = inject(Lookup);
private PropertiesService = inject(Propertiess);
 properties= signal<PropertyItemInterface[]>([]);
IsdeletModal= signal(false);
selectedPropertyId= signal<string | null>(null);
isDeleting= signal(false);
IsVeiwPropertyModal = signal(false);
priorityID=signal<string | null>(null);
   ngOnInit(): void {
    this.loadProperties();
    this.loadConstructionStages()
    this.loadStatuses()
    this.loadRegions()
  }
  
 
   queryFilters: LeadFilter = {
    pageNumber: 1,
    pageSize: 10,
    search: '',
    customerType: null,
    status:null,
    constructionStage:null,
    regionId:null
  }; 
  
  
  loadProperties(): void {    
 
    this.PropertiesService.getProperties(this.queryFilters).subscribe({
      next: (res) => {
        this.properties.set(res?.data.data ?? []); 
        console.log(res);
         this.totalCount.set(res?.data?.totalCount ?? 0);
        this.totalPages.set(
          res?.data?.totalPages ??
          Math.ceil((res?.data?.totalCount ?? 0) / (this.queryFilters.pageSize || 10))
        );
      },
      error: (err) => {
        console.error('Error fetching properties:', err);
      } 
    }
)
}
onFilterChange(): void {
  this.queryFilters.pageNumber = 1;
  this.loadProperties();
}
openDeleteModal(id: string): void { 
this.selectedPropertyId.set(id);
this.IsdeletModal.set(true);
}
 
closeDeleteModal(): void {  
    this.IsdeletModal.set(false); 
    this.selectedPropertyId.set(null);
}
 
confirmDelete() {
  this.isDeleting.set(true);
  const id = this.selectedPropertyId();
  if (id) { 
 
    this.PropertiesService.deleteProperty(id).subscribe({
      next: (res) => {
        console.log('Property deleted successfully:', res);
        this.loadProperties();
     this.isDeleting.set(false);
      this.closeDeleteModal(); 
      },
      error: (err) => {
        console.error('Error deleting property:', err);
        this.isDeleting.set(false);
      }
    });}
}
 
isAddPropertyModalOpen = signal(false);
 
openAddPropertyModal(id: string | null = null) {
  this.priorityID.set(id);
  this.isAddPropertyModalOpen.set(true);
}
 
closeAddPropertyModal() {
  this.isAddPropertyModalOpen.set(false);
  this.priorityID.set(null);
   this.loadProperties();
}
 
 
selectedProperty = signal<PropertyItemInterface | null>(null);
isViewPropertyModalOpen = signal<boolean>(false);
isLoadingProperty = signal<boolean>(false);
 
// --- Open / Close ---
openViewPropertyModal(id: string ): void {
  this.isViewPropertyModalOpen.set(true);
  this.isLoadingProperty.set(true);
 
  this.PropertiesService.getPropertyById(id).subscribe({
    next: (res) => {
      this.selectedProperty.set(res.data);
      this.isLoadingProperty.set(false);
      console.log(res);
      
    },
    error: (err) => {
      console.error('Failed to load property', err);
     
    
    }
  });
}
 
closeViewPropertyModal(): void {
  this.isViewPropertyModalOpen.set(false);
  this.selectedProperty.set(null);
}
 
editFromViewModal(): void {
  const property = this.selectedProperty();
  if (!property) return;
 
  this.closeViewPropertyModal();
  this.openAddPropertyModal(property.id); // reuses your existing edit flow
}
 
 
regions = signal<LookupItemv2[]>([]);
  PropertyStatuses = signal<LookupItem[]>([]);
  ConstructionStages = signal<LookupItem[]>([]);
 
  loadRegions(): void {
    this.LookupService.getRegions().subscribe({
      next: (res) => this.regions.set(res.data),
      error: (err) => console.log('Loading regions', err),
    });
  }
 
    loadStatuses() {
    this.LookupService.getPropertyStatuses().subscribe({
      next: (res) => {
        this.PropertyStatuses.set(res.data)
        console.log(res);
        
      } ,
      error: (error) => console.log(error),
    });
  }
 
   loadConstructionStages() {
    this.LookupService.getConstructionStages().subscribe({
      next: (res) => this.ConstructionStages.set(res.data),
      error: (error) => console.log(error),
    });
  }

 totalCount = signal(0);
  totalPages = signal(0);
  pagesArray = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.queryFilters.pageNumber) return;
    this.queryFilters.pageNumber = page;
    this.loadProperties();
  }

  nextPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) + 1);
  }

  prevPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) - 1);
  }

  onPageSizeChange() {
    this.queryFilters.pageNumber = 1;
    this.loadProperties();
  }

}