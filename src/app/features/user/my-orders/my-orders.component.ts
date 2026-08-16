import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { RealtimeSseService } from '../../../core/services/realtime-sse.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../core/models/order.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    VndCurrencyPipe,
  ],
  template: `
    <div class="orders-page">
      <div class="orders-container">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Đơn Đặt Của Tôi</h1>
            <p class="page-subtitle">Theo dõi quy trình pha chế và cập nhật trạng thái đơn hàng của bạn</p>
          </div>
          <button class="btn-refresh" (click)="fetchOrders()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon>
            Làm mới
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-state">
          <p>Đang tải danh sách đơn hàng...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && orders().length === 0" class="empty-orders">
          <div class="empty-icon">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <h3>Bạn chưa có đơn đặt món nào</h3>
          <p>Hãy dạo một vòng thực đơn Starbucks và chọn cho mình thức uống yêu thích nhé!</p>
          <a routerLink="/menu" class="btn-explore">Khám phá thực đơn ngay</a>
        </div>

        <!-- Order List [US-08] -->
        <div *ngIf="!loading() && orders().length > 0" class="orders-list">
          <div *ngFor="let order of orders()" class="order-card">
            <div class="order-header">
              <div class="order-id-group">
                <span class="order-id">Mã đơn: #{{ order.id.slice(-6).toUpperCase() }}</span>
                <span class="order-date">{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <!-- Status Badge [US-11] -->
              <app-status-badge [status]="order.status"></app-status-badge>
            </div>

            <!-- Order Item Details -->
            <div class="order-body">
              <img [src]="order.recipeSnapshot.imgUrl" [alt]="order.recipeSnapshot.name" class="recipe-thumb" />
              <div class="item-info">
                <h4 class="item-name">{{ order.recipeSnapshot.name }}</h4>
                <div class="item-meta">
                  <span>Số lượng: <strong>{{ order.portions }} phần</strong></span>
                  <span>Đơn giá: {{ order.recipeSnapshot.giaCoBan | vndCurrency }}</span>
                  <span>Thời gian nhận: <strong>{{ order.desiredTime }}</strong></span>
                </div>
                <p class="item-note" *ngIf="order.note">
                  <mat-icon>sticky_note_2</mat-icon>
                  <em>Ghi chú: "{{ order.note }}"</em>
                </p>
              </div>

              <!-- Total price -->
              <div class="order-price-col">
                <span class="price-lbl">Tổng thanh toán</span>
                <span class="price-val">{{ order.totalPrice | vndCurrency }}</span>
              </div>
            </div>

            <!-- Cancellation Reason Alert [US-11, AD-03] -->
            <div *ngIf="order.status === 'Bị huỷ'" class="cancel-reason-box">
              <mat-icon>error_outline</mat-icon>
              <div>
                <strong>Lý do huỷ đơn:</strong>
                <p>{{ order.cancelReason || 'Đơn hàng bị huỷ bởi hệ thống' }}</p>
              </div>
            </div>

            <!-- Order Actions (Edit / Cancel if Pending) -->
            <div class="order-actions" *ngIf="order.status === 'Pending'">
              <span class="pending-tip">
                <mat-icon>schedule</mat-icon>
                Đơn đang chờ tiếp nhận. Bạn có thể sửa hoặc huỷ.
              </span>
              <div class="btn-actions-wrap">
                <button class="btn-edit" (click)="openEditModal(order)">
                  <mat-icon>edit</mat-icon>
                  Chỉnh sửa đơn
                </button>
                <button class="btn-cancel-order" (click)="openCancelConfirm(order)">
                  <mat-icon>cancel</mat-icon>
                  Huỷ đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- EDIT ORDER MODAL [US-09] -->
      <div class="modal-backdrop" *ngIf="editingOrder()">
        <div class="modal-panel">
          <div class="modal-header">
            <h3>Chỉnh sửa đơn hàng #{{ editingOrder()!.id.slice(-6).toUpperCase() }}</h3>
            <button class="btn-close" (click)="editingOrder.set(null)">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="editForm" (ngSubmit)="onSaveEdit()" class="edit-form">
            <div class="form-row">
              <label>Khẩu phần (1 - 20 phần):</label>
              <input type="number" formControlName="portions" min="1" max="20" class="input-ctrl" />
            </div>

            <div class="form-row">
              <label>Ghi chú món:</label>
              <input type="text" formControlName="note" class="input-ctrl" />
            </div>

            <div class="form-row">
              <label>Thời gian nhận:</label>
              <select formControlName="desiredTime" class="input-ctrl">
                <option value="Nhận ngay">Nhận ngay (Trong vòng 15-20 phút)</option>
                <option value="Sau 30 phút">Sau 30 phút</option>
                <option value="Sau 1 tiếng">Sau 1 tiếng</option>
                <option value="Hẹn giờ theo yêu cầu">Hẹn giờ theo yêu cầu</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel-m" (click)="editingOrder.set(null)">Bỏ qua</button>
              <button type="submit" class="btn-save-m" [disabled]="editForm.invalid">Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </div>

      <!-- CANCEL CONFIRM DIALOG [FE-13] -->
      <app-confirm-dialog
        [isOpen]="cancelDialogOpen()"
        title="Xác nhận huỷ đơn hàng"
        message="Bạn có chắc chắn muốn huỷ đơn hàng này không? Sau khi huỷ, đơn hàng sẽ không thể phục hồi."
        confirmText="Huỷ đơn ngay"
        cancelText="Giữ lại đơn"
        type="danger"
        (confirmed)="confirmCancelOrder()"
        (cancelled)="cancelDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .orders-page {
      min-height: calc(100vh - 72px);
      background: #f2f0eb;
      padding: 36px 24px 60px;
    }
    .orders-container {
      max-width: 960px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .page-title {
      font-size: 26px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }
    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.58);
    }
    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 50px;
      background: #ffffff;
      border: 1px solid #edebe9;
      color: #00754a;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .order-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #edebe9;
      margin-bottom: 16px;
    }
    .order-id-group {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .order-id {
      font-size: 15px;
      font-weight: 800;
      color: #1e3932;
    }
    .order-date {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
    .order-body {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    @media (max-width: 600px) {
      .order-body {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    .recipe-thumb {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      object-fit: cover;
    }
    .item-info {
      flex: 1;
    }
    .item-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e3932;
      margin-bottom: 6px;
    }
    .item-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .item-note {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #00754a;
    }
    .item-note mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .order-price-col {
      text-align: right;
      display: flex;
      flex-direction: column;
    }
    .price-lbl {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.45);
    }
    .price-val {
      font-size: 18px;
      font-weight: 800;
      color: #006241;
    }
    .cancel-reason-box {
      display: flex;
      gap: 10px;
      background: #fde8e7;
      border: 1px solid #c82014;
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 16px;
      color: #c82014;
      font-size: 13px;
    }
    .cancel-reason-box mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .order-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #edebe9;
      flex-wrap: wrap;
      gap: 12px;
    }
    .pending-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #b4852e;
      font-weight: 600;
    }
    .pending-tip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .btn-actions-wrap {
      display: flex;
      gap: 10px;
    }
    .btn-edit, .btn-cancel-order {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-edit {
      background: #faf6ee;
      color: #1e3932;
      border: 1px solid #dfc49d;
    }
    .btn-edit:hover {
      background: #dfc49d;
    }
    .btn-cancel-order {
      background: #fde8e7;
      color: #c82014;
      border: 1px solid rgba(200, 32, 20, 0.2);
    }
    .btn-cancel-order:hover {
      background: #c82014;
      color: #ffffff;
    }
    .empty-orders {
      text-align: center;
      background: #ffffff;
      border-radius: 20px;
      padding: 60px 24px;
      border: 1px dashed #d6dbde;
      max-width: 500px;
      margin: 40px auto;
    }
    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #f2f0eb;
      color: #00754a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .btn-explore {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 28px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
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
    .modal-panel {
      background: #ffffff;
      border-radius: 20px;
      padding: 28px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-header h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1e3932;
    }
    .btn-close {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.4);
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-row label {
      font-size: 13px;
      font-weight: 700;
      color: #1e3932;
    }
    .input-ctrl {
      padding: 10px 14px;
      border: 1px solid #d6dbde;
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
    .btn-cancel-m, .btn-save-m {
      flex: 1;
      padding: 12px;
      border-radius: 50px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
    .btn-cancel-m {
      background: #edebe9;
      color: rgba(0, 0, 0, 0.87);
    }
    .btn-save-m {
      background: #00754a;
      color: #ffffff;
    }
  `],
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private sseService = inject(RealtimeSseService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);

  // Edit modal state
  editingOrder = signal<Order | null>(null);
  editForm = this.fb.group({
    portions: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    note: [''],
    desiredTime: ['Nhận ngay'],
  });

  // Cancel dialog state
  cancelDialogOpen = signal<boolean>(false);
  orderToCancel = signal<Order | null>(null);

  private sseSub?: Subscription;

  ngOnInit() {
    this.fetchOrders();

    // Listen to realtime SSE updates to refresh orders live [BE-18, US-11]
    this.sseSub = this.sseService.events$.subscribe((event) => {
      if (event.type === 'ORDER_STATUS_CHANGED') {
        this.fetchOrders(false);
      }
    });
  }

  ngOnDestroy() {
    this.sseSub?.unsubscribe();
  }

  fetchOrders(showLoading: boolean = true) {
    if (showLoading) this.loading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openEditModal(order: Order) {
    this.editingOrder.set(order);
    this.editForm.patchValue({
      portions: order.portions,
      note: order.note,
      desiredTime: order.desiredTime,
    });
  }

  onSaveEdit() {
    if (this.editForm.invalid || !this.editingOrder()) return;
    const { portions, note, desiredTime } = this.editForm.value;

    this.orderService
      .updateOrder(this.editingOrder()!.id, {
        portions: portions!,
        note: note || '',
        desiredTime: desiredTime || 'Nhận ngay',
      })
      .subscribe({
        next: () => {
          this.toast.success('Chỉnh sửa đơn hàng thành công');
          this.editingOrder.set(null);
          this.fetchOrders();
        },
      });
  }

  openCancelConfirm(order: Order) {
    this.orderToCancel.set(order);
    this.cancelDialogOpen.set(true);
  }

  confirmCancelOrder() {
    if (!this.orderToCancel()) return;
    const orderId = this.orderToCancel()!.id;

    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.toast.success('Đã huỷ đơn hàng');
        this.cancelDialogOpen.set(false);
        this.orderToCancel.set(null);
        this.fetchOrders();
      },
      error: () => {
        this.cancelDialogOpen.set(false);
      },
    });
  }
}
