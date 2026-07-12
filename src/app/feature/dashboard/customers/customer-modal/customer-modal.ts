import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { Lookup } from '../../../../core/models/lookup';
import { LookupItem } from '../../leads/leads';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Users } from '../../../../core/models/users';
import { Custmor } from '../../../../core/models/custmor';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'component-customer-modal',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './customer-modal.html',
  styleUrl: './customer-modal.css',
})
export class CustomerModal implements OnInit {
  private readonly lookupService = inject(Lookup);
  private readonly usersService = inject(Users);
  private readonly customerService = inject(Custmor);
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);

  @Input() customerId: string | null = null;
  @Output() onClose = new EventEmitter<void>();

  owners = signal<LookupItem[]>([]);
  types = signal<LookupItem[]>([]);
  isSaving = signal(false);
 


  form: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern('^(05[024568][0-9]{7}|0[1-9][0-9]{7})$')]],
    customerTag: [null, Validators.required],
    notes: [''],
    ownerId: [null ,],
  });



  ngOnInit(): void {
    this.loadLookups();
    this.loadCustomer();
  }


  loadLookups() {
    this.lookupService.getCustomerTags().subscribe({
      next: (res) => this.types.set(res?.data || []),
      error: (err) => console.error('Error loading customer tags:', err),
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


    get isEditMode(): boolean {
    return !!this.customerId;
  }
  
  loadCustomer() {
    if (!this.customerId) return;


    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (res) => {
        const customer = res?.data ?? res;

        this.form.patchValue({
          fullName: customer?.fullName ?? '',
          phone: customer?.phone ?? '',
          customerTag: customer?.customerTag ?? customer?.customerTagId ?? null,
          notes: customer?.notes ?? '',
          ownerId: customer?.ownerId ?? null,
        });

      },
      error: (err) => {
        console.error('Error loading customer:', err);
      },
    });
  }

  close() {
    this.onClose.emit();
  }

  onsubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const payload = this.form.value;
    const request$ = this.customerId
      ? this.customerService.updateCustomer(this.customerId, payload)
      : this.customerService.createCustomer(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastrService.success(this.customerId ? 'Customer updated successfully' : 'Customer added successfully');
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
      },
    });
  }
}
