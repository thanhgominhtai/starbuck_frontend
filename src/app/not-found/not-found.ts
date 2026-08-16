import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatIconModule],
  template: `
    <div class="sb-not-found-wrap">
      <div class="sb-not-found-card">
        <div class="error-num font-mono">404</div>
        <div class="error-badge">
          <mat-icon class="star-icon">star</mat-icon>
          <span>PAGE NOT FOUND</span>
        </div>
        
        <h1 class="error-title font-serif">Trang Không Tồn Tại</h1>
        
        <p class="error-desc">
          Rất tiếc, đường dẫn bạn truy cập không tồn tại hoặc món trà đặc sản này đã được cập nhật thay đổi trong thực đơn.
        </p>

        <div class="actions">
          <a routerLink="/drinks" class="sb-btn-pill sb-btn-primary return-btn">
            <mat-icon class="btn-icon">arrow_back</mat-icon>
            <span>Quay lại Thực Đơn Starbucks</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sb-not-found-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 200px);
      padding: 24px;
    }

    .sb-not-found-card {
      max-width: 520px;
      width: 100%;
      background-color: var(--sb-surface-white);
      border: 1px solid var(--sb-border);
      border-radius: var(--radius-xl);
      padding: 48px 36px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: var(--sb-shadow-card);
    }

    .error-num {
      font-size: 4rem;
      font-weight: 700;
      color: var(--sb-green-starbucks);
      line-height: 1;
    }

    .error-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background-color: var(--sb-green-uplift);
      border-radius: var(--radius-pill);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--sb-green-house);
      margin: 12px 0 16px 0;
    }

    .star-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--sb-gold);
    }

    .error-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--sb-green-house);
      margin-bottom: 12px;
    }

    .error-desc {
      font-size: 0.9375rem;
      color: var(--sb-text-muted);
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .return-btn {
      padding: 10px 24px !important;
    }

    .btn-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class NotFound {}
