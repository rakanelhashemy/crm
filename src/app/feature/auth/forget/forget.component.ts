import { NgClass } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, finalize, interval, take } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';

const STORAGE_KEY = 'forgot-password-state';

interface ForgotPasswordState {
  step: number;
  email: string;
  resetCode: string;
}

@Component({
  imports: [ReactiveFormsModule, NgClass, RouterLink],
  selector: 'app-forget',
  templateUrl: './forget.component.html',
  styleUrls: ['./forget.component.css'],
})
export class ForgetComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  forgotStep = signal(1);
  showPass = signal(false);
  showConfirmPass = signal(false);
  isSending = signal(false);
  isVerifying = signal(false);
  isResending = signal(false);
  isResetting = signal(false);
  resendTimer = signal(0);

  private resetCode = '';
  private readonly subscriptions = new Subscription();
  passwordPattern = /^(?=.*[a-z])(?=.*\d).{6,}$/;

  forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  verifyForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]],
  });

  resetPasswordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.pattern(this.passwordPattern)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  constructor() {
    // Whenever the step changes, automatically persist the state
    effect(() => {
      const step = this.forgotStep();
      this.persistState(step);
    });
  }

  ngOnInit(): void {
    // 1) Check for parameters coming from the email link (higher priority)
    const querySub = this.route.queryParamMap.subscribe((params) => {
      const email = params.get('email') ?? '';
      const code = params.get('code') ?? params.get('token') ?? params.get('resetCode') ?? '';

      if (email || code) {
        if (email) this.forgotForm.patchValue({ email });

        if (code) {
          this.resetCode = code;
          this.verifyForm.patchValue({ code });
          this.forgotStep.set(3);
        } else {
          this.forgotStep.set(2);
        }
        this.persistState(this.forgotStep());
        return;
      }

      // 2) No parameters? Try to restore the last saved state
      this.restoreState();
    });

    this.subscriptions.add(querySub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private persistState(step: number): void {
    // Don't save anything if still on step 1 (no need)
    if (step === 1) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const state: ForgotPasswordState = {
      step,
      email: this.forgotForm.get('email')?.value ?? '',
      resetCode: this.resetCode,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private restoreState(): void {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const state: ForgotPasswordState = JSON.parse(raw);
      if (state.email) {
        this.forgotForm.patchValue({ email: state.email });
      }
      if (state.resetCode) {
        this.resetCode = state.resetCode;
        this.verifyForm.patchValue({ code: state.resetCode });
      }
      if (state.step && state.step > 1) {
        this.forgotStep.set(state.step);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  private clearPersistedState(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  isForgotFieldInvalid(field: string): boolean {
    const control = this.forgotForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isVerifyFieldInvalid(field: string): boolean {
    const control = this.verifyForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isResetFieldInvalid(field: string): boolean {
    const control = this.resetPasswordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  sendResetLink(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSending.set(true);

    const requestSub = this.authService
      .forgotPassword({ email: this.forgotForm.controls.email.value })
      .pipe(finalize(() => this.isSending.set(false)))
      .subscribe({
        next: (res) => {
          this.forgotStep.set(2);
          this.startResendTimer();
          this.toastrService.success('The code was successfully sent to your email', 'Verify Code', {
            progressBar: true,
            closeButton: true,
          });
        },
        error: (err) => {
          this.toastrService.error(err?.error?.message, 'Failed', {
            progressBar: true,
            closeButton: true,
          });
        },
      });

    this.subscriptions.add(requestSub);
  }

  verifyCode(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.isVerifying.set(true);
    const code = this.verifyForm.controls.code.value;

    const requestSub = this.authService
      .verifyResetCode({ email: this.forgotForm.controls.email.value, code })
      .pipe(finalize(() => this.isVerifying.set(false)))
      .subscribe({
        next: (res) => {
          this.resetCode = code;
          this.forgotStep.set(3);
          this.toastrService.success('The code has been successfully verified.', 'done', {
            progressBar: true,
            closeButton: true,
          });
        },
        error: (err) => {
          this.toastrService.error(err?.error?.message ?? 'Invalid or expired code.', 'Failed', {
            progressBar: true,
            closeButton: true,
          });
        },
      });

    this.subscriptions.add(requestSub);
  }

  resendCode(): void {
    if (this.resendTimer() > 0 || this.isResending()) {
      return;
    }

    this.isResending.set(true);

    const requestSub = this.authService
      .forgotPassword({ email: this.forgotForm.controls.email.value })
      .pipe(finalize(() => this.isResending.set(false)))
      .subscribe({
        next: () => {
          this.startResendTimer();
          this.toastrService.success('The code has been resent.', 'Done', {
            progressBar: true,
            closeButton: true,
          });
        },
        error: (err) => {
          this.toastrService.error(err?.error?.message ?? 'Could not resend the code.', 'Failed', {
            progressBar: true,
            closeButton: true,
          });
        },
      });

    this.subscriptions.add(requestSub);
  }

  private startResendTimer(): void {
    this.resendTimer.set(60);
    const timerSub = interval(1000)
      .pipe(take(60))
      .subscribe(() => {
        this.resendTimer.update((v) => Math.max(v - 1, 0));
      });
    this.subscriptions.add(timerSub);
  }

  confirmNewPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isResetting.set(true);

    const payload = {
      email: this.forgotForm.controls.email.value,
      code: this.resetCode,
      newPassword: this.resetPasswordForm.controls.newPassword.value,
      confirmPassword: this.resetPasswordForm.controls.confirmPassword.value,
    };

    const requestSub = this.authService
      .resetPassword(payload)
      .pipe(finalize(() => this.isResetting.set(false)))
      .subscribe({
        next: () => {
          this.clearPersistedState();
          this.toastrService.success('Password updated successfully.', 'Success', {
            progressBar: true,
            closeButton: true,
          });
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.toastrService.error(err?.error?.message ?? 'Could not reset password.', 'Failed', {
            progressBar: true,
            closeButton: true,
          });
        },
      });

    this.subscriptions.add(requestSub);
  }

  // Called from the "Back to Login" button to intentionally clear the state
  cancelAndGoToLogin(): void {
    this.clearPersistedState();
    this.router.navigate(['/login']);
  }
}