import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiUrl;
const ACCESS_TOKEN_KEY = 'sb_recipe_access_token';
const REFRESH_TOKEN_KEY = 'sb_recipe_refresh_token';
const USER_KEY = 'sb_recipe_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  private userSignal = signal<User | null>(this.getStoredUser());
  public currentUser = this.userSignal.asReadonly();
  public isLoggedIn = computed(() => !!this.userSignal());
  public isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSignal.set(res.user);
  }

  clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  signUp(payload: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/signup`, payload).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          this.saveSession(res);
          this.toast.success(`Chào mừng ${res.user.name} đến với Starbucks Recipe!`);
        }
      }),
    );
  }

  signIn(payload: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/signin`, payload).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          this.saveSession(res);
          this.toast.success(`Đăng nhập thành công! Chào bạn ${res.user.name}`);
        }
      }),
    );
  }

  reactivateAccount(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/reactivate`, payload).pipe(
      tap((res) => {
        this.saveSession(res);
        this.toast.success(`Chào mừng bạn quay trở lại! Đã kích hoạt lại tài khoản thành công.`);
      }),
    );
  }

  sendRestoreOtp(email: string): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${API_BASE}/auth/send-restore-otp`, { email });
  }

  confirmRestoreOtp(payload: { email: string; otp: string; newPassword?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/confirm-restore-otp`, payload).pipe(
      tap((res) => {
        this.saveSession(res);
        this.toast.success(`Khôi phục tài khoản thành công! Dữ liệu của bạn đã được phục hồi nguyên vẹn.`);
      }),
    );
  }

  overwriteAccount(payload: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/overwrite-account`, payload).pipe(
      tap((res) => {
        this.saveSession(res);
        this.toast.success(`Tạo mới tài khoản thành công!`);
      }),
    );
  }

  forgotPassword(email: string): Observable<{ message: string; devOtp?: string }> {
    return this.http.post<{ message: string; devOtp?: string }>(`${API_BASE}/auth/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<{ message: string; resetToken: string }> {
    return this.http.post<{ message: string; resetToken: string }>(`${API_BASE}/auth/verify-otp`, { email, otp });
  }

  resetPassword(payload: { resetToken: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE}/auth/reset-password`, payload);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${API_BASE}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => this.saveSession(res)),
      catchError((err) => {
        this.clearSession();
        this.router.navigate(['/auth']);
        return throwError(() => err);
      }),
    );
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${API_BASE}/auth/logout`, { refreshToken }).subscribe({
        next: () => {},
        error: () => {},
      });
    }
    this.clearSession();
    this.toast.info('Bạn đã đăng xuất khỏi hệ thống');
    this.router.navigate(['/auth']);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${API_BASE}/users/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  updateProfile(payload: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    currentPassword?: string;
  }): Observable<User> {
    return this.http.patch<User>(`${API_BASE}/users/me`, payload).pipe(
      tap((user) => {
        this.userSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.toast.success('Cập nhật hồ sơ thành công');
      }),
    );
  }

  changePassword(payload: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${API_BASE}/users/change-password`, payload);
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE}/users/me`).pipe(
      tap(() => {
        this.clearSession();
        this.toast.warning('Tài khoản của bạn đã được xoá vĩnh viễn');
        this.router.navigate(['/auth']);
      }),
    );
  }

  getAdmins(keyword?: string): Observable<User[]> {
    const params: any = {};
    if (keyword) params.keyword = keyword;
    return this.http.get<User[]>(`${API_BASE}/users/admins`, { params });
  }

  getAllUsers(keyword?: string): Observable<User[]> {
    const params: any = {};
    if (keyword) params.keyword = keyword;
    return this.http.get<User[]>(`${API_BASE}/users/all`, { params });
  }

  updateUserRole(userId: string, role: 'USER' | 'ADMIN'): Observable<User> {
    return this.http.patch<User>(`${API_BASE}/users/${userId}/role`, { role });
  }
}
