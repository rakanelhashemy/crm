import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Lead } from '../../../../core/models/lead';
import { Lookup } from '../../../../core/models/lookup';
import { Leadd } from './leadinterface';
import { LookupItem } from '../leads';
import { Users } from '../../../../core/models/users';

@Component({
  selector: 'component-leadmodal',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './leadmodal.html',
  styleUrl: './leadmodal.css',
})
export class Leadmodal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leadService = inject(Lead);
  private readonly lookupService = inject(Lookup);
  private readonly usersService = inject(Users);
 
  @Input() leadid: string | null = null;
  @Output() onClose = new EventEmitter<void>();
 
  sources = signal<LookupItem[]>([]);
  statuses = signal<LookupItem[]>([]);
  propertyTypes = signal<LookupItem[]>([]);
  owners = signal<LookupItem[]>([]);
 
  isSaving = signal(false);
 
  isEditMode = computed(() => !!this.leadid);
 
  // Required always: phone, source, propertyType, status.
  // Owner is required only in edit mode (backend enforces OwnerId on update, not on create).
  form: FormGroup = this.fb.group({
    fullName: [''],
    phone: ['', [Validators.required ]],
    source: [null, Validators.required],
    propertyType: [null, Validators.required],
    budget: [null, Validators.min(0)],
    status: [null, Validators.required],
    owner: [null],
    notes: [''],
  });
 
  ngOnInit() {
    // Owner is only mandatory when editing an existing lead (backend requires
    // OwnerId on update, but allows it to be empty on create).
    if (this.isEditMode()) {
      this.form.get('owner')?.addValidators(Validators.required);
      this.form.get('owner')?.updateValueAndValidity();
    }
 
    this.loadLookups();
    this.loadLeadDetail();
  }
 
  private loadLeadDetail() {
    if (!this.leadid) {
      this.patchFormFromInput(null);
      return;
    }
 
    this.leadService.getLeadById(this.leadid).subscribe({
      next: (res) => this.patchFormFromInput(res?.data ?? null),
      error: (err) => {
        console.error('Error fetching lead details:', err);
        this.patchFormFromInput(null);
      },
    });
  }
 
  private loadLookups() {
    this.lookupService.getLeadSources().subscribe({
      next: (res) => this.sources.set(res?.data || []),
      error: (err) => console.error('Error loading sources:', err),
    });
 
    this.lookupService.getLeadStatuses().subscribe({
      next: (res) => this.statuses.set(res?.data || []),
      error: (err) => console.error('Error loading statuses:', err),
    });
 
    this.lookupService.getPropertyTypes?.().subscribe?.({
      next: (res: any) => {
        const items = (res?.data || []).map((item: any) => ({
          value: item.value ?? item.id,
          label: item.label ?? item.name,
        }));
        this.propertyTypes.set(items);
      },
      error: (err: any) => console.error('Error loading property types:', err),
    });
 
    this.usersService.getUsersDropdown?.().subscribe?.({
      next: (res: any) => {
        const items = (res?.data || []).map((item: any) => ({
          value: item.value ?? item.id,
          label: item.label ?? item.fullName ?? item.name,
        }));
        this.owners.set(items);
      },
      error: (err: any) => console.error('Error loading owners:', err),
    });
  }
 
  private patchFormFromInput(lead: Leadd | null) {
    if (lead) {
      this.form.patchValue({
        fullName: lead.fullName ?? null,
        phone: lead.phone ?? null,
        source: lead.source ?? null,
        propertyType: lead.propertyTypeId ?? null,
        budget: lead.budget ?? null,
        status: lead.status ?? null,
        owner: lead.ownerId ?? null,
        notes: lead.notes ?? '',
      });
    } else {
      this.form.reset({
        fullName: '',
        phone: '',
        source: null,
        propertyType: null,
        budget: null,
        status: null,
        owner: null,
        notes: '',
      });
    }
  }
 
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
 
    this.isSaving.set(true);
 
    const raw = this.form.value;
    const { propertyType, owner, ...rest } = raw;
    const payload = {
      ...rest,
      propertyTypeId: raw.propertyType === null ? null : String(raw.propertyType),
      ownerId: raw.owner === null ? null : String(raw.owner),
      budget: raw.budget === null ? null : Number(raw.budget),
    };
 
    const request$ = this.isEditMode()
      ? this.leadService.updateLead(this.leadid!, payload)
      : this.leadService.createLead(payload);
 
    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.onClose.emit();
      },
      error: (err: any) => {
        this.isSaving.set(false);
        if (err.error?.errors?.length) {
          console.error('Backend Validation Errors:', err.error.errors);
        } else {
          console.error('Error saving lead:', err);
        }
      },
    });
  }
 
  close() {
    this.onClose.emit();
  }
}