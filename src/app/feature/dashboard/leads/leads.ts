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
import { ToastrService } from 'ngx-toastr';

export interface ExcelUploadResult {
  file: File;
  name: string;
  sizeLabel: string;
}
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
  private readonly Toastr = inject(ToastrService);

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
        // Modify these field names based on the structure of your API response
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
  currentPage = signal(1); // The actual single source of truth for the current page number
 
  pagesArray = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage(); // ✅ Now correctly tracks the actual signal
    const delta = 1; // Number of pages to display around the current page
   
    const pages: number[] = [];
   
    // If total pages are small, display them all without an ellipsis
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
   
    pages.push(1); // The first page is always visible
   
    if (current - delta > 2) {
      pages.push(-1); // Ellipsis after page 1
    }
   
    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);
    for (let i = start; i <= end; i++) pages.push(i);
   
    if (current + delta < total - 1) {
      pages.push(-1); // Ellipsis before the last page
    }
   
    pages.push(total); // The last page is always visible
   
    return pages;
  });
 
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);          // ✅ Triggers the computed signal update
    this.queryFilters.pageNumber = page; // Same value is sent to the API as before
    this.getLeads(this.queryFilters);
  }
 
  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }
 
  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }
 
  onPageSizeChange() {
    this.currentPage.set(1);
    this.queryFilters.pageNumber = 1;
    this.getLeads(this.queryFilters);
  }
 

  isModalOpen = signal(false);
  leads = signal<Leadd[]>([] as Leadd[]);
  editingLeadId = signal<string | null>(null);


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
      next: (res) => {
        this.isDeleting.set(false);
        console.log(res);
        
        this.getLeads(this.queryFilters);
        this.closeDeleteModal();
        this.Toastr.success("lead",res.message ,{closeButton:true  , progressBar:true})
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



  convertLead(id:string){
     this.leadService.convertLead(id).subscribe({
      next:(res)=>{
        this.closeLeadView();
        this.Toastr.success("lead",res.message ,{closeButton:true  , progressBar:true})
      }
     })
  }








  isExcelModalOpen = signal(false);
  isUploading = signal(false);

  maxSizeMb = 50;
  acceptedExtensions = ['.xlsx', '.xls', '.csv'];

  openExcelModal(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    this.isExcelModalOpen.set(true);
  }

  

  selectedFile: File | null = null;
  isDragging = false;
  errorMessage: string | null = null;
 
  get fileSizeLabel(): string {
    if (!this.selectedFile) return '';
    return this.formatSize(this.selectedFile.size);
  }
 
  get fileExtensionLabel(): string {
    if (!this.selectedFile) return '';
    return this.selectedFile.name.split('.').pop()?.toUpperCase() ?? '';
  }
 
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }
 
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }
 
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }
 
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = '';
  }
 
  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = null;
  }
 
  cancel(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    this.isExcelModalOpen.set(false); // Instead of this.closed.emit()
  }

  confirmUpload(): void {
    if (!this.selectedFile) return;

    this.isUploading.set(true);
    this.leadService.importLeadsExcel(this.selectedFile).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.isExcelModalOpen.set(false);
        this.selectedFile = null;
        this.Toastr.success( 'File uploaded successfully', 'Import Leads', {
          closeButton: true,
          progressBar: true,
        });
        this.getLeads(this.queryFilters); // Refresh table data
      },
      error: (err) => {
        this.isUploading.set(false);
        this.errorMessage = 'An error occurred while uploading the file. Please try again.';
        console.error('Error uploading excel:', err);
      },
    });
  }
 
  private handleFile(file: File): void {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
 
    if (!this.acceptedExtensions.includes(extension)) {
      this.errorMessage = `Unsupported file format. Allowed formats: ${this.acceptedExtensions.join(', ')}`;
      this.selectedFile = null;
      return;
    }
 
    const maxBytes = this.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      this.errorMessage = `File size exceeds the allowed limit (${this.maxSizeMb} MB).`;
      this.selectedFile = null;
      return;
    }
 
    this.errorMessage = null;
    this.selectedFile = file;
  }
 
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  
}