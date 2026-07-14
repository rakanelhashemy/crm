import { Component, computed, effect, EventEmitter, inject, input, Input, OnInit, Output, signal } from '@angular/core';
import { Lookup } from '../../../../core/models/lookup';
import { LookupItem } from '../../leads/leads';
import { Users } from '../../../../core/models/users';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Propertiess } from '../../../../core/models/properties';
 interface LookupItemv2 {
  id: string;
  name?: string;
  fullName?:string;
}
 
@Component({
  selector: 'component-properity-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './properity-modal.html',
  styleUrl: './properity-modal.css',
})
export class ProperityModal implements OnInit {
  private fb = inject(FormBuilder);
  private lookup = inject(Lookup);
  private UsersService = inject(Users);
  private propertyService = inject(Propertiess);

  // ---------- INPUT / OUTPUT ----------
  editingPropertyId = input<string | null>(null);
  @Output() onClose = new EventEmitter<void>();

  // ---------- COMPUTED ----------
  isEditMode = computed(() => !!this.editingPropertyId());

  // ---------- LOOKUP DATA ----------
  regions = signal<LookupItemv2[]>([]);
  PropertyStatuses = signal<LookupItemv2[]>([]);
  ConstructionStages = signal<LookupItem[]>([]);
  Addresses = signal<LookupItemv2[]>([]);
  users = signal<LookupItemv2[]>([]);
  DeveloperCompanies = signal<LookupItemv2[]>([]);

  // ---------- PANEL TOGGLES ----------
  ISopenregion = signal(false);
  ISopenAddress = signal(false);
  ISoproperitytype = signal(false);
  IScompanydev = signal(false);

  // ---------- MAIN FORM ----------
  propertyForm: FormGroup = this.fb.group({
    unit: ['', Validators.required],
    type: ['', Validators.required],
    region: ['', Validators.required],
    address: ['', Validators.required],
    beds: [null, Validators.min(1) ],
    baths: [null, Validators.min(1)],
    officeNum: [null , Validators.min(1)],
    area: [1200, [Validators.required, Validators.min(20)]],
    price: [350000, [Validators.required, Validators.min(1)]],
    stage: [''],
    owner: [''],
    notes: [''],
    developer: [''],
    commissionPct: [0, [Validators.required,Validators.min(.1), Validators.max(20)]],
  });

  // ---------- MINI CONTROLS (Add panels) ----------
  newRegionName = new FormControl('', Validators.required);
  newAddressName = new FormControl('', Validators.required);
  newTypeName = new FormControl('', Validators.required);
  newDevName = new FormControl('', Validators.required);

  constructor() {
  
    effect(() => {
      const id = this.editingPropertyId();
      // reset any open "add new" panels whenever we switch between add/edit
      this.ISopenregion.set(false);
      this.ISopenAddress.set(false);
      this.ISoproperitytype.set(false);
      this.IScompanydev.set(false);

      if (id) {
        this.loadPropertyForEdit(id);
      } else {
        this.resetForm();
      }
    });
  }

  ngOnInit(): void {
    this.loadLookUp();
  }

  loadLookUp() {
    this.loadRegions();
    this.loadStatuses();
    this.loadConstructionStages();
    this.loadAddresses();
    this.loadUsersDropdown();
    this.loadDeveloperCompaniesRegions();
  }

  // ---------- LOADERS ----------
  loadRegions(): void {
    this.lookup.getRegions().subscribe({
      next: (res) => this.regions.set(res.data),
      error: (err) => console.log('Loading regions', err),
    });
  }

  loadStatuses() {
    this.lookup.getPropertyTypes().subscribe({
      next: (res) => {
        this.PropertyStatuses.set(res.data)
        console.log(res);
        
      } ,
      error: (error) => console.log(error),
    });
  }

  loadConstructionStages() {
    this.lookup.getConstructionStages().subscribe({
      next: (res) => this.ConstructionStages.set(res.data),
      error: (error) => console.log(error),
    });
  }

