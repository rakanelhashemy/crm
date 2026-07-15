import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Users } from '../../../core/models/users';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Calendar } from "../calendar/calendar";

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: number;
  statusLabel: string;
  createdAt: string;
  updatedAt: string | null;
  createdByName: string | null;
  updatedByName: string | null;
}

type ViewName = 'profile' | 'edit' | 'reset';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPwd = group.get('newPassword')?.value;
  const confirmPwd = group.get('confirmPassword')?.value;
  return newPwd && confirmPwd && newPwd !== confirmPwd ? { mismatch: true } : null;
}

@Component({
  selector: 'component-profile',
  imports: [ReactiveFormsModule, Calendar],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly profileService = inject(Users);
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // ---------- navigation ----------

  view = signal<ViewName>('profile');

  eyebrowLabel = computed(() => {
    switch (this.view()) {
      case 'reset': return 'Password reset';
      case 'edit': return 'Edit record';
      default: return 'User record';
    }
  });

  showView(name: ViewName): void {
    this.view.set(name);
    if (name === 'edit') {
      this.editSaved.set(false);
      this.patchEditForm();
    }
    if (name === 'reset') this.resetPasswordForm();
  }

  backToProfile(): void {
    this.view.set('profile');
    this.editSaved.set(false);
    this.resetDone.set(false);
  }

  // ---------- profile data ----------

  profileResource = resource({
    loader: () => firstValueFrom(this.profileService.getMyprofile()),
  });

  user = computed<UserRecord | null>(() => {
    const response = this.profileResource.value() as any;
    return response?.data ?? response ?? null;
  });
  loading = computed(() => this.profileResource.isLoading());
  loadError = computed(() => (this.profileResource.error() ? 'Failed to load profile.' : ''));

  statusStyle = computed(() => {
    const status = this.user()?.status;
    switch (status) {
      case 1: return { bg: 'var(--success-100)', fg: 'var(--success-600)' };
      case 2: return { bg: 'var(--danger-100)', fg: 'var(--danger-600)' };
      case 3: return { bg: 'var(--warn-100)', fg: 'var(--warn-600)' };
      default: return { bg: 'var(--info-100)', fg: 'var(--info-600)' };
    }
  });

  phoneDisplay = computed(() => this.user()?.phone || '—');
  createdDisplay = computed(() => this.formatDate(this.user()?.createdAt));
  updatedDisplay = computed(() => this.formatDate(this.user()?.updatedAt));

  private formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ---------- edit profile form group ----------

  editForm = this.fb.group({
    fullName: ['', Validators.required],
    phone: [''],
  });

  editSaved = signal(false);
  saving = signal(false);
  saveError = signal('');

  private patchEditForm(): void {
    const u = this.user();
    this.editForm.reset({
      fullName: u?.fullName ?? '',
      phone: u?.phone ?? '',
    });
  }

  constructor() {
    // Keep the edit form in sync whenever the profile data changes/loads.
    effect(() => {
      if (this.user()) this.patchEditForm();
    });
  }

  async saveEdit(): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set('');

    const { fullName, phone } = this.editForm.getRawValue();
    const payload = {
      fullName: (fullName ?? '').trim(),
      phone: (phone ?? '').trim(),
    };

    try {
      const response = await firstValueFrom(this.profileService.updatemyProfile(payload));
      const updated = response?.data ?? response ?? {};
      const current = this.user();

      // Optimistic update: use what we actually sent (payload) as the source of
      // truth for the fields we just edited, so the UI reflects the change
      // immediately even if the API response is minimal/empty.
      this.profileResource.set({
        ...current!,
        ...payload,
        ...updated,
        updatedAt: updated.updatedAt ?? new Date().toISOString(),
        updatedByName: updated.updatedByName ?? current?.updatedByName ?? 'You',
      });

      await this.profileResource.reload();

      this.editSaved.set(true);
    } catch {
      this.saveError.set('Failed to save changes.');
    } finally {
      this.saving.set(false);
    }
  }

  // ---------- password reset form group ----------

  resetForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  passwordScore = signal(0);
  resetError = signal('');
  resetting = signal(false);
  resetDone = signal(false);

  matchError = computed(() =>
    this.resetForm.errors?.['mismatch'] && this.resetForm.get('confirmPassword')?.touched
      ? "Passwords don't match."
      : ''
  );

  private resetPasswordForm(): void {
    this.resetForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    this.passwordScore.set(0);
    this.resetError.set('');
    this.resetDone.set(false);
  }

  onPasswordInput(): void {
    const pwd = this.resetForm.get('newPassword')?.value ?? '';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    this.passwordScore.set(score);
  }

  async submitReset(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.resetError.set('');
    this.resetting.set(true);

    const { currentPassword, newPassword, confirmPassword } = this.resetForm.getRawValue();

    try {
      await firstValueFrom(
        this.authService.changePassword({
          userId: this.user()?.id ?? '',
          currentPassword: currentPassword ?? '',
          newPassword: newPassword ?? '',
          confirmNewPassword: confirmPassword ?? '',
        })
      );
      this.resetDone.set(true);
    } catch {
      this.resetError.set('Failed to reset password. Check your current password and try again.');
    } finally {
      this.resetting.set(false);
    }
  }

  // ---------- theme ----------

  theme = this.themeService.theme;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}