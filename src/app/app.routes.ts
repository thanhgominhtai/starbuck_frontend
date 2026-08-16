import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';
import { antiTraversalGuard } from './core/guards/anti-traversal.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'menu',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'menu',
    canActivate: [authGuard, antiTraversalGuard],
    loadComponent: () =>
      import('./features/user/recipe-catalog/recipe-catalog.component').then(
        (m) => m.RecipeCatalogComponent,
      ),
  },
  {
    path: 'recipe/:id',
    canActivate: [authGuard, antiTraversalGuard],
    loadComponent: () =>
      import('./features/user/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
  {
    path: 'my-orders',
    canActivate: [authGuard, antiTraversalGuard],
    loadComponent: () =>
      import('./features/user/my-orders/my-orders.component').then(
        (m) => m.MyOrdersComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard, antiTraversalGuard],
    loadComponent: () =>
      import('./features/user/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard, antiTraversalGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/order-manager/order-manager.component').then(
            (m) => m.AdminOrderManagerComponent,
          ),
      },
      {
        path: 'recipes',
        loadComponent: () =>
          import('./features/admin/recipe-manager/recipe-manager.component').then(
            (m) => m.AdminRecipeManagerComponent,
          ),
      },
      {
        path: 'admins',
        loadComponent: () =>
          import('./features/admin/admin-manager/admin-manager.component').then(
            (m) => m.AdminManagerComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'menu',
  },
];
