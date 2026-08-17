import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

export interface SseNotification {
  type: 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'RECIPE_UPDATED';
  message: string;
  orderId?: string;
  recipeId?: string;
  status?: string;
  data?: any;
  timestamp: string;
}

const SSE_URL = environment.sseUrl;

@Injectable({
  providedIn: 'root',
})
export class RealtimeSseService {
  private toast = inject(ToastService);
  private eventSource: EventSource | null = null;

  private eventsSubject = new Subject<SseNotification>();
  public events$ = this.eventsSubject.asObservable();

  public isConnected = signal<boolean>(false);
  public lastEvent = signal<SseNotification | null>(null);

  constructor() {
    this.connect();
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(SSE_URL);

      this.eventSource.onopen = () => {
        this.isConnected.set(true);
        console.log('[SSE] Kết nối Realtime SSE thành công!');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as SseNotification;
          this.lastEvent.set(payload);
          this.eventsSubject.next(payload);

          // Show floating toast notification for live events
          if (payload.type === 'ORDER_CREATED') {
            this.toast.info(payload.message, '🛒 Đơn hàng mới');
          } else if (payload.type === 'ORDER_STATUS_CHANGED') {
            this.toast.success(payload.message, '🔔 Cập nhật đơn hàng');
          }
        } catch (e) {
          console.error('[SSE] Parse error', e);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected.set(false);
        // Will auto reconnect by browser EventSource
      };
    } catch (err) {
      console.warn('[SSE] Connection error', err);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected.set(false);
    }
  }
}
