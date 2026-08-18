import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
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
