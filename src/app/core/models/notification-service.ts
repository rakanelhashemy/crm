import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface NotificationInterface {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  taskItemId: string;
  sentAt: string;
}
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
private readonly http = inject(HttpClient);

// ---- State ----
notificationsOpen = signal(false);
loading = signal(false);        // تحميل أول مرة
loadingMore = signal(false);    // تحميل صفحة إضافية أثناء السكرول
notifications = signal<NotificationInterface[]>([]);
currentPage = signal(1);
pageSize = 10;
hasMore = signal(true);         // هل لسه فيه بيانات تانية؟

unreadCount = computed(() =>
  this.notifications().filter(n => !n.isRead).length
);

// ---- UI Actions ----
toggle(): void {
  this.notificationsOpen.update(v => !v);
  if (this.notificationsOpen()) {
    this.resetAndFetch();
  }
}

close(): void {
  this.notificationsOpen.set(false);
}

// ---- API Calls + State Updates ----
private resetAndFetch(): void {
  this.currentPage.set(1);
  this.hasMore.set(true);
  this.notifications.set([]);
  this.fetchNotifications();
}

fetchNotifications(): void {
  if (this.loading() || this.loadingMore() || !this.hasMore()) return;

  const page = this.currentPage();
  page === 1 ? this.loading.set(true) : this.loadingMore.set(true);

  const params = new HttpParams()
    .set('page', page)
    .set('pageSize', this.pageSize);

  this.http.get<any>(`${environment.baseUrl}notification/Mine`, { params }).subscribe({
    next: (res) => {
      const newItems: NotificationInterface[] = res.data ?? res;

      this.notifications.update(list => [...list, ...newItems]);

      if (newItems.length < this.pageSize) {
        this.hasMore.set(false);
      } else {
        this.currentPage.update(p => p + 1);
      }

      this.loading.set(false);
      this.loadingMore.set(false);
    },
    error: () => {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  });
}

loadMore(): void {
  this.fetchNotifications();
}

markAllAsRead(): void {
  this.http.patch(`${environment.baseUrl}notification/Read`, {}).subscribe({
    next: () => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    }
  });
}

markOneAsRead(item: NotificationInterface): void {
  if (item.isRead) return;
  this.http.patch(`${environment.baseUrl}notification/${item.id}/Read`, {}).subscribe({
    next: () => {
      this.notifications.update(list =>
        list.map(n => n.id === item.id ? { ...n, isRead: true } : n)
      );
    }
  });
}
}
