import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common'; // Pipe định dạng hiển thị số tiền có dấu phẩy

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 💡 D4: Module Hộp Thoại Popup

import { DrinkService } from '../drink-service';
import { ConfirmDialogComponent } from './confirm-dialog.component';   // 💡 D4: Component Popup Xác Nhận

@Component({
  selector: 'app-drink-detail',
  imports: [
    RouterLink,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
  ],
  templateUrl: './drink-detail.html',
  styleUrl: './drink-detail.css',
})
export class DrinkDetail {
  private readonly route = inject(ActivatedRoute);  // Inject thông tin tham số đường dẫn URL
  private readonly router = inject(Router);          // Inject dịch vụ điều hướng trang
  private readonly drinkService = inject(DrinkService); // Inject service dữ liệu món trà
  private readonly dialog = inject(MatDialog);        // 💡 D4: Inject dịch vụ quản lý MatDialog

  protected readonly drinkId = signal<string>('');  // Signal lưu mã món trà được chọn từ URL (kiểu string)
  protected readonly quantity = signal<number>(1); // Signal lưu số lượng ly người dùng chọn (mặc định 1)

  constructor() {
    // Đọc tham số id trên đường dẫn URL (ví dụ /drinks/1 hoặc MongoDB ObjectId)
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      this.drinkId.set(id);
    });
  }

  // Computed tìm đối tượng món trà chi tiết từ Service theo id
  protected readonly drink = computed(() => {
    return this.drinkService.getDrinkById(this.drinkId());
  });

  // Computed tính tổng tiền = giá gốc * số lượng ly
  protected readonly totalPrice = computed(() => {
    const d = this.drink();
    if (!d) return 0;
    return d.giaCoBan * this.quantity();
  });

  // Hàm tăng/giảm số ly
  protected tangSoLuong(): void { this.quantity.update((q) => q + 1); }
  protected giamSoLuong(): void { if (this.quantity() > 1) this.quantity.update((q) => q - 1); }

  // 💡 D4: Hàm bật Hộp Thoại Popup Xác Nhận trước khi xóa món
  protected confirmDelete(): void {
    const currentDrink = this.drink();
    if (!currentDrink) return;

    // Mở popup confirm-dialog và truyền tên món trà sang qua thuộc tính data
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { drinkName: currentDrink.name },
    });

    // Lắng nghe phản hồi khi popup đóng lại
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        // Nếu người dùng bấm "Xóa món" (result === true) -> Gọi service xóa và về trang danh sách
        this.drinkService.deleteDrink(currentDrink.id);
        this.router.navigate(['/drinks']);
      }
    });
  }
}
