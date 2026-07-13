import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { NotificationService } from '../../../core/models/notification-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'component-notification',
  imports: [CommonModule],
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

    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHour < 24) return `منذ ${diffHour} ساعة`;
    if (diffDay < 7) return `منذ ${diffDay} يوم`;
    return new Date(sentAt).toLocaleDateString('ar-EG');
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
  const threshold = 50; // px من الآخر
  if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
    this.notificationService.loadMore();
  }
}
}
