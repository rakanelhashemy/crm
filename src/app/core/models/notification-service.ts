import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

export enum NotificationType {
  TaskAssigned = 0,
  TaskReminder30Min = 1,
  TaskDueNow = 2,
  TaskReassigned = 3,
  General = 4,
}

interface NotificationTypeMeta {
  label: string;
  icon: string;
}

const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  [NotificationType.TaskAssigned]:      { label: 'Task Assigned',    icon: 'assignment' },
  [NotificationType.TaskReminder30Min]: { label: 'Task Reminder',    icon: 'alarm' },
  [NotificationType.TaskDueNow]:        { label: 'Task Due Now',     icon: 'warning' },
  [NotificationType.TaskReassigned]:    { label: 'Task Reassigned',  icon: 'sync' },
  [NotificationType.General]:           { label: 'General',          icon: 'info' },
};

const UNKNOWN_TYPE_META: NotificationTypeMeta = { label: 'Notification', icon: 'notifications' };

export function getNotificationMeta(type: string): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[type] ?? UNKNOWN_TYPE_META;
}

export interface NotificationInterface {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  taskItemId: string | null;
  sentAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly toastrService = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  private readonly hubUrl = environment.notificationHubUrl;
  private hubConnection: signalR.HubConnection | null = null;

  notificationsOpen = signal(false);
  loading = signal(false);
  loadingMore = signal(false);
  notifications = signal<NotificationInterface[]>([]);
  currentPage = signal(1);
  pageSize = 10;
  hasMore = signal(true);

  unreadCount = computed(() =>
    this.notifications().filter(n => !n.isRead).length
  );

  toggle(): void {
    this.notificationsOpen.update(v => !v);
    if (this.notificationsOpen()) {
      this.resetAndFetch();
    }
  }

  close(): void {
    this.notificationsOpen.set(false);
  }

  private resetAndFetch(): void {
    this.currentPage.set(1);
    this.hasMore.set(true);
    this.notifications.set([]);
    this.fetchNotifications();
  }

  fetchNotifications(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) {
      return;
    }

    const page = this.currentPage();
    page === 1 ? this.loading.set(true) : this.loadingMore.set(true);

    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', this.pageSize);

    const url = `${environment.baseUrl}notification/Mine`;

    this.http.get<any>(url, { params }).subscribe({
      next: (res) => {
        const newItems: NotificationInterface[] = res.data ?? res;

        this.notifications.update(list => this.mergeNotifications(list, newItems));

        if (newItems.length < this.pageSize) {
          this.hasMore.set(false);
        } else {
          this.currentPage.update(p => p + 1);
        }

        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('fetchNotifications error:', err);
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  loadMore(): void {
    this.fetchNotifications();
  }

  markAllAsRead(): void {
    const url = `${environment.baseUrl}notification/Read`;
    this.http.patch(url, {}).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      },
      error: (err) => console.error('markAllAsRead error:', err),
    });
  }

  markOneAsRead(item: NotificationInterface): void {
    if (item.isRead) {
      return;
    }
    const url = `${environment.baseUrl}notification/${item.id}/Read`;
    this.http.patch(url, {}).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === item.id ? { ...n, isRead: true } : n)
        );
      },
      error: (err) => console.error('markOneAsRead error:', err),
    });
  }

  connectRealtime(): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected ||
        this.hubConnection?.state === signalR.HubConnectionState.Connecting ||
        this.hubConnection?.state === signalR.HubConnectionState.Reconnecting) {
      return;
    }

    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => localStorage.getItem('Token') ?? '',
          transport: signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection.on('ReceiveNotification', (notification: NotificationInterface) => {
        console.log('SignalR notification received. Inside Angular zone?', NgZone.isInAngularZone());

        // Ensure everything below runs inside Angular's zone so change
        // detection picks up the DOM changes Toastr makes (this is the
        // most common reason a toast is "added" but never visually shown
        // on hosts like Vercel where SignalR callbacks can fire outside
        // NgZone).
        this.ngZone.run(() => {
          this.notifications.update(list => this.mergeNotifications(list, [notification]));
          this.showInteractiveToast(notification);
        });
      });

      this.hubConnection.onclose((err) => {
        if (err) {
          console.error('SignalR connection closed with error:', err);
        }
        this.hubConnection = null;
      });
    }

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR connected successfully.');
      })
      .catch((err) => {
        console.error('SignalR connection error:', err);
        this.hubConnection = null;
      });
  }

  disconnectRealtime(): void {
    this.hubConnection?.stop();
    this.hubConnection = null;
  }

  private showInteractiveToast(notification: NotificationInterface): void {
    try {
      const meta = getNotificationMeta(notification.type);

      const toast = this.toastrService.info(notification.message, notification.title || meta.label, {
        closeButton: true,
        tapToDismiss: false,
        timeOut: 8000,
        extendedTimeOut: 4000,
      });

      toast.onTap.subscribe(() => {
        this.markOneAsRead(notification);
        if (notification.taskItemId) {
          this.router.navigate(['/tasks', notification.taskItemId]);
        }
        this.notificationsOpen.set(false);
      });

      toast.onAction?.subscribe(() => {
        this.markOneAsRead(notification);
      });
    } catch (err) {
      console.error('showInteractiveToast error:', err);
    }
  }

  private mergeNotifications(
    current: NotificationInterface[],
    incoming: NotificationInterface[],
  ): NotificationInterface[] {
    const notifications = new Map(current.map(notification => [notification.id, notification]));

    for (const notification of incoming) {
      notifications.set(notification.id, notification);
    }

    return [...notifications.values()].sort(
      (left, right) => new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime(),
    );
  }
}