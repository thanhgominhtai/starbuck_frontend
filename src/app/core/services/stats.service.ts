import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models/stats.model';

const API_BASE = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private http = inject(HttpClient);

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API_BASE}/stats/dashboard`);
  }
}
