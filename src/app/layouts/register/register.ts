import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'component-register',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  // State flags for the template
  isVerifying = signal(true);
  isTokenValid = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  private email = '';
  private invitationToken = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      this.invitationToken = params['token'];

      if (!this.email || !this.invitationToken) {
        console.error('Missing email or invitationToken in query params');
        this.isVerifying.set(false);
        this.errorMessage.set('Invalid or expired invitation link.');
        return;
      }

      this.authService.verifyInvite({ email: this.email, invitationToken: this.invitationToken }).subscribe({
        next: () => {
          this.isVerifying.set(false);
          this.isTokenValid.set(true);
        },
        error: (err) => {
          console.error('Invite verification failed', err);
          this.isVerifying.set(false);
          this.router.navigate(['/login']);
        },
      });
    });
  }

  get passwordsMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && !!this.form.get('confirmPassword')?.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      invitationToken: this.invitationToken,
      email: this.email,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword,
    };

    this.authService.completeRegistration(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
  showPassword = signal(false);
showConfirmPassword = signal(false);
}