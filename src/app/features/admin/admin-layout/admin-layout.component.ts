import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="admin-wrapper">
      <!-- Main Admin Content Area -->
      <main class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <span class="portal-badge">TRANG QUẢN TRỊ VIÊN STARBUCKS</span>
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
      min-height: 100vh;
      background: #f2f0eb;
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
      font-size: 13px;
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
      flex: 1;
      padding: 28px;
    }
  `],
})
export class AdminLayoutComponent {
  public authService = inject(AuthService);
}
