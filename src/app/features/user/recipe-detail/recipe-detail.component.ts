import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RecipeService } from '../../../core/services/recipe.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { ToastService } from '../../../core/services/toast.service';
import { Recipe } from '../../../core/models/recipe.model';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, VndCurrencyPipe],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.css',
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private orderService = inject(OrderService);
  public authService = inject(AuthService);
  public favoriteService = inject(FavoriteService);
  private toast = inject(ToastService);

  recipe = signal<Recipe | null>(null);
  submitting = signal<boolean>(false);

  orderForm = this.fb.group({
    portions: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    note: [''],
    desiredTime: ['Nhận ngay'],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipeService.getRecipeById(id).subscribe({
        next: (data) => this.recipe.set(data),
        error: () => {
          this.toast.error('Không tìm thấy thông tin món ăn');
          this.router.navigate(['/menu']);
        },
      });
    }
  }

  toggleFavorite() {
    const r = this.recipe();
    if (!r) return;
    const isFav = this.favoriteService.toggleFavorite(r.id);
    if (isFav) {
      this.toast.success(`Đã thêm "${r.name}" vào danh sách Yêu thích ❤️`);
    } else {
      this.toast.info(`Đã bỏ "${r.name}" khỏi danh sách Yêu thích`);
    }
  }

  calculatedTotal(): number {
    if (!this.recipe()) return 0;
    const portions = this.orderForm.get('portions')?.value || 1;
    return this.recipe()!.giaCoBan * portions;
  }

  increasePortions() {
    const current = this.orderForm.get('portions')?.value || 1;
    if (current < 20) {
      this.orderForm.patchValue({ portions: current + 1 });
    }
  }

  decreasePortions() {
    const current = this.orderForm.get('portions')?.value || 1;
    if (current > 1) {
      this.orderForm.patchValue({ portions: current - 1 });
    }
  }

  onPlaceOrder() {
    if (this.orderForm.invalid || !this.recipe()) return;
    this.submitting.set(true);

    const { portions, note, desiredTime } = this.orderForm.value;

    this.orderService
      .createOrder({
        recipeId: this.recipe()!.id,
        portions: portions!,
        note: note || '',
        desiredTime: desiredTime || 'Nhận ngay',
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Đặt món thành công! Đơn hàng của bạn đang được tiếp nhận');
          this.router.navigate(['/my-orders']);
        },
        error: () => {
          this.submitting.set(false);
        },
      });
  }
}
