import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
            <p class="page-subtitle">Theo dõi quy trình pha chế, xem chi tiết công thức và quản lý trạng thái đơn hàng</p>
          </div>
          <button class="btn-refresh" (click)="fetchOrders()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon>
            Làm mới
          </button>
        </div>

        <!-- Filter Status Tabs -->
        <div class="status-tabs" *ngIf="orders().length > 0">
          <button
            *ngFor="let tab of filterTabs"
            class="tab-btn"
            [class.active]="selectedTab() === tab"
            (click)="selectTab(tab)"
          >
            {{ tab }}
            <span class="tab-count" *ngIf="getTabCount(tab) > 0">({{ getTabCount(tab) }})</span>
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-state">
          <mat-icon class="spin-icon">sync</mat-icon>
          <p>Đang tải danh sách đơn hàng...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && filteredOrders().length === 0" class="empty-orders">
          <div class="empty-icon">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <h3>Không có đơn hàng nào</h3>
          <p>Không có đơn đặt món nào trong mục này. Hãy khám phá thực đơn Starbucks ngay nhé!</p>
          <a routerLink="/menu" class="btn-explore">Khám phá thực đơn ngay</a>
        </div>

        <!-- Order List -->
        <div *ngIf="!loading() && filteredOrders().length > 0" class="orders-list">
          <div *ngFor="let order of filteredOrders()" class="order-card" (click)="openDetailModal(order)">
            <div class="order-header">
              <div class="order-id-group">
                <span class="order-id">Mã đơn: #{{ order.id.slice(-6).toUpperCase() }}</span>
                <span class="order-date">{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="header-right">
                <app-status-badge [status]="order.status"></app-status-badge>
              </div>
            </div>

            <!-- Order Item Details -->
            <div class="order-body">
              <img [src]="order.recipeSnapshot.imgUrl" [alt]="order.recipeSnapshot.name" class="recipe-thumb" />
              <div class="item-info">
                <div class="item-head">
                  <h4 class="item-name">{{ order.recipeSnapshot.name }}</h4>
                  <span class="item-category">{{ order.recipeSnapshot.category || 'Món nước' }}</span>
                </div>

                <div class="item-meta">
                  <span>Số lượng: <strong>{{ order.portions }} phần</strong></span>
                  <span>Đơn giá: {{ order.recipeSnapshot.giaCoBan | vndCurrency }}</span>
                  <span>Nhận món: <strong>{{ order.desiredTime }}</strong></span>
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

            <!-- Cancellation Reason Alert if Cancelled -->
            <div *ngIf="order.status === 'Bị huỷ'" class="cancel-reason-box">
              <mat-icon>error_outline</mat-icon>
              <div>
                <strong>Lý do huỷ đơn:</strong>
                <p>{{ order.cancelReason || 'Đơn hàng bị huỷ bởi hệ thống hoặc người dùng' }}</p>
              </div>
            </div>

            <!-- Order Actions Bar -->
            <div class="order-actions" (click)="$event.stopPropagation()">
              <div class="status-tip-wrap">
                <span class="status-hint pending-hint" *ngIf="order.status === 'Pending'">
                  <mat-icon>schedule</mat-icon>
                  Đơn đang chờ tiếp nhận. Bạn có thể chỉnh sửa hoặc huỷ đơn.
                </span>
                <span class="status-hint in-progress-hint" *ngIf="order.status === 'Đang làm'">
                  <mat-icon>local_fire_department</mat-icon>
                  Barista đang thực hiện pha chế theo công thức chuẩn.
                </span>
                <span class="status-hint completed-hint" *ngIf="order.status === 'Hoàn thành'">
                  <mat-icon>check_circle</mat-icon>
                  Đơn hàng đã hoàn thành. Sẵn sàng phục vụ!
                </span>
                <span class="status-hint cancelled-hint" *ngIf="order.status === 'Bị huỷ'">
                  <mat-icon>highlight_off</mat-icon>
                  Đơn hàng đã kết thúc (Đã huỷ).
                </span>
              </div>

              <div class="btn-actions-wrap">
                <!-- Nút Xem chi tiết (Mọi trạng thái đều có) -->
                <button type="button" class="btn-view-detail" (click)="openDetailModal(order)">
                  <mat-icon>visibility</mat-icon>
                  Chi tiết đơn
                </button>

                <!-- Thao tác Pending: Sửa & Huỷ -->
                <ng-container *ngIf="order.status === 'Pending'">
                  <button type="button" class="btn-edit" (click)="openEditModal(order)">
                    <mat-icon>edit</mat-icon>
                    Sửa
                  </button>
                  <button type="button" class="btn-cancel-order" (click)="openCancelConfirm(order)">
                    <mat-icon>cancel</mat-icon>
                    Huỷ
                  </button>
                </ng-container>

                <!-- Thao tác Hoàn thành hoặc Bị huỷ: Đặt lại món -->
                <button
                  type="button"
                  class="btn-reorder"
                  *ngIf="order.status === 'Hoàn thành' || order.status === 'Bị huỷ'"
                  (click)="reorder(order)"
                >
                  <mat-icon>replay</mat-icon>
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- COMPREHENSIVE ORDER DETAIL MODAL (MỌI TRẠNG THÁI ĐỀU XEM ĐƯỢC) -->
      <!-- ============================================================= -->
      <div class="modal-backdrop" *ngIf="viewingOrder()" (click)="closeDetailModal()">
        <div class="modal-card detail-modal-card" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-title-group">
              <h3>Chi tiết Đơn hàng #{{ viewingOrder()!.id.slice(-6).toUpperCase() }}</h3>
              <span class="modal-date">Đặt lúc: {{ viewingOrder()!.createdAt | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
            </div>
            <button class="btn-close" (click)="closeDetailModal()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="modal-scroll-body">
            <!-- 1. Progress Tracker / Timeline -->
            <div class="order-timeline-box">
              <div class="timeline-track">
                <!-- Step 1: Tiếp nhận -->
                <div
                  class="timeline-step"
                  [class.active]="viewingOrder()!.status === 'Pending' || viewingOrder()!.status === 'Đang làm' || viewingOrder()!.status === 'Hoàn thành'"
                  [class.current]="viewingOrder()!.status === 'Pending'"
                >
                  <div class="step-circle">
                    <mat-icon>assignment_turned_in</mat-icon>
                  </div>
                  <span class="step-label">Đã tiếp nhận</span>
                </div>

                <div
                  class="step-line"
                  [class.filled]="viewingOrder()!.status === 'Đang làm' || viewingOrder()!.status === 'Hoàn thành'"
                  *ngIf="viewingOrder()!.status !== 'Bị huỷ'"
                ></div>

                <!-- Step 2: Pha chế -->
                <div
                  class="timeline-step"
                  *ngIf="viewingOrder()!.status !== 'Bị huỷ'"
                  [class.active]="viewingOrder()!.status === 'Đang làm' || viewingOrder()!.status === 'Hoàn thành'"
                  [class.current]="viewingOrder()!.status === 'Đang làm'"
                >
                  <div class="step-circle">
                    <mat-icon>coffee_maker</mat-icon>
                  </div>
                  <span class="step-label">Đang pha chế</span>
                </div>

                <div
                  class="step-line"
                  [class.filled]="viewingOrder()!.status === 'Hoàn thành'"
                  *ngIf="viewingOrder()!.status !== 'Bị huỷ'"
                ></div>

                <!-- Step 3: Hoàn thành -->
                <div
                  class="timeline-step"
                  *ngIf="viewingOrder()!.status !== 'Bị huỷ'"
                  [class.active]="viewingOrder()!.status === 'Hoàn thành'"
                  [class.current]="viewingOrder()!.status === 'Hoàn thành'"
                >
                  <div class="step-circle">
                    <mat-icon>task_alt</mat-icon>
                  </div>
                  <span class="step-label">Hoàn thành</span>
                </div>

                <!-- Cancelled Step -->
                <div class="timeline-step step-cancelled" *ngIf="viewingOrder()!.status === 'Bị huỷ'">
                  <div class="step-circle cancel-circle">
                    <mat-icon>cancel</mat-icon>
                  </div>
                  <span class="step-label cancel-lbl">Đã huỷ đơn</span>
                </div>
              </div>
            </div>

            <!-- Cancel alert in detail if cancelled -->
            <div class="detail-cancel-alert" *ngIf="viewingOrder()!.status === 'Bị huỷ'">
              <mat-icon>warning</mat-icon>
              <div>
                <strong>Đơn hàng đã bị huỷ</strong>
                <p>Lý do: {{ viewingOrder()!.cancelReason || 'Huỷ bởi hệ thống / khách hàng' }}</p>
              </div>
            </div>

            <!-- 2. Recipe & Item Details Card -->
            <div class="detail-item-card">
              <img [src]="viewingOrder()!.recipeSnapshot.imgUrl" [alt]="viewingOrder()!.recipeSnapshot.name" class="detail-img" />
              <div class="detail-info">
                <div class="detail-tag-row">
                  <span class="detail-cat">{{ viewingOrder()!.recipeSnapshot.category || 'Món đặc biệt' }}</span>
                  <app-status-badge [status]="viewingOrder()!.status"></app-status-badge>
                </div>
                <h2 class="detail-recipe-name">{{ viewingOrder()!.recipeSnapshot.name }}</h2>
                <p class="detail-recipe-desc" *ngIf="viewingOrder()!.recipeSnapshot.description">
                  {{ viewingOrder()!.recipeSnapshot.description }}
                </p>
              </div>
            </div>

            <!-- 3. Formula & Ingredients Breakdown (Scaled by portions) -->
            <div
              class="recipe-formula-box"
              *ngIf="viewingOrder()!.recipeSnapshot.toppings && (viewingOrder()!.recipeSnapshot.toppings)!.length > 0"
            >
              <h4 class="box-subtitle">
                <mat-icon>format_list_bulleted</mat-icon>
                Định lượng thành phần & Topping (Tính theo {{ viewingOrder()!.portions }} phần)
              </h4>
              <div class="formula-list">
                <div *ngFor="let t of viewingOrder()!.recipeSnapshot.toppings!" class="formula-item">
                  <span class="t-name">• {{ t.name }}</span>
                  <span class="t-qty">{{ t.quantity * viewingOrder()!.portions }} {{ t.unit }}</span>
                </div>
              </div>
            </div>

            <!-- 4. Order Specifics (Portions, Note, Delivery Time) -->
            <div class="order-specs-grid">
              <div class="spec-item">
                <span class="spec-lbl">Khẩu phần đặt:</span>
                <strong class="spec-val">{{ viewingOrder()!.portions }} phần</strong>
              </div>
              <div class="spec-item">
                <span class="spec-lbl">Đơn giá cơ bản:</span>
                <strong class="spec-val">{{ viewingOrder()!.recipeSnapshot.giaCoBan | vndCurrency }}</strong>
              </div>
              <div class="spec-item">
                <span class="spec-lbl">Thời gian nhận:</span>
                <strong class="spec-val">{{ viewingOrder()!.desiredTime }}</strong>
              </div>
              <div class="spec-item">
                <span class="spec-lbl">Tổng thanh toán:</span>
                <strong class="spec-val price-highlight">{{ viewingOrder()!.totalPrice | vndCurrency }}</strong>
              </div>
            </div>

            <div class="detail-note-box">
              <span class="spec-lbl">Ghi chú yêu cầu:</span>
              <p class="note-content">{{ viewingOrder()!.note || 'Không có ghi chú thêm cho món này.' }}</p>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="modal-footer">
            <!-- Pending Actions -->
            <div class="footer-btn-group" *ngIf="viewingOrder()!.status === 'Pending'">
              <button type="button" class="btn-danger-outline" (click)="openCancelConfirmFromDetail()">
                <mat-icon>cancel</mat-icon>
                Huỷ đơn này
              </button>
              <button type="button" class="btn-primary-m" (click)="openEditModalFromDetail()">
                <mat-icon>edit</mat-icon>
                Chỉnh sửa số phần & ghi chú
              </button>
            </div>

            <!-- In-progress notice -->
            <div class="footer-notice" *ngIf="viewingOrder()!.status === 'Đang làm'">
              <mat-icon>info</mat-icon>
              <span>Đơn hàng đang trong quá trình pha chế. Nếu bạn cần điều chỉnh, vui lòng liên hệ trực tiếp quầy phục vụ.</span>
            </div>

            <!-- Completed & Cancelled Actions -->
            <div class="footer-btn-group" *ngIf="viewingOrder()!.status === 'Hoàn thành' || viewingOrder()!.status === 'Bị huỷ'">
              <button type="button" class="btn-close-secondary" (click)="closeDetailModal()">Đóng</button>
              <button type="button" class="btn-primary-m" (click)="reorder(viewingOrder()!)">
                <mat-icon>shopping_bag</mat-icon>
                Đặt lại món này
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- EDIT ORDER MODAL -->
      <!-- ============================================================= -->
      <div class="modal-backdrop" *ngIf="editingOrder()">
        <div class="modal-card edit-modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Chỉnh sửa đơn hàng #{{ editingOrder()!.id.slice(-6).toUpperCase() }}</h3>
            <button class="btn-close" (click)="editingOrder.set(null)">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="editForm" (ngSubmit)="onSaveEdit()" class="modal-scroll-body edit-form">
            <div class="form-row">
              <label>Khẩu phần (1 - 20 phần): <span class="req-star">*</span></label>
              <input type="number" formControlName="portions" min="1" max="20" class="input-ctrl" />
              <span class="field-hint">Giá mới dự kiến: {{ calculatedEditTotal() | vndCurrency }}</span>
            </div>

            <div class="form-row">
              <label>Thời gian nhận món:</label>
              <input type="text" formControlName="desiredTime" placeholder="Ví dụ: Nhận ngay, 15 phút nữa..." class="input-ctrl" />
            </div>

            <div class="form-row">
              <label>Ghi chú món ăn:</label>
              <textarea formControlName="note" rows="3" placeholder="Ví dụ: Ít ngọt, nhiều đá..." class="input-ctrl textarea-ctrl"></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel-m" (click)="editingOrder.set(null)">Hủy bỏ</button>
              <button type="submit" class="btn-save-m" [disabled]="editForm.invalid">Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </div>

      <!-- CANCEL CONFIRM DIALOG -->
      <app-confirm-dialog
        [isOpen]="cancelDialogOpen()"
        title="Xác nhận huỷ đơn hàng?"
        [message]="'Bạn có chắc chắn muốn huỷ đơn hàng #' + (orderToCancel()?.id?.slice(-6)?.toUpperCase() || '') + '? Hành động này không thể hoàn tác.'"
        confirmText="Xác nhận huỷ đơn"
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
      padding: 36px 24px 80px;
    }
    .orders-container {
      max-width: 960px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
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
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 50px;
      border: 1px solid #d6dbde;
      background: #ffffff;
      color: #1e3932;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-refresh:hover:not(:disabled) {
      background: #edebe9;
      color: #00754a;
    }
    .status-tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 6px;
      margin-bottom: 24px;
    }
    .tab-btn {
      padding: 8px 18px;
      border-radius: 50px;
      border: 1px solid #edebe9;
      background: #ffffff;
      color: rgba(0, 0, 0, 0.7);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: #edebe9;
    }
    .tab-btn.active {
      background: #00754a;
      color: #ffffff;
      border-color: #00754a;
      box-shadow: 0 2px 8px rgba(0, 117, 74, 0.25);
    }
    .tab-count {
      font-size: 12px;
      opacity: 0.85;
      margin-left: 2px;
    }
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 60px 0;
      color: rgba(0, 0, 0, 0.55);
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
    .empty-orders {
      text-align: center;
      padding: 60px 24px;
      background: #ffffff;
      border-radius: 20px;
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
    .empty-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .empty-orders h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1e3932;
      margin-bottom: 8px;
    }
    .empty-orders p {
      font-size: 13.5px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 20px;
    }
    .btn-explore {
      display: inline-block;
      padding: 10px 24px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0, 117, 74, 0.3);
    }
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .order-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
      display: flex;
      flex-direction: column;
      gap: 16px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    .order-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
      border-color: #dfc49d;
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f2f0eb;
      padding-bottom: 14px;
    }
    .order-id-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .order-id {
      font-weight: 800;
      color: #1e3932;
      font-size: 14.5px;
      letter-spacing: 0.02em;
    }
    .order-date {
      font-size: 12.5px;
      color: rgba(0, 0, 0, 0.5);
    }
    .order-body {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .recipe-thumb {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid #edebe9;
    }
    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .item-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .item-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e3932;
      margin: 0;
    }
    .item-category {
      font-size: 11px;
      font-weight: 700;
      color: #00754a;
      background: #d4e9e2;
      padding: 2px 8px;
      border-radius: 50px;
    }
    .item-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
    }
    .item-note {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #b4852e;
      margin: 2px 0 0;
    }
    .item-note mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }
    .order-price-col {
      text-align: right;
      flex-shrink: 0;
    }
    .price-lbl {
      display: block;
      font-size: 11.5px;
      color: rgba(0, 0, 0, 0.5);
      margin-bottom: 2px;
    }
    .price-val {
      font-size: 17px;
      font-weight: 800;
      color: #00754a;
    }
    .cancel-reason-box {
      display: flex;
      gap: 10px;
      padding: 10px 14px;
      background: #fde8e7;
      border-radius: 10px;
      border: 1px solid #c82014;
      color: #c82014;
      font-size: 12.5px;
    }
    .cancel-reason-box mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    .cancel-reason-box p {
      margin: 2px 0 0;
      line-height: 1.35;
    }
    .order-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      border-top: 1px solid #f2f0eb;
      padding-top: 14px;
    }
    .status-tip-wrap {
      flex: 1;
    }
    .status-hint {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-hint mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .pending-hint { color: #b4852e; }
    .in-progress-hint { color: #00754a; }
    .completed-hint { color: #1e3932; }
    .cancelled-hint { color: #888888; }
    .btn-actions-wrap {
      display: flex;
      gap: 8px;
    }
    .btn-view-detail {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 50px;
      background: #faf6ee;
      border: 1px solid #cba258;
      color: #b4852e;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-view-detail:hover {
      background: #cba258;
      color: #ffffff;
    }
    .btn-view-detail mat-icon, .btn-edit mat-icon, .btn-cancel-order mat-icon, .btn-reorder mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }
    .btn-edit {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-edit:hover {
      background: #005c3b;
    }
    .btn-cancel-order {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 50px;
      background: #fffafa;
      color: #c82014;
      border: 1px solid #c82014;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-cancel-order:hover {
      background: #c82014;
      color: #ffffff;
    }
    .btn-reorder {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 50px;
      background: #1e3932;
      color: #ffffff;
      border: none;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-reorder:hover {
      background: #13241f;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1200;
      padding: 20px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      animation: modalSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .detail-modal-card {
      max-width: 640px;
    }
    @keyframes modalSlide {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid #edebe9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-title-group h3 {
      font-size: 18px;
      font-weight: 800;
      color: #1e3932;
      margin: 0 0 2px;
    }
    .modal-date {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
    }
    .btn-close {
      background: none;
      border: none;
      color: rgba(0, 0, 0, 0.5);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s;
    }
    .btn-close:hover {
      background: #edebe9;
      color: #1e3932;
    }
    .modal-scroll-body {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Timeline Tracker */
    .order-timeline-box {
      background: #faf6ee;
      border: 1px solid #edebe9;
      border-radius: 14px;
      padding: 16px 20px;
    }
    .timeline-track {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      opacity: 0.45;
      transition: all 0.3s;
    }
    .timeline-step.active {
      opacity: 1;
    }
    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #edebe9;
      color: #1e3932;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }
    .timeline-step.active .step-circle {
      background: #00754a;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 117, 74, 0.3);
    }
    .timeline-step.current .step-circle {
      background: #cba258;
      color: #ffffff;
      transform: scale(1.1);
    }
    .step-label {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e3932;
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: #edebe9;
      margin: 0 8px -18px;
    }
    .step-line.filled {
      background: #00754a;
    }
    .cancel-circle {
      background: #c82014 !important;
      color: #ffffff !important;
    }
    .cancel-lbl {
      color: #c82014 !important;
    }
    .detail-cancel-alert {
      display: flex;
      gap: 10px;
      background: #fde8e7;
      border: 1px solid #c82014;
      border-radius: 12px;
      padding: 12px 16px;
      color: #c82014;
      font-size: 13px;
    }
    .detail-cancel-alert mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .detail-cancel-alert p {
      margin: 2px 0 0;
    }

    /* Detail Item Card */
    .detail-item-card {
      display: flex;
      gap: 16px;
      background: #f2f0eb;
      border-radius: 14px;
      padding: 16px;
    }
    .detail-img {
      width: 90px;
      height: 90px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .detail-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-tag-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-cat {
      font-size: 11px;
      font-weight: 700;
      color: #00754a;
      background: #ffffff;
      padding: 2px 8px;
      border-radius: 50px;
    }
    .detail-recipe-name {
      font-size: 17px;
      font-weight: 800;
      color: #1e3932;
      margin: 2px 0;
    }
    .detail-recipe-desc {
      font-size: 12.5px;
      color: rgba(0, 0, 0, 0.65);
      line-height: 1.4;
      margin: 0;
    }

    /* Formula */
    .recipe-formula-box {
      background: #ffffff;
      border: 1px solid #edebe9;
      border-radius: 14px;
      padding: 16px;
    }
    .box-subtitle {
      font-size: 13px;
      font-weight: 700;
      color: #1e3932;
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 12px;
    }
    .box-subtitle mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #00754a;
    }
    .formula-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }
    .formula-item {
      display: flex;
      justify-content: space-between;
      background: #faf6ee;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12.5px;
    }
    .t-name {
      font-weight: 600;
      color: #1e3932;
    }
    .t-qty {
      font-weight: 700;
      color: #00754a;
    }

    /* Order Specs */
    .order-specs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #faf6ee;
      border-radius: 14px;
      padding: 16px;
    }
    .spec-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .spec-lbl {
      font-size: 11.5px;
      color: rgba(0, 0, 0, 0.55);
      font-weight: 600;
    }
    .spec-val {
      font-size: 14px;
      color: #1e3932;
    }
    .price-highlight {
      font-size: 17px;
      color: #00754a;
    }
    .detail-note-box {
      background: #f2f0eb;
      border-radius: 12px;
      padding: 12px 16px;
    }
    .note-content {
      font-size: 13px;
      color: #1e3932;
      font-style: italic;
      margin: 4px 0 0;
    }

    /* Modal Footer */
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #edebe9;
      background: #faf6ee;
    }
    .footer-btn-group {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .footer-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(0, 0, 0, 0.65);
      font-size: 12.5px;
    }
    .footer-notice mat-icon {
      color: #00754a;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .btn-danger-outline {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 50px;
      background: #ffffff;
      border: 1px solid #c82014;
      color: #c82014;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-danger-outline:hover {
      background: #c82014;
      color: #ffffff;
    }
    .btn-primary-m {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 22px;
      border-radius: 50px;
      background: #00754a;
      border: none;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-primary-m:hover {
      background: #005c3b;
    }
    .btn-close-secondary {
      padding: 10px 20px;
      border-radius: 50px;
      background: #edebe9;
      border: none;
      color: #1e3932;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Edit Form Controls */
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
    .req-star {
      color: #c82014;
    }
    .input-ctrl {
      padding: 10px 14px;
      border: 1.5px solid #d6dbde;
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    .input-ctrl:focus {
      border-color: #00754a;
    }
    .textarea-ctrl {
      resize: vertical;
    }
    .field-hint {
      font-size: 12px;
      color: #00754a;
      font-weight: 700;
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
      font-size: 13.5px;
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
    .btn-save-m:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private sseService = inject(RealtimeSseService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);

  // Filter Tabs
  filterTabs = ['Tất cả', 'Chờ tiếp nhận', 'Đang làm', 'Hoàn thành', 'Bị huỷ'];
  selectedTab = signal<string>('Tất cả');

  // Detail modal state (Xem chi tiết mọi trạng thái)
  viewingOrder = signal<Order | null>(null);

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

    // Listen to realtime SSE updates to refresh orders live
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

        // Update viewing order if currently open
        if (this.viewingOrder()) {
          const updated = data.find((o) => o.id === this.viewingOrder()!.id);
          if (updated) {
            this.viewingOrder.set(updated);
          }
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  selectTab(tab: string) {
    this.selectedTab.set(tab);
  }

  getTabCount(tab: string): number {
    if (tab === 'Tất cả') return this.orders().length;
    if (tab === 'Chờ tiếp nhận') return this.orders().filter((o) => o.status === 'Pending').length;
    if (tab === 'Đang làm') return this.orders().filter((o) => o.status === 'Đang làm').length;
    if (tab === 'Hoàn thành') return this.orders().filter((o) => o.status === 'Hoàn thành').length;
    if (tab === 'Bị huỷ') return this.orders().filter((o) => o.status === 'Bị huỷ').length;
    return 0;
  }

  filteredOrders(): Order[] {
    const tab = this.selectedTab();
    if (tab === 'Chờ tiếp nhận') return this.orders().filter((o) => o.status === 'Pending');
    if (tab === 'Đang làm') return this.orders().filter((o) => o.status === 'Đang làm');
    if (tab === 'Hoàn thành') return this.orders().filter((o) => o.status === 'Hoàn thành');
    if (tab === 'Bị huỷ') return this.orders().filter((o) => o.status === 'Bị huỷ');
    return this.orders();
  }

  openDetailModal(order: Order) {
    this.viewingOrder.set(order);
  }

  closeDetailModal() {
    this.viewingOrder.set(null);
  }

  openEditModal(order: Order) {
    this.editingOrder.set(order);
    this.editForm.patchValue({
      portions: order.portions,
      note: order.note,
      desiredTime: order.desiredTime,
    });
  }

  openEditModalFromDetail() {
    if (this.viewingOrder()) {
      const ord = this.viewingOrder()!;
      this.closeDetailModal();
      this.openEditModal(ord);
    }
  }

  openCancelConfirm(order: Order) {
    this.orderToCancel.set(order);
    this.cancelDialogOpen.set(true);
  }

  openCancelConfirmFromDetail() {
    if (this.viewingOrder()) {
      const ord = this.viewingOrder()!;
      this.closeDetailModal();
      this.openCancelConfirm(ord);
    }
  }

  calculatedEditTotal(): number {
    if (!this.editingOrder()) return 0;
    const portions = this.editForm.get('portions')?.value || 1;
    return this.editingOrder()!.recipeSnapshot.giaCoBan * portions;
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

  confirmCancelOrder() {
    if (!this.orderToCancel()) return;
    const orderId = this.orderToCancel()!.id;

    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.toast.success('Đã huỷ đơn hàng thành công');
        this.cancelDialogOpen.set(false);
        this.orderToCancel.set(null);
        this.fetchOrders();
      },
      error: () => {
        this.cancelDialogOpen.set(false);
      },
    });
  }

  reorder(order: Order) {
    this.closeDetailModal();
    this.router.navigate(['/recipe', order.recipeId]);
  }
}
