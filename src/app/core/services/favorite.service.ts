import { Injectable, signal } from '@angular/core';

const FAVORITES_KEY = 'starbucks_user_favorites';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  favorites = signal<Set<string>>(new Set());

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites() {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        this.favorites.set(new Set(ids));
      }
    } catch {
      this.favorites.set(new Set());
    }
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
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(current)));
    return isFav;
  }
}
