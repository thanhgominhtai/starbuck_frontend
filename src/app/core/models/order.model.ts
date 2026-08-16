export type OrderStatus = 'Pending' | 'Đang làm' | 'Hoàn thành' | 'Bị huỷ';

export interface OrderRecipeSnapshot {
  name: string;
  giaCoBan: number;
  imgUrl: string;
  category?: string;
  description?: string;
  toppings?: Array<{ name: string; quantity: number; unit: string }>;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  recipeId: string;
  recipeSnapshot: OrderRecipeSnapshot;
  portions: number;
  note: string;
  desiredTime: string;
  totalPrice: number;
  status: OrderStatus;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  recipeId: string;
  portions: number;
  note?: string;
  desiredTime?: string;
}

export interface UpdateOrderDto {
  portions?: number;
  note?: string;
  desiredTime?: string;
}
