import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe, CreateRecipeDto } from '../models/recipe.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private http = inject(HttpClient);

  getRecipes(keyword?: string, category?: string): Observable<Recipe[]> {
    let params = new HttpParams();
    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    if (category && category.trim() && category !== 'Tất cả') {
      params = params.set('category', category.trim());
    }
    return this.http.get<Recipe[]>(`${API_BASE}/recipes`, { params });
  }

  getRecipeById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${API_BASE}/recipes/${id}`);
  }

  createRecipe(dto: CreateRecipeDto): Observable<Recipe> {
    return this.http.post<Recipe>(`${API_BASE}/recipes`, dto);
  }

  updateRecipe(id: string, dto: Partial<CreateRecipeDto>): Observable<Recipe> {
    return this.http.patch<Recipe>(`${API_BASE}/recipes/${id}`, dto);
  }

  deleteRecipe(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE}/recipes/${id}`);
  }
}
