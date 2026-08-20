import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StatsService } from '../../../core/services/stats.service';
import {
  DashboardStats,
  TimelineStat,
  CategoryStat,
  TopCustomerStat,
  TopRecipeStat,
} from '../../../core/models/stats.model';
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

type TimePeriod =
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'all'
  | 'custom';
type KpiTab = 'revenue' | 'orders' | 'recipes' | 'users';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, VndCurrencyPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
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
    } else if (period === '30days') {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      this.tempStartDate.set(s);
      this.tempEndDate.set(now);
    } else if (period === 'thisMonth') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      this.tempStartDate.set(s);
      this.tempEndDate.set(now);
    } else if (period === 'lastMonth') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      this.tempStartDate.set(s);
      this.tempEndDate.set(e);
      this.calendarViewMonth.set(s.getMonth());
      this.calendarViewYear.set(s.getFullYear());
    } else if (period === 'thisYear') {
      const s = new Date(now.getFullYear(), 0, 1);
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

    if (period === '30days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { startDate: this.formatDate(start), endDate: this.formatDate(now) };
    }

    if (period === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: this.formatDate(start), endDate: this.formatDate(now) };
    }

    if (period === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: this.formatDate(start), endDate: this.formatDate(end) };
    }

    if (period === 'thisYear') {
      const start = new Date(now.getFullYear(), 0, 1);
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
      case 'today':
        return 'Hôm nay';
      case 'yesterday':
        return 'Hôm qua';
      case '7days':
        return '7 ngày gần đây';
      case '30days':
        return '30 ngày qua';
      case 'thisMonth':
        return 'Tháng này';
      case 'lastMonth':
        return 'Tháng trước';
      case 'thisYear':
        return 'Năm nay (' + new Date().getFullYear() + ')';
      case 'custom':
        return 'Khoảng ngày tùy chọn';
      default:
        return 'Toàn bộ thời gian';
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
    if (!this.stats() || !this.stats()!.timeline || this.stats()!.timeline.length === 0)
      return null;
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
