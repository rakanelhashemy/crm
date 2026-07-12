import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output, computed, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { Lookup } from '../../../../core/models/lookup';
import { LookupItem } from '../../leads/leads';
import { Users } from '../../../../core/models/users';
import { Custmor } from '../../../../core/models/custmor';
import { Propertiess } from '../../../../core/models/properties';
import { Dealsser } from '../../../../core/models/dealsser';

interface LookupItemv2 {
  id: string;
  name?: string;
  fullName?: string;
}

interface PropertyListItem {
  id: string;
  unit: string;
  regionName: string;
  addressName: string;
  propertyTypeName: string;
  developerCompanyName: string | null;
  expectedCommissionPct: number;
  beds?: number;
  baths?: number;
  area?: number;
  officeNumbers?: number;
  price: number;
  constructionStage?: number;
  constructionStageLabel?: string;
  status: number;
  statusLabel: string;
}

interface DealDetail {
  id: string;
  propertyId: string;
  propertyUnit: string;
  regionName: string;
  addressName: string;
  propertyTypeName: string;
  developerCompany: string | null;
  expectedCommissionPct: number;
  customerId: string;
  customerName: string;
  agentId: string | null;
  agentName: string | null;
  stage: number;
  stageLabel: string;
  value: number;
  commissionPct: number;
  actualCommissionValue: number;
}

@Component({
  selector: 'component-deal-modal',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './deal-modal.html',
  styleUrl: './deal-modal.css',
})
export class DealModal implements OnInit {
  @Input() dealID: string | null = null;
  @Output() onClose = new EventEmitter<void>();

  private readonly customerService = inject(Custmor);
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(Users);
  private readonly lookupService = inject(Lookup);
  private readonly PropertiesService = inject(Propertiess);
  private readonly dealsService = inject(Dealsser);
  private readonly destroyRef = inject(DestroyRef);

  // --- state ---
  statuses = signal<LookupItem[]>([]);
  users = signal<LookupItemv2[]>([]);
  customers = signal<LookupItemv2[]>([]);
  Property = signal<PropertyListItem[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);

  propertyText = signal('');
  customerText = signal('');
  selectedProperty = signal<PropertyListItem | null>(null);

dealForm = this.fb.group({
  propertyId: ['', Validators.required],
  customerId: ['', Validators.required],
  stage: [null as number | null],
  agentId: [null as string | null],
  value: [0, [Validators.required, Validators.min(1)]],
  commissionPct: [0, [Validators.required, Validators.min(0.01), Validators.max(30)]],
});

  propertyLabel = (p: PropertyListItem) => `${p.unit ?? ''} — ${p.regionName ?? ''}`;
  customerLabel = (c: LookupItemv2) => c.fullName ?? '';

  // Turn the raw FormControl value streams into real signals so `computed()`
  // re-runs on every keystroke, not just when we call setValue() from code.
  private valueSignal = toSignal(this.dealForm.controls.value.valueChanges, {
    initialValue: this.dealForm.controls.value.value,
  });
  private commissionPctSignal = toSignal(this.dealForm.controls.commissionPct.valueChanges, {
    initialValue: this.dealForm.controls.commissionPct.value,
  });

  propertyValueDisplay = computed(() => this.valueSignal() ?? 0);
  commissionEarnedDisplay = computed(() => {
    const val = this.valueSignal() ?? 0;
    const pct = this.commissionPctSignal() ?? 0;
    return (val * pct) / 100;
  });

