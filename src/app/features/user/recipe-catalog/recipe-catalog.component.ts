import { Component, OnInit, AfterViewInit, inject, signal, computed, HostListener, OnDestroy, ElementRef, ViewChild } from '@angular/core';
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
  templateUrl: './recipe-catalog.component.html',
  styleUrl: './recipe-catalog.component.css',
})
export class RecipeCatalogComponent implements OnInit, AfterViewInit, OnDestroy {
  private recipeService = inject(RecipeService);
  public favoriteService = inject(FavoriteService);
  private toast = inject(ToastService);

  @ViewChild('heroCanvas') heroCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('dockRef') dockRef?: ElementRef<HTMLDivElement>;
  @ViewChild('searchInputRef') searchInputRef?: ElementRef<HTMLInputElement>;

  private heroAnimationId?: number;
  private heroMouseX = -1000;
  private heroMouseY = -1000;

  searchControl = new FormControl('');
  rawRecipes = signal<Recipe[]>([]);
  loading = signal<boolean>(true);
  selectedCategory = signal<string>('Tất cả');

  // Filter & Action States
  priceSort = signal<'none' | 'asc' | 'desc'>('none');
  isPopularOnly = signal<boolean>(false);
  isNewOnly = signal<boolean>(false);
  isLuckyActive = signal<boolean>(false);
  isLuckyRolling = signal<boolean>(false);
  luckyDrinkIds = signal<string[]>([]);

