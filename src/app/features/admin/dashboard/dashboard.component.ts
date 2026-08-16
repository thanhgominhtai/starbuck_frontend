import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StatsService } from '../../../core/services/stats.service';
import { DashboardStats } from '../../../core/models/stats.model';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, VndCurrencyPipe],
  template: `
    <div class="dashboard-view" *ngIf="stats()">
      <!-- Page Header -->
      <div class="dash-header">
        <div>
          <h1 class="dash-title">Tổng Quan Quản Trị & Báo Cáo</h1>
          <p class="dash-desc">Thống kê doanh thu, tỷ lệ đơn hàng và hiệu suất món ăn theo thời gian thực</p>
        </div>
        <button class="btn-sync" (click)="fetchStats()">
          <mat-icon>sync</mat-icon>
          Cập nhật số liệu
        </button>
      </div>

      <!-- 4 KPI Metrics Cards -->
      <div class="kpi-grid">
        <div class="kpi-card revenue-card">
          <div class="kpi-icon-wrap">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-lbl">Tổng doanh thu hệ thống</span>
            <span class="kpi-val">{{ stats()!.kpi.totalRevenue | vndCurrency }}</span>
          </div>
        </div>

        <div class="kpi-card orders-card">
          <div class="kpi-icon-wrap">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-lbl">Tổng số đơn hàng</span>
            <span class="kpi-val">{{ stats()!.kpi.totalOrders }} đơn</span>
          </div>
        </div>

        <div class="kpi-card recipes-card">
          <div class="kpi-icon-wrap">
            <mat-icon>local_cafe</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-lbl">Công thức / Món ăn</span>
            <span class="kpi-val">{{ stats()!.kpi.totalRecipes }} món</span>
          </div>
        </div>

        <div class="kpi-card users-card">
          <div class="kpi-icon-wrap">
            <mat-icon>group</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-lbl">Thành viên hệ thống</span>
            <span class="kpi-val">{{ stats()!.kpi.totalUsers }} user</span>
          </div>
        </div>
      </div>

      <!-- Charts & Visual Analytics Section -->
      <div class="analytics-grid">
        <!-- 1. Status Breakdown Visual Bars -->
        <div class="analytics-card">
          <div class="card-head">
            <h3 class="card-title">Phân Bổ Trạng Thái Đơn Hàng</h3>
            <span class="head-sub">Tỷ lệ theo trạng thái</span>
          </div>

          <div class="status-bars">
            <div class="status-row">
              <div class="status-label-wrap">
                <span class="dot-indicator dot-pending"></span>
                <span>Chờ tiếp nhận (Pending)</span>
              </div>
              <span class="status-count-tag">{{ stats()!.kpi.pendingOrders }} đơn</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill fill-pending"
                [style.width.%]="getPercent(stats()!.kpi.pendingOrders)"
              ></div>
            </div>

            <div class="status-row">
              <div class="status-label-wrap">
                <span class="dot-indicator dot-progress"></span>
                <span>Đang làm (In Progress)</span>
              </div>
              <span class="status-count-tag">{{ stats()!.kpi.inProgressOrders }} đơn</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill fill-progress"
                [style.width.%]="getPercent(stats()!.kpi.inProgressOrders)"
              ></div>
            </div>

            <div class="status-row">
              <div class="status-label-wrap">
                <span class="dot-indicator dot-completed"></span>
                <span>Hoàn thành (Completed)</span>
              </div>
              <span class="status-count-tag">{{ stats()!.kpi.completedOrders }} đơn</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill fill-completed"
                [style.width.%]="getPercent(stats()!.kpi.completedOrders)"
              ></div>
            </div>

            <div class="status-row">
              <div class="status-label-wrap">
                <span class="dot-indicator dot-cancelled"></span>
                <span>Bị huỷ (Cancelled)</span>
              </div>
              <span class="status-count-tag">{{ stats()!.kpi.cancelledOrders }} đơn</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill fill-cancelled"
                [style.width.%]="getPercent(stats()!.kpi.cancelledOrders)"
              ></div>
            </div>
          </div>
        </div>

        <!-- 2. Top 5 Best-Selling Recipes -->
        <div class="analytics-card">
          <div class="card-head">
            <h3 class="card-title">Top Món Ăn Bán Chạy Nhất</h3>
            <span class="head-sub">Xếp hạng theo số lượng phần bán</span>
          </div>

          <div class="top-recipes-list" *ngIf="stats()!.topRecipes.length > 0; else noTop">
            <div *ngFor="let item of stats()!.topRecipes; let idx = index" class="top-item-row">
              <div class="rank-badge" [class.gold-rank]="idx === 0">#{{ idx + 1 }}</div>
              <div class="top-item-details">
                <span class="top-item-name">{{ item.name }}</span>
                <span class="top-item-sales">Doanh số: {{ item.totalSales | vndCurrency }}</span>
              </div>
              <div class="top-item-qty">
                <strong>{{ item.portionsSold }}</strong> phần
              </div>
            </div>
          </div>
          <ng-template #noTop>
            <p class="empty-txt">Chưa có đủ dữ liệu bán hàng để thống kê top món.</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-view {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dash-title {
      font-size: 24px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }
    .dash-desc {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.58);
    }
    .btn-sync {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 117, 74, 0.3);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .kpi-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
    }
    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #d4e9e2;
      color: #006241;
    }
    .revenue-card .kpi-icon-wrap {
      background: #faf6ee;
      color: #cba258;
    }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-lbl {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      font-weight: 600;
    }
    .kpi-val {
      font-size: 20px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.01em;
    }
    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .analytics-grid {
        grid-template-columns: 1fr;
      }
    }
    .analytics-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e3932;
    }
    .head-sub {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
    .status-bars {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .status-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.75);
    }
    .status-label-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-pending { background: #cba258; }
    .dot-progress { background: #00754a; }
    .dot-completed { background: #137333; }
    .dot-cancelled { background: #c82014; }
    .progress-track {
      height: 8px;
      border-radius: 50px;
      background: #f2f0eb;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 50px;
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .fill-pending { background: #cba258; }
    .fill-progress { background: #00754a; }
    .fill-completed { background: #137333; }
    .fill-cancelled { background: #c82014; }
    .top-recipes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .top-item-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      border-radius: 12px;
      background: #f2f0eb;
    }
    .rank-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #edebe9;
      color: #1e3932;
      font-size: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rank-badge.gold-rank {
      background: #cba258;
      color: #ffffff;
    }
    .top-item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .top-item-name {
      font-size: 14px;
      font-weight: 700;
      color: #1e3932;
    }
    .top-item-sales {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }
    .top-item-qty {
      font-size: 13px;
      color: #00754a;
    }
    .empty-txt {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private statsService = inject(StatsService);
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.fetchStats();
  }

  fetchStats() {
    this.statsService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
    });
  }

  getPercent(count: number): number {
    if (!this.stats() || this.stats()!.kpi.totalOrders === 0) return 0;
    return Math.round((count / this.stats()!.kpi.totalOrders) * 100);
  }
}
