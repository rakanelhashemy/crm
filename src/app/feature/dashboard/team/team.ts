import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Users } from '../../../core/models/users';
import { LeadFilter } from '../leads/leadfilter';
import { UserStatus } from './teamsinterface';
import { NameavtarPipe } from '../../../shared/pipes/nameavtar-pipe';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LookupItem } from '../leads/leads';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'component-team',
  imports: [NameavtarPipe ,ReactiveFormsModule ,FormsModule],
  templateUrl: './team.html',
  styleUrl: './team.css',
})
export class Team implements OnInit {
  private userService = inject(Users);
  private fb = inject(FormBuilder);
  private Auth = inject(AuthService);
 
  // ---- Query / list state ----
  queryFilters: LeadFilter = {
    pageNumber: 1,
    pageSize: 10,
    search: '',
  };
 
  userslist = signal<UserStatus[]>([]);
  dropdown = signal<LookupItem[]>([]);
 
 
  searchTerm = '';
 
  totalCount = signal(0);
  totalPages = signal(0);
  pagesArray = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );
 
  // ---- Modal state ----
  editUserId = signal<string | null>(null);
  isModalOpen = signal(false);
  isModaledit = signal(false);
 
  
  // ---- Forms ----
userForm = this.fb.group({
  fullName: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  phone: [''] 
});
 
  statusForm = this.fb.group({
    statusId: ['', Validators.required],
  });
 
  // ---- Search debounce ----
  private searchTimeout?: ReturnType<typeof setTimeout>;
 
  ngOnInit(): void {
    this.getlist();
    this.getlookup();
  }
 
  getlist() {
    this.userService.getUsers(this.queryFilters).subscribe({
      next: (res) => {
        this.userslist.set(res.data.data);
        this.totalCount.set(res.data.totalCount ?? 0);
        this.totalPages.set(
          Math.ceil((res.data.totalCount ?? 0) / (this.queryFilters.pageSize || 10))
        );
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
    });
  }
 
  getlookup() {
    this.userService.getUsersDropdownStatuses().subscribe({
      next: (res) => {
        this.dropdown.set(res.data);
      },
      error: (err) => {
        console.error('Error fetching status lookup:', err);
      },
    });
  }
 
  // ---- Search ----
  // Fired on every keystroke via (ngModelChange), debounced before hitting the API.
  onSearchChange(value: string) {
    this.searchTerm = value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.queryFilters.search = value;
      this.queryFilters.pageNumber = 1;
      this.getlist();
    }, 300);
  }
 
  clearSearch() {
    this.searchTerm = '';
    this.onSearchChange('');
  }
 
  // ---- Modals ----
  openAddModal() {
    this.userForm.reset();
    this.isModalOpen.set(true);
  }
 
  openEditModal(userId: string) {
    this.editUserId.set(userId);
    const current = this.userslist().find((u) => u.id === userId);
    this.statusForm.reset({
      statusId: (current as any)?.status ?? '',
    });
    this.isModaledit.set(true);
  }
 
  closeModal() {
    this.isModaledit.set(false);
    this.isModalOpen.set(false);
    this.editUserId.set(null);
    this.userForm.reset();
    this.statusForm.reset();
    this.getlist();
  }
 
  // ---- Pagination ----

currentPage = signal(1); // مصدر الحقيقة الحقيقي لرقم الصفحة
 

 
goToPage(page: number) {
  if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
  this.currentPage.set(page);          // ✅ بيحرّك الـ computed
  this.queryFilters.pageNumber = page; // نفس القيمة تتبعت للـ API زي الأول
  this.getlist();
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
   this.getlist();

}

 
  // ---- Actions ----
 changestatus() {
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }
    const id = this.editUserId();
    if (!id) return;
 
    const newStatus = Number(this.statusForm.value.statusId);
 

    this.userService.changeStatusesOfUser(id, { newStatus }).subscribe({
      next: () => {
        this.closeModal();
      },
      error: (err) => {
        console.error('Error updating user status:', err);
      },
    });
  }
 
submitform() {
  if (this.userForm.invalid) {
    this.userForm.markAllAsTouched();
    return;
  }

  const payload = {
    ...this.userForm.getRawValue(),
    frontendRegisterUrl : `${window.location.origin}/register/`
  };

  this.Auth.invite(payload).subscribe({
    next: (res) => {
      this.closeModal();
    console.log(res);
    
    },
    error: (err) => {
      console.error('Error inviting user:', err);
    },
  });
}
}
