import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeadFilter } from '../leads/leadfilter';

import { Custmor } from '../../../core/models/custmor';
import { Lookup } from '../../../core/models/lookup';
import { LookupItem } from '../leads/leads';
import { NameavtarPipe } from '../../../shared/pipes/nameavtar-pipe';
import { TimeagoPipe } from '../../../shared/pipes/timeago-pipe';
import { CustomerModal } from "./customer-modal/customer-modal";
import { ShortCurrencyPipePipe } from '../../../shared/pipes/short-currency-pipe-pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'component-customers',
  imports: [FormsModule, NameavtarPipe, TimeagoPipe, CustomerModal ,ShortCurrencyPipePipe,DatePipe],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers implements OnInit {

  private customerService = inject(Custmor);
private LookupService = inject(Lookup);
  isModalOpen = signal(false);
  editingcustomerId = signal<string | null>(null);;
    customers=signal<Customerr[]>([]);
 types=signal<LookupItem[]>([]);
 iscreatemode=signal(false);
 ngOnInit(): void {
    this.loadCustomers(this.queryFilters);
    this.loadLookups()
  }

  selectedCustomer = signal<Customerr | null>(null);

 queryFilters: LeadFilter = {
  pageNumber: 1,
  pageSize: 10,
  search: '',
  customerType: null,
};

  onFilterChange() {
    this.queryFilters.pageNumber = 1;
    this.loadCustomers(this.queryFilters);
  }

  loadCustomers(queryFilters: LeadFilter): void {
  
    this.customerService.getCustomers(queryFilters).subscribe({
      next: (res) => {
        this.customers.set(res?.data.data ) 
        console.log(res.data);
           this.totalCount.set(res?.data?.totalCount ?? 0);
        this.totalPages.set(
          res?.data?.totalPages ??
          Math.ceil((res?.data?.totalCount ?? 0) / (queryFilters.pageSize || 10))
        );
      
      },
      error: (err) => {
        console.error('Failed to load customers', err);
    
      },
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
    this.loadCustomers(this.queryFilters);
  }

  nextPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) + 1);
  }

  prevPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) - 1);
  }

  onPageSizeChange() {
    this.queryFilters.pageNumber = 1;
    this.loadCustomers(this.queryFilters);
  }



   loadLookups() {
    this.LookupService.getCustomerTags().subscribe({
      next: (res) => this.types.set(res?.data || []),
      error: (err) => console.error('Error loading statuses:', err),
    });

  }
  closeModal() {
    this.isModalOpen.set(false);
    this.editingcustomerId.set(null);
    this.loadCustomers(this.queryFilters);
  }

   openAddModal() {
    this.editingcustomerId.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(leadid: string) {
    this.editingcustomerId.set(leadid);
    this.isModalOpen.set(true);
    this.closeCustomerDetailsModal();
  }


  
 isDeleteModalOpen = signal(false);
deletingcustomerId = signal<string | null>(null);

isDeleting = signal(false);

opendeleteModal(leadId: string) {
  this.deletingcustomerId.set(leadId);
  this.isDeleteModalOpen.set(true);
}

closeDeleteModal() {
  this.isDeleteModalOpen.set(false);
  this.deletingcustomerId.set(null);
}

confirmDelete() {
  this.deletecustomer(this.deletingcustomerId()!);
}

deletecustomer(leadId: string) {
  this.isDeleting.set(true);
  this.customerService.deleteCustomer(leadId).subscribe({
    next: () => {
      this.isDeleting.set(false);
      this.loadCustomers(this.queryFilters);
      this.closeDeleteModal();
    },
    error: (err) => {
      this.isDeleting.set(false);
      console.error('Error deleting lead:', err);
    },
  });
}


isCustomerDetailsModalOpen = signal(false);


openCustomerDetailsModal(customerId: string){
  this.isCustomerDetailsModalOpen.set(true);

 this.customerService.getCustomerById(customerId).subscribe({
   next: (res) => {
    console.log(res);
    
      this.selectedCustomer.set(res?.data || null);
    },
error: (err) => {
  console.error('Failed to load customer details', err);
 }
}
)


}
closeCustomerDetailsModal(){
  this.isCustomerDetailsModalOpen.set(false);
}





}
