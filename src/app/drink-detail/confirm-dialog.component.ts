import { Component, inject } from '@angular/core';

// 💡 D4: MAT_DIALOG_DATA dùng nhận dữ liệu truyền từ ngoài vào Dialog. MatDialogRef điều khiển đóng popup
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <!-- Tiêu đề Dialog Popup -->
    <h2 mat-dialog-title>Xác nhận xóa</h2>
    
    <!-- Nội dung Dialog Popup -->
    <mat-dialog-content>
      Bạn có chắc chắn muốn xóa món <strong>"{{ data.drinkName }}"</strong> này không? Hành động này không thể hoàn tác.
    </mat-dialog-content>

    <!-- Nút bấm ở chân Dialog Popup -->
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy bỏ</button>
      <button mat-filled-button color="warn" (click)="onConfirm()">Xóa món</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  // Inject đối tượng điều khiển đóng popup
  protected readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  // Inject dữ liệu (tên món trà) được truyền vào dialog từ component gọi nó
  protected readonly data = inject<{ drinkName: string }>(MAT_DIALOG_DATA);

  // Đóng popup và trả về result = false (Hủy xóa)
  onCancel(): void { this.dialogRef.close(false); }

  // Đóng popup và trả về result = true (Xác nhận xóa)
  onConfirm(): void { this.dialogRef.close(true); }
}