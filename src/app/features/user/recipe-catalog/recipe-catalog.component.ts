import { Component, OnInit, inject, signal, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';
import { RecipeService } from '../../../core/services/recipe.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { ToastService } from '../../../core/services/toast.service';
import { Recipe } from '../../../core/models/recipe.model';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-recipe-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    LoadingSkeletonComponent,
    VndCurrencyPipe,
  ],
  template: `
    <div class="catalog-page">
      <!-- Hero Banner with Starbucks House Green Band -->
      <section class="hero-band">
        <div class="hero-content">
          <div class="hero-eyebrow">
            <mat-icon class="star-mini">star</mat-icon>
            <span>STARBUCKS ATELIER MENU</span>
            <mat-icon class="star-mini">star</mat-icon>
          </div>
          <h1 class="hero-title">
            Khám Phá <span class="highlight-gold">Hương Vị Tinh Hoa</span> <span class="highlight-green">Starbucks</span>
          </h1>
          <p class="hero-desc">
            Từ cà phê hạt rang mộc, trà ủ lạnh thơm mát đến công thức độc quyền — trải nghiệm trọn vẹn nghệ thuật pha chế thủ công thượng hạng.
          </p>

          <!-- Search Bar with REST API Debounce Constraints [FE-06] -->
          <div class="search-bar-wrap">
            <div class="search-input-box">
              <mat-icon class="search-icon">search</mat-icon>
              <input
                type="text"
                [formControl]="searchControl"
                placeholder="Tìm kiếm theo tên món hoặc thành phần (tối thiểu 2 ký tự)..."
              />
              <button
                type="button"
                class="clear-btn"
                *ngIf="searchControl.value"
                (click)="clearSearch()"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content Area -->
      <div class="catalog-container">
        <!-- Apple-Style Interactive Magnification Category Dock -->
        <div class="dock-container-wrap">
          <div
            #dockRef
            class="apple-dock"
            (mousemove)="onDockMouseMove($event)"
            (mouseleave)="onDockMouseLeave()"
            role="toolbar"
            aria-label="Thanh tùy chọn danh mục món ăn"
          >
            <button
              *ngFor="let item of categoryItems; let i = index"
              type="button"
              class="dock-item"
              [class.active]="selectedCategory() === item.id"
              [style.transform]="getDockItemTransform(i)"
              (click)="selectCategory(item.id)"
              (mouseenter)="hoveredIndex.set(i)"
              (mouseleave)="hoveredIndex.set(-1)"
            >
              <!-- Floating Tooltip Label (DockLabel) -->
              <div class="dock-label" *ngIf="hoveredIndex() === i">
                <span class="dock-label-title">{{ item.label }}</span>
                <span class="dock-label-sub">{{ item.tag }}</span>
              </div>

              <!-- Dock Item Icon -->
              <div class="dock-icon-box" [class.is-fav]="item.id === '❤️ Yêu thích'">
                <mat-icon>{{ item.icon }}</mat-icon>
              </div>

              <span class="dock-text">{{ item.label }}</span>

              <!-- Active Glowing Dot (Dock Indicator) -->
              <span class="dock-active-dot" *ngIf="selectedCategory() === item.id"></span>
            </button>
          </div>
        </div>

        <!-- Loading State Skeleton [FE-09] -->
        <div *ngIf="loading()" class="skeleton-section">
          <app-loading-skeleton [count]="6"></app-loading-skeleton>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && recipes().length === 0" class="empty-state">
          <div class="empty-icon">
            <mat-icon>search_off</mat-icon>
          </div>
          <h3 class="empty-title">Không tìm thấy món ăn nào</h3>
          <p class="empty-desc">
            Không có công thức nào khớp với từ khóa tìm kiếm của bạn. Hãy thử từ khóa khác!
          </p>
          <button class="btn-reset" (click)="clearSearch()">Xem tất cả thực đơn</button>
        </div>

        <!-- Recipe Grid List [US-04] -->
        <div *ngIf="!loading() && recipes().length > 0" class="recipe-grid">
          <div *ngFor="let recipe of recipes()" class="recipe-card">
            <!-- Card Image -->
            <div class="card-media">
              <img [src]="recipe.imgUrl" [alt]="recipe.name" loading="lazy" />

              <!-- Top Left: Highlight Badges ("Bán chạy" / "Đặc biệt") - Luôn ở trên đầu hình -->
              <div class="card-top-badges">
                <span class="popular-badge" *ngIf="recipe.isPopular">
                  <mat-icon>star</mat-icon>
                  Bán chạy
                </span>
                <span class="special-badge" *ngIf="recipe.category === 'Đặc biệt'">
                  <mat-icon>auto_awesome</mat-icon>
                  Đặc biệt
                </span>
              </div>

              <!-- Top Right: Nút Trái Tim Yêu Thích -->
              <button
                type="button"
                class="btn-fav-card"
                [class.is-fav]="favoriteService.isFavorite(recipe.id)"
                (click)="toggleFav(recipe, $event)"
                [title]="favoriteService.isFavorite(recipe.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'"
              >
                <mat-icon>{{ favoriteService.isFavorite(recipe.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
              </button>

              <!-- Bottom Right: Loại nước (Category) của các món -->
              <span class="cat-badge">{{ recipe.category || 'Món nước' }}</span>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <h3 class="recipe-name">{{ recipe.name }}</h3>
              <p class="recipe-desc">{{ recipe.description }}</p>

              <!-- Toppings count summary -->
              <div class="topping-tags" *ngIf="recipe.toppings && recipe.toppings.length > 0">
                <span class="tag-label">Topping ({{ recipe.toppings.length }}):</span>
                <span *ngFor="let t of recipe.toppings.slice(0, 2)" class="topping-tag">
                  {{ t.name }}
                </span>
                <span *ngIf="recipe.toppings.length > 2" class="topping-more">
                  +{{ recipe.toppings.length - 2 }}
                </span>
              </div>

              <!-- Card Footer -->
              <div class="card-footer">
                <div class="price-box">
                  <span class="price-label">Giá từ</span>
                  <span class="price-val">{{ recipe.giaCoBan | vndCurrency }}</span>
                </div>
                <a [routerLink]="['/recipe', recipe.id]" class="btn-detail">
                  <span>Chi tiết & Đặt món</span>
                  <mat-icon>arrow_forward</mat-icon>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      min-height: calc(100vh - 72px);
      background: #f2f0eb;
      padding-bottom: 60px;
    }
    .hero-band {
      background: radial-gradient(circle at 50% 25%, rgba(0, 117, 74, 0.32) 0%, rgba(30, 57, 50, 0.98) 75%), #13241f;
      color: #ffffff;
      padding: 60px 24px 50px;
      text-align: center;
      position: relative;
      border-bottom: 1px solid rgba(203, 162, 88, 0.2);
    }
    .hero-content {
      max-width: 820px;
      margin: 0 auto;
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      font-weight: 800;
      color: #dfc49d;
      letter-spacing: 0.2em;
      background: rgba(203, 162, 88, 0.12);
      padding: 5px 18px;
      border-radius: 50px;
      border: 1px solid rgba(203, 162, 88, 0.35);
      margin-bottom: 16px;
      backdrop-filter: blur(6px);
    }
    .star-mini {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: #cba258;
    }
    .hero-title {
      font-size: 40px;
      font-weight: 800;
      color: #f7f5f0;
      letter-spacing: -0.025em;
      margin-bottom: 14px;
      line-height: 1.25;
    }
    .highlight-gold {
      background: linear-gradient(135deg, #fcefd6 0%, #dfc49d 45%, #cba258 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
      font-weight: 900;
    }
    .highlight-green {
      color: #b2ebd4;
      font-weight: 800;
      text-shadow: 0 0 16px rgba(0, 117, 74, 0.4);
    }
    .hero-desc {
      font-size: 15.5px;
      color: #d4e9e2;
      line-height: 1.65;
      margin-bottom: 32px;
      opacity: 0.88;
      max-width: 640px;
      margin-left: auto;
      margin-right: auto;
    }
    .search-bar-wrap {
      max-width: 580px;
      margin: 0 auto;
    }
    .search-input-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border-radius: 50px;
      padding: 10px 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    .search-icon {
      color: #00754a;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .search-input-box input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 15px;
      color: #1e3932;
      font-family: inherit;
    }
    .clear-btn {
      background: none;
      border: none;
      color: rgba(0, 0, 0, 0.4);
      cursor: pointer;
      display: flex;
    }
    .catalog-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 24px 0;
    }
    .dock-container-wrap {
      display: flex;
      justify-content: center;
      margin: 8px 0 36px;
      position: sticky;
      top: 14px;
      z-index: 100;
      padding: 0 12px;
    }
    .apple-dock {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 50px;
      border: 1.5px solid rgba(203, 162, 88, 0.35);
      box-shadow: 0 14px 34px rgba(30, 57, 50, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: box-shadow 0.3s;
    }
    .apple-dock:hover {
      box-shadow: 0 20px 44px rgba(30, 57, 50, 0.18), 0 6px 16px rgba(0, 0, 0, 0.08);
      border-color: rgba(203, 162, 88, 0.6);
    }
    .dock-item {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      border-radius: 50px;
      border: 1px solid transparent;
      background: rgba(242, 240, 235, 0.7);
      color: #1e3932;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      white-space: nowrap;
      transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s, color 0.2s, box-shadow 0.2s;
      transform-origin: bottom center;
    }
    .dock-item:hover {
      background: #ffffff;
      color: #00754a;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .dock-item.active {
      background: #00754a;
      color: #ffffff;
      border-color: #00754a;
      box-shadow: 0 4px 14px rgba(0, 117, 74, 0.4);
    }
    .dock-icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dock-icon-box mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #00754a;
      transition: color 0.2s;
    }
    .dock-item.active .dock-icon-box mat-icon {
      color: #ffffff;
    }
    .dock-icon-box.is-fav mat-icon {
      color: #e53935;
    }
    .dock-item.active .dock-icon-box.is-fav mat-icon {
      color: #ffcdd2;
    }
    .dock-text {
      font-weight: 700;
    }
    .dock-active-dot {
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #dfc49d;
      box-shadow: 0 0 6px #dfc49d;
    }
    .dock-label {
      position: absolute;
      top: -46px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e3932;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 11px;
      white-space: nowrap;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(203, 162, 88, 0.4);
      animation: labelPop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
    }
    .dock-label::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 8px;
      height: 8px;
      background: #1e3932;
      border-right: 1px solid rgba(203, 162, 88, 0.4);
      border-bottom: 1px solid rgba(203, 162, 88, 0.4);
    }
    .dock-label-title {
      font-weight: 800;
      color: #dfc49d;
    }
    .dock-label-sub {
      font-size: 9.5px;
      color: #d4e9e2;
      opacity: 0.9;
    }
    @keyframes labelPop {
      from { opacity: 0; transform: translateX(-50%) translateY(4px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    .recipe-card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #edebe9;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .recipe-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }
    .card-media {
      position: relative;
      height: 220px;
      overflow: hidden;
    }
    .card-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .recipe-card:hover .card-media img {
      transform: scale(1.05);
    }
    .card-top-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 2;
    }
    .popular-badge {
      background: #cba258;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
    .special-badge {
      background: linear-gradient(135deg, #00754a 0%, #1e3932 100%);
      color: #dfc49d;
      border: 1px solid rgba(203, 162, 88, 0.5);
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
    .popular-badge mat-icon, .special-badge mat-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
    }
    .btn-fav-card {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
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
    .btn-fav-card mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: transform 0.2s;
    }
    .btn-fav-card:hover {
      transform: scale(1.1);
      background: #ffffff;
      color: #e53935;
    }
    .btn-fav-card.is-fav {
      color: #e53935;
      background: #ffffff;
    }
    .btn-fav-card.is-fav mat-icon {
      transform: scale(1.08);
    }
    .cat-badge {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(30, 57, 50, 0.88);
      backdrop-filter: blur(6px);
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 50px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .recipe-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e3932;
      margin-bottom: 8px;
      letter-spacing: -0.01em;
    }
    .recipe-desc {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
      line-height: 1.5;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .topping-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .tag-label {
      font-size: 11px;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.5);
    }
    .topping-tag {
      font-size: 11px;
      background: #f2f0eb;
      color: #1e3932;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
    }
    .topping-more {
      font-size: 11px;
      color: #00754a;
      font-weight: 700;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #edebe9;
      padding-top: 16px;
    }
    .price-box {
      display: flex;
      flex-direction: column;
    }
    .price-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }
    .price-val {
      font-size: 18px;
      font-weight: 800;
      color: #006241;
      letter-spacing: -0.01em;
    }
    .btn-detail {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #00754a;
      color: #ffffff;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-detail mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .btn-detail:hover {
      background: #005c3b;
    }
    .btn-detail:active {
      transform: scale(0.95);
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: #ffffff;
      border-radius: 20px;
      border: 1px dashed #d6dbde;
      max-width: 480px;
      margin: 40px auto;
    }
    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #f2f0eb;
      color: rgba(0, 0, 0, 0.4);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .empty-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e3932;
      margin-bottom: 8px;
    }
    .empty-desc {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 20px;
    }
    .btn-reset {
      padding: 10px 24px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
  `],
})
export class RecipeCatalogComponent implements OnInit, OnDestroy {
  private recipeService = inject(RecipeService);
  public favoriteService = inject(FavoriteService);
  private toast = inject(ToastService);

