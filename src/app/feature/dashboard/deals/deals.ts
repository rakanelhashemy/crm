import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LeadFilter } from '../leads/leadfilter';
import { Lookup } from '../../../core/models/lookup';
import { LookupItem } from '../leads/leads';
import { FormsModule } from '@angular/forms';
import { Dealsser } from '../../../core/models/dealsser';
import { PropertyDeal } from './dealinterface';
import { NameavtarPipe } from '../../../shared/pipes/nameavtar-pipe';
import { DealModal } from "./deal-modal/deal-modal";

@Component({
  selector: 'component-deals',
  imports: [FormsModule, NameavtarPipe, DealModal],
  templateUrl: './deals.html',
  styleUrl: './deals.css',
})
export class Deals  implements OnInit{
  private readonly lookupService = inject(Lookup);
  private readonly DealsService = inject(Dealsser);

  statuses = signal<LookupItem[]>([]);
  Dealslist = signal<PropertyDeal[]>([] as PropertyDeal[]);

    statusColors: Record<number, string> = {
    1: '#8A8F98', 2: '#E0A020', 3: '#2E8FC8', 4: '#D14343',
    5: '#B98900', 6: '#7A5AF8', 7: '#D97706', 8: '#22A06B', 9: '#6B7280',
  };
    getStatusColor(statusValue: number): string {
    return this.statusColors[statusValue] || '#8A8F98';
  }

    queryFilters: LeadFilter = {
      pageNumber: 1,
      pageSize: 10,
      search: '',
      stage: null,
  
    };

    ngOnInit(): void {
    this.loadLookups();
      this.getDeals(this.queryFilters)
    }

      loadLookups() {
    this.lookupService.getDealStages().subscribe({
      next: (res) => this.statuses.set(res?.data || []),
      error: (err) => console.error('Error loading statuses:', err),
    });
  }


    onFilterChange() {
    this.queryFilters.pageNumber = 1;
    this.getDeals(this.queryFilters);
  }





  getDeals(queryFilters: LeadFilter) {
    this.DealsService.getDeals(queryFilters).subscribe({
      next: (res) => {
       console.log(res);
        this.Dealslist.set(res.data.data)
        this.totalCount.set(res?.data?.totalCount ?? 0);
        this.totalPages.set(
          res?.data?.totalPages ??
          Math.ceil((res?.data?.totalCount ?? 0) / (queryFilters.pageSize || 10))
        );
      },
      error: (err) => {
        console.error('Error fetching leads:', err);
      },
    });
  }





isModalOpen =signal (false)
editingdealId =signal <string |null>(null) 

 openAddModal() {
    this.editingdealId.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(leadid: string) {
    this.editingdealId.set(leadid);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingdealId.set(null);
    this.getDeals(this.queryFilters);
  }

 
 isDeleteModalOpen = signal(false);
deletemodalId = signal<string | null>(null);

isDeleting = signal(false);

opendeleteModal(leadId: string) {
  this.deletemodalId.set(leadId);
  this.isDeleteModalOpen.set(true);
}

closeDeleteModal() {
  this.isDeleteModalOpen.set(false);
  this.deletemodalId.set(null);
}

confirmDelete() {
  this.deleteLead(this.deletemodalId()!);
}

deleteLead(leadId: string) {
  this.isDeleting.set(true);
  this.DealsService.deleteDeal(leadId).subscribe({
    next: () => {
      this.getDeals(this.queryFilters);
      this.closeDeleteModal();
  this.isDeleting.set(false);

    },
    error: (err) => {
      console.error('Error deleting lead:', err);
    },
  });
}





 
   isShowleadView = signal(false);
  selectedLead = signal<PropertyDeal | null>(null);

  viewLead(dealId: string) {
      this.isShowleadView.set(true);
    this.DealsService.getDeal(dealId).subscribe({
      next: (res) => {
        console.log('Fetched lead details:', res?.data);
        this.selectedLead.set(res?.data ?? null);
        this.isShowleadView.set(true);
      },
      error: (err) => {
        console.error('Error fetching lead details:', err);
      },
    });
  }

  closeLeadView() {
    this.isShowleadView.set(false);
    this.selectedLead.set(null);
  }

  editFromView() {
    const lead = this.selectedLead();
    if (!lead) return;
    this.closeLeadView();
    this.openEditModal(lead.id);
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
    this.getDeals(this.queryFilters);
  }

  nextPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) + 1);
  }

  prevPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) - 1);
  }

  onPageSizeChange() {
    this.queryFilters.pageNumber = 1;
   this.getDeals(this.queryFilters);
  }
}
