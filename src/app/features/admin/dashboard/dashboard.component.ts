import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StatsService } from '../../../core/services/stats.service';
import { DashboardStats, TimelineStat, CategoryStat, TopCustomerStat, TopRecipeStat } from '../../../core/models/stats.model';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

export interface CalendarCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isHoverInRange: boolean;
}

type TimePeriod = 'today' | 'yesterday' | '7days' | 'thisMonth' | 'all' | 'custom';
type KpiTab = 'revenue' | 'orders' | 'recipes' | 'users';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, VndCurrencyPipe],
  template: `
    <div class="dashboard-view">
      <!-- 1. Header & Quick Sync -->
      <div class="dash-header">
        <div class="header-left">
          <div class="header-badge">
            <mat-icon class="pulse-dot">analytics</mat-icon>
            <span>STARBUCKS ATELIER EXECUTIVE KPI</span>
          </div>
          <h1 class="dash-title">Báo Cáo & Phân Tích Hiệu Suất</h1>
          <p class="dash-desc">Thống kê doanh thu, lưu lượng đơn hàng và hành vi khách hàng theo thời gian thực</p>
        </div>

        <div class="header-right">
          <div class="sync-info">
            <span class="sync-label">Cập nhật lần cuối:</span>
            <strong class="sync-time">{{ lastSyncTime() }}</strong>
          </div>
          <button class="btn-sync" [class.is-loading]="loading()" (click)="fetchStats()" title="Làm mới số liệu">
            <mat-icon [class.spin-anim]="loading()">sync</mat-icon>
            <span>Đồng bộ dữ liệu</span>
          </button>
        </div>
      </div>

      <!-- 2. Time Filter & Custom Calendar Popover Control Bar -->
      <div class="time-filter-bar">
        <div class="presets-group">
          <button
            type="button"
            class="preset-chip"
            [class.active]="selectedPeriod() === 'today'"
            (click)="selectPeriod('today')"
          >
            Hôm nay
          </button>
          <button
            type="button"
            class="preset-chip"
            [class.active]="selectedPeriod() === 'yesterday'"
            (click)="selectPeriod('yesterday')"
          >
            Hôm qua
          </button>
          <button
            type="button"
            class="preset-chip"
            [class.active]="selectedPeriod() === '7days'"
            (click)="selectPeriod('7days')"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            class="preset-chip"
            [class.active]="selectedPeriod() === 'thisMonth'"
            (click)="selectPeriod('thisMonth')"
          >
            Tháng này
          </button>
          <button
            type="button"
            class="preset-chip"
            [class.active]="selectedPeriod() === 'all'"
            (click)="selectPeriod('all')"
          >
            Toàn thời gian
          </button>
        </div>

        <!-- Custom Luxury Date Range Popover Trigger -->
        <div class="calendar-picker-container" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="custom-calendar-trigger"
            [class.is-open]="showCalendar()"
            [class.is-active]="selectedPeriod() === 'custom'"
            (click)="toggleCalendar()"
          >
            <mat-icon class="cal-icon">date_range</mat-icon>
            <span class="cal-text">
              <ng-container *ngIf="selectedPeriod() === 'custom' && customStartDate && customEndDate; else pickText">
                {{ formatDisplayDate(customStartDate) }} ➔ {{ formatDisplayDate(customEndDate) }}
              </ng-container>
              <ng-template #pickText>
                <span>Chọn Lịch / Khoảng ngày</span>
              </ng-template>
            </span>
            <mat-icon class="arrow-icon">{{ showCalendar() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>

          <!-- Custom Popover Calendar Dialog -->
          <div class="calendar-popover" *ngIf="showCalendar()" (click)="$event.stopPropagation()">
            <!-- Popover Top Navigation -->
            <div class="cal-popover-header">
              <button type="button" class="nav-month-btn" (click)="prevMonth()" title="Tháng trước">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <div class="month-title-wrap">
                <span class="month-name">Tháng {{ calendarViewMonth() + 1 }}</span>
                <span class="year-name">, {{ calendarViewYear() }}</span>
              </div>
              <button
                type="button"
                class="nav-month-btn"
                (click)="nextMonth()"
                [disabled]="isNextMonthDisabled()"
                title="Tháng sau"
              >
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>

            <!-- Popover Quick Shortcuts -->
            <div class="cal-shortcuts">
              <button type="button" class="shortcut-chip" (click)="selectShortcut('today')">Hôm nay</button>
              <button type="button" class="shortcut-chip" (click)="selectShortcut('yesterday')">Hôm qua</button>
              <button type="button" class="shortcut-chip" (click)="selectShortcut('7days')">7 ngày qua</button>
              <button type="button" class="shortcut-chip" (click)="selectShortcut('thisMonth')">Tháng này</button>
            </div>

            <!-- Days of Week Header -->
            <div class="weekdays-grid">
              <span class="weekday">T2</span>
              <span class="weekday">T3</span>
              <span class="weekday">T4</span>
              <span class="weekday">T5</span>
              <span class="weekday">T6</span>
              <span class="weekday">T7</span>
              <span class="weekday weekend">CN</span>
            </div>

            <!-- Days Grid Matrix (35 or 42 cells) -->
            <div class="days-matrix">
              <button
                type="button"
                *ngFor="let cell of calendarCells()"
                class="day-cell"
                [class.not-current-month]="!cell.isCurrentMonth"
                [class.is-today]="cell.isToday"
                [class.is-future]="cell.isFuture"
                [class.is-start]="cell.isStart"
                [class.is-end]="cell.isEnd"
                [class.in-range]="cell.isInRange"
                [class.hover-range]="cell.isHoverInRange"
                [disabled]="cell.isFuture"
                (click)="onDateCellClick(cell.date)"
                (mouseenter)="onDateCellHover(cell.date)"
                (mouseleave)="onDateCellHover(null)"
              >
                <span class="day-number">{{ cell.dayNumber }}</span>
                <span class="today-dot" *ngIf="cell.isToday && !cell.isStart && !cell.isEnd"></span>
              </button>
            </div>

            <!-- Popover Footer -->
            <div class="cal-popover-footer">
              <div class="range-preview">
                <span class="preview-label">Đang chọn:</span>
                <strong class="preview-dates" *ngIf="tempStartDate(); else noDate">
                  {{ formatDisplayDate(formatDate(tempStartDate()!)) }}
                  <span *ngIf="tempEndDate()"> ➔ {{ formatDisplayDate(formatDate(tempEndDate()!)) }}</span>
                  <span *ngIf="!tempEndDate()" class="hint-click-end"> (Chọn ngày kết thúc)</span>
                </strong>
                <ng-template #noDate>
                  <span class="hint-pick">Nhấp chọn ngày trên lịch</span>
                </ng-template>
              </div>

              <div class="cal-actions-group">
                <button type="button" class="btn-cal-cancel" (click)="closeCalendar()">Hủy</button>
                <button
                  type="button"
                  class="btn-cal-apply"
                  (click)="applyCalendarSelection()"
                  [disabled]="!tempStartDate()"
                >
                  <mat-icon>check</mat-icon>
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Period Notice Banner -->
      <div class="period-notice-pill">
        <mat-icon>calendar_today</mat-icon>
        <span>
          Đang xem thống kê: <strong>{{ getPeriodLabel() }}</strong>
          <em *ngIf="activeDateRangeLabel()">({{ activeDateRangeLabel() }})</em>
        </span>
      </div>

      <!-- Loading State Overlay -->
      <div *ngIf="loading()" class="loading-state-banner">
        <mat-icon class="spin-anim">sync</mat-icon>
        <span>Đang tính toán số liệu và biểu đồ phân tích...</span>
      </div>

      <!-- Main Content when data ready -->
      <ng-container *ngIf="stats()">
        <!-- 3. Four Interactive KPI Metrics Cards -->
        <div class="kpi-interactive-grid">
          <!-- Card 1: Doanh Thu -->
          <div
            class="kpi-card revenue-card"
            [class.is-active]="activeTab() === 'revenue'"
            (click)="activeTab.set('revenue')"
          >
            <div class="kpi-top">
              <div class="kpi-icon-wrap revenue-icon">
                <mat-icon>payments</mat-icon>
              </div>
              <span class="view-detail-badge" *ngIf="activeTab() === 'revenue'">
                <mat-icon>insights</mat-icon> Đang xem chi tiết
              </span>
            </div>
            <div class="kpi-content">
              <span class="kpi-title">Doanh Thu Thuần</span>
              <span class="kpi-number">{{ stats()!.kpi.totalRevenue | vndCurrency }}</span>
              <p class="kpi-sub">Đã trừ đơn hủy & hoàn lại</p>
            </div>
            <div class="kpi-footer">
              <span class="click-hint">Bấm xem biểu đồ dòng tiền ➔</span>
            </div>
          </div>

          <!-- Card 2: Đơn Hàng -->
          <div
            class="kpi-card orders-card"
            [class.is-active]="activeTab() === 'orders'"
            (click)="activeTab.set('orders')"
          >
            <div class="kpi-top">
              <div class="kpi-icon-wrap orders-icon">
                <mat-icon>receipt_long</mat-icon>
              </div>
              <span class="view-detail-badge" *ngIf="activeTab() === 'orders'">
                <mat-icon>insights</mat-icon> Đang xem chi tiết
              </span>
            </div>
            <div class="kpi-content">
              <span class="kpi-title">Tổng Đơn Hàng</span>
              <span class="kpi-number">{{ stats()!.kpi.totalOrders }} <small>đơn</small></span>
              <p class="kpi-sub">Tỷ lệ thành công: {{ getFulfillmentRate() }}%</p>
            </div>
            <div class="kpi-footer">
              <span class="click-hint">Bấm xem tỷ lệ trạng thái ➔</span>
            </div>
          </div>

          <!-- Card 3: Thực Đơn & Món Ăn -->
          <div
            class="kpi-card recipes-card"
            [class.is-active]="activeTab() === 'recipes'"
            (click)="activeTab.set('recipes')"
          >
            <div class="kpi-top">
              <div class="kpi-icon-wrap recipes-icon">
                <mat-icon>local_cafe</mat-icon>
              </div>
              <span class="view-detail-badge" *ngIf="activeTab() === 'recipes'">
                <mat-icon>insights</mat-icon> Đang xem chi tiết
              </span>
            </div>
            <div class="kpi-content">
              <span class="kpi-title">Thực Đơn & Thức Uống</span>
              <span class="kpi-number">{{ stats()!.kpi.totalRecipes }} <small>thức uống</small></span>
              <p class="kpi-sub" *ngIf="stats()!.topRecipes.length > 0">
                Top 1: {{ stats()!.topRecipes[0].name }}
              </p>
            </div>
            <div class="kpi-footer">
              <span class="click-hint">Bấm xem xếp hạng bán chạy ➔</span>
            </div>
          </div>

          <!-- Card 4: Khách Hàng & Thành Viên -->
          <div
            class="kpi-card users-card"
            [class.is-active]="activeTab() === 'users'"
            (click)="activeTab.set('users')"
          >
            <div class="kpi-top">
              <div class="kpi-icon-wrap users-icon">
                <mat-icon>group</mat-icon>
              </div>
              <span class="view-detail-badge" *ngIf="activeTab() === 'users'">
                <mat-icon>insights</mat-icon> Đang xem chi tiết
              </span>
            </div>
            <div class="kpi-content">
              <span class="kpi-title">Thành Viên Hệ Thống</span>
              <span class="kpi-number">{{ stats()!.kpi.totalUsers }} <small>user</small></span>
              <p class="kpi-sub" *ngIf="stats()!.kpi.newUsersCount !== undefined">
                +{{ stats()!.kpi.newUsersCount }} thành viên mới trong kỳ
              </p>
            </div>
            <div class="kpi-footer">
              <span class="click-hint">Bấm xem khách hàng VIP ➔</span>
            </div>
          </div>
        </div>

        <!-- 4. Deep-Dive Analytics View Section based on Active Tab -->
        <div class="deep-dive-panel">
          <!-- TAB 1: DOANH THU DRILL-DOWN -->
          <div *ngIf="activeTab() === 'revenue'" class="drill-section tab-fade-in">
            <div class="section-banner revenue-theme">
              <div class="banner-title-box">
                <mat-icon>payments</mat-icon>
                <div>
                  <h2 class="section-title">Phân Tích Chi Tiết Dòng Tiền & Doanh Số</h2>
                  <p class="section-subtitle">Biến thiên doanh thu theo mốc thời gian và giá trị trung bình trên từng đơn hàng</p>
                </div>
              </div>

              <!-- Top Metrics Highlights -->
              <div class="quick-stats-row">
                <div class="stat-pill">
                  <span class="p-lbl">Giá trị đơn TB (AOV):</span>
                  <strong class="p-val">{{ getAverageOrderValue() | vndCurrency }}</strong>
                </div>
                <div class="stat-pill" *ngIf="getPeakDay()">
                  <span class="p-lbl">Ngày đạt đỉnh:</span>
                  <strong class="p-val">{{ getPeakDay()!.date }} ({{ getPeakDay()!.revenue | vndCurrency }})</strong>
                </div>
              </div>
            </div>

            <!-- Revenue Visual Grid -->
            <div class="drill-grid">
              <!-- Timeline Revenue Chart -->
              <div class="analytics-card chart-large">
                <div class="card-head">
                  <h3 class="card-title">Biểu Đồ Xu Hướng Doanh Thu Theo Ngày</h3>
                  <span class="head-sub">Doanh số thực tế ghi nhận</span>
                </div>

                <div class="timeline-bars-wrap" *ngIf="stats()!.timeline && stats()!.timeline.length > 0; else noTimeline">
                  <div class="bar-col" *ngFor="let item of stats()!.timeline">
                    <div class="bar-tooltip">
                      <strong>{{ item.date }}</strong>
                      <span>Doanh thu: {{ item.revenue | vndCurrency }}</span>
                      <span>Đơn hàng: {{ item.orders }} đơn</span>
                    </div>
                    <div class="bar-track">
                      <div
                        class="bar-fill gold-gradient-bar"
                        [style.height.%]="getBarHeight(item.revenue)"
                      ></div>
                    </div>
                    <span class="bar-label">{{ formatShortDate(item.date) }}</span>
                  </div>
                </div>
                <ng-template #noTimeline>
                  <div class="empty-box">
                    <mat-icon>query_builder</mat-icon>
                    <p>Chưa có dữ liệu đơn hàng hoàn tất trong khoảng thời gian này.</p>
                  </div>
                </ng-template>
              </div>

              <!-- Revenue by Category Breakdown -->
              <div class="analytics-card">
                <div class="card-head">
                  <h3 class="card-title">Cơ Cấu Doanh Thu Theo Danh Mục</h3>
                  <span class="head-sub">Mức độ đóng góp doanh số</span>
                </div>

                <div class="category-breakdown-list" *ngIf="stats()!.categories && stats()!.categories.length > 0; else noCats">
                  <div class="cat-item-row" *ngFor="let cat of stats()!.categories">
                    <div class="cat-head">
                      <span class="cat-name">{{ cat.category }}</span>
                      <strong class="cat-rev">{{ cat.revenue | vndCurrency }}</strong>
                    </div>
                    <div class="progress-track">
                      <div
                        class="progress-fill fill-green"
                        [style.width.%]="getCategoryPercent(cat.revenue)"
                      ></div>
                    </div>
                    <span class="cat-sub">{{ cat.portions }} ly bán ra ({{ getCategoryPercent(cat.revenue) }}% tổng doanh thu)</span>
                  </div>
                </div>
                <ng-template #noCats>
                  <p class="empty-txt">Chưa có dữ liệu phân loại món trong kỳ này.</p>
                </ng-template>
              </div>
            </div>
          </div>

          <!-- TAB 2: ĐƠN HÀNG DRILL-DOWN -->
          <div *ngIf="activeTab() === 'orders'" class="drill-section tab-fade-in">
            <div class="section-banner orders-theme">
              <div class="banner-title-box">
                <mat-icon>receipt_long</mat-icon>
                <div>
                  <h2 class="section-title">Hiệu Suất & Trạng Thái Xử Lý Đơn Hàng</h2>
                  <p class="section-subtitle">Tỷ lệ hoàn thành, luồng xử lý và phân bổ khung giờ cao điểm</p>
                </div>
              </div>

              <div class="quick-stats-row">
                <div class="stat-pill">
                  <span class="p-lbl">Tỷ lệ thành công:</span>
                  <strong class="p-val text-green">{{ getFulfillmentRate() }}%</strong>
                </div>
                <div class="stat-pill">
                  <span class="p-lbl">Đơn đã giao thành công:</span>
                  <strong class="p-val">{{ stats()!.kpi.completedOrders }} đơn</strong>
                </div>
              </div>
            </div>

            <div class="drill-grid">
              <!-- Order Status Breakdown Progress -->
              <div class="analytics-card">
                <div class="card-head">
                  <h3 class="card-title">Phân Bổ Trạng Thái Đơn Hàng</h3>
                  <span class="head-sub">Tỷ lệ % theo trạng thái</span>
                </div>

                <div class="status-bars">
                  <div class="status-row">
                    <div class="status-label-wrap">
                      <span class="dot-indicator dot-pending"></span>
                      <span>Chờ tiếp nhận (Pending)</span>
                    </div>
                    <span class="status-count-tag">{{ stats()!.kpi.pendingOrders }} đơn ({{ getPercent(stats()!.kpi.pendingOrders) }}%)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-pending" [style.width.%]="getPercent(stats()!.kpi.pendingOrders)"></div>
                  </div>

                  <div class="status-row">
                    <div class="status-label-wrap">
                      <span class="dot-indicator dot-progress"></span>
                      <span>Đang pha chế (In Progress)</span>
                    </div>
                    <span class="status-count-tag">{{ stats()!.kpi.inProgressOrders }} đơn ({{ getPercent(stats()!.kpi.inProgressOrders) }}%)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-progress" [style.width.%]="getPercent(stats()!.kpi.inProgressOrders)"></div>
                  </div>

                  <div class="status-row">
                    <div class="status-label-wrap">
                      <span class="dot-indicator dot-completed"></span>
                      <span>Hoàn thành (Completed)</span>
                    </div>
                    <span class="status-count-tag">{{ stats()!.kpi.completedOrders }} đơn ({{ getPercent(stats()!.kpi.completedOrders) }}%)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-completed" [style.width.%]="getPercent(stats()!.kpi.completedOrders)"></div>
                  </div>

                  <div class="status-row">
                    <div class="status-label-wrap">
                      <span class="dot-indicator dot-cancelled"></span>
                      <span>Bị hủy (Cancelled)</span>
                    </div>
                    <span class="status-count-tag">{{ stats()!.kpi.cancelledOrders }} đơn ({{ getPercent(stats()!.kpi.cancelledOrders) }}%)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-cancelled" [style.width.%]="getPercent(stats()!.kpi.cancelledOrders)"></div>
                  </div>
                </div>
              </div>

              <!-- Peak Ordering Hours Distribution -->
              <div class="analytics-card">
                <div class="card-head">
                  <h3 class="card-title">Khung Giờ Đặt Hàng Cao Điểm</h3>
                  <span class="head-sub">Số đơn hàng phát sinh theo giờ trong ngày</span>
                </div>

                <div class="peak-hours-grid" *ngIf="stats()!.peakHours && stats()!.peakHours.length > 0; else noHours">
                  <div class="hour-col" *ngFor="let h of stats()!.peakHours">
                    <span class="hour-val">{{ h.count }}</span>
                    <div class="hour-track">
                      <div class="hour-fill" [style.height.%]="getHourHeight(h.count)"></div>
                    </div>
                    <span class="hour-lbl">{{ h.hour }}h</span>
                  </div>
                </div>
                <ng-template #noHours>
                  <p class="empty-txt">Chưa có đủ dữ liệu đơn theo giờ trong kỳ này.</p>
                </ng-template>
              </div>
            </div>
          </div>

          <!-- TAB 3: CÔNG THỨC & THỨC UỐNG DRILL-DOWN -->
          <div *ngIf="activeTab() === 'recipes'" class="drill-section tab-fade-in">
            <div class="section-banner recipes-theme">
              <div class="banner-title-box">
                <mat-icon>local_cafe</mat-icon>
                <div>
                  <h2 class="section-title">Hiệu Suất Thực Đơn & Xếp Hạng Nước Uống Bán Chạy</h2>
                  <p class="section-subtitle">Top đồ uống được ưa chuộng nhất và thống kê mức độ tiêu thụ topping</p>
                </div>
              </div>

              <div class="quick-stats-row">
                <div class="stat-pill">
                  <span class="p-lbl">Tổng thức uống trên Menu:</span>
                  <strong class="p-val">{{ stats()!.kpi.totalRecipes }} thức uống</strong>
                </div>
              </div>
            </div>

            <div class="drill-grid">
              <!-- Top 5 Best Sellers -->
              <div class="analytics-card">
                <div class="card-head">
                  <h3 class="card-title">Top 5 Nước Uống Bán Chạy Nhất</h3>
                  <span class="head-sub">Xếp hạng theo số phần bán ra</span>
                </div>

                <div class="top-recipes-list" *ngIf="stats()!.topRecipes.length > 0; else noTop">
                  <div *ngFor="let item of stats()!.topRecipes; let idx = index" class="top-item-row">
                    <div class="rank-badge" [class.gold-rank]="idx === 0" [class.silver-rank]="idx === 1" [class.bronze-rank]="idx === 2">
                      <mat-icon *ngIf="idx === 0">local_fire_department</mat-icon>
                      <span *ngIf="idx > 0">#{{ idx + 1 }}</span>
                    </div>
                    <div class="top-item-details">
                      <span class="top-item-name">{{ item.name }}</span>
                      <span class="top-item-cat">{{ item.category || 'Món nước' }}</span>
                      <span class="top-item-sales">Doanh thu: {{ item.totalSales | vndCurrency }}</span>
                    </div>
                    <div class="top-item-qty">
                      <strong>{{ item.portionsSold }}</strong> ly
                    </div>
                  </div>
                </div>
                <ng-template #noTop>
                  <p class="empty-txt">Chưa có dữ liệu bán hàng để thống kê top món.</p>
                </ng-template>
              </div>

              <!-- Popular Toppings -->
              <div class="analytics-card">
                <div class="card-head">
                  <h3 class="card-title">Top Topping Đi Kèm Được Yêu Thích</h3>
                  <span class="head-sub">Số lượt khách hàng chọn kèm</span>
                </div>

                <div class="toppings-list" *ngIf="stats()!.topToppings && stats()!.topToppings.length > 0; else noTops">
                  <div class="topping-row" *ngFor="let t of stats()!.topToppings; let i = index">
                    <div class="topping-info">
                      <span class="topping-icon">🧋</span>
                      <span class="topping-name">{{ t.name }}</span>
                    </div>
                    <span class="topping-count-badge">{{ t.count }} phần</span>
                  </div>
                </div>
                <ng-template #noTops>
                  <p class="empty-txt">Chưa có dữ liệu topping trong khoảng thời gian này.</p>
                </ng-template>
              </div>
            </div>
          </div>

          <!-- TAB 4: THÀNH VIÊN & KHÁCH HÀNG DRILL-DOWN -->
          <div *ngIf="activeTab() === 'users'" class="drill-section tab-fade-in">
            <div class="section-banner users-theme">
              <div class="banner-title-box">
                <mat-icon>group</mat-icon>
                <div>
                  <h2 class="section-title">Khách Hàng Thân Thiết & Thành Viên Hệ Thống</h2>
                  <p class="section-subtitle">Vinh danh khách hàng VIP chi tiêu nhiều nhất và tỷ lệ tăng trưởng người dùng</p>
                </div>
              </div>

              <div class="quick-stats-row">
                <div class="stat-pill">
                  <span class="p-lbl">Tổng thành viên:</span>
                  <strong class="p-val">{{ stats()!.kpi.totalUsers }} user</strong>
                </div>
                <div class="stat-pill" *ngIf="stats()!.kpi.newUsersCount !== undefined">
                  <span class="p-lbl">Thành viên mới trong kỳ:</span>
                  <strong class="p-val text-green">+{{ stats()!.kpi.newUsersCount }}</strong>
                </div>
              </div>
            </div>

            <div class="drill-grid single-col-drill">
              <!-- VIP Customers Table -->
              <div class="analytics-card">
                <div class="card-head">
                  <h3 class="card-title">Bảng Vinh Danh Khách Hàng VIP Chi Tiêu Nhiều Nhất</h3>
                  <span class="head-sub">Top 5 khách hàng trung thành theo tổng giá trị đơn hàng</span>
                </div>

                <div class="vip-customers-table" *ngIf="stats()!.topCustomers && stats()!.topCustomers.length > 0; else noVip">
                  <div class="vip-row" *ngFor="let vip of stats()!.topCustomers; let i = index">
                    <div class="vip-rank-pill" [class.rank-1]="i === 0">
                      👑 VIP #{{ i + 1 }}
                    </div>
                    <div class="vip-user-info">
                      <div class="vip-avatar">{{ vip.name.charAt(0).toUpperCase() }}</div>
                      <div class="vip-text">
                        <strong class="vip-name">{{ vip.name }}</strong>
                        <span class="vip-email">{{ vip.email }}</span>
                      </div>
                    </div>
                    <div class="vip-orders-count">
                      <mat-icon>receipt</mat-icon>
                      <span>{{ vip.orderCount }} đơn hàng</span>
                    </div>
                    <div class="vip-spent">
                      <span class="spent-label">Tổng chi tiêu:</span>
                      <strong class="spent-amount">{{ vip.totalSpent | vndCurrency }}</strong>
                    </div>
                  </div>
                </div>
                <ng-template #noVip>
                  <p class="empty-txt">Chưa có đơn hàng hoàn thành từ khách hàng trong khoảng thời gian này.</p>
                </ng-template>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-view {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* 1. Header */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      color: #00754a;
      letter-spacing: 0.14em;
      background: #e8f5e9;
      padding: 4px 12px;
      border-radius: 50px;
      margin-bottom: 8px;
    }
    .pulse-dot {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #00754a;
    }
    .dash-title {
      font-size: 26px;
      font-weight: 900;
      color: #1e3932;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
    }
    .dash-desc {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.58);
      margin: 0;
    }
    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }
    .sync-info {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
    .sync-time {
      color: #1e3932;
      font-weight: 700;
    }
    .btn-sync {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 20px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 117, 74, 0.25);
      transition: all 0.2s;
    }
    .btn-sync:hover {
      background: #006241;
      transform: translateY(-1px);
    }
    .spin-anim {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* 2. Time Filter Bar */
    .time-filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      background: #ffffff;
      padding: 12px 18px;
      border-radius: 18px;
      border: 1px solid #edebe9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      position: relative;
    }
    .presets-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .preset-chip {
      padding: 8px 16px;
      border-radius: 50px;
      background: #f4f3ef;
      border: 1px solid transparent;
      color: #1e3932;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-chip:hover {
      background: #e8e6df;
    }
    .preset-chip.active {
      background: #1e3932;
      color: #dfc49d;
      font-weight: 700;
      border-color: rgba(203, 162, 88, 0.4);
      box-shadow: 0 4px 12px rgba(30, 57, 50, 0.2);
    }

    /* Custom Luxury Calendar Popover */
    .calendar-picker-container {
      position: relative;
    }
    .custom-calendar-trigger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 50px;
      background: #faf8f5;
      border: 1.5px solid #e0ded9;
      color: #1e3932;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s;
    }
    .custom-calendar-trigger:hover {
      border-color: #cba258;
      background: #ffffff;
      box-shadow: 0 4px 14px rgba(203, 162, 88, 0.15);
    }
    .custom-calendar-trigger.is-active, .custom-calendar-trigger.is-open {
      border-color: #00754a;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(0, 117, 74, 0.15);
      color: #00754a;
    }
    .cal-icon {
      font-size: 17px;
      width: 17px;
      height: 17px;
      color: #00754a;
    }
    .arrow-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.4);
    }

    /* Calendar Popover Dialog */
    .calendar-popover {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 340px;
      background: #ffffff;
      border-radius: 22px;
      padding: 20px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(203, 162, 88, 0.35);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: popoverFade 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes popoverFade {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .cal-popover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-month-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f4f2ee;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1e3932;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-month-btn:hover:not(:disabled) {
      background: #00754a;
      color: #ffffff;
    }
    .nav-month-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .month-title-wrap {
      font-size: 15px;
      font-weight: 800;
      color: #1e3932;
    }
    .year-name {
      color: #cba258;
    }

    /* Shortcuts in Popover */
    .cal-shortcuts {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #f7f6f2;
      padding: 4px;
      border-radius: 12px;
    }
    .shortcut-chip {
      padding: 6px 0;
      font-size: 11px;
      font-weight: 700;
      color: #1e3932;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .shortcut-chip:hover {
      background: #ffffff;
      color: #00754a;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    /* Weekday labels */
    .weekdays-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.45);
      padding-bottom: 4px;
      border-bottom: 1px solid #f0eee9;
    }
    .weekday.weekend {
      color: #cba258;
    }

    /* Days Matrix */
    .days-matrix {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      row-gap: 4px;
    }
    .day-cell {
      height: 38px;
      background: transparent;
      border: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 12.5px;
      font-weight: 600;
      color: #1e3932;
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease;
      border-radius: 0;
    }
    .day-cell:hover:not(:disabled) {
      background: #e8f5e9;
      color: #00754a;
      border-radius: 10px;
    }
    .day-cell.not-current-month {
      color: rgba(0, 0, 0, 0.22);
    }
    .day-cell.is-future {
      color: rgba(0, 0, 0, 0.2);
      cursor: not-allowed;
    }
    .day-cell.is-today .day-number {
      font-weight: 800;
      color: #cba258;
    }
    .today-dot {
      width: 4px;
      height: 4px;
      background: #cba258;
      border-radius: 50%;
      position: absolute;
      bottom: 4px;
    }

    /* Range and Start/End styling */
    .day-cell.is-start {
      background: linear-gradient(135deg, #00754a 0%, #1e3932 100%) !important;
      color: #ffffff !important;
      font-weight: 800;
      border-radius: 10px 0 0 10px !important;
      box-shadow: 0 4px 12px rgba(0, 117, 74, 0.35);
      z-index: 2;
    }
    .day-cell.is-end {
      background: linear-gradient(135deg, #00754a 0%, #1e3932 100%) !important;
      color: #ffffff !important;
      font-weight: 800;
      border-radius: 0 10px 10px 0 !important;
      box-shadow: 0 4px 12px rgba(0, 117, 74, 0.35);
      z-index: 2;
    }
    .day-cell.is-start.is-end {
      border-radius: 10px !important;
    }
    .day-cell.in-range {
      background: #e2f2ec;
      color: #006241;
      font-weight: 700;
    }
    .day-cell.hover-range {
      background: #f0f7f4;
      color: #00754a;
    }

    /* Popover Footer */
    .cal-popover-footer {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0eee9;
    }
    .range-preview {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 11.5px;
    }
    .preview-label {
      color: rgba(0, 0, 0, 0.45);
    }
    .preview-dates {
      color: #00754a;
      font-size: 13px;
    }
    .hint-click-end, .hint-pick {
      color: #cba258;
      font-weight: normal;
    }
    .cal-actions-group {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn-cal-cancel {
      padding: 7px 14px;
      border-radius: 50px;
      background: #f4f2ee;
      border: none;
      color: rgba(0, 0, 0, 0.65);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cal-cancel:hover {
      background: #e6e4df;
    }
    .btn-cal-apply {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 7px 18px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 117, 74, 0.25);
      transition: all 0.2s;
    }
    .btn-cal-apply:hover:not(:disabled) {
      background: #006241;
      transform: translateY(-1px);
    }
    .btn-cal-apply:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-cal-apply mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .period-notice-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #1e3932;
      background: #f0f7f4;
      padding: 8px 16px;
      border-radius: 12px;
      border-left: 4px solid #00754a;
    }
    .period-notice-pill mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #00754a;
    }

    .loading-state-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      background: #ffffff;
      border-radius: 14px;
      color: #00754a;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid #d4e9e2;
    }

    /* 3. Interactive KPI Grid */
    .kpi-interactive-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }
    .kpi-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 22px;
      border: 1.5px solid #edebe9;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
      border-color: #cba258;
    }
    .kpi-card.is-active {
      border-color: #00754a;
      background: linear-gradient(180deg, #ffffff 0%, #f6fbf9 100%);
      box-shadow: 0 12px 30px rgba(0, 117, 74, 0.16);
      transform: translateY(-4px);
    }
    .kpi-card.is-active::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid #00754a;
    }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .revenue-icon { background: #faf3e5; color: #cba258; }
    .orders-icon { background: #e6f4ea; color: #137333; }
    .recipes-icon { background: #e0f2f1; color: #00754a; }
    .users-icon { background: #f3e5f5; color: #8e24aa; }

    .view-detail-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 800;
      color: #00754a;
      background: #d4e9e2;
      padding: 4px 10px;
      border-radius: 50px;
    }
    .view-detail-badge mat-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
    }

    .kpi-title {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.55);
      font-weight: 700;
      display: block;
      margin-bottom: 4px;
    }
    .kpi-number {
      font-size: 24px;
      font-weight: 900;
      color: #1e3932;
      letter-spacing: -0.02em;
      display: block;
      margin-bottom: 4px;
    }
    .kpi-number small {
      font-size: 14px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.45);
    }
    .kpi-sub {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-footer {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #f2f0eb;
    }
    .click-hint {
      font-size: 11.5px;
      color: #00754a;
      font-weight: 700;
    }

    /* 4. Deep-Dive Section */
    .deep-dive-panel {
      margin-top: 10px;
    }
    .tab-fade-in {
      animation: tabFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes tabFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .section-banner {
      background: linear-gradient(135deg, #1e3932 0%, #11241f 100%);
      color: #ffffff;
      padding: 22px 28px;
      border-radius: 20px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      border: 1px solid rgba(203, 162, 88, 0.3);
      box-shadow: 0 8px 24px rgba(30, 57, 50, 0.16);
    }
    .banner-title-box {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .banner-title-box mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #dfc49d;
    }
    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 4px;
    }
    .section-subtitle {
      font-size: 13px;
      color: #d4e9e2;
      margin: 0;
      opacity: 0.9;
    }

    .quick-stats-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .stat-pill {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      padding: 8px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .p-lbl {
      font-size: 11px;
      color: #dfc49d;
      font-weight: 600;
    }
    .p-val {
      font-size: 14.5px;
      font-weight: 800;
      color: #ffffff;
    }
    .text-green { color: #52d6a4 !important; }

    .drill-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 22px;
    }
    .single-col-drill {
      grid-template-columns: 1fr;
    }
    @media (max-width: 960px) {
      .drill-grid { grid-template-columns: 1fr; }
    }

    .analytics-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
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
      font-weight: 800;
      color: #1e3932;
      margin: 0;
    }
    .head-sub {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }

    /* Timeline Histogram Bars */
    .timeline-bars-wrap {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      height: 280px;
      padding: 75px 16px 12px;
      overflow-x: auto;
      overflow-y: visible;
    }
    .bar-col {
      flex: 1;
      min-width: 40px;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      position: relative;
    }
    .bar-col:hover .bar-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }
    .bar-track {
      width: 100%;
      max-width: 26px;
      height: 160px;
      background: #f4f2ee;
      border-radius: 8px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .gold-gradient-bar {
      width: 100%;
      background: linear-gradient(180deg, #cba258 0%, #00754a 100%);
      border-radius: 8px 8px 0 0;
      transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bar-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.55);
      margin-top: 8px;
      font-weight: 600;
      white-space: nowrap;
    }
    .bar-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(6px);
      background: #1e3932;
      color: #ffffff;
      font-size: 11.5px;
      padding: 8px 12px;
      border-radius: 10px;
      white-space: nowrap;
      display: flex;
      flex-direction: column;
      gap: 3px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(203, 162, 88, 0.45);
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      z-index: 50;
    }
    .bar-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px;
      border-style: solid;
      border-color: #1e3932 transparent transparent transparent;
    }

    /* Category breakdown */
    .category-breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cat-item-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cat-head {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      font-weight: 700;
      color: #1e3932;
    }
    .cat-rev {
      color: #00754a;
    }
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
    .fill-green { background: linear-gradient(90deg, #00754a, #52d6a4); }
    .cat-sub {
      font-size: 11.5px;
      color: rgba(0, 0, 0, 0.5);
    }

    /* Status Bars */
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
    .fill-pending { background: #cba258; }
    .fill-progress { background: #00754a; }
    .fill-completed { background: #137333; }
    .fill-cancelled { background: #c82014; }

    /* Peak Hours */
    .peak-hours-grid {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 180px;
      padding-top: 10px;
    }
    .hour-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .hour-val {
      font-size: 10px;
      font-weight: 700;
      color: #00754a;
      margin-bottom: 4px;
    }
    .hour-track {
      width: 100%;
      max-width: 16px;
      height: 120px;
      background: #f4f2ee;
      border-radius: 6px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }
    .hour-fill {
      width: 100%;
      background: #00754a;
      border-radius: 6px 6px 0 0;
      transition: height 0.5s;
    }
    .hour-lbl {
      font-size: 10.5px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 6px;
      font-weight: 600;
    }

    /* Top Recipes */
    .top-recipes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .top-item-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 14px;
      background: #faf8f5;
      border: 1px solid #edebe9;
    }
    .rank-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #edebe9;
      color: #1e3932;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .rank-badge.gold-rank {
      background: linear-gradient(135deg, #ff6d00 0%, #e65100 100%);
      color: #ffffff;
      box-shadow: 0 4px 10px rgba(230, 81, 0, 0.3);
    }
    .rank-badge.gold-rank mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      font-variation-settings: 'FILL' 1;
    }
    .rank-badge.silver-rank {
      background: #d4e9e2;
      color: #006241;
    }
    .rank-badge.bronze-rank {
      background: #faf3e5;
      color: #cba258;
    }
    .top-item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .top-item-name {
      font-size: 14.5px;
      font-weight: 700;
      color: #1e3932;
    }
    .top-item-cat {
      font-size: 11px;
      color: #00754a;
      font-weight: 600;
    }
    .top-item-sales {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
    }
    .top-item-qty {
      font-size: 14px;
      color: #00754a;
      font-weight: 600;
    }
    .top-item-qty strong {
      font-size: 17px;
      font-weight: 800;
    }

    /* Toppings List */
    .toppings-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .topping-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #f9f8f6;
      border-radius: 12px;
    }
    .topping-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topping-name {
      font-size: 13.5px;
      font-weight: 700;
      color: #1e3932;
    }
    .topping-count-badge {
      background: #00754a;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 50px;
    }

    /* VIP Customers Table */
    .vip-customers-table {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .vip-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
      padding: 14px 18px;
      background: #faf8f5;
      border-radius: 16px;
      border: 1px solid #edebe9;
      transition: all 0.2s;
    }
    .vip-row:hover {
      background: #ffffff;
      border-color: #cba258;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
    }
    .vip-rank-pill {
      font-size: 12px;
      font-weight: 800;
      color: #8e24aa;
      background: #f3e5f5;
      padding: 6px 12px;
      border-radius: 50px;
    }
    .vip-rank-pill.rank-1 {
      color: #ffffff;
      background: linear-gradient(135deg, #cba258 0%, #a67c2e 100%);
      box-shadow: 0 4px 10px rgba(203, 162, 88, 0.35);
    }
    .vip-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 200px;
    }
    .vip-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1e3932;
      color: #dfc49d;
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vip-text {
      display: flex;
      flex-direction: column;
    }
    .vip-name {
      font-size: 14.5px;
      font-weight: 700;
      color: #1e3932;
    }
    .vip-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
    }
    .vip-orders-count {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
      font-weight: 600;
    }
    .vip-orders-count mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #00754a;
    }
    .vip-spent {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .spent-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.45);
    }
    .spent-amount {
      font-size: 16px;
      font-weight: 800;
      color: #00754a;
    }

    .empty-box, .empty-txt {
      text-align: center;
      padding: 30px;
      color: rgba(0, 0, 0, 0.5);
      font-size: 13.5px;
    }
    .empty-box mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: rgba(0, 0, 0, 0.3);
      margin-bottom: 8px;
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private statsService = inject(StatsService);

  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(false);
  lastSyncTime = signal<string>('');

  // Selected Time Period Filter State
  selectedPeriod = signal<TimePeriod>('7days');
  customStartDate = '';
  customEndDate = '';

  // Custom Calendar Popover States
  showCalendar = signal<boolean>(false);
  calendarViewMonth = signal<number>(new Date().getMonth());
  calendarViewYear = signal<number>(new Date().getFullYear());
  tempStartDate = signal<Date | null>(null);
  tempEndDate = signal<Date | null>(null);
  hoverDate = signal<Date | null>(null);

  // Interactive Active KPI Tab Drilldown State
  activeTab = signal<KpiTab>('revenue');

  // Computed Calendar Day Cells Matrix
  calendarCells = computed<CalendarCell[]>(() => {
    const year = this.calendarViewYear();
    const month = this.calendarViewMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = this.tempStartDate();
    const end = this.tempEndDate();
    const hover = this.hoverDate();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Convert to Mon = 0, Sun = 6

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    // 1. Previous Month Overflow
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      d.setHours(0, 0, 0, 0);
      cells.push(this.createCell(d, false, today, start, end, hover));
    }

    // 2. Current Month Days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      cells.push(this.createCell(d, true, today, start, end, hover));
    }

    // 3. Next Month Overflow (to fill up to 35 or 42 grid)
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      d.setHours(0, 0, 0, 0);
      cells.push(this.createCell(d, false, today, start, end, hover));
    }

    return cells;
  });

  private createCell(
    date: Date,
    isCurrentMonth: boolean,
    today: Date,
    start: Date | null,
    end: Date | null,
    hover: Date | null,
  ): CalendarCell {
    const dateTime = date.getTime();
    const isFuture = dateTime > today.getTime();
    const isToday = dateTime === today.getTime();

    const isStart = start !== null && dateTime === start.getTime();
    const isEnd = end !== null && dateTime === end.getTime();

    let isInRange = false;
    if (start && end) {
      isInRange = dateTime >= start.getTime() && dateTime <= end.getTime();
    }

    let isHoverInRange = false;
    if (start && !end && hover && hover.getTime() >= start.getTime()) {
      isHoverInRange = dateTime >= start.getTime() && dateTime <= hover.getTime();
    }

    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      isFuture,
      isStart,
      isEnd,
      isInRange,
      isHoverInRange,
    };
  }

  ngOnInit() {
    this.fetchStats();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-picker-container')) {
      this.closeCalendar();
    }
  }

  toggleCalendar() {
    const next = !this.showCalendar();
    this.showCalendar.set(next);
    if (next) {
      const { startDate, endDate } = this.calculateDateRange();
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        this.tempStartDate.set(s);
        this.calendarViewMonth.set(s.getMonth());
        this.calendarViewYear.set(s.getFullYear());
      } else {
        this.tempStartDate.set(null);
      }

      if (endDate) {
        const e = new Date(endDate);
        e.setHours(0, 0, 0, 0);
        this.tempEndDate.set(e);
      } else {
        this.tempEndDate.set(null);
      }
    }
  }

  closeCalendar() {
    this.showCalendar.set(false);
    this.hoverDate.set(null);
  }

  prevMonth() {
    let m = this.calendarViewMonth() - 1;
    let y = this.calendarViewYear();
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    this.calendarViewMonth.set(m);
    this.calendarViewYear.set(y);
  }

  nextMonth() {
    if (this.isNextMonthDisabled()) return;
    let m = this.calendarViewMonth() + 1;
    let y = this.calendarViewYear();
    if (m > 11) {
      m = 0;
      y += 1;
    }
    this.calendarViewMonth.set(m);
    this.calendarViewYear.set(y);
  }

  isNextMonthDisabled(): boolean {
    const now = new Date();
    return (
      this.calendarViewYear() > now.getFullYear() ||
      (this.calendarViewYear() === now.getFullYear() && this.calendarViewMonth() >= now.getMonth())
    );
  }

  onDateCellClick(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date.getTime() > today.getTime()) return;

    const start = this.tempStartDate();
    const end = this.tempEndDate();

    if (!start || (start && end)) {
      this.tempStartDate.set(date);
      this.tempEndDate.set(null);
    } else {
      if (date.getTime() < start.getTime()) {
        this.tempStartDate.set(date);
        this.tempEndDate.set(null);
      } else {
        this.tempEndDate.set(date);
      }
    }
  }

  onDateCellHover(date: Date | null) {
    this.hoverDate.set(date);
  }

  selectShortcut(period: TimePeriod) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (period === 'today') {
      this.tempStartDate.set(now);
      this.tempEndDate.set(now);
    } else if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      this.tempStartDate.set(y);
      this.tempEndDate.set(y);
    } else if (period === '7days') {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      this.tempStartDate.set(s);
      this.tempEndDate.set(now);
    } else if (period === 'thisMonth') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      this.tempStartDate.set(s);
      this.tempEndDate.set(now);
    }
    this.applyCalendarSelection();
  }

  applyCalendarSelection() {
    const start = this.tempStartDate();
    const end = this.tempEndDate() || start;

    if (!start || !end) return;

    this.customStartDate = this.formatDate(start);
    this.customEndDate = this.formatDate(end);
    this.selectedPeriod.set('custom');
    this.closeCalendar();
    this.fetchStats();
  }

  selectPeriod(period: TimePeriod) {
    this.selectedPeriod.set(period);
    this.closeCalendar();
    this.fetchStats();
  }

  fetchStats() {
    this.loading.set(true);
    const { startDate, endDate } = this.calculateDateRange();

    this.statsService.getDashboardStats(startDate, endDate).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.lastSyncTime.set(new Date().toLocaleTimeString('vi-VN'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private calculateDateRange(): { startDate?: string; endDate?: string } {
    const period = this.selectedPeriod();
    const now = new Date();

    if (period === 'today') {
      const todayStr = this.formatDate(now);
      return { startDate: todayStr, endDate: todayStr };
    }

    if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = this.formatDate(y);
      return { startDate: yStr, endDate: yStr };
    }

    if (period === '7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { startDate: this.formatDate(start), endDate: this.formatDate(now) };
    }

    if (period === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: this.formatDate(start), endDate: this.formatDate(now) };
    }

    if (period === 'custom' && this.customStartDate && this.customEndDate) {
      return { startDate: this.customStartDate, endDate: this.customEndDate };
    }

    // 'all'
    return {};
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod()) {
      case 'today': return 'Hôm nay';
      case 'yesterday': return 'Hôm qua';
      case '7days': return '7 ngày gần đây';
      case 'thisMonth': return 'Tháng này';
      case 'custom': return 'Khoảng ngày tùy chọn';
      default: return 'Toàn bộ thời gian';
    }
  }

  activeDateRangeLabel(): string {
    const { startDate, endDate } = this.calculateDateRange();
    if (!startDate || !endDate) return '';
    return `${this.formatDisplayDate(startDate)} ➔ ${this.formatDisplayDate(endDate)}`;
  }

  // Analytics Helpers
  getPercent(count: number): number {
    if (!this.stats() || this.stats()!.kpi.totalOrders === 0) return 0;
    return Math.round((count / this.stats()!.kpi.totalOrders) * 100);
  }

  getFulfillmentRate(): number {
    if (!this.stats() || this.stats()!.kpi.totalOrders === 0) return 100;
    return Math.round((this.stats()!.kpi.completedOrders / this.stats()!.kpi.totalOrders) * 100);
  }

  getAverageOrderValue(): number {
    if (!this.stats()) return 0;
    const completed = this.stats()!.kpi.completedOrders || this.stats()!.kpi.totalOrders;
    if (completed === 0) return 0;
    return Math.round(this.stats()!.kpi.totalRevenue / completed);
  }

  getPeakDay(): TimelineStat | null {
    if (!this.stats() || !this.stats()!.timeline || this.stats()!.timeline.length === 0) return null;
    return [...this.stats()!.timeline].sort((a, b) => b.revenue - a.revenue)[0];
  }

  getBarHeight(revenue: number): number {
    const peak = this.getPeakDay();
    if (!peak || peak.revenue === 0) return 0;
    return Math.max(12, Math.round((revenue / peak.revenue) * 100));
  }

  getHourHeight(count: number): number {
    if (!this.stats() || !this.stats()!.peakHours || this.stats()!.peakHours.length === 0) return 0;
    const max = Math.max(...this.stats()!.peakHours.map((h) => h.count));
    if (max === 0) return 0;
    return Math.max(10, Math.round((count / max) * 100));
  }

  getCategoryPercent(rev: number): number {
    if (!this.stats() || this.stats()!.kpi.totalRevenue === 0) return 0;
    return Math.round((rev / this.stats()!.kpi.totalRevenue) * 100);
  }

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  formatShortDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr;
  }
}
