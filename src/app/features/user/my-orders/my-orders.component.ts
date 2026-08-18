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
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css',
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
