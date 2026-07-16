import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { NotificationService } from '../../../core/models/notification-service';
import { CommonModule } from '@angular/common';
import { UtcToLocalPipe } from '../../../shared/pipes/utc-to-local-pipe-pipe';
import { TimeagoPipe } from '../../../shared/pipes/timeago-pipe';

@Component({
  selector: 'component-notification',
  imports: [CommonModule ,UtcToLocalPipe],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
})
export class Notification {
  notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);

  timeAgo(sentAt: string): string {
    const diffMs = Date.now() - new Date(sentAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(sentAt).toLocaleDateString('en-US');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.notificationService.notificationsOpen() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.notificationService.close();
    }
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const threshold = 50; // px from the bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      this.notificationService.loadMore();
    }
  }
}
