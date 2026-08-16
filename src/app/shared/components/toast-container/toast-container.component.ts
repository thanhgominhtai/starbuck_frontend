import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-wrapper" *ngIf="toastService.toasts().length > 0">
      <div
        *ngFor="let t of toastService.toasts()"
        class="toast-card"
        [ngClass]="'toast-' + t.type"
        (click)="toastService.remove(t.id)"
      >
        <div class="toast-icon">
          <mat-icon *ngIf="t.type === 'success'">check_circle</mat-icon>
          <mat-icon *ngIf="t.type === 'error'">error</mat-icon>
          <mat-icon *ngIf="t.type === 'warning'">warning</mat-icon>
          <mat-icon *ngIf="t.type === 'info'">info</mat-icon>
        </div>
        <div class="toast-body">
          <div class="toast-title" *ngIf="t.title">{{ t.title }}</div>
          <div class="toast-msg">{{ t.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.remove(t.id); $event.stopPropagation()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 380px;
      pointer-events: none;
    }
    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06);
      border-left: 5px solid #00754a;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
    }
    .toast-card:hover {
      transform: translateY(-2px);
    }
    .toast-success {
      border-left-color: #00754a;
    }
    .toast-success .toast-icon {
      color: #00754a;
    }
    .toast-error {
      border-left-color: #c82014;
    }
    .toast-error .toast-icon {
      color: #c82014;
    }
    .toast-warning {
      border-left-color: #fbbc05;
    }
    .toast-warning .toast-icon {
      color: #fbbc05;
    }
    .toast-info {
      border-left-color: #1e3932;
    }
    .toast-info .toast-icon {
      color: #1e3932;
    }
    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toast-body {
      flex: 1;
    }
    .toast-title {
      font-weight: 700;
      font-size: 14px;
      color: #1e3932;
      margin-bottom: 2px;
    }
    .toast-msg {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.75);
      line-height: 1.4;
    }
    .toast-close {
      background: none;
      border: none;
      color: rgba(0, 0, 0, 0.4);
      cursor: pointer;
      padding: 0;
      display: flex;
    }
    .toast-close:hover {
      color: #000;
    }
    .toast-close mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `],
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
