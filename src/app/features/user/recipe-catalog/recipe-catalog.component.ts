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
  isFavoriteOnly = signal<boolean>(false);
  isLuckyActive = signal<boolean>(false);
  isLuckyRolling = signal<boolean>(false);
  luckyDrinkIds = signal<string[]>([]);

  // Computed dynamic recipe list pipeline
  recipes = computed<Recipe[]>(() => {
    let list = [...this.rawRecipes()];
    const favSet = this.favoriteService.favorites();

    // 1. Lucky Random Suggestion Mode
    if (this.isLuckyActive()) {
      const luckySet = new Set(this.luckyDrinkIds());
      return list.filter((r) => luckySet.has(r.id));
    }

    // 2. Filter by Favorite (Button 2)
    if (this.isFavoriteOnly()) {
      list = list.filter((r) => favSet.has(r.id));
    }

    // 3. Filter by Hot / Popular (Button 3)
    if (this.isPopularOnly()) {
      list = list.filter((r) => r.isPopular);
    }

    // 4. Sort by Price (Button 1)
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

  getPriceSortTooltip(): string {
    const sort = this.priceSort();
    if (sort === 'asc') return 'Giá: Thấp đến Cao ⬆️';
    if (sort === 'desc') return 'Giá: Cao xuống Thấp ⬇️';
    return 'Sắp xếp theo giá ↕️';
  }

  // Button 2: Toggle Favorites Filter
  toggleFavoriteOnly() {
    this.isLuckyActive.set(false);
    const next = !this.isFavoriteOnly();
    this.isFavoriteOnly.set(next);
    if (next) {
      this.toast.success('Đang lọc danh sách Món Yêu Thích ❤️');
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
      this.toast.success(`🎲 Gợi ý ngẫu nhiên: Đã chọn ${picked.length} món ngon dành cho bạn!`);
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
          return this.recipeService.getRecipes(keyword, cat);
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

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    this.initHeroCanvas();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.resizeObserver?.disconnect();
    if (this.heroAnimationId) {
      cancelAnimationFrame(this.heroAnimationId);
    }
  }

  onHeroMouseMove(e: MouseEvent) {
    const canvas = this.heroCanvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
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

    const syncCanvasSize = (): boolean => {
      const rect = canvas.getBoundingClientRect();
      const parent = canvas.parentElement;
      const w = Math.round(rect.width || (parent ? parent.clientWidth : window.innerWidth));
      const h = Math.round(rect.height || (parent ? parent.clientHeight : 260));

      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        return true;
      }
      return false;
    };

    syncCanvasSize();

    const SPACING = 24;          // Grid spacing
    const BASE_R = 1.15;         // Base dot radius
    const HOVER_R = 100;         // Full circular radius
    const DEFAULT_DOT_COLOR = 'rgba(212, 233, 226, 0.14)';
    const ACTIVE_GOLD_COLOR = '#fcefd6';
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
        const fullW = w > 0 ? w : window.innerWidth;
        const fullH = h > 0 ? h : 260;
        this.x = Math.random() * fullW;
        this.y = initial ? Math.random() * fullH : fullH + 10;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = -0.22 - Math.random() * 0.38; // float gently upward
        this.size = Math.random() * 2.2 + 1.0;
        this.alpha = Math.random() * 0.38 + 0.16;
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
        c.shadowBlur = 6;
        c.shadowColor = `rgba(${this.color}, 0.45)`;
        c.fill();
        c.shadowBlur = 0;
      }
    }

    const particleCount = 45;
    const particles: Particle[] = [];

    const spawnParticles = () => {
      particles.length = 0;
      const w = canvas.width || window.innerWidth;
      const h = canvas.height || 260;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(w, h));
      }
    };

    spawnParticles();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (syncCanvasSize()) {
          spawnParticles();
        }
      });
      const parent = canvas.parentElement;
      if (parent) {
        this.resizeObserver.observe(parent);
      }
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      if (w > 0 && h > 0) {
        ctx.clearRect(0, 0, w, h);

        // 1. Floating Aroma Particles across full width & height
        for (let i = 0; i < particles.length; i++) {
          particles[i].update(w, h);
          particles[i].draw(ctx);
        }

        // 2. Interactive Dot Matrix across entire banner
        const startX = (w % SPACING) / 2 + SPACING / 2;
        const startY = (h % SPACING) / 2 + SPACING / 2;

        for (let x = startX; x < w; x += SPACING) {
          for (let y = startY; y < h; y += SPACING) {
            const dx = x - this.heroMouseX;
            const dy = y - this.heroMouseY;
            const dist = Math.hypot(dx, dy);

            if (dist < HOVER_R) {
              const ratio = 1 - dist / HOVER_R;
              ctx.fillStyle = ratio > 0.45 ? ACTIVE_GOLD_COLOR : ACTIVE_GREEN_COLOR;
              ctx.shadowBlur = 12 * ratio;
              ctx.shadowColor = ratio > 0.45 ? 'rgba(203, 162, 88, 0.7)' : 'rgba(82, 214, 164, 0.7)';
              ctx.beginPath();
              ctx.arc(x, y, BASE_R + ratio * 2.2, 0, Math.PI * 2);
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
      }

      this.heroAnimationId = requestAnimationFrame(draw);
    };

    draw();
  }

  fetchRecipes() {
    this.loading.set(true);
    const keyword = this.searchControl.value?.trim() || '';
    const cat = this.selectedCategory();

    this.recipeService
      .getRecipes(keyword, cat)
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
    this.isFavoriteOnly.set(false);
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
    }
  }
}
