import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  public toasts = this.toastsSignal.asReadonly();
  private timer: any = null;

  /**
   * Displays strictly ONE notification at the top-center of the screen.
   * If a notification is already visible, any new action replaces it immediately in-place
   * with 0 downward shifting or multi-card stacking.
   */
  show(type: ToastType, message: string, title?: string, duration: number = 2800) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, message, title, duration };

    // Strictly 1 single toast on screen at any time
    this.toastsSignal.set([toast]);

    if (duration > 0) {
      this.timer = setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, title: string = 'Thành công') {
    this.show('success', message, title, 2500);
  }

  error(message: string, title: string = 'Đã có lỗi xảy ra') {
    this.show('error', message, title, 3800);
  }

  info(message: string, title: string = 'Thông báo') {
    this.show('info', message, title, 2200);
  }

  warning(message: string, title: string = 'Cảnh báo') {
    this.show('warning', message, title, 3200);
  }

  remove(id?: string) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (id) {
      this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
    } else {
      this.toastsSignal.set([]);
    }
  }

  clear() {
    this.remove();
  }
}
