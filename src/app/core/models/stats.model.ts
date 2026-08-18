export interface DashboardKPI {
  totalRevenue: number;
  totalOrders: number;
  totalRecipes: number;
  totalUsers: number;
  newUsersCount?: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface TopRecipeStat {
  name: string;
  category?: string;
  portionsSold: number;
  totalSales: number;
}

export interface TimelineStat {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategoryStat {
  category: string;
  revenue: number;
  portions: number;
}

export interface PeakHourStat {
  hour: number;
  count: number;
}

export interface TopCustomerStat {
  email: string;
  name: string;
  totalSpent: number;
  orderCount: number;
}

export interface ToppingStat {
  name: string;
  count: number;
}

export interface DashboardStats {
  kpi: DashboardKPI;
  statusBreakdown: StatusBreakdown[];
  topRecipes: TopRecipeStat[];
  timeline: TimelineStat[];
  categories: CategoryStat[];
  peakHours: PeakHourStat[];
  topCustomers: TopCustomerStat[];
  topToppings: ToppingStat[];
}
