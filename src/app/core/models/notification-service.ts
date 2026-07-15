import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

// ---- Notification Type Enum ----
// Backend enum (CRMForIndividuals.Domain.Enums.NotificationType) is serialized to its
// STRING NAME on the wire (e.g. "TaskAssigned", not "1").
//
// IMPORTANT: the backend enum was fixed so that 0 = "Unspecified" instead of a real
// type. Previously TaskAssigned = 0, which meant any notification created without an
// explicit type would default to 0 and get serialized as "TaskAssigned" — a valid-
// looking name that silently passed the "known type" check below. That bug is why
// "Unspecified" exists now: it gives unset notifications a real, detectable identity
// instead of masquerading as a legitimate type.
export enum NotificationType {
  TaskAssigned = 0,
  TaskReminder30Min = 1,
  TaskDueNow = 2,
  TaskReassigned = 3,
  General = 4,
}

// Display metadata per type, with a safe fallback for unknown/unmapped values
interface NotificationTypeMeta {
  label: string;
  icon: string;
}

const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  [NotificationType.TaskAssigned]:      { label: 'تم تعيين مهمة',      icon: 'assignment' },
  [NotificationType.TaskReminder30Min]: { label: 'تذكير بمهمة',        icon: 'alarm' },
  [NotificationType.TaskDueNow]:        { label: 'مهمة مستحقة الآن',   icon: 'warning' },
  [NotificationType.TaskReassigned]:    { label: 'إعادة تعيين مهمة',   icon: 'sync' },
  [NotificationType.General]:           { label: 'عام',                icon: 'info' },
  // Deliberately no entry for Unspecified here — it falls through to UNKNOWN_TYPE_META
  // below, which is exactly what we want: it should look generic/unlabeled, not like
  // any real notification type.
};

