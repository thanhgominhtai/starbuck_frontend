import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="sb-dialog-wrap">
      <div class="dialog-header">
        <div class="dialog-icon-badge">
          <mat-icon class="warn-icon">warning_amber</mat-icon>
        </div>
        <h2 class="dialog-title font-serif">Xác nhận xóa món trà</h2>
      </div>
      
      <div class="dialog-body">
        <p class="dialog-text">
          Bạn có chắc chắn muốn xóa món <strong class="drink-highlight">"{{ data.drinkName }}"</strong> khỏi thực đơn quầy trà Starbucks không? Thao tác này sẽ đồng bộ tới hệ thống và không thể hoàn tác.
        </p>
      </div>

      <div class="dialog-actions">
        <button type="button" class="sb-btn-pill sb-btn-outlined" (click)="onCancel()">
          Hủy bỏ
        </button>
        <button type="button" class="sb-btn-pill btn-confirm-delete" (click)="onConfirm()">
          <mat-icon class="btn-icon">delete_forever</mat-icon>
          <span>Xác nhận xóa</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sb-dialog-wrap {
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dialog-icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background-color: var(--sb-error-subtle);
      border: 1px solid rgba(200, 32, 20, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .warn-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--sb-error);
    }

    .dialog-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: var(--sb-green-house);
      line-height: 1.2;
    }

    .dialog-body {
      padding: 4px 0;
    }

    .dialog-text {
      font-size: 0.9375rem;
      color: var(--sb-text-black);
      line-height: 1.6;
    }

    .drink-highlight {
      color: var(--sb-green-starbucks);
      font-weight: 700;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid var(--sb-border);
    }

    .btn-confirm-delete {
      background-color: var(--sb-error);
      border-color: var(--sb-error);
      color: #ffffff;
    }

    .btn-confirm-delete:hover {
      background-color: #a8180e;
      box-shadow: 0 4px 12px rgba(200, 32, 20, 0.3);
    }

    .btn-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `]
})
export class ConfirmDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  protected readonly data = inject<{ drinkName: string }>(MAT_DIALOG_DATA);

  onCancel(): void { this.dialogRef.close(false); }
  onConfirm(): void { this.dialogRef.close(true); }
}