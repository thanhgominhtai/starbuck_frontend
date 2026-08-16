import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeSseService } from '../../../core/services/realtime-sse.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="admin-wrapper">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <div class="admin-icon">
            <mat-icon>shield</mat-icon>
          </div>
          <div class="brand-text">
            <span class="title">STARBUCKS</span>
            <span class="sub">ADMIN PORTAL</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-item"
          >
            <mat-icon>dashboard</mat-icon>
            Dashboard Thống Kê
          </a>

          <a
            routerLink="/admin/orders"
            routerLinkActive="active"
            class="nav-item"
          >
            <mat-icon>receipt_long</mat-icon>
            Quản Lý Đơn Hàng
          </a>

          <a
            routerLink="/admin/recipes"
            routerLinkActive="active"
            class="nav-item"
          >
            <mat-icon>menu_book</mat-icon>
            Quản Trị Recipe (Món)
          </a>

          <a
            routerLink="/admin/admins"
            routerLinkActive="active"
            class="nav-item"
          >
            <mat-icon>manage_accounts</mat-icon>
            Quản Trị Admin
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/menu" class="btn-return-store">
            <mat-icon>storefront</mat-icon>
            Về Cửa Hàng (User)
          </a>
        </div>
      </aside>

      <!-- Main Admin Content Area -->
      <main class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <span class="portal-badge">KHU VỰC QUẢN TRỊ VIÊN</span>
          </div>
          <div class="topbar-right">
            <div class="admin-profile-pill">
              <img
                [src]="authService.currentUser()?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'"
                alt="Avatar"
              />
              <span class="admin-name">{{ authService.currentUser()?.name }}</span>
            </div>
          </div>
        </header>

        <div class="admin-content-view">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-wrapper {
      display: flex;
      min-height: calc(100vh - 72px);
      background: #f2f0eb;
    }
    .admin-sidebar {
      width: 260px;
      background: #1e3932;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      padding: 24px 16px;
      flex-shrink: 0;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 24px;
    }
    .admin-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #cba258;
      color: #1e3932;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-text .title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .brand-text .sub {
      font-size: 10px;
      font-weight: 700;
      color: #cba258;
      letter-spacing: 0.1em;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .nav-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
    .nav-item.active {
      background: #00754a;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 117, 74, 0.4);
    }
    .sidebar-footer {
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-return-store {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: 50px;
      background: #faf6ee;
      color: #1e3932;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-return-store:hover {
      background: #dfc49d;
    }
    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }
    .admin-topbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid #edebe9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
    }
    .portal-badge {
      font-size: 12px;
      font-weight: 800;
      color: #006241;
      letter-spacing: 0.05em;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .admin-profile-pill {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .admin-profile-pill img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #cba258;
    }
    .admin-name {
      font-size: 13px;
      font-weight: 700;
      color: #1e3932;
    }
    .admin-content-view {
      padding: 28px;
      flex: 1;
    }
    @media (max-width: 768px) {
      .admin-wrapper {
        flex-direction: column;
      }
      .admin-sidebar {
        width: 100%;
      }
    }
  `],
})
export class AdminLayoutComponent {
  public authService = inject(AuthService);
  public sseService = inject(RealtimeSseService);
}
