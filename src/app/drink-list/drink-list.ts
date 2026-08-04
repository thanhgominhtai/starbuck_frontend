import { Component, computed, signal, inject } from '@angular/core';
import { DrinkModel } from '../models';
// import { DrinkDetail } from '../drink-detail/drink-detail';
import { FormsModule } from '@angular/forms';
import { DrinkService } from '../drink-service';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-drink-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './drink-list.html',
  styleUrl: './drink-list.css',
})
export class DrinkList {
  private readonly drinkService = inject(DrinkService);
  protected readonly drinks = this.drinkService.drinks;
  // protected readonly chonTraSua = signal<DrinkModel>(this.drinks()[0]);
  protected readonly keyword = signal<string>('');
  protected readonly sortOrder = signal<'asc' | 'desc' | 'default'>('default');

  protected readonly filteredDrinks = computed(() => {
    const key = this.keyword().toLowerCase().trim();
    let result = this.drinks();

    if (key) {
      // D1: Tìm cả trong name và description
      result = result.filter(
        (drink) =>
          drink.name.toLowerCase().includes(key) ||
          drink.description.toLowerCase().includes(key)
      );
    }

    // D2: Sắp xếp theo giá
    if (this.sortOrder() === 'asc') {
      result = [...result].sort((a, b) => a.giaCoBan - b.giaCoBan);
    } else if (this.sortOrder() === 'desc') {
      result = [...result].sort((a, b) => b.giaCoBan - a.giaCoBan);
    }

    return result;
  });

  protected setSort(order: 'asc' | 'desc' | 'default'): void {
    this.sortOrder.set(order);
  }

  protected readonly maxPrice = computed(() => {
    const all = this.drinks();
    return all.length > 0 ? Math.max(...all.map((drink) => drink.giaCoBan)) : 0;
  });
}
