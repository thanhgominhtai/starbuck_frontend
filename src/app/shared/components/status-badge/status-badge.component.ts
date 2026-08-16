import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">
      <span class="dot"></span>
      {{ status || 'Chờ tiếp nhận' }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .badge-pending {
      background: #faf6ee;
      color: #b4852e;
      border: 1px solid rgba(203, 162, 88, 0.3);
    }
    .badge-pending .dot {
      background: #cba258;
    }
    .badge-progress {
      background: #d4e9e2;
      color: #006241;
      border: 1px solid rgba(0, 98, 65, 0.2);
    }
    .badge-progress .dot {
      background: #00754a;
      animation: pulse 1.5s infinite;
    }
    .badge-completed {
      background: #e6f4ea;
      color: #137333;
      border: 1px solid rgba(19, 115, 51, 0.2);
    }
    .badge-completed .dot {
      background: #137333;
    }
    .badge-cancelled {
      background: #fde8e7;
      color: #c82014;
      border: 1px solid rgba(200, 32, 20, 0.2);
    }
    .badge-cancelled .dot {
      background: #c82014;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
      100% { opacity: 1; transform: scale(1); }
    }
  `],
})
export class StatusBadgeComponent {
  @Input() status = 'Pending';

  get badgeClass(): string {
    switch (this.status) {
      case 'Pending':
        return 'badge-pending';
      case 'Đang làm':
        return 'badge-progress';
      case 'Hoàn thành':
        return 'badge-completed';
      case 'Bị huỷ':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  }
}
