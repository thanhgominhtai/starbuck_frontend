import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order, CreateOrderDto, UpdateOrderDto, OrderStatus } from '../models/order.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);

  private normalizeOrder(order: Order): Order {
    if (!order) return order;
    if (order.recipeSnapshot?.imgUrl && order.recipeSnapshot.imgUrl.startsWith('/uploads/')) {
      const apiBase = API_BASE.replace(/\/+$/, '');
      return {
        ...order,
        recipeSnapshot: {
          ...order.recipeSnapshot,
          imgUrl: `${apiBase}${order.recipeSnapshot.imgUrl}`,
        },
      };
    }
    return order;
  }

  createOrder(dto: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(`${API_BASE}/orders`, dto).pipe(map((o) => this.normalizeOrder(o)));
  }

  getMyOrders(): Observable<Order[]> {
    return this.http
      .get<Order[]>(`${API_BASE}/orders/my-orders`)
      .pipe(map((orders) => orders.map((o) => this.normalizeOrder(o))));
  }

  updateOrder(orderId: string, dto: UpdateOrderDto): Observable<Order> {
    return this.http
      .patch<Order>(`${API_BASE}/orders/${orderId}`, dto)
      .pipe(map((o) => this.normalizeOrder(o)));
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.http
      .delete<Order>(`${API_BASE}/orders/${orderId}/cancel`)
      .pipe(map((o) => this.normalizeOrder(o)));
  }

  // Admin APIs
  getAdminOrders(status?: string, keyword?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (status && status.trim() && status !== 'Tất cả') {
      params = params.set('status', status.trim());
    }
    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    return this.http
      .get<Order[]>(`${API_BASE}/orders/admin/all`, { params })
      .pipe(map((orders) => orders.map((o) => this.normalizeOrder(o))));
  }

  updateOrderStatus(orderId: string, status: OrderStatus, cancelReason?: string): Observable<Order> {
    return this.http
      .patch<Order>(`${API_BASE}/orders/admin/${orderId}/status`, {
        status,
        cancelReason,
      })
      .pipe(map((o) => this.normalizeOrder(o)));
  }
}
