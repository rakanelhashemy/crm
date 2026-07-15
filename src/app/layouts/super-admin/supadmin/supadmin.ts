import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/models/notification-service';
import { ThemeService } from '../../../core/services/theme.service';
import { Notification } from '../../../feature/dashboard/notification/notification';
import { Users } from '../../../core/models/users';
import { NameavtarPipe } from '../../../shared/pipes/nameavtar-pipe';

@Component({
  selector: 'app-supadmin',
  imports: [RouterOutlet, RouterModule, FormsModule, Notification, NameavtarPipe],
  templateUrl: './supadmin.html',
  styleUrl: './supadmin.css',
})
export class Supadmin implements OnInit {
  private readonly toastrService = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly usersService = inject(Users);

  readonly notificationService = inject(NotificationService);
  readonly theme = this.themeService.theme;

  isLoggingOut = signal(false);
  sidebarOpen = signal(false);

  ngOnInit(): void {
    this.notificationService.fetchNotifications();
    this.getMyusersService()
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
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

  onBellClick(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.toggle();
  }

 name= signal<string|null>(null)
  getMyusersService(){
    this.usersService.getMyprofile().subscribe({
      next:(res)=>{
        
        this.name.set(res.data.fullName)
      }
    })
  }
  
}