  @ViewChild('dockRef') dockRef?: ElementRef<HTMLDivElement>;

  searchControl = new FormControl('');
  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(true);
  selectedCategory = signal<string>('Tất cả');

  categoryItems = [
    { id: 'Tất cả', label: 'Tất cả', icon: 'local_cafe', tag: 'Toàn bộ thực đơn' },
    { id: '❤️ Yêu thích', label: 'Yêu thích', icon: 'favorite', tag: 'Món bạn đã lưu' },
    { id: 'Cà phê', label: 'Cà phê', icon: 'coffee', tag: 'Espresso & Cold Brew' },
    { id: 'Trà sữa', label: 'Trà sữa', icon: 'bubble_chart', tag: 'Trà sữa & Macchiato' },
    { id: 'Trà trái cây', label: 'Trà trái cây', icon: 'eco', tag: 'Trà hoa quả thanh mát' },
    { id: 'Đặc biệt', label: 'Đặc biệt', icon: 'auto_awesome', tag: 'Công thức độc quyền' },
  ];

  hoveredIndex = signal<number>(-1);
  mousePositionX = signal<number | null>(null);

  private sub = new Subscription();

  onDockMouseMove(event: MouseEvent) {
    this.mousePositionX.set(event.clientX);
  }

  onDockMouseLeave() {
    this.mousePositionX.set(null);
    this.hoveredIndex.set(-1);
  }

