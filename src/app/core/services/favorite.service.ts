import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  favorites = signal<Set<string>>(new Set());

  constructor() {
    // Tự động chuyển đổi danh sách Yêu thích tương ứng với từng User khi Đăng nhập / Đăng xuất
    effect(
      () => {
        const user = this.authService.currentUser();
        if (user && user.id) {
          this.loadUserFavorites(user.id);
        } else {
          this.loadGuestFavorites();
        }
      },
      { allowSignalWrites: true },
    );
  }

  private getStorageKey(userId?: string): string {
    return userId ? `sb_favs_user_${userId}` : 'sb_favs_guest';
  }

  private loadGuestFavorites(): void {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        this.favorites.set(new Set(ids));
        return;
      }
    } catch {}
    this.favorites.set(new Set());
  }

  private loadUserFavorites(userId: string): void {
    const key = this.getStorageKey(userId);

    // 1. Tải nhanh từ LocalStorage của chính User này
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        this.favorites.set(new Set(ids));
      } else {
        this.favorites.set(new Set());
      }
    } catch {
      this.favorites.set(new Set());
    }

    // 2. Đồng bộ danh sách mới nhất từ Database MongoDB của User này
    this.http.get<string[]>(`${API_BASE}/users/me/favorites`).subscribe({
      next: (ids) => {
        const set = new Set(ids || []);
        this.favorites.set(set);
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
      },
      error: () => {
        // Giữ nguyên dữ liệu offline
      },
    });
  }

  isFavorite(recipeId: string): boolean {
    return this.favorites().has(recipeId);
  }

  toggleFavorite(recipeId: string): boolean {
    const current = new Set(this.favorites());
    let isFav = false;
    if (current.has(recipeId)) {
      current.delete(recipeId);
      isFav = false;
    } else {
      current.add(recipeId);
      isFav = true;
    }
    this.favorites.set(current);

    const user = this.authService.currentUser();
    const key = this.getStorageKey(user?.id);
    localStorage.setItem(key, JSON.stringify(Array.from(current)));

    // Lưu vào database nếu đã đăng nhập
    if (user && user.id) {
      this.http
        .post<{ isFavorite: boolean; favorites: string[] }>(
          `${API_BASE}/users/me/favorites/${recipeId}`,
          {},
        )
        .subscribe({
          error: (err) => console.error('Lỗi lưu yêu thích lên server:', err),
        });
    }

    return isFav;
  }
}
