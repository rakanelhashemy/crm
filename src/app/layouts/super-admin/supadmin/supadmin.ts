import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

type ThemeMode = 'light' | 'dark';
interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
}
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


   sidebarOpen = signal(false);

     toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
 

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }


notificationsOpen = signal(false);
notifications = signal<NotificationItem[]>([
  { id: '1', text: 'A new client has registered in the system', time: '5 minutes ago', read: false },
  { id: '2', text: 'Deal #204 has been updated', time: 'An hour ago', read: false },
  { id: '3', text: 'Reminder: Call at 3 o\'clock', time: '2 hours ago', read: true },
]);

unreadNotifications = computed(() =>
  this.notifications().filter(n => !n.read).length
);

toggleNotifications(): void {
  this.notificationsOpen.update(v => !v);
}

markAllAsRead(): void {
  this.notifications.update(list =>
    list.map(n => ({ ...n, read: true }))
  );
}

// قفل البانل لو دُست بره الزرار
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  const wrapper = (event.target as HTMLElement).closest('.notification-wrapper');
  if (!wrapper && this.notificationsOpen()) {
    this.notificationsOpen.set(false);
  }
}
}