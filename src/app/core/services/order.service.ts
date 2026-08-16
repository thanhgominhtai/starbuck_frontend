import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, CreateOrderDto, UpdateOrderDto, OrderStatus } from '../models/order.model';

const API_BASE = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);

  createOrder(dto: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(`${API_BASE}/orders`, dto);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_BASE}/orders/my-orders`);
  }

  updateOrder(orderId: string, dto: UpdateOrderDto): Observable<Order> {
    return this.http.patch<Order>(`${API_BASE}/orders/${orderId}`, dto);
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.http.delete<Order>(`${API_BASE}/orders/${orderId}/cancel`);
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
    return this.http.get<Order[]>(`${API_BASE}/orders/admin/all`, { params });
  }

  updateOrderStatus(orderId: string, status: OrderStatus, cancelReason?: string): Observable<Order> {
    return this.http.patch<Order>(`${API_BASE}/orders/admin/${orderId}/status`, {
      status,
      cancelReason,
    });
  }
}
