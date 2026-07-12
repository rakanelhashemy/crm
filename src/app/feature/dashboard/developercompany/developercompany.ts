import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LeadFilter } from '../leads/leadfilter';
import { Developercompanyy } from './../../../core/models/developercompany';
import { developerinterface } from './deveinterface';
import { DatePipe } from '@angular/common';
import { DeveloperModal } from "./developer-modal/developer-modal";
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'component-developercompany',
  imports: [DatePipe, DeveloperModal ,FormsModule],
templateUrl: './developercompany.html',
  styleUrl: './developercompany.css',
})
export class Developercompany  implements OnInit{

  private DeveloperService = inject(Developercompanyy);

 queryFilters: LeadFilter = {
  pageNumber: 1,
  pageSize: 10,
  search: "",
};
 
developerlist= signal<developerinterface[]> ([])
  
ngOnInit(): void {
  this.getlist()
}
getlist() {
  this.DeveloperService.list(this.queryFilters).subscribe({
    next: (res) => {
      console.log(res);
      this.developerlist.set(res.data.data);
      this.totalCount.set(res.data.totalCount ?? 0);
      this.totalPages.set(
        Math.ceil((res.data.totalCount ?? 0) / (this.queryFilters.pageSize || 10))
      );
    },
    error: (err) => {
      console.error('Error fetching developer companies:', err);
    },
  });
}



 isDeleteModalOpen = signal(false);
deletecompanyID = signal<string | null>(null);

isDeleting = signal(false);

opendeleteModal(leadId: string) {
  this.deletecompanyID.set(leadId);
  this.isDeleteModalOpen.set(true);
}

closeDeleteModal() {
  this.isDeleteModalOpen.set(false);
  this.deletecompanyID.set(null);
}

confirmDelete() {
  this.deleteLead(this.deletecompanyID()!);
}

deleteLead(companyId: string) {
  this.isDeleting.set(true);
  this.DeveloperService.delete(companyId).subscribe({
    next: () => {
      this.isDeleting.set(false);
      this.closeDeleteModal();
       this.getlist()
    },
    error: (err) => {
      this.isDeleting.set(false);
      console.error('Error deleting lead:', err);
    },
  });
}

editingcompany = signal<developerinterface|null> (null)
isModalOpen =signal(false)

  openAddModal() {
    this.editingcompany.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(leadid: developerinterface) {
    this.editingcompany.set(leadid);
    this.isModalOpen.set(true);
  }
 closeModal() {
    this.isModalOpen.set(false);
    this.editingcompany.set(null);
       this.getlist()
  }

 searchSubject = new Subject<string>();
searchTerm = ''; 
constructor() {
  this.searchSubject
    .pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed()
    )
    .subscribe((value) => {
      this.queryFilters.search = value;
      this.queryFilters.pageNumber = 1;
      this.getlist();
    });
}

onSearchInput(value: string): void {
  this.searchSubject.next(value);
}
   // ---- Pagination actions ----
   // ---- Pagination state ----
  totalCount = signal(0);
  totalPages = signal(0);
  pagesArray = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.queryFilters.pageNumber) return;
    this.queryFilters.pageNumber = page;
       this.getlist()
  }

  nextPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) + 1);
  }

  prevPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) - 1);
  }

  onPageSizeChange() {
    this.queryFilters.pageNumber = 1;
       this.getlist()
  }
}
