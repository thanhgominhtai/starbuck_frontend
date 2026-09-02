import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Recipe, CreateRecipeDto } from '../models/recipe.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private http = inject(HttpClient);

  private normalizeRecipe(recipe: Recipe): Recipe {
    if (!recipe) return recipe;
    let imgUrl = recipe.imgUrl;
    if (imgUrl && imgUrl.startsWith('/uploads/')) {
      const apiBase = API_BASE.replace(/\/+$/, '');
      imgUrl = `${apiBase}${imgUrl}`;
    }
    return { ...recipe, imgUrl };
  }

  getRecipes(keyword?: string, category?: string): Observable<Recipe[]> {
    let params = new HttpParams();
    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    if (category && category.trim() && category !== 'Tất cả') {
      params = params.set('category', category.trim());
    }
    return this.http
      .get<Recipe[]>(`${API_BASE}/recipes`, { params })
      .pipe(map((recipes) => recipes.map((r) => this.normalizeRecipe(r))));
  }

  getRecipeById(id: string): Observable<Recipe> {
    return this.http
      .get<Recipe>(`${API_BASE}/recipes/${id}`)
      .pipe(map((r) => this.normalizeRecipe(r)));
  }

  createRecipe(dto: CreateRecipeDto): Observable<Recipe> {
    return this.http
      .post<Recipe>(`${API_BASE}/recipes`, dto)
      .pipe(map((r) => this.normalizeRecipe(r)));
  }

  updateRecipe(id: string, dto: Partial<CreateRecipeDto>): Observable<Recipe> {
    return this.http
      .patch<Recipe>(`${API_BASE}/recipes/${id}`, dto)
      .pipe(map((r) => this.normalizeRecipe(r)));
  }

  deleteRecipe(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE}/recipes/${id}`);
  }
}
