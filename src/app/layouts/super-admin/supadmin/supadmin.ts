import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

type ThemeMode = 'light' | 'dark';

@Component({
  selector: 'app-supadmin',
  imports: [RouterOutlet, RouterModule, FormsModule],
  templateUrl: './supadmin.html',
  styleUrl: './supadmin.css',
})
export class Supadmin implements OnInit {
  private readonly toastrService = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeStorageKey = 'crm-theme';

  theme = signal<ThemeMode>('light');
  isLoggingOut = signal(false);

  ngOnInit(): void {
    this.setTheme(this.getInitialTheme());
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  logout() {
    const revokePayload = this.authService.getRevokePayload();

    if (!revokePayload) {
      this.authService.clearAuthDataAndRedirect();
      return;
    }

    this.isLoggingOut.set(true);

    this.authService
      .revokeToken(revokePayload)
      .pipe(finalize(() => this.isLoggingOut.set(false)))
      .subscribe({
        next: () => {
          this.authService.clearAuthData();
          this.router.navigate(['/login']);
          this.toastrService.success('logout success');
        },
        error: () => {
          this.authService.clearAuthDataAndRedirect();
        },
      });
  }

  private getInitialTheme(): ThemeMode {
    const savedTheme = localStorage.getItem(this.themeStorageKey);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    localStorage.setItem(this.themeStorageKey, theme);
    document.documentElement.dataset['theme'] = theme;
  }
}