const UNKNOWN_TYPE_META: NotificationTypeMeta = { label: 'إشعار', icon: 'notifications' };

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

  private readonly hubUrl = environment.notificationHubUrl;
  private hubConnection: signalR.HubConnection | null = null;

  // ---- State ----
  notificationsOpen = signal(false);
  loading = signal(false);        // first load
  loadingMore = signal(false);    // loading an extra page during scroll
  notifications = signal<NotificationInterface[]>([]);
  currentPage = signal(1);
  pageSize = 10;
  hasMore = signal(true);         // is there another page left to fetch?

  unreadCount = computed(() =>
    this.notifications().filter(n => !n.isRead).length
  );

  // ---- UI Actions ----
  toggle(): void {
    this.notificationsOpen.update(v => !v);
    console.log('[Notif] toggle() -> panel open =', this.notificationsOpen());
    if (this.notificationsOpen()) {
      this.resetAndFetch();
    }
  }

  close(): void {
    this.notificationsOpen.set(false);
    console.log('[Notif] close() -> panel closed');
  }

  // ---- API Calls + State Updates ----
  private resetAndFetch(): void {
    console.log('[Notif] resetAndFetch() -> resetting page/list and fetching');
    this.currentPage.set(1);
    this.hasMore.set(true);
    this.notifications.set([]);
    this.fetchNotifications();
  }

  fetchNotifications(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) {
      console.log('[Notif] fetchNotifications() SKIPPED', {
        loading: this.loading(),
        loadingMore: this.loadingMore(),
        hasMore: this.hasMore(),
      });
      return;
    }

    const page = this.currentPage();
    page === 1 ? this.loading.set(true) : this.loadingMore.set(true);

    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', this.pageSize);

    const url = `${environment.baseUrl}notification/Mine`;
    console.log('[Notif] fetchNotifications() -> GET', url, { page, pageSize: this.pageSize });

    this.http.get<any>(url, { params }).subscribe({
      next: (res) => {

        console.log('[Notif] fetchNotifications() SUCCESS, raw response =', res);
        const newItems: NotificationInterface[] = res.data ?? res;
        console.log('[Notif] fetchNotifications() -> items received:', newItems.length, newItems);



        this.notifications.update(list => this.mergeNotifications(list, newItems));
        console.log('[Notif] notifications signal after merge:', this.notifications());

        if (newItems.length < this.pageSize) {
          this.hasMore.set(false);
          console.log('[Notif] hasMore set to FALSE (last page reached)');
        } else {
          this.currentPage.update(p => p + 1);
          console.log('[Notif] currentPage incremented to', this.currentPage());
        }

        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('[Notif] fetchNotifications() FAILED ->', err);
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  loadMore(): void {
    console.log('[Notif] loadMore() called');
    this.fetchNotifications();
  }

  markAllAsRead(): void {
    const url = `${environment.baseUrl}notification/Read`;
    console.log('[Notif] markAllAsRead() -> PATCH', url);
    this.http.patch(url, {}).subscribe({
      next: () => {
        console.log('[Notif] markAllAsRead() SUCCESS');
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      },
      error: (err) => console.error('[Notif] markAllAsRead() FAILED ->', err),
    });
  }

  markOneAsRead(item: NotificationInterface): void {
    if (item.isRead) {
      console.log('[Notif] markOneAsRead() SKIPPED, already read ->', item.id);
      return;
    }
    const url = `${environment.baseUrl}notification/${item.id}/Read`;
    console.log('[Notif] markOneAsRead() -> PATCH', url);
    this.http.patch(url, {}).subscribe({
      next: () => {
        console.log('[Notif] markOneAsRead() SUCCESS ->', item.id);
        this.notifications.update(list =>
          list.map(n => n.id === item.id ? { ...n, isRead: true } : n)
        );
      },
      error: (err) => console.error('[Notif] markOneAsRead() FAILED ->', err),
    });
  }

  /**
   * Starts the authenticated real-time notification connection.
   * Call this once after login (and once on app bootstrap if a valid
   * token already exists from a previous session) — see AUTH-WIRING.md.
   */
  connectRealtime(): void {
    console.log('[Notif][Hub] connectRealtime() called. hubUrl =', this.hubUrl);
    console.log('[Notif][Hub] current hubConnection state =', this.hubConnection?.state ?? 'null (no connection yet)');

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected ||
        this.hubConnection?.state === signalR.HubConnectionState.Connecting ||
        this.hubConnection?.state === signalR.HubConnectionState.Reconnecting) {
      console.log('[Notif][Hub] connectRealtime() SKIPPED, already connected/connecting/reconnecting');
      return;
    }

    const token = localStorage.getItem('Token');
    console.log('[Notif][Hub] token found in localStorage("Token")? ->', token ? `YES (length ${token.length})` : 'NO - THIS IS LIKELY THE BUG, check the exact key name');

    if (!this.hubConnection) {
      console.log('[Notif][Hub] building new HubConnection...');
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => {
            const t = localStorage.getItem('Token') ?? '';
            console.log('[Notif][Hub] accessTokenFactory invoked, token empty?', t === '');
            return t;
          },
          transport: signalR.HttpTransportType.LongPolling, // force it, temporarily
        })
        .withAutomaticReconnect()
        .build();

      // Payload now matches NotificationInterface exactly — see BACKEND-PATCH.md
    this.hubConnection.on('ReceiveNotification', (notification: NotificationInterface) => {
  console.log('[Notif][Hub] EVENT RECEIVED "ReceiveNotification" ->', notification);

  // Show a toast based on notification type
  if (notification.type === NotificationType[NotificationType.TaskAssigned]) {
    this.toastrService.success('New Task Assigned to You', 'Notifications');
  }

  this.notifications.update(list => this.mergeNotifications(list, [notification]));
  console.log('[Notif][Hub] notifications signal after live push:', this.notifications());
});

      this.hubConnection.onclose((err) => {
        console.warn('[Notif][Hub] connection CLOSED', err ?? '(no error, closed cleanly)');
        this.hubConnection = null;
      });

      this.hubConnection.onreconnecting((err) => {
        console.warn('[Notif][Hub] RECONNECTING...', err);
      });

      this.hubConnection.onreconnected((connectionId) => {
        console.log('[Notif][Hub] RECONNECTED, connectionId =', connectionId);
      });
    }

    console.log('[Notif][Hub] calling hubConnection.start()...');
    this.hubConnection.start()
      .then(() => {
        console.log('[Notif][Hub] CONNECTED SUCCESSFULLY. state =', this.hubConnection?.state);
      })
      .catch((err) => {
        console.error('[Notif][Hub] CONNECTION FAILED ->', err);
        this.hubConnection = null;
      });
  }

  /** Call on logout so the connection closes and the user leaves their SignalR group. */
  disconnectRealtime(): void {
    console.log('[Notif][Hub] disconnectRealtime() called, current state =', this.hubConnection?.state ?? 'null');
    this.hubConnection?.stop();
    this.hubConnection = null;
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