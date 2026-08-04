import { Component, computed, inject, signal } from '@angular/core';
// import { DrinkModel } from '../models';
import { DecimalPipe } from '@angular/common';
import { DrinkService } from '../drink-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-drink-detail',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './drink-detail.html',
  styleUrl: './drink-detail.css',
})
export class DrinkDetail {
  private readonly drinkService = inject(DrinkService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.paramMap);
  protected readonly soLy = signal<number>(1);


  protected readonly selectedDrink = computed(() => {
    const id = Number(this.params()?.get('id'))
    return this.drinkService.getDrinkById(id);
  })

  protected tangSoLy(): void {
    this.soLy.update((n) => n + 1);
  }

  protected giamSoLy(): void {
    if (this.soLy() > 1) {
      this.soLy.update((n) => n - 1);
    }
  }

  protected readonly tongTien = computed(() => {
    const drink = this.selectedDrink();
    if (!drink) return 0;
    const baseTotal = drink.giaCoBan * this.soLy();
    return this.soLy() >= 5 ? baseTotal * 0.9 : baseTotal;
  });

  protected readonly toppingCanDung = computed(() => {
    const drink = this.selectedDrink();
    if (!drink) return [];
    return drink.toppings.map((topping) => ({
      ...topping,
      quantity: topping.quantity * this.soLy(),
    }));
  });

  protected readonly tongSoTopping = computed(() => {
    return this.toppingCanDung().reduce((sum, item) => sum + item.quantity, 0);
  });

  // D4: Xóa món
  protected deleteDrink(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa món này không?')) {
      this.drinkService.deleteDrink(id);
      this.router.navigate(['/drinks']);
    }
  }

  // D5: Bật/Tắt yêu thích
  protected toggleFavorite(id: number): void {
    this.drinkService.toggleFavorite(id);
  }
}
