import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common'; // 💡 Pipe định dạng số tiền có dấu phẩy (30,000đ)

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';      // 💡 M3-3: Module thẻ Card
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';    // 💡 D2: Module các hạt Chip lọc
import { MatSelectModule } from '@angular/material/select';  // 💡 D6: Module menu dropdown sắp xếp

import { DrinkService } from '../drink-service';
import { DrinkModel } from '../models';

// Khai báo các kiểu giá trị bộ lọc
export type FilterCategory = 'all' | 'popular';
export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

@Component({
  selector: 'app-drink-list',
  imports: [
    FormsModule,
    RouterLink,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
  ],
  templateUrl: './drink-list.html',
  styleUrl: './drink-list.css',
})
export class DrinkList {
  private readonly drinkService = inject(DrinkService);

  protected readonly drinks = this.drinkService.drinks; // Signal danh sách tất cả món từ Service
  protected readonly keyword = signal<string>('');      // Signal lưu từ khóa tìm kiếm
  protected readonly categoryFilter = signal<FilterCategory>('all'); // 💡 D2: Signal Chip lọc trạng thái
  protected readonly sortOption = signal<SortOption>('default');    // 💡 D6: Signal tiêu chí sắp xếp

  // 💡 D2 & D6: Combined Computed tự động tính toán lại danh sách khi 1 trong 3 signal (keyword, categoryFilter, sortOption) thay đổi
  protected readonly filteredDrinks = computed(() => {
    const key = this.keyword().toLowerCase().trim();
    const category = this.categoryFilter();
    const sort = this.sortOption();

    let result = [...this.drinks()];

    // 1. Lọc theo từ khóa nhập vào (tìm trong cả tên lẫn mô tả)
    if (key) {
      result = result.filter(
        (drink) =>
          drink.name.toLowerCase().includes(key) ||
          drink.description.toLowerCase().includes(key)
      );
    }

    // 2. Lọc theo Chip loại món (D2)
    if (category === 'popular') {
      result = result.filter((drink) => drink.isPopular);
    }

    // 3. Sắp xếp danh sách (D6)
    if (sort === 'price-asc') {
      result.sort((a, b) => a.giaCoBan - b.giaCoBan);
    } else if (sort === 'price-desc') {
      result.sort((a, b) => b.giaCoBan - a.giaCoBan);
    } else if (sort === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  });

  // 💡 D2: Hàm đổi loại Chip lọc khi người dùng bấm
  protected onCategoryChange(category: FilterCategory): void {
    this.categoryFilter.set(category);
  }

  // Hàm bật/tắt yêu thích khi bấm icon ngôi sao trên thẻ card
  protected toggleFavorite(drink: DrinkModel, event: Event): void {
    event.stopPropagation(); // Chặn sự kiện click bấm làm chuyển trang
    event.preventDefault();
    this.drinkService.toggleFavorite(drink.id);
  }
}