  ngOnInit(): void {
    this.isLoading.set(true);

    forkJoin({
      statuses: this.lookupService.getDealStages().pipe(catchError(() => of({ data: [] }))),
      users: this.usersService.getUsersDropdown().pipe(catchError(() => of({ data: { data: [] } }))),
      customers: this.customerService.getCustomers().pipe(catchError(() => of({ data: { data: [] } }))),
      properties: this.PropertiesService.getProperties().pipe(catchError(() => of({ data: { data: [] } }))),
      deal: this.dealID
        ? this.dealsService.getDeal(this.dealID).pipe(catchError(() => of(null)))
        : of(null),
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ statuses, users, customers, properties, deal }) => {
        this.statuses.set(statuses?.data || []);
        this.users.set(users?.data || []);
        this.customers.set(customers?.data?.data || []);
        this.Property.set(properties?.data?.data || []);

        if (this.dealID && deal) {
          this.patchFormFromDeal(deal.data as DealDetail);
        } else if (this.dealID && !deal) {
          this.loadError.set('Could not load this deal. Please try again.');
        }
      });
  }

  private patchFormFromDeal(deal: DealDetail) {
    this.propertyText.set(`${deal.propertyUnit ?? ''} — ${deal.regionName ?? ''}`);
    this.customerText.set(deal.customerName ?? '');

    this.selectedProperty.set({
      id: deal.propertyId,
      unit: deal.propertyUnit,
      regionName: deal.regionName,
      addressName: deal.addressName,
      propertyTypeName: deal.propertyTypeName,
      developerCompanyName: deal.developerCompany,
      expectedCommissionPct: deal.expectedCommissionPct,
      price: deal.value,
      status: 0,
      statusLabel: '',
    });

    this.dealForm.patchValue({
      propertyId: deal.propertyId,
      customerId: deal.customerId,
      agentId: deal.agentId,
      value: deal.value,
      commissionPct: deal.commissionPct,
      stage: deal.stage,
    });
  }

  onPropertyInput(text: string) {
    this.propertyText.set(text);
    const match = this.Property().find(p => this.propertyLabel(p) === text);
    this.selectedProperty.set(match ?? null);
    this.dealForm.controls.propertyId.setValue(match ? match.id : '');

    if (match) {
      this.dealForm.controls.value.setValue(match.price ?? 0);
      this.dealForm.controls.commissionPct.setValue(match.expectedCommissionPct ?? 0);
    }
  }

  onCustomerInput(text: string) {
    this.customerText.set(text);
    const match = this.customers().find(c => this.customerLabel(c) === text);
    this.dealForm.controls.customerId.setValue(match ? match.id : '');
  }

  useCommissionFromProperty() {
    const prop = this.selectedProperty();
    if (prop?.expectedCommissionPct != null) {
      this.dealForm.controls.commissionPct.setValue(prop.expectedCommissionPct);
    }
  }

  save() {
    if (this.dealForm.invalid) {
      this.dealForm.markAllAsTouched();
      return;
    }

    this.saveError.set(null);
    const raw = this.dealForm.getRawValue();
    const actualCommissionValue = (raw.value! * raw.commissionPct!) / 100;
    this.isSaving.set(true);

    const request$ = this.dealID
      ? this.dealsService.updateDeal(this.dealID, {
          propertyId: raw.propertyId,
          customerId: raw.customerId,
          agentId: raw.agentId,
          stage: raw.stage,
          value: raw.value,
          commissionPct: raw.commissionPct,
          actualCommissionValue,
        })
      : this.dealsService.createDeal({
          propertyId: raw.propertyId,
          customerId: raw.customerId,
          agentId: raw.agentId,
          value: raw.value,
          commissionPct: raw.commissionPct,
          actualCommissionValue,
        });

    request$
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.onClose.emit(),
        error: (err) => {
          console.error(this.dealID ? 'Error updating deal:' : 'Error creating deal:', err);
          const validationErrors = err?.error?.errors;
          if (validationErrors) {
            console.error('Validation details:', validationErrors);
            const firstField = Object.keys(validationErrors)[0];
            this.saveError.set(
              firstField
                ? `${firstField}: ${validationErrors[firstField]?.[0] ?? 'Invalid value'}`
                : 'Please check the form and try again.'
            );
          } else {
            this.saveError.set(err?.error?.title || 'Something went wrong while saving.');
          }
        },
      });
  }

  cancel() {
    this.onClose.emit();
  }
}