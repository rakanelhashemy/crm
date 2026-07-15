import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/models/notification-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('crm');
    private readonly notificationService = inject(NotificationService);

ngOnInit(): void {
     if (localStorage.getItem('Token')) {
      this.notificationService.connectRealtime();
    }
}
}
