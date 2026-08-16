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
  template: `
    <div class="detail-page" *ngIf="recipe()">
      <div class="detail-container">
        <!-- Back Navigation -->
        <a routerLink="/menu" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          Quay lại thực đơn
        </a>

        <div class="detail-layout">
          <!-- Left Column: Media & Highlights -->
          <div class="media-col">
            <div class="image-frame">
              <img [src]="recipe()!.imgUrl" [alt]="recipe()!.name" />
              
              <!-- Badges on top left -->
              <div class="detail-top-badges">
                <span class="badge-pop" *ngIf="recipe()!.isPopular">
                  <mat-icon>star</mat-icon>
                  Bán chạy
                </span>
                <span class="badge-special" *ngIf="recipe()!.category === 'Đặc biệt'">
                  <mat-icon>auto_awesome</mat-icon>
                  Đặc biệt
                </span>
              </div>

              <!-- Top Right: Favorite Button -->
              <button
                type="button"
                class="btn-fav-detail"
                [class.is-fav]="favoriteService.isFavorite(recipe()!.id)"
                (click)="toggleFavorite()"
                [title]="favoriteService.isFavorite(recipe()!.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'"
              >
                <mat-icon>{{ favoriteService.isFavorite(recipe()!.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
              </button>
            </div>

            <!-- Recipe Metadata Card -->
            <div class="meta-card">
              <h4 class="meta-title">Thành phần & Topping chính</h4>
              <div class="topping-list" *ngIf="recipe()!.toppings && recipe()!.toppings.length > 0; else noToppings">
                <div *ngFor="let t of recipe()!.toppings" class="topping-item">
                  <div class="topping-info">
                    <span class="topping-dot"></span>
                    <span class="topping-name">{{ t.name }}</span>
                  </div>
                  <span class="topping-qty">{{ t.quantity }} {{ t.unit }}</span>
                </div>
              </div>
              <ng-template #noToppings>
                <p class="no-toppings-txt">Món này phục vụ theo định lượng nguyên bản.</p>
              </ng-template>
            </div>
          </div>

          <!-- Right Column: Info & Order Box -->
          <div class="info-col">
            <div class="category-pill">{{ recipe()!.category || 'Thức uống' }}</div>
            <h1 class="recipe-title">{{ recipe()!.name }}</h1>
            <p class="recipe-description">{{ recipe()!.description }}</p>

            <div class="price-band">
              <span class="price-caption">Giá cơ bản / 1 phần</span>
              <span class="price-amount">{{ recipe()!.giaCoBan | vndCurrency }}</span>
            </div>

            <!-- ORDER FORM [US-07] -->
            <div class="order-box">
              <h3 class="order-box-title">
                <mat-icon>shopping_bag</mat-icon>
                Đặt Khẩu Phần Món Ăn
              </h3>

              <!-- Admin Notice [AD-00] -->
              <div class="admin-notice" *ngIf="authService.isAdmin()">
                <mat-icon>info</mat-icon>
                <div>
                  <strong>Lưu ý quyền hạn (AD-00):</strong>
                  <p>Tài khoản Quản trị viên (Admin) chỉ xem công thức và không có quyền tự đặt món.</p>
                </div>
              </div>

              <form [formGroup]="orderForm" (ngSubmit)="onPlaceOrder()" *ngIf="!authService.isAdmin()">
                <!-- Portion Selector -->
                <div class="form-row">
                  <label>Số lượng khẩu phần (1 - 20 phần):</label>
                  <div class="quantity-picker">
                    <button
                      type="button"
                      class="qty-btn"
                      (click)="decreasePortions()"
                      [disabled]="(orderForm.get('portions')?.value ?? 1) <= 1"
                    >
                      <mat-icon>remove</mat-icon>
                    </button>
                    <input type="number" formControlName="portions" min="1" max="20" />
                    <button
                      type="button"
                      class="qty-btn"
                      (click)="increasePortions()"
                      [disabled]="(orderForm.get('portions')?.value ?? 1) >= 20"
                    >
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                </div>

                <!-- Note -->
                <div class="form-row">
                  <label>Ghi chú đặc biệt (tùy chọn):</label>
                  <input
                    type="text"
                    formControlName="note"
                    placeholder="Ví dụ: Ít ngọt, 30% đá, không lấy thìa nhựa..."
                    class="txt-input"
                  />
                </div>

                <!-- Desired Time -->
                <div class="form-row">
                  <label>Thời gian nhận món:</label>
                  <select formControlName="desiredTime" class="txt-input select-input">
                    <option value="Nhận ngay">Nhận ngay (Trong vòng 15-20 phút)</option>
                    <option value="Sau 30 phút">Sau 30 phút</option>
                    <option value="Sau 1 tiếng">Sau 1 tiếng</option>
                    <option value="Hẹn giờ theo yêu cầu">Hẹn giờ theo yêu cầu</option>
                  </select>
                </div>

                <!-- Total Computation -->
                <div class="total-summary">
                  <span class="total-label">Tổng thanh toán dự kiến:</span>
                  <span class="total-price">{{ calculatedTotal() | vndCurrency }}</span>
                </div>

                <button type="submit" class="btn-order-now" [disabled]="submitting()">
                  <mat-icon>shopping_cart_checkout</mat-icon>
                  <span *ngIf="!submitting()">Xác nhận đặt món ngay</span>
                  <span *ngIf="submitting()">Đang xử lý đơn...</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-page {
      min-height: calc(100vh - 72px);
      background: #f2f0eb;
      padding: 32px 16px 60px;
    }
    .detail-container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #00754a;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 24px;
      transition: transform 0.2s;
    }
    .back-link:hover {
      transform: translateX(-4px);
    }
    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 36px;
      background: #ffffff;
      border-radius: 24px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #edebe9;
    }
    @media (max-width: 860px) {
      .detail-layout {
        grid-template-columns: 1fr;
        padding: 24px;
      }
    }
    .image-frame {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      height: 340px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;
    }
    .image-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .detail-top-badges {
      position: absolute;
      top: 14px;
      left: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 2;
    }
    .badge-pop {
      background: #cba258;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .badge-special {
      background: linear-gradient(135deg, #00754a 0%, #1e3932 100%);
      color: #dfc49d;
      border: 1px solid rgba(203, 162, 88, 0.5);
      font-size: 12px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .badge-pop mat-icon, .badge-special mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }
    .btn-fav-detail {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(4px);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #757575;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 2;
    }
    .btn-fav-detail mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      transition: transform 0.2s;
    }
    .btn-fav-detail:hover {
      transform: scale(1.1);
      background: #ffffff;
      color: #e53935;
    }
    .btn-fav-detail.is-fav {
      color: #e53935;
      background: #ffffff;
    }
    .btn-fav-detail.is-fav mat-icon {
      transform: scale(1.08);
    }
    .meta-card {
      background: #f2f0eb;
      border-radius: 16px;
      padding: 20px;
    }
    .meta-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3932;
      margin-bottom: 14px;
    }
    .topping-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .topping-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .topping-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topping-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00754a;
    }
    .topping-name {
      color: rgba(0, 0, 0, 0.87);
      font-weight: 600;
    }
    .topping-qty {
      color: rgba(0, 0, 0, 0.58);
      font-weight: 500;
    }
    .no-toppings-txt {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.58);
      font-style: italic;
    }
    .category-pill {
      display: inline-block;
      background: #d4e9e2;
      color: #006241;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 50px;
      margin-bottom: 10px;
    }
    .recipe-title {
      font-size: 28px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .recipe-description {
      font-size: 15px;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .price-band {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding-bottom: 24px;
      border-bottom: 1px solid #edebe9;
      margin-bottom: 24px;
    }
    .price-caption {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5);
    }
    .price-amount {
      font-size: 26px;
      font-weight: 800;
      color: #006241;
    }
    .order-box {
      background: #faf6ee;
      border: 1px solid #dfc49d;
      border-radius: 18px;
      padding: 24px;
    }
    .order-box-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 17px;
      font-weight: 700;
      color: #1e3932;
      margin-bottom: 18px;
    }
    .order-box-title mat-icon {
      color: #00754a;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }
    .form-row label {
      font-size: 13px;
      font-weight: 700;
      color: #1e3932;
    }
    .quantity-picker {
      display: inline-flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #d6dbde;
      border-radius: 50px;
      padding: 4px;
      width: fit-content;
    }
    .qty-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #f2f0eb;
      color: #1e3932;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .qty-btn:hover:not(:disabled) {
      background: #00754a;
      color: #ffffff;
    }
    .qty-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .quantity-picker input {
      width: 48px;
      text-align: center;
      border: none;
      font-size: 15px;
      font-weight: 700;
      color: #1e3932;
      outline: none;
    }
    .txt-input {
      padding: 10px 14px;
      border: 1px solid #d6dbde;
      border-radius: 10px;
      background: #ffffff;
      font-size: 14px;
      font-family: inherit;
      color: #1e3932;
      outline: none;
    }
    .txt-input:focus {
      border-color: #00754a;
      box-shadow: 0 0 0 3px rgba(0, 117, 74, 0.15);
    }
    .select-input {
      cursor: pointer;
    }
    .total-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-top: 1px dashed #dfc49d;
      margin-top: 8px;
      margin-bottom: 16px;
    }
    .total-label {
      font-size: 14px;
      font-weight: 700;
      color: #1e3932;
    }
    .total-price {
      font-size: 20px;
      font-weight: 800;
      color: #00754a;
    }
    .btn-order-now {
      width: 100%;
      padding: 14px 24px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 117, 74, 0.3);
    }
    .btn-order-now:hover:not(:disabled) {
      background: #005c3b;
    }
    .btn-order-now:active:not(:disabled) {
      transform: scale(0.96);
    }
    .btn-order-now:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .admin-notice {
      display: flex;
      gap: 10px;
      background: #fde8e7;
      border: 1px solid #c82014;
      border-radius: 12px;
      padding: 12px 16px;
      color: #c82014;
      font-size: 13px;
      line-height: 1.4;
    }
    .admin-notice mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .admin-notice p {
      margin-top: 2px;
    }
  `],
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
