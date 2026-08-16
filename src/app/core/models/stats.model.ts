export interface DashboardKPI {
  totalRevenue: number;
  totalOrders: number;
  totalRecipes: number;
  totalUsers: number;
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
  portionsSold: number;
  totalSales: number;
}

export interface DashboardStats {
  kpi: DashboardKPI;
  statusBreakdown: StatusBreakdown[];
  topRecipes: TopRecipeStat[];
}
