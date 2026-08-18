import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { RealtimeSseService } from '../../../core/services/realtime-sse.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-admin-order-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    StatusBadgeComponent,
    VndCurrencyPipe,
  ],
  template: `
    <div class="order-mgr-view">
      <!-- Top Title & Search Filter [FE-07] -->
      <div class="mgr-header">
        <div>
          <h1 class="mgr-title">Quản Lý Toàn Bộ Đơn Hàng</h1>
          <p class="mgr-subtitle">Xem, tìm kiếm và cập nhật trạng thái đơn đặt món thời gian thực</p>
        </div>

        <div class="mgr-filters">
          <div class="search-box" [class.has-text]="!!searchControl.value">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Tìm theo khách hàng, email, món ăn, mã đơn..."
            />
            <button
              type="button"
              class="btn-clear-search"
              *ngIf="searchControl.value"
              (click)="clearSearch()"
              title="Xóa tìm kiếm"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="filter-select-wrap">
            <mat-icon class="filter-icon">tune</mat-icon>
            <select [formControl]="statusFilter" class="status-select">
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Pending">⏳ Chờ tiếp nhận (Pending)</option>
              <option value="Đang làm">☕ Đang làm</option>
              <option value="Hoàn thành">✅ Hoàn thành</option>
              <option value="Bị huỷ">❌ Bị huỷ</option>
            </select>
            <mat-icon class="filter-arrow">expand_more</mat-icon>
          </div>
        </div>
      </div>

      <!-- Orders Data Table [AD-01] -->
      <div class="table-card">
        <div *ngIf="loading()" class="table-loading">Đang tải danh sách đơn hàng...</div>

        <table class="sb-table" *ngIf="!loading() && orders().length > 0">
          <thead>
            <tr>
              <th>MÃ ĐƠN</th>
              <th>KHÁCH HÀNG</th>
              <th>MÓN ĐẶT</th>
              <th>SỐ LƯỢNG</th>
              <th>TỔNG TIỀN</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC CẬP NHẬT</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders()">
              <td>
                <span class="order-tag">#{{ order.id.slice(-6).toUpperCase() }}</span>
                <span class="order-time">{{ order.createdAt | date: 'dd/MM HH:mm' }}</span>
              </td>
              <td>
                <div class="user-cell">
                  <span class="user-name-txt">{{ order.userName }}</span>
                  <span class="user-email-txt">{{ order.userEmail }}</span>
                </div>
              </td>
              <td>
                <div class="recipe-cell">
                  <img [src]="order.recipeSnapshot.imgUrl" [alt]="order.recipeSnapshot.name" class="table-thumb" />
                  <div>
                    <span class="r-name">{{ order.recipeSnapshot.name }}</span>
                    <span class="r-note" *ngIf="order.note">Note: {{ order.note }}</span>
                  </div>
                </div>
              </td>
              <td><strong>{{ order.portions }}</strong> phần</td>
              <td>
                <span class="price-txt">{{ order.totalPrice | vndCurrency }}</span>
              </td>
              <td>
                <app-status-badge [status]="order.status"></app-status-badge>
                <span class="cancel-preview" *ngIf="order.status === 'Bị huỷ' && order.cancelReason">
                  Lý do: {{ order.cancelReason }}
                </span>
              </td>
              <td>
                <div class="action-dropdown-wrap">
                  <div class="status-action-pill" [ngClass]="'status-pill-' + getStatusSlug(order.status)">
                    <mat-icon class="pill-icon">{{ getStatusIcon(order.status) }}</mat-icon>
                    <select
                      class="action-select-custom"
                      [value]="order.status"
                      (change)="onStatusSelectChange(order, $event)"
                    >
                      <option value="Pending">Chờ tiếp nhận</option>
                      <option value="Đang làm">Đang làm</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                      <option value="Bị huỷ">Bị huỷ</option>
                    </select>
                    <mat-icon class="pill-chevron">expand_more</mat-icon>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="!loading() && orders().length === 0" class="table-empty">
          <mat-icon>inbox</mat-icon>
          <p>Không có đơn hàng nào khớp với bộ lọc.</p>
        </div>
      </div>

      <!-- CANCEL REASON MODAL -->
      <div class="modal-backdrop" *ngIf="cancelModalOpen()">
        <div class="modal-card">
          <div class="modal-head">
            <mat-icon class="cancel-icon">warning</mat-icon>
            <h3>Bắt buộc nhập lý do huỷ đơn hàng</h3>
          </div>
          <p class="modal-sub">
            Lý do này sẽ hiển thị trực tiếp cho khách hàng tại màn hình theo dõi đơn hàng của họ.
          </p>

          <form [formGroup]="cancelForm" (ngSubmit)="confirmCancelWithReason()" class="modal-form">
            <div class="form-group">
              <label>Lý do huỷ đơn:</label>
              <textarea
                formControlName="cancelReason"
                rows="3"
                placeholder="Ví dụ: Món ăn tạm hết nguyên liệu, quán quá tải đơn..."
                class="modal-textarea"
              ></textarea>
              <span class="err-msg" *ngIf="cancelForm.get('cancelReason')?.touched && cancelForm.get('cancelReason')?.invalid">
                Vui lòng nhập lý do huỷ đơn trước khi tiếp tục
              </span>
            </div>

            <div class="modal-btns">
              <button type="button" class="btn-cancel-modal" (click)="closeCancelModal()">Huỷ thao tác</button>
              <button type="submit" class="btn-confirm-cancel" [disabled]="cancelForm.invalid">
                Xác nhận Huỷ Đơn
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-mgr-view {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .mgr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .mgr-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }
    .mgr-subtitle {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.58);
    }
    .mgr-filters {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: #ffffff;
      border: 1.5px solid #edebe9;
      border-radius: 50px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }
    .search-box:focus-within, .search-box.has-text {
      border-color: #00754a;
      box-shadow: 0 0 0 3px rgba(0, 117, 74, 0.12);
    }
    .search-box .search-icon {
      color: #00754a;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .search-box input {
      border: none;
      outline: none;
      font-size: 13px;
      font-family: inherit;
      width: 260px;
      color: #1e3932;
    }
    .btn-clear-search {
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      cursor: pointer;
      border-radius: 50%;
      color: rgba(0, 0, 0, 0.4);
      transition: all 0.15s;
    }
    .btn-clear-search:hover {
      background: #edebe9;
      color: #1e3932;
    }
    .btn-clear-search mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .filter-select-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      background: #ffffff;
      border: 1.5px solid #edebe9;
      border-radius: 50px;
      padding: 0 12px 0 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }
    .filter-select-wrap:hover, .filter-select-wrap:focus-within {
      border-color: #00754a;
      box-shadow: 0 0 0 3px rgba(0, 117, 74, 0.12);
    }
    .filter-icon {
      color: #00754a;
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
      pointer-events: none;
    }
    .status-select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      padding: 9px 24px 9px 4px;
      background: transparent;
      border: none;
      font-size: 13px;
      font-weight: 600;
      color: #1e3932;
      outline: none;
      cursor: pointer;
      font-family: inherit;
    }
    .filter-arrow {
      position: absolute;
      right: 10px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.45);
      pointer-events: none;
    }
    .table-card {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
      overflow-x: auto;
    }
    .sb-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    .sb-table th {
      padding: 16px 20px;
      background: #faf6ee;
      color: #1e3932;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #edebe9;
    }
    .sb-table td {
      padding: 16px 20px;
      border-bottom: 1px solid #f2f0eb;
      vertical-align: middle;
    }
    .sb-table tr:hover {
      background: #fafafa;
    }
    .order-tag {
      font-weight: 800;
      color: #1e3932;
      display: block;
    }
    .order-time {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.45);
    }
    .user-cell {
      display: flex;
      flex-direction: column;
    }
    .user-name-txt {
      font-weight: 700;
      color: #1e3932;
    }
    .user-email-txt {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }
    .recipe-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .table-thumb {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
    }
    .r-name {
      font-weight: 700;
      color: #1e3932;
      display: block;
    }
    .r-note {
      font-size: 11px;
      color: #00754a;
      font-style: italic;
    }
    .price-txt {
      font-weight: 800;
      color: #006241;
    }
    .cancel-preview {
      display: block;
      font-size: 11px;
      color: #c82014;
      margin-top: 4px;
    }
    .action-dropdown-wrap {
      display: inline-flex;
      align-items: center;
    }
    .status-action-pill {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px 6px 10px;
      border-radius: 50px;
      border: 1.5px solid transparent;
      font-weight: 700;
      font-size: 12.5px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.04);
    }
    .status-action-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .status-pill-pending {
      background: #fff9e6;
      border-color: #f3d078;
      color: #946200;
    }
    .status-pill-pending .pill-icon {
      color: #d97706;
    }
    .status-pill-preparing {
      background: #eef7ff;
      border-color: #9ec5fe;
      color: #0d6efd;
    }
    .status-pill-preparing .pill-icon {
      color: #0d6efd;
    }
    .status-pill-completed {
      background: #edf7ed;
      border-color: #a3cfbb;
      color: #0f5132;
    }
    .status-pill-completed .pill-icon {
      color: #00754a;
    }
    .status-pill-cancelled {
      background: #fdf2f2;
      border-color: #f8d7da;
      color: #842029;
    }
    .status-pill-cancelled .pill-icon {
      color: #dc3545;
    }
    .pill-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      pointer-events: none;
    }
    .action-select-custom {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background: transparent;
      border: none;
      outline: none;
      font-size: 12.5px;
      font-weight: 700;
      font-family: inherit;
      color: inherit;
      cursor: pointer;
      padding-right: 18px;
    }
    .action-select-custom option {
      background: #ffffff;
      color: #1e3932;
      font-weight: 600;
      font-size: 13px;
      padding: 8px 12px;
    }
    .pill-chevron {
      position: absolute;
      right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      pointer-events: none;
      color: inherit;
      opacity: 0.65;
      transition: transform 0.2s;
    }
    .status-action-pill:hover .pill-chevron {
      opacity: 1;
      transform: translateY(1px);
    }
    .table-empty {
      text-align: center;
      padding: 48px 20px;
      color: rgba(0, 0, 0, 0.5);
    }
    .table-empty mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 16px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 28px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    .modal-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .cancel-icon {
      color: #c82014;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .modal-head h3 {
      font-size: 17px;
      font-weight: 700;
      color: #1e3932;
    }
    .modal-sub {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
      margin-bottom: 16px;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-textarea {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d6dbde;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      resize: vertical;
    }
    .modal-textarea:focus {
      border-color: #c82014;
      box-shadow: 0 0 0 3px rgba(200, 32, 20, 0.15);
    }
    .modal-btns {
      display: flex;
      gap: 12px;
    }
    .btn-cancel-modal, .btn-confirm-cancel {
      flex: 1;
      padding: 12px;
      border-radius: 50px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
    .btn-cancel-modal {
      background: #edebe9;
      color: rgba(0, 0, 0, 0.87);
    }
    .btn-confirm-cancel {
      background: #c82014;
      color: #ffffff;
    }
    .btn-confirm-cancel:disabled {
      opacity: 0.5;
    }
    .err-msg {
      font-size: 11px;
      color: #c82014;
    }
  `],
})
export class AdminOrderManagerComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private sseService = inject(RealtimeSseService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);

  searchControl = new FormControl('');
  statusFilter = new FormControl('Tất cả');

  // Cancel reason modal state [AD-03]
  cancelModalOpen = signal<boolean>(false);
  targetOrderForCancel = signal<Order | null>(null);
  cancelForm = this.fb.group({
    cancelReason: ['', [Validators.required, Validators.minLength(3)]],
  });

  private sub = new Subscription();

  ngOnInit() {
    this.fetchOrders();

    // Debounced real-time reactive search (350ms buffer)
    const searchSub = this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.fetchOrders(true);
      });
    this.sub.add(searchSub);

    // Status filter reactive change
    const statusSub = this.statusFilter.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        this.fetchOrders(true);
      });
    this.sub.add(statusSub);

    // Realtime SSE updates
    const sseSub = this.sseService.events$.subscribe(() => {
      this.fetchOrders(false);
    });
    this.sub.add(sseSub);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  fetchOrders(showLoading: boolean = true) {
    if (showLoading) this.loading.set(true);
    const keyword = this.searchControl.value?.trim() || '';
    const status = this.statusFilter.value || 'Tất cả';

    this.orderService.getAdminOrders(status, keyword).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onStatusSelectChange(order: Order, event: any) {
    const newStatus = event.target.value as OrderStatus;

    // [AD-03] If switching to Cancelled, require cancelReason popup
    if (newStatus === 'Bị huỷ') {
      this.targetOrderForCancel.set(order);
      this.cancelForm.reset();
      this.cancelModalOpen.set(true);
      // Reset select dropdown temporarily
      event.target.value = order.status;
      return;
    }

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        this.toast.success(`Đã cập nhật trạng thái đơn #${order.id.slice(-6).toUpperCase()} sang "${newStatus}"`);
        this.fetchOrders();
      },
    });
  }

  confirmCancelWithReason() {
    if (this.cancelForm.invalid || !this.targetOrderForCancel()) return;
    const order = this.targetOrderForCancel()!;
    const reason = this.cancelForm.value.cancelReason!;

    this.orderService.updateOrderStatus(order.id, 'Bị huỷ', reason).subscribe({
      next: () => {
        this.toast.success(`Đã huỷ đơn #${order.id.slice(-6).toUpperCase()} kèm lý do`);
        this.closeCancelModal();
        this.fetchOrders();
      },
    });
  }

  closeCancelModal() {
    this.cancelModalOpen.set(false);
    this.targetOrderForCancel.set(null);
  }

  getStatusSlug(status: string): string {
    switch (status) {
      case 'Pending':
        return 'pending';
      case 'Đang làm':
        return 'preparing';
      case 'Hoàn thành':
        return 'completed';
      case 'Bị huỷ':
        return 'cancelled';
      default:
        return 'default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Pending':
        return 'hourglass_top';
      case 'Đang làm':
        return 'local_cafe';
      case 'Hoàn thành':
        return 'check_circle';
      case 'Bị huỷ':
        return 'cancel';
      default:
        return 'edit_note';
    }
  }
}