  getDockItemTransform(index: number): string {
    const mouseX = this.mousePositionX();
    if (mouseX === null) return 'scale(1) translateY(0)';

    const dock = this.dockRef?.nativeElement;
    if (!dock) return 'scale(1) translateY(0)';

    const items = dock.querySelectorAll('.dock-item');
    const item = items[index] as HTMLElement;
    if (!item) return 'scale(1) translateY(0)';

    const rect = item.getBoundingClientRect();
    const itemCenterX = rect.left + rect.width / 2;
    const distance = Math.abs(mouseX - itemCenterX);

    const maxDistance = 120; // Pixel influence radius
    if (distance > maxDistance) return 'scale(1) translateY(0)';

    // Smooth bell curve / cosine magnification
    const scaleFactor = Math.cos((distance / maxDistance) * (Math.PI / 2));
    const scale = 1 + scaleFactor * 0.16; // Max scale 1.16x
    const translateY = -scaleFactor * 6; // Lift up 6px

    return `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
  }

  ngOnInit() {
    this.fetchRecipes();

    // Debounce & Reactive Search RESTful API integration
    const searchSub = this.searchControl.valueChanges
      .pipe(
        map((val) => (val ? val.trim() : '')),
        filter((val) => val.length === 0 || val.length >= 2),
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => this.loading.set(true)),
        switchMap((keyword) => {
          const cat = this.selectedCategory();
          const queryCategory = cat === '❤️ Yêu thích' ? 'Tất cả' : cat;
          return this.recipeService.getRecipes(keyword, queryCategory);
        }),
      )
      .subscribe({
        next: (data) => {
          if (this.selectedCategory() === '❤️ Yêu thích') {
            this.recipes.set(data.filter((r) => this.favoriteService.isFavorite(r.id)));
          } else {
            this.recipes.set(data);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });

    this.sub.add(searchSub);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  fetchRecipes() {
    this.loading.set(true);
    const keyword = this.searchControl.value?.trim() || '';
    const cat = this.selectedCategory();
    const queryCategory = cat === '❤️ Yêu thích' ? 'Tất cả' : cat;

    this.recipeService
      .getRecipes(keyword, queryCategory)
      .subscribe({
        next: (data) => {
          if (cat === '❤️ Yêu thích') {
            this.recipes.set(data.filter((r) => this.favoriteService.isFavorite(r.id)));
          } else {
            this.recipes.set(data);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.fetchRecipes();
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.selectedCategory.set('Tất cả');
    this.fetchRecipes();
  }

  toggleFav(recipe: Recipe, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    const isNowFav = this.favoriteService.toggleFavorite(recipe.id);
    if (isNowFav) {
      this.toast.success(`Đã thêm "${recipe.name}" vào danh sách Yêu thích ❤️`);
    } else {
      this.toast.info(`Đã bỏ "${recipe.name}" khỏi danh sách Yêu thích`);
      if (this.selectedCategory() === '❤️ Yêu thích') {
        this.recipes.set(this.recipes().filter((r) => r.id !== recipe.id));
      }
    }
  }
}