  // Computed dynamic recipe list pipeline
  recipes = computed<Recipe[]>(() => {
    let list = [...this.rawRecipes()];

    // 1. Lucky Random Suggestion Mode
    if (this.isLuckyActive()) {
      const luckySet = new Set(this.luckyDrinkIds());
      return list.filter((r) => luckySet.has(r.id));
    }

    // 2. Filter by Category
    const cat = this.selectedCategory();
    if (cat === '❤️ Yêu thích') {
      list = list.filter((r) => this.favoriteService.isFavorite(r.id));
    }

    // 3. Filter by Hot / Popular (Button 3)
    if (this.isPopularOnly()) {
      list = list.filter((r) => r.isPopular);
    }

    // 4. Filter by New Arrivals (Button 2)
    if (this.isNewOnly()) {
      list = list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    // 5. Sort by Price (Button 1)
    const sort = this.priceSort();
    if (sort === 'asc') {
      list = list.sort((a, b) => a.giaCoBan - b.giaCoBan);
    } else if (sort === 'desc') {
      list = list.sort((a, b) => b.giaCoBan - a.giaCoBan);
    }

    return list;
  });

  // Spotlight Morphing Search States
  isSearchFocused = signal<boolean>(false);
  isSearchHovered = signal<boolean>(false);
  showMorphActions = computed(() => this.isSearchHovered() || this.isSearchFocused());
  isSearchActive = computed(() => this.isSearchFocused() || this.isSearchHovered() || !!this.searchControl.value);

  quickSuggestions = ['Caramel Macchiato', 'Matcha Latte', 'Trà Sữa Oolong', 'Cold Brew', 'Trà Dâu Tây'];

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

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearchInput();
    }
  }

  focusSearchInput() {
    this.searchInputRef?.nativeElement.focus();
    this.isSearchFocused.set(true);
  }

  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused.set(false);
    }, 200);
  }

  applySuggestion(keyword: string) {
    this.searchControl.setValue(keyword);
    this.isSearchFocused.set(false);
    this.fetchRecipes();
  }

  scrollToDock() {
    this.dockRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Button 1: Toggle Sort by Price
  togglePriceSort() {
    this.isLuckyActive.set(false);
    const current = this.priceSort();
    if (current === 'none') {
      this.priceSort.set('asc');
      this.toast.info('Sắp xếp giá: Thấp đến Cao ⬆️');
    } else if (current === 'asc') {
      this.priceSort.set('desc');
      this.toast.info('Sắp xếp giá: Cao xuống Thấp ⬇️');
    } else {
      this.priceSort.set('none');
      this.toast.info('Đã tắt sắp xếp theo giá');
    }
  }

  getPriceSortTitle(): string {
    const sort = this.priceSort();
    if (sort === 'asc') return 'Giá: Thấp đến Cao (Nhấn để chuyển sang Cao xuống Thấp)';
    if (sort === 'desc') return 'Giá: Cao xuống Thấp (Nhấn để tắt sắp xếp)';
    return 'Sắp xếp theo giá (Thấp đến Cao / Cao xuống Thấp)';
  }

  // Button 2: Toggle New Arrivals
  toggleNewOnly() {
    this.isLuckyActive.set(false);
    const next = !this.isNewOnly();
    this.isNewOnly.set(next);
    if (next) {
      this.toast.info('Đang hiển thị các Món Mới Nhất 🆕');
    } else {
      this.toast.info('Hiển thị tất cả món');
    }
  }

  // Button 3: Toggle Hot / Popular
  togglePopularOnly() {
    this.isLuckyActive.set(false);
    const next = !this.isPopularOnly();
    this.isPopularOnly.set(next);
    if (next) {
      this.toast.success('Đang lọc danh sách Món Bán Chạy Nhất 🔥');
    } else {
      this.toast.info('Hiển thị tất cả món');
    }
  }

  // Button 4: Lucky Random Drink Picker
  feelLucky() {
    const all = this.rawRecipes();
    if (all.length === 0) {
      this.toast.info('Không có món nào trong thực đơn để gợi ý.');
      return;
    }

    this.isLuckyRolling.set(true);
    setTimeout(() => {
      // Pick random 3 to 4 unique items
      const shuffled = [...all].sort(() => 0.5 - Math.random());
      const count = Math.min(Math.floor(Math.random() * 2) + 3, shuffled.length); // 3 or 4
      const picked = shuffled.slice(0, count);
      this.luckyDrinkIds.set(picked.map((r) => r.id));
      this.isLuckyActive.set(true);
      this.isLuckyRolling.set(false);
      this.toast.success(`🎲 Tôi cảm thấy may mắn: Đã gợi ý ${picked.length} món ngon dành cho bạn!`);
    }, 300);
  }

  resetLuckyMode() {
    this.isLuckyActive.set(false);
    this.luckyDrinkIds.set([]);
  }

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
          this.rawRecipes.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });

    this.sub.add(searchSub);
  }

  ngAfterViewInit() {
    this.initHeroCanvas();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.heroAnimationId) {
      cancelAnimationFrame(this.heroAnimationId);
    }
  }

  onHeroMouseMove(e: MouseEvent) {
    const canvas = this.heroCanvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      // 1:1 Accurate coordinate mapping between visual pointer and internal canvas buffer
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.heroMouseX = (e.clientX - rect.left) * scaleX;
      this.heroMouseY = (e.clientY - rect.top) * scaleY;
    }
  }

  onHeroMouseLeave() {
    this.heroMouseX = -1000;
    this.heroMouseY = -1000;
  }

  private initHeroCanvas() {
    const canvas = this.heroCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync buffer resolution to actual rendered bounding box
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
          canvas.width = Math.round(rect.width);
          canvas.height = Math.round(rect.height);
        }
      }
    };

    updateCanvasSize();

    const SPACING = 24;          // Uniform square grid spacing
    const BASE_R = 1.05;         // Base dot radius
    const HOVER_R = 88;          // Balanced circular glow radius (~176px diameter)
    const DEFAULT_DOT_COLOR = 'rgba(212, 233, 226, 0.12)';
    const ACTIVE_GOLD_COLOR = '#dfc49d';
    const ACTIVE_GREEN_COLOR = '#52d6a4';

    class Particle {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      size = 0;
      alpha = 0;
      color = '203, 162, 88';

      constructor(w: number, h: number) {
        this.reset(w, h, true);
      }

      reset(w: number, h: number, initial = false) {
        this.x = Math.random() * w;
        this.y = initial ? Math.random() * h : h + 10;
        this.vx = (Math.random() - 0.5) * 0.32;
        this.vy = -0.22 - Math.random() * 0.38; // float gently upward
        this.size = Math.random() * 2.0 + 0.9;
        this.alpha = Math.random() * 0.35 + 0.14;
        // 60% Luxury Gold aroma, 40% Uplift Mint aroma
        this.color = Math.random() > 0.4 ? '203, 162, 88' : '126, 224, 184';
      }

      update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < -10) this.reset(w, h);
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        c.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = 30; // Increased by 1.5x as requested
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    const draw = () => {
      updateCanvasSize();
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Floating Aroma Particles
      particles.forEach((p) => {
        p.update(w, h);
        p.draw(ctx);
      });

      // 2. Square Grid with Centered Offsets for Exact Geometric Circle
      const startX = (w % SPACING) / 2 + SPACING / 2;
      const startY = (h % SPACING) / 2 + SPACING / 2;

      for (let x = startX; x < w; x += SPACING) {
        for (let y = startY; y < h; y += SPACING) {
          const dx = x - this.heroMouseX;
          const dy = y - this.heroMouseY;
          const dist = Math.hypot(dx, dy); // Accurate Euclidean distance

          if (dist < HOVER_R) {
            const ratio = 1 - dist / HOVER_R;
            ctx.fillStyle = ratio > 0.45 ? ACTIVE_GOLD_COLOR : ACTIVE_GREEN_COLOR;
            ctx.shadowBlur = 10 * ratio;
            ctx.shadowColor = 'rgba(203, 162, 88, 0.45)';
            ctx.beginPath();
            ctx.arc(x, y, BASE_R + ratio * 1.8, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = DEFAULT_DOT_COLOR;
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.beginPath();
            ctx.arc(x, y, BASE_R, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      this.heroAnimationId = requestAnimationFrame(draw);
    };

    draw();
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
          this.rawRecipes.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  selectCategory(category: string) {
    this.isLuckyActive.set(false);
    this.selectedCategory.set(category);
    this.fetchRecipes();
  }

  clearSearch(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.searchControl.setValue('');
    this.selectedCategory.set('Tất cả');
    this.priceSort.set('none');
    this.isPopularOnly.set(false);
    this.isNewOnly.set(false);
    this.isLuckyActive.set(false);
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
        this.rawRecipes.set(this.rawRecipes().filter((r) => r.id !== recipe.id));
      }
    }
  }
}
