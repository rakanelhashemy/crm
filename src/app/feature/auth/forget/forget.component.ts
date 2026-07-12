import { NgClass } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';

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
  isResetting = signal(false);

  private resetCode = '';
  private readonly subscriptions = new Subscription();
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%&*]).{6,}$/;

  forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetPasswordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(this.passwordPattern)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  ngOnInit(): void {
    const querySub = this.route.queryParamMap.subscribe((params) => {
      const email = params.get('email') ?? '';
      this.resetCode = params.get('code') ?? params.get('token') ?? params.get('resetCode') ?? '';

      if (email) {
        this.forgotForm.patchValue({ email });
      }

      if (this.resetCode || email) {
        this.forgotStep.set(2);
      }
    });

    this.subscriptions.add(querySub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { mismatch: true };
  }

  isForgotFieldInvalid(field: string): boolean {
    const control = this.forgotForm.get(field);
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
        next: () => {
          this.forgotStep.set(2);
          this.toastrService.success('Recovery instructions sent to your email.', 'Success', {
            progressBar: true,
            closeButton: true,
          });
        },
        error: (err) => {
          this.toastrService.error(err?.error?.message ?? 'Could not send recovery email.', 'Failed', {
            progressBar: true,
            closeButton: true,
          });
        },
      });

    this.subscriptions.add(requestSub);
  }

  confirmNewPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isResetting.set(true);

    const payload = {
      email: this.forgotForm.controls.email.value,
      password: this.resetPasswordForm.controls.password.value,
      confirmPassword: this.resetPasswordForm.controls.confirmPassword.value,
      code: this.resetCode,
      token: this.resetCode,
    };

    const requestSub = this.authService
      .resetPassword(payload)
      .pipe(finalize(() => this.isResetting.set(false)))
      .subscribe({
        next: () => {
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
}