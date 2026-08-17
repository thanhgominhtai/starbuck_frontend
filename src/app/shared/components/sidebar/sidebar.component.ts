import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <aside
      *ngIf="!isAuthPage()"
      class="sb-sidebar"
      [class.expanded]="isExpanded()"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Top Brand / Logo -->
      <div class="sidebar-header">
        <a routerLink="/menu" class="brand-link">
          <div class="logo-circle">
            <mat-icon>local_cafe</mat-icon>
          </div>
          <div class="brand-info" *ngIf="isExpanded()">
            <span class="brand-title">STARBUCKS</span>
            <span class="brand-sub">RECIPE ATELIER</span>
          </div>
        </a>

        <!-- Pin / Toggle button on expanded -->
        <button
          type="button"
          class="btn-pin"
          *ngIf="isExpanded()"
          (click)="togglePin($event)"
          [title]="isPinned() ? 'Bỏ ghim thanh menu' : 'Ghim mở rộng menu'"
        >
          <mat-icon>{{ isPinned() ? 'push_pin' : 'push_pin' }}</mat-icon>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <!-- USER SECTION -->
        <div class="nav-section-label" *ngIf="isExpanded()">KHÁCH HÀNG</div>

        <a
          routerLink="/menu"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-link"
          [title]="!isExpanded() ? 'Thực đơn' : ''"
        >
          <div class="icon-wrap">
            <mat-icon>restaurant_menu</mat-icon>
          </div>
          <span class="link-label" *ngIf="isExpanded()">Thực đơn</span>
        </a>

        <a
          routerLink="/my-orders"
          routerLinkActive="active"
          class="nav-link"
          *ngIf="authService.isLoggedIn()"
          [title]="!isExpanded() ? 'Đơn của tôi' : ''"
        >
          <div class="icon-wrap">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <span class="link-label" *ngIf="isExpanded()">Đơn của tôi</span>
        </a>

        <a
          routerLink="/profile"
          routerLinkActive="active"
          class="nav-link"
          *ngIf="authService.isLoggedIn()"
          [title]="!isExpanded() ? 'Tài khoản' : ''"
        >
          <div class="icon-wrap">
            <mat-icon>account_circle</mat-icon>
          </div>
          <span class="link-label" *ngIf="isExpanded()">Tài khoản</span>
        </a>

        <!-- ADMIN SECTION (If User is Admin) -->
        <ng-container *ngIf="authService.isAdmin()">
          <div class="nav-divider"></div>
          <div class="nav-section-label admin-label" *ngIf="isExpanded()">QUẢN TRỊ ADMIN</div>

          <a
            routerLink="/admin/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link admin-nav-link"
            [title]="!isExpanded() ? 'Dashboard KPI' : ''"
          >
            <div class="icon-wrap">
              <mat-icon>dashboard</mat-icon>
            </div>
            <span class="link-label" *ngIf="isExpanded()">Dashboard KPI</span>
          </a>

          <a
            routerLink="/admin/orders"
            routerLinkActive="active"
            class="nav-link admin-nav-link"
            [title]="!isExpanded() ? 'Quản lý Đơn hàng' : ''"
          >
            <div class="icon-wrap">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <span class="link-label" *ngIf="isExpanded()">Quản lý Đơn hàng</span>
          </a>

          <a
            routerLink="/admin/recipes"
            routerLinkActive="active"
            class="nav-link admin-nav-link"
            [title]="!isExpanded() ? 'Quản lý Món ăn' : ''"
          >
            <div class="icon-wrap">
              <mat-icon>menu_book</mat-icon>
            </div>
            <span class="link-label" *ngIf="isExpanded()">Quản lý Món ăn</span>
          </a>

          <a
            routerLink="/admin/admins"
            routerLinkActive="active"
            class="nav-link admin-nav-link"
            [title]="!isExpanded() ? 'Quản trị Admin' : ''"
          >
            <div class="icon-wrap">
              <mat-icon>manage_accounts</mat-icon>
            </div>
            <span class="link-label" *ngIf="isExpanded()">Quản trị Admin</span>
          </a>
        </ng-container>
      </nav>

      <!-- Bottom User / Auth Section -->
      <div class="sidebar-footer">
        <!-- If Logged In -->
        <div class="user-card" *ngIf="authService.isLoggedIn(); else guestTpl">
          <a routerLink="/profile" class="user-profile-link" [title]="!isExpanded() ? authService.currentUser()?.name : ''">
            <div class="avatar-wrap">
              <img
                [src]="authService.currentUser()?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + authService.currentUser()?.email"
                alt="Avatar"
                class="user-avatar"
              />
              <span class="status-dot"></span>
            </div>
            <div class="user-meta" *ngIf="isExpanded()">
              <span class="user-name">{{ authService.currentUser()?.name }}</span>
              <span class="user-role-badge" [class.is-admin]="authService.isAdmin()">
                {{ authService.isAdmin() ? 'ADMIN' : 'USER' }}
              </span>
            </div>
          </a>

          <button
            type="button"
            class="btn-logout"
            (click)="authService.logout()"
            [title]="isExpanded() ? 'Đăng xuất tài khoản' : 'Đăng xuất'"
          >
            <mat-icon>logout</mat-icon>
            <span class="logout-text" *ngIf="isExpanded()">Đăng xuất</span>
          </button>
        </div>

        <!-- If Guest -->
        <ng-template #guestTpl>
          <a
            routerLink="/auth"
            class="btn-login-card"
            [title]="!isExpanded() ? 'Đăng nhập / Đăng ký' : ''"
          >
            <div class="icon-wrap">
              <mat-icon>login</mat-icon>
            </div>
            <span class="login-text" *ngIf="isExpanded()">Đăng nhập / Đăng ký</span>
          </a>
        </ng-template>
      </div>
    </aside>
  `,
  styles: [`
    .sb-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 72px;
      background: #1e3932;
      background: linear-gradient(180deg, #1e3932 0%, #13241f 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 1000;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.18);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      overflow-x: hidden;
      overflow-y: auto;
      user-select: none;
    }

    .sb-sidebar.expanded {
      width: 260px;
    }

    /* Scrollbar */
    .sb-sidebar::-webkit-scrollbar {
      width: 4px;
    }
    .sb-sidebar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
    }

    /* Header */
    .sidebar-header {
      padding: 18px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      min-height: 72px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #ffffff;
      min-width: 40px;
    }
    .logo-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #00754a;
      border: 2px solid #cba258;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 117, 74, 0.4);
    }
    .logo-circle mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .brand-info {
      display: flex;
      flex-direction: column;
      white-space: nowrap;
      animation: fadeIn 0.2s ease-in-out;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      color: #cba258;
      letter-spacing: 0.08em;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      color: #d4e9e2;
      letter-spacing: 0.12em;
    }
    .btn-pin {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.45);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .btn-pin:hover {
      color: #dfc49d;
      background: rgba(255, 255, 255, 0.08);
    }
    .btn-pin mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .nav-section-label {
      font-size: 10.5px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.12em;
      padding: 8px 12px 4px;
      white-space: nowrap;
      animation: fadeIn 0.2s ease-in-out;
    }
    .admin-label {
      color: #dfc49d;
    }
    .nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 8px 6px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 12px;
      border-radius: 12px;
      color: #d4e9e2;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
      position: relative;
    }
    .icon-wrap {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-wrap mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      transition: transform 0.2s;
    }
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
    .nav-link:hover .icon-wrap mat-icon {
      transform: scale(1.1);
    }
    .nav-link.active {
      background: #00754a;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 117, 74, 0.35);
    }
    .admin-nav-link.active {
      background: #cba258;
      color: #1e3932;
      box-shadow: 0 4px 12px rgba(203, 162, 88, 0.35);
    }
    .admin-nav-link.active .icon-wrap mat-icon {
      color: #1e3932;
    }
    .link-label {
      animation: fadeIn 0.2s ease-in-out;
    }

    /* Footer / Account */
    .sidebar-footer {
      padding: 14px 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.15);
    }
    .user-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .user-profile-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #ffffff;
      padding: 6px;
      border-radius: 10px;
      transition: background 0.2s;
    }
    .user-profile-link:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .avatar-wrap {
      position: relative;
      width: 38px;
      height: 38px;
      flex-shrink: 0;
    }
    .user-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #00754a;
    }
    .status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #4caf50;
      border: 2px solid #1e3932;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      white-space: nowrap;
      animation: fadeIn 0.2s ease-in-out;
    }
    .user-name {
      font-size: 13.5px;
      font-weight: 700;
      color: #ffffff;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .user-role-badge {
      font-size: 10px;
      font-weight: 800;
      color: #d4e9e2;
      letter-spacing: 0.05em;
    }
    .user-role-badge.is-admin {
      color: #cba258;
    }
    .btn-logout {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #ff8a80;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s;
      width: 100%;
    }
    .btn-logout:hover {
      background: rgba(200, 32, 20, 0.25);
      border-color: #c82014;
      color: #ffffff;
    }
    .btn-logout mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .logout-text {
      animation: fadeIn 0.2s ease-in-out;
    }

    /* Guest login button */
    .btn-login-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 12px;
      background: #00754a;
      color: #ffffff;
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0, 117, 74, 0.3);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-login-card:hover {
      background: #005c3b;
    }
    .login-text {
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-4px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `],
})
export class SidebarComponent {
  public authService = inject(AuthService);
  public sidebarService = inject(SidebarService);
  private router = inject(Router);

  isExpanded = this.sidebarService.isExpanded;
  isPinned = this.sidebarService.isPinned;

  onMouseEnter() {
    this.sidebarService.setHover(true);
  }

  onMouseLeave() {
    this.sidebarService.setHover(false);
  }

  togglePin(event: MouseEvent) {
    this.sidebarService.togglePin(event);
  }

  isAuthPage(): boolean {
    return this.router.url.startsWith('/auth');
  }
}
