import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Xác nhận hành động';
  @Input() message = 'Bạn có chắc chắn muốn tiếp tục thực hiện hành động này không?';
  @Input() confirmText = 'Xác nhận';
  @Input() cancelText = 'Huỷ bỏ';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