  loadAddresses() {
    this.lookup.getAddresses().subscribe({
      next: (res) => this.Addresses.set(res.data),
      error: (error) => console.log(error),
    });
  }

  loadUsersDropdown() {
    this.UsersService.getUsersDropdown().subscribe({
      next: (res) => this.users.set(res.data),
      error: (error) => console.log(error),
    });
  }

  loadDeveloperCompaniesRegions() {
    this.lookup.getDeveloperCompanies().subscribe({
      next: (res) => this.DeveloperCompanies.set(res.data),
      error: (error) => console.log(error),
    });
  }

  // ---------- LOAD PROPERTY FOR EDIT ----------
  loadPropertyForEdit(id: string): void {
    this.propertyService.getPropertyById(id).subscribe({
      next: (res) => {
        const p = res.data ?? res; // fallback لو الـ API بيرجع الكائن مباشرة
        this.propertyForm.patchValue({
          unit: p.unit,
          type: p.propertyTypeId != null ? String(p.propertyTypeId) : '',
          region: p.regionId != null ? String(p.regionId) : '',
          address: p.addressId != null ? String(p.addressId) : '',
          beds: p.beds,
          baths: p.baths,
          officeNum: p.officeNumbers,
          area: p.area,
          price: p.price,
          stage: p.constructionStage != null ? String(p.constructionStage) : '',
          owner: p.agentId != null ? String(p.agentId) : '',
          notes: p.notes,
          developer: p.developerCompanyId != null ? String(p.developerCompanyId) : '',
          commissionPct: p.expectedCommissionPct,
        });
      },
      error: (err) => console.log('Error loading property for edit', err),
    });
  }

  // ---------- PANEL TOGGLES ----------
  openregion() {
    this.ISopenregion.set(true);
    this.ISopenAddress.set(false);
  }

  closeregion() {
    this.ISopenregion.set(false);
    this.newRegionName.reset('');
  }

  openAddress() {
    this.ISopenAddress.set(true);
    this.ISopenregion.set(false);
  }

  closeAddress() {
    this.ISopenAddress.set(false);
    this.newAddressName.reset('');
  }

  // ---------- REGION ----------
  saveNewRegion(): void {
    if (this.newRegionName.invalid) return;
    const name = this.newRegionName.value!;

    this.lookup.createRegion({ name }).subscribe({
      next: (res) => {
        this.closeregion();
        this.lookup.getRegions().subscribe({
          next: (regionsRes) => {
            this.regions.set(regionsRes.data);
            if (res?.data?.id) {
              this.propertyForm.get('region')?.setValue(res.data.id);
            }
          },
        });
      },
      error: (err) => console.log('Error creating region', err),
    });
  }

  deleteSelectedRegion(): void {
    const id = this.propertyForm.get('region')?.value;
    if (!id) return;
    if (!confirm('Are you sure you want to delete this region?')) return;

    this.lookup.deleteRegion(id).subscribe({
      next: () => {
        this.loadRegions();
        this.propertyForm.get('region')?.setValue('');
      },
      error: (err) => console.log('Error deleting region', err),
    });
  }

  // ---------- ADDRESS ----------
  saveNewAddress(): void {
    if (this.newAddressName.invalid) return;
    const regionId = this.propertyForm.get('region')?.value;
    if (!regionId) return;

    const name = this.newAddressName.value!;

    this.lookup.createAddress({ name, regionId: +regionId }).subscribe({
      next: (res) => {
        this.closeAddress();
        this.lookup.getAddresses().subscribe({
          next: (addressRes) => {
            this.Addresses.set(addressRes.data);
            if (res?.data?.id) {
              this.propertyForm.get('address')?.setValue(res.data.id);
            }
          },
        });
      },
      error: (err) => console.log('Error creating address', err),
    });
  }

  deleteSelectedAddress(): void {
    const id = this.propertyForm.get('address')?.value;
    if (!id) return;
    if (!confirm('Are you sure you want to delete this address?')) return;

    this.lookup.deleteAddress(id).subscribe({
      next: () => {
        this.loadAddresses();
        this.propertyForm.get('address')?.setValue('');
      },
      error: (err) => console.log('Error deleting address', err),
    });
  }

