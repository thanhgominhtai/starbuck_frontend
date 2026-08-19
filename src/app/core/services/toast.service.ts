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
  private MAX_VISIBLE_TOASTS = 2; // Prevent screen clutter on mobile and desktop

  show(type: ToastType, message: string, title?: string, duration: number = 2800) {
    const current = this.toastsSignal();

    // 1. If duplicate message already showing, refresh it instead of adding a new card
    const existingIndex = current.findIndex((t) => t.message === message && t.type === type);
    if (existingIndex !== -1) {
      const existing = current[existingIndex];
      // Reset timer
      setTimeout(() => this.remove(existing.id), duration);
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, message, title, duration };

    // 2. Cap queue: Keep at most (MAX_VISIBLE_TOASTS - 1) before adding the new one
    this.toastsSignal.update((list) => {
      const trimmed = list.length >= this.MAX_VISIBLE_TOASTS 
        ? list.slice(list.length - (this.MAX_VISIBLE_TOASTS - 1)) 
        : list;
      return [...trimmed, toast];
    });

    if (duration > 0) {
      setTimeout(() => {
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

  remove(id: string) {
    this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
  }
}
