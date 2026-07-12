import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Leadmodal } from './leadmodal/leadmodal';

import { TimeagoPipe } from '../../../shared/pipes/timeago-pipe';
import { LeadFilter } from './leadfilter';
import { FormsModule } from '@angular/forms';
import { Leadd } from './leadmodal/leadinterface';
import { Lead } from '../../../core/models/lead';
import { ShortCurrencyPipePipe } from '../../../shared/pipes/short-currency-pipe-pipe';
import { NameavtarPipe } from '../../../shared/pipes/nameavtar-pipe';
import { Lookup } from '../../../core/models/lookup';


export interface LookupItem {
  value: number;
  name: string;
  label: string;
}


@Component({
  selector: 'component-leads',
  imports: [Leadmodal,  TimeagoPipe, FormsModule, ShortCurrencyPipePipe, NameavtarPipe],
  templateUrl: './leads.html',
  styleUrl: './leads.css',
})
export class Leads implements OnInit {
  private readonly leadService = inject(Lead);
  private readonly lookupService = inject(Lookup);

  statuses = signal<LookupItem[]>([]);
  sources = signal<LookupItem[]>([]);

  statusColors: Record<number, string> = {
    1: '#8A8F98', 2: '#E0A020', 3: '#2E8FC8', 4: '#D14343',
    5: '#B98900', 6: '#7A5AF8', 7: '#D97706', 8: '#22A06B', 9: '#6B7280',
  };

  queryFilters: LeadFilter = {
    pageNumber: 1,
    pageSize: 10,
    search: '',
    status: null,
    source: null,
  };

 

  ngOnInit() {
    this.getLeads(this.queryFilters);
    this.loadLookups();
  }

  getLeads(queryFilters: LeadFilter) {
    this.leadService.getLeadList(queryFilters).subscribe({
      next: (res) => {
        this.leads.set(res?.data?.data ?? []);
        // عدّلي أسماء الحقول دي على حسب شكل الـ response الراجع من الـ API عندك
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

  loadLookups() {
    this.lookupService.getLeadStatuses().subscribe({
      next: (res) => this.statuses.set(res?.data || []),
      error: (err) => console.error('Error loading statuses:', err),
    });

    this.lookupService.getLeadSources().subscribe({
      next: (res) => this.sources.set(res?.data || []),
      error: (err) => console.error('Error loading sources:', err),
    });
    
  }

  getStatusColor(statusValue: number): string {
    return this.statusColors[statusValue] || '#8A8F98';
  }

  onFilterChange() {
    this.queryFilters.pageNumber = 1;
    this.getLeads(this.queryFilters);
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
    this.getLeads(this.queryFilters);
  }

  nextPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) + 1);
  }

  prevPage() {
    this.goToPage((this.queryFilters.pageNumber || 1) - 1);
  }

  onPageSizeChange() {
    this.queryFilters.pageNumber = 1;
    this.getLeads(this.queryFilters);
  }

  isModalOpen = signal(false);
  leads = signal<Leadd[]>([] as Leadd[]);
  editingLeadId = signal<string | null>(null);
;


  openAddModal() {
    this.editingLeadId.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(leadid: string) {
    this.editingLeadId.set(leadid);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingLeadId.set(null);
    this.getLeads(this.queryFilters);
  }

 
 isDeleteModalOpen = signal(false);
deletingLeadId = signal<string | null>(null);

isDeleting = signal(false);

opendeleteModal(leadId: string) {
  this.deletingLeadId.set(leadId);
  this.isDeleteModalOpen.set(true);
}

closeDeleteModal() {
  this.isDeleteModalOpen.set(false);
  this.deletingLeadId.set(null);
}

confirmDelete() {
  this.deleteLead(this.deletingLeadId()!);
}

deleteLead(leadId: string) {
  this.isDeleting.set(true);
  this.leadService.deleteLead(leadId).subscribe({
    next: () => {
      this.isDeleting.set(false);
      this.getLeads(this.queryFilters);
      this.closeDeleteModal();
    },
    error: (err) => {
      this.isDeleting.set(false);
      console.error('Error deleting lead:', err);
    },
  });
}





  
   isShowleadView = signal(false);
  selectedLead = signal<Leadd | null>(null);

  viewLead(leadId: string) {
    // Try to find it in the already-loaded page first (avoids an extra call)
    const found = this.leads().find(l => l.id === leadId);
    if (found) {
      
      this.selectedLead.set(found);
      this.isShowleadView.set(true);
      return;
    }


    this.leadService.getLeadById(leadId).subscribe({
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
}