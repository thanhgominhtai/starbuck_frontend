import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeSseService } from '../../../core/services/realtime-sse.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <header class="sb-navbar" *ngIf="!isAuthPage()">
      <div class="sb-nav-container">
        <!-- Logo & Brand -->
        <a routerLink="/menu" class="sb-logo">
          <div class="logo-circle">
            <mat-icon>local_cafe</mat-icon>
          </div>
          <div class="logo-text">
            <span class="brand-name">STARBUCKS</span>
            <span class="brand-sub">RECIPES & ORDERS</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="sb-nav-links" *ngIf="authService.isLoggedIn()">
          <a
            routerLink="/menu"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link"
          >
            <mat-icon>restaurant_menu</mat-icon>
            Thực đơn
          </a>

          <a
            routerLink="/my-orders"
            routerLinkActive="active"
            class="nav-link"
          >
            <mat-icon>receipt_long</mat-icon>
            Đơn của tôi
          </a>

          <a
            routerLink="/profile"
            routerLinkActive="active"
            class="nav-link"
          >
            <mat-icon>account_circle</mat-icon>
            Tài khoản
          </a>

          <!-- Admin Portal Link -->
          <a
            *ngIf="authService.isAdmin()"
            routerLink="/admin/dashboard"
            routerLinkActive="active"
            class="nav-link admin-nav-link"
          >
            <mat-icon>admin_panel_settings</mat-icon>
            Quản trị Admin
          </a>
        </nav>

        <!-- Right User Actions -->
        <div class="sb-actions">
          <!-- Logged In User Pill -->
          <div class="user-pill" *ngIf="authService.isLoggedIn(); else guestTpl">
            <img
              [src]="authService.currentUser()?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'"
              alt="Avatar"
              class="user-avatar"
            />
            <div class="user-info">
              <span class="user-name">{{ authService.currentUser()?.name }}</span>
              <span class="role-badge" [class.admin-badge]="authService.isAdmin()">
                {{ authService.isAdmin() ? 'ADMIN' : 'USER' }}
              </span>
            </div>
            <button class="btn-logout" (click)="authService.logout()" title="Đăng xuất">
              <mat-icon>logout</mat-icon>
            </button>
          </div>

          <!-- Guest Actions -->
          <ng-template #guestTpl>
            <a routerLink="/auth" class="btn-pill btn-signin">
              Đăng nhập / Đăng ký
            </a>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .sb-navbar {
      background: #ffffff;
      border-bottom: 1px solid #edebe9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .sb-nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .sb-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .logo-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #006241;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    .logo-circle mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .sb-logo:hover .logo-circle {
      transform: scale(1.05);
    }
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 16px;
      font-weight: 800;
      color: #006241;
      letter-spacing: 0.05em;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 600;
      color: #cba258;
      letter-spacing: 0.1em;
    }
    .sb-nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 50px;
      color: rgba(0, 0, 0, 0.7);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .nav-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .nav-link:hover {
      background: #f2f0eb;
      color: #006241;
    }
    .nav-link.active {
      background: #d4e9e2;
      color: #006241;
    }
    .admin-nav-link {
      color: #1e3932;
      border: 1px solid rgba(203, 162, 88, 0.5);
      background: #faf6ee;
    }
    .admin-nav-link.active {
      background: #cba258;
      color: #ffffff;
    }
    .sb-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 6px 4px 12px;
      background: #f2f0eb;
      border-radius: 50px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #00754a;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 13px;
      font-weight: 700;
      color: #1e3932;
      max-width: 110px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .role-badge {
      font-size: 10px;
      font-weight: 700;
      color: #006241;
    }
    .admin-badge {
      color: #b4852e;
    }
    .btn-logout {
      background: none;
      border: none;
      color: rgba(0, 0, 0, 0.5);
      cursor: pointer;
      padding: 4px;
      display: flex;
      border-radius: 50%;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background: #edebe9;
      color: #c82014;
    }
    .btn-logout mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .btn-pill {
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-signin {
      background: #00754a;
      color: #ffffff;
    }
    .btn-signin:hover {
      background: #005c3b;
    }
    .btn-signin:active {
      transform: scale(0.95);
    }
  `],
})
export class NavbarComponent {
  public authService = inject(AuthService);
  public sseService = inject(RealtimeSseService);
  private router = inject(Router);

  isAuthPage(): boolean {
    return this.router.url.startsWith('/auth') || this.router.url === '/';
  }
}
