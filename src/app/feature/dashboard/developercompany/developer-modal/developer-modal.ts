import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { developerinterface } from '../deveinterface';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Developercompanyy } from '../../../../core/models/developercompany';

@Component({
  selector: 'component-developer-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './developer-modal.html',
  styleUrl: './developer-modal.css',
})
export class DeveloperModal {
 private readonly developerCompanyService= inject(Developercompanyy)
 private readonly fb= inject(FormBuilder)

 @Input() companyselected: developerinterface | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<developerinterface>();

  isSaving = false;
  errorMessage = '';

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    contactPhone: [null],                  // يقبل null بحرية، من غير أي validator
    contactEmail: [null, Validators.email], // يقبل null، لو اتكتبت قيمة لازم تبقى email صحيح
  });

 

  ngOnChanges(): void {
    if (this.companyselected) {
      this.form.patchValue({
        name: this.companyselected.name,
        contactPhone: this.companyselected.contactPhone ?? null,
        contactEmail: this.companyselected.contactEmail ?? null,
      });
    } else {
      this.form.reset({ name: '', contactPhone: null, contactEmail: null });
    }
  }

  close(): void {
    this.form.reset({ name: '', contactPhone: null, contactEmail: null });
    this.errorMessage = '';
    this.onClose.emit();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const raw = this.form.value;
    const payload = {
      name: raw.name?.trim(),
      contactPhone: raw.contactPhone?.trim() ? raw.contactPhone.trim() : null,
      contactEmail: raw.contactEmail?.trim() ? raw.contactEmail.trim() : null,
    };

    const request$ = this.companyselected?.id
      ? this.developerCompanyService.update(this.companyselected.id, payload)
      : this.developerCompanyService.create(payload);

    request$.subscribe({
      next: (result) => {
        this.isSaving = false;
        this.onSaved.emit(result);
        this.close();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'حصل خطأ، حاول تاني.';
      },
    });
  }
}
