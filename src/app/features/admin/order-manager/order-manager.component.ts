import { Component, OnInit, inject, signal, OnDestroy, HostListener } from '@angular/core';
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
  templateUrl: './order-manager.component.html',
  styleUrl: './order-manager.component.css',
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

  // Custom dropdown status menu state
  activeDropdownOrderId = signal<string | null>(null);
  activeDropdownOrder = signal<Order | null>(null);
  dropdownStyle = signal<{ top: string; left: string }>({ top: '0px', left: '0px' });

  // Custom filter dropdown menu state
  filterDropdownOpen = signal<boolean>(false);
  filterDropdownStyle = signal<{ top: string; left: string }>({ top: '0px', left: '0px' });

  filterOptions = [
    { label: 'Tất cả trạng thái', value: 'Tất cả', icon: 'all_inclusive', slug: 'all' },
    { label: '⏳ Chờ tiếp nhận (Pending)', value: 'Pending', icon: 'hourglass_top', slug: 'pending' },
    { label: '☕ Đang làm', value: 'Đang làm', icon: 'local_cafe', slug: 'preparing' },
    { label: '✅ Hoàn thành', value: 'Hoàn thành', icon: 'check_circle', slug: 'completed' },
    { label: '❌ Bị huỷ', value: 'Bị huỷ', icon: 'cancel', slug: 'cancelled' },
  ];

  statusOptions: { label: string; value: OrderStatus; icon: string; slug: string }[] = [
    { label: 'Chờ tiếp nhận', value: 'Pending', icon: 'hourglass_top', slug: 'pending' },
    { label: 'Đang làm', value: 'Đang làm', icon: 'local_cafe', slug: 'preparing' },
    { label: 'Hoàn thành', value: 'Hoàn thành', icon: 'check_circle', slug: 'completed' },
    { label: 'Bị huỷ', value: 'Bị huỷ', icon: 'cancel', slug: 'cancelled' },
  ];

  @HostListener('document:click')
  onDocumentClick() {
    this.closeDropdown();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.activeDropdownOrderId() || this.filterDropdownOpen()) {
      this.closeDropdown();
    }
  }

  closeDropdown() {
    this.activeDropdownOrderId.set(null);
    this.activeDropdownOrder.set(null);
    this.filterDropdownOpen.set(false);
  }

  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.activeDropdownOrderId.set(null);
    this.activeDropdownOrder.set(null);

    if (this.filterDropdownOpen()) {
      this.filterDropdownOpen.set(false);
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuHeight = 230;
    const menuWidth = 235;

    // Check if space below is enough, else open upward
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 6;
    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      top = rect.top - menuHeight - 6;
    }

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 16) {
      left = window.innerWidth - menuWidth - 16;
    }
    if (left < 16) left = 16;

    this.filterDropdownStyle.set({
      top: `${top}px`,
      left: `${left}px`,
    });
    this.filterDropdownOpen.set(true);
  }

  selectFilter(val: string, event: MouseEvent) {
    event.stopPropagation();
    this.statusFilter.setValue(val);
    this.filterDropdownOpen.set(false);
  }

  getFilterLabel(): string {
    const val = this.statusFilter.value || 'Tất cả';
    const found = this.filterOptions.find((o) => o.value === val);
    return found ? found.label : 'Tất cả trạng thái';
  }

  toggleStatusDropdown(order: Order, event: MouseEvent) {
    event.stopPropagation();
    this.filterDropdownOpen.set(false);

    if (this.activeDropdownOrderId() === order.id) {
      this.closeDropdown();
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuHeight = 195;
    const menuWidth = 195;

    // Check if space below is enough, else open upward
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = rect.bottom + 6;
    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      top = rect.top - menuHeight - 6;
    }

    // Ensure left does not overflow viewport width
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 16) {
      left = window.innerWidth - menuWidth - 16;
    }
    if (left < 16) left = 16;

    this.dropdownStyle.set({
      top: `${top}px`,
      left: `${left}px`,
    });
    this.activeDropdownOrderId.set(order.id);
    this.activeDropdownOrder.set(order);
  }

  selectStatus(order: Order, newStatus: OrderStatus, event: MouseEvent) {
    event.stopPropagation();
    this.closeDropdown();

    if (order.status === newStatus) return;

    if (newStatus === 'Bị huỷ') {
      this.targetOrderForCancel.set(order);
      this.cancelForm.reset();
      this.cancelModalOpen.set(true);
      return;
    }

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        this.toast.success(`Đã cập nhật trạng thái đơn #${order.id.slice(-6).toUpperCase()} sang "${newStatus}"`);
        this.fetchOrders();
      },
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Chờ tiếp nhận';
      case 'Đang làm':
        return 'Đang làm';
      case 'Hoàn thành':
        return 'Hoàn thành';
      case 'Bị huỷ':
        return 'Bị huỷ';
      default:
        return status;
    }
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
