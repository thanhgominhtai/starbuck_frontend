import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';

import { DrinkService } from '../drink-service';
import { DrinkModel } from '../models';

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

  protected readonly drinks = this.drinkService.drinks;
  protected readonly keyword = signal<string>('');
  protected readonly categoryFilter = signal<FilterCategory>('all');
  protected readonly sortOption = signal<SortOption>('default');

  // Đếm số lượng món Hot/Phổ biến
  protected readonly popularCount = computed(() => {
    return this.drinks().filter((d) => d.isPopular).length;
  });

  // Computed tự động tính toán danh sách lọc & sắp xếp
  protected readonly filteredDrinks = computed(() => {
    const key = this.keyword().toLowerCase().trim();
    const category = this.categoryFilter();
    const sort = this.sortOption();

    let result = [...this.drinks()];

    // 1. Lọc theo từ khóa (tìm trong cả tên và mô tả)
    if (key) {
      result = result.filter(
        (drink) =>
          drink.name.toLowerCase().includes(key) ||
          drink.description.toLowerCase().includes(key)
      );
    }

    // 2. Lọc theo danh mục
    if (category === 'popular') {
      result = result.filter((drink) => drink.isPopular);
    }

    // 3. Sắp xếp danh sách
    if (sort === 'price-asc') {
      result.sort((a, b) => a.giaCoBan - b.giaCoBan);
    } else if (sort === 'price-desc') {
      result.sort((a, b) => b.giaCoBan - a.giaCoBan);
    } else if (sort === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  });

  // Đổi danh mục lọc
  protected onCategoryChange(category: FilterCategory): void {
    this.categoryFilter.set(category);
  }

  // Toggle trạng thái yêu thích
  protected toggleFavorite(drink: DrinkModel, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.drinkService.toggleFavorite(drink.id);
  }
}
