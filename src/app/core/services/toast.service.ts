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

  show(type: ToastType, message: string, title?: string, duration: number = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, message, title, duration };

    this.toastsSignal.update((current) => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, title: string = 'Thành công') {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'Đã có lỗi xảy ra') {
    this.show('error', message, title);
  }

  info(message: string, title: string = 'Thông báo') {
    this.show('info', message, title);
  }

  warning(message: string, title: string = 'Cảnh báo') {
    this.show('warning', message, title);
  }

  remove(id: string) {
    this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
  }
}
