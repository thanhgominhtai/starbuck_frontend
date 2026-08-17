import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

// 💡 C18 & C20: Import các hàm tạo Signal Form và các luật Validation từ '@angular/forms/signals'
import {
  form,
  submit,
  FormField,
  required,
  email,
  min,
  max,
  minLength,
} from '@angular/forms/signals';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';       // 💡 D3: Toast notification
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // 💡 D5: Loading spinner

import { DrinkService } from '../drink-service';

@Component({
  selector: 'app-add-drink',
  imports: [
    RouterLink,
    FormField, // 💡 C18: Directive [formField] liên kết ô input với Signal Form
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-drink.html',
  styleUrl: './add-drink.css',
})
export class AddDrink {
  private readonly drinkService = inject(DrinkService); // Inject service dữ liệu món trà
  private readonly snackBar = inject(MatSnackBar);        // 💡 D3: Inject dịch vụ Toast thông báo

  // 💡 C18: 1. Model dữ liệu gốc là 1 signal thường chứa 4 trường dữ liệu
  protected readonly drinkModel = signal({
    name: '',
    description: '',
    giaCoBan: 0,        // 💡 Kiểu số, khởi tạo bằng 0
    authorEmail: '',
  });

  // 💡 C18 & C20: 2. Form bọc QUANH signal dữ liệu gốc kèm các luật Validation bằng tiếng Việt
  protected readonly drinkForm = form(this.drinkModel, (path) => {
    // Luật kiểm tra tên món: Bắt buộc + tối thiểu 3 ký tự
    required(path.name, { message: 'Tên món trà là bắt buộc.' });
    minLength(path.name, 3, { message: 'Tên món phải có tối thiểu 3 ký tự.' });

    // Luật kiểm tra mô tả: Bắt buộc nhập
    required(path.description, { message: 'Mô tả món là bắt buộc.' });

    // Luật kiểm tra giá bán: Bắt buộc + tối thiểu 1.000đ + tối đa 200.000đ
    required(path.giaCoBan, { message: 'Giá bán là bắt buộc.' });
    min(path.giaCoBan, 1000, { message: 'Giá tối thiểu là 1.000đ.' });
    max(path.giaCoBan, 200000, { message: 'Giá tối đa là 200.000đ.' });

    // Luật kiểm tra email người tạo: Bắt buộc + đúng định dạng email
    required(path.authorEmail, { message: 'Email người tạo là bắt buộc.' });
    email(path.authorEmail, { message: 'Email không đúng định dạng.' });
  });

  // 💡 C19, D3 & D5: 3. Hàm save() bất đồng bộ sử dụng submit()
  protected async save(event: Event): Promise<void> {
    event.preventDefault(); // Ngăn hành vi submit chuyển trang mặc định của trình duyệt

    // Hàm submit tự động kiểm tra validation và chặn gửi đúp liên tục
    const ok = await submit(this.drinkForm, async () => {
      // 💡 D5: Giả lập delay 500ms để quan sát hiệu ứng spinner xoay trên nút Lưu
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newId = Date.now().toString();
      const current = this.drinkModel(); // Đọc trực tiếp dữ liệu mới nhất từ signal gốc

      // Thêm món trà mới vào Service
      this.drinkService.addDrink({
        id: newId,
        name: current.name,
        description: current.description,
        giaCoBan: current.giaCoBan,
        authorEmail: current.authorEmail,
        imgUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
        isPopular: false,
        toppings: [],
      });
    });

    // Nếu gửi thành công (ok === true)
    if (ok) {
      // 💡 D3: Hiện thanh thông báo Toast thành công ở góc dưới bên phải màn hình
      this.snackBar.open('Đã thêm món mới thành công!', 'Đóng', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      });

      // 💡 C19: RESET FORM 2 BƯỚC BẮT BUỘC
      this.drinkForm().reset(); // Bước 1: Xóa trạng thái touched/dirty của các ô nhập
      this.drinkModel.set({
        name: '',
        description: '',
        giaCoBan: 0,
        authorEmail: '',
      });                      // Bước 2: Reset dữ liệu trong signal gốc về giá trị ban đầu
    }
  }
}
