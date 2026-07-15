import { Component, effect, EventEmitter, inject, input, Input, output, Output, signal, SimpleChanges } from '@angular/core';
import { LookupItem } from '../../leads/leads';
import { Lookup } from '../../../../core/models/lookup';
import { Taskss } from '../../../../core/models/tasks';
import { Users } from '../../../../core/models/users';
import { Lead } from '../../../../core/models/lead';
import { Custmor } from '../../../../core/models/custmor';
import { forkJoin } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

interface LookupItemv2 {
  id: string;
  name?: string;
  fullName?:string;
}
@Component({
  selector: 'component-tasks-modal',
  imports: [ReactiveFormsModule],
  
templateUrl: './tasks-modal.html',
  styleUrl: './tasks-modal.css',
})
export class TasksModal {
  private readonly taskService = inject(Taskss);
  private readonly lookupService = inject(Lookup);
  private readonly usersService = inject(Users);
  private readonly leadService = inject(Lead);
  private readonly customerService = inject(Custmor);
  private readonly fb = inject(FormBuilder);

  
  tasksId = input<string | null>(null);
  closed = output<void>();

  statuses = signal<LookupItem[]>([]);
  priorities = signal<LookupItem[]>([]);
  users = signal<LookupItemv2[]>([]);
  leads = signal<LookupItemv2[]>([]);
  customers = signal<LookupItemv2[]>([]);

  isLoadingLookups = signal<boolean>(false);
  isLoadingTask = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  loadError = signal<string | null>(null);

  private lookupsReady = signal<boolean>(false);
  private initialized = false;

  get isEditMode(): boolean {
    return !!this.tasksId();
  }

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    status: [null, Validators.required],
    priority: [null, Validators.required],
    dueDate: ['', [Validators.required, this.futureDateValidator()]],
    notes: [''],
    assigneeId: ['', Validators.required],
    leadId: [null],
    customerId: [null]
  });

  constructor() {
    this.loadModalData();

    // A task can link to a lead or a customer, not both.
    // Picking one clears the other.
    this.taskForm.get('leadId')?.valueChanges.subscribe((value) => {
      if (value) {
        this.taskForm.get('customerId')?.setValue(null, { emitEvent: false });
      }
    });

    this.taskForm.get('customerId')?.valueChanges.subscribe((value) => {
      if (value) {
        this.taskForm.get('leadId')?.setValue(null, { emitEvent: false });
      }
    });

   
    effect(() => {
      const id = this.tasksId();
      const ready = this.lookupsReady();
      if (!ready) {
        return;
      }

      if (!this.initialized) {
        this.initialized = true;
        if (id) {
          this.loadTask(id);
        }
        return;
      }

      if (id) {
        this.loadTask(id);
      } else {
        this.taskForm.reset({
          title: '',
          status: null,
          priority: null,
          dueDate: '',
          notes: '',
          assigneeId: '',
          leadId: null,
          customerId: null
        });
      }
    });
  }

  private loadModalData(): void {
    this.isLoadingLookups.set(true);
    this.loadError.set(null);

    forkJoin({
      statuses: this.lookupService.gettasksStatuses(),
      priorities: this.lookupService.gettasksPriorities(),
      users: this.usersService.getUsersDropdown(),
      leads: this.leadService.getLeadList(),
      customers: this.customerService.getCustomers()
    }).subscribe({
      next: (res: any) => {
        this.statuses.set(res.statuses.data);
        this.priorities.set(res.priorities.data);

        this.users.set(
          (res.users.data ?? []).map((u: any) => ({ id: u.id, fullName: u.fullName }))
        );
        this.leads.set(
          (res.leads.data.data ?? []).map((l: any) => ({ id: l.id, fullName: l.fullName }))
        );
        this.customers.set(
          (res.customers.data.data ?? []).map((c: any) => ({ id: c.id, fullName: c.fullName }))
        );

        this.isLoadingLookups.set(false);
      
        this.lookupsReady.set(true);
      },
      error: (err) => {
        this.isLoadingLookups.set(false);
        this.loadError.set('Could not load form data. Please try again.');
      }
    });
  }

  private loadTask(id: string): void {
    this.isLoadingTask.set(true);
    this.loadError.set(null);

    this.taskService.getTaskById(id).subscribe({
      next: (res: any) => {
        const task = res.data ?? res;
        this.taskForm.patchValue({
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? this.toLocalDateTimeInputValue(task.dueDate) : '',
          notes: task.notes,
          assigneeId: task.assigneeId,
          leadId: task.leadId ?? null,
          customerId: task.customerId ?? null
        });
        this.isLoadingTask.set(false);
      },
      error: (err) => {
        this.isLoadingTask.set(false);
        this.loadError.set('Could not load this task. Please try again.');
      }
    });
  }

  save(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.loadError.set(null);

    const payload = { ...this.taskForm.value };

    // Local datetime-local value -> UTC ISO string for the server
    if (payload.dueDate) {
      payload.dueDate = new Date(payload.dueDate).toISOString();
    }
console.log(payload);

    const id = this.tasksId();

    const request$ = this.isEditMode
      ? this.taskService.updateTask(id as string, payload)
      : this.taskService.createTask(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.loadError.set('Could not save the task. Please try again.');
      }
    });
  }

  close(): void {
    this.closed.emit();
  } 

  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; 
      }

      const inputDate = new Date(value);
      const now = new Date();

     
      return inputDate < now ? { pastDate: true } : null;
    };
  }

  // Converts a UTC ISO string (from the server) into the local value
  // expected by <input type="datetime-local">, e.g. "2026-07-15T16:30".
  private toLocalDateTimeInputValue(utcIso: string): string {
    const date = new Date(utcIso);
    const localMs = date.getTime() - date.getTimezoneOffset() * 60000;
    return new Date(localMs).toISOString().slice(0, 16);
  }

}