  // ---------- PROPERTY TYPE ----------
  saveNewPropertyType(): void {
    if (this.newTypeName.invalid) return;
    const name = this.newTypeName.value!;

    this.lookup.createPropertyType({ name }).subscribe({
      next: (res) => {
        this.newTypeName.reset('');
        this.ISoproperitytype.set(false);
        
        
        this.lookup.getPropertyTypes().subscribe({
          next: (statusRes) => {
            this.PropertyStatuses.set(statusRes.data);
            if (res?.data?.value) {
              this.propertyForm.get('type')?.setValue(res.data.value);
            }
          },
        });
      },
      error: (err) => console.log('Error creating property type', err),
    });
  }

  deleteSelectedPropertyType(): void {
    const id = this.propertyForm.get('type')?.value;
    if (!id) return;
    if (!confirm('Are you sure you want to delete this property type?')) return;

    this.lookup.deletePropertyType(id).subscribe({
      next: () => {
        this.loadStatuses();
        this.propertyForm.get('type')?.setValue('');
      },
      error: (err) => console.log('Error deleting property type', err),
    });
  }

  // ---------- DEVELOPER COMPANY ----------
  saveNewDeveloper(): void {
    if (this.newDevName.invalid) return;
    const name = this.newDevName.value!;

    this.lookup.createDeveloperCompanies({ name }).subscribe({
      next: (res) => {
        this.newDevName.reset('');
        this.IScompanydev.set(false);
        this.lookup.getDeveloperCompanies().subscribe({
          next: (devRes) => {
            this.DeveloperCompanies.set(devRes.data);
            if (res?.data?.id) {
              this.propertyForm.get('developer')?.setValue(res.data.id);
            }
          },
        });
      },
      error: (err) => console.log('Error creating developer company', err),
    });
  }

  deleteSelectedDeveloper(): void {
    const id = this.propertyForm.get('developer')?.value;
    if (!id) return;
    if (!confirm('Are you sure you want to delete this developer company?')) return;

    this.lookup.deleteDeveloperCompanies(id).subscribe({
      next: () => {
        this.loadDeveloperCompaniesRegions();
        this.propertyForm.get('developer')?.setValue('');
      },
      error: (err) => console.log('Error deleting developer company', err),
    });
  }

  // ---------- SUBMIT ----------
  onSubmit(): void {
    if (this.propertyForm.invalid) {
      this.propertyForm.markAllAsTouched();
      return;
    }

    const formValue = this.propertyForm.value;
    const body = {
      unit: formValue.unit,
      regionId: formValue.region,
      addressId: formValue.address,
      propertyTypeId: formValue.type,
      developerCompanyId: formValue.developer || null,
      expectedCommissionPct: formValue.commissionPct ?? 0,
      beds: formValue.beds || null,
      baths: formValue.baths || null,
      area: formValue.area || 0,
      officeNumbers: formValue.officeNum || null,
      price: formValue.price,
      constructionStage: formValue.stage != null && formValue.stage !== '' ? +formValue.stage : 1,
      notes: formValue.notes || '',
      agentId: formValue.owner,
    };

    const propertyId = this.editingPropertyId();
    const request$ = propertyId
      ? this.propertyService.updateProperty(propertyId, body)
      : this.propertyService.createProperty(body);
 console.log(body);
 
    request$.subscribe({
      next: (res) => {
        console.log(propertyId ? 'Property updated' : 'Property created', res);
        this.resetForm();
        this.onClose.emit();
      },
      error: (err) => {
        console.error('Error saving property', err);
      },
    });
  }

  resetForm(): void {
    this.propertyForm.reset({
      unit: '',
      type: '',
      region: '',
      address: '',
      beds: null,
      baths: null,
      officeNum: null,
      area: 1200,
      price: 350000,
      stage: '',
      owner: '',
      notes: '',
      developer: '',
      commissionPct: 0,
    });
  }
  }
