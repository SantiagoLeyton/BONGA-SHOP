import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home-page.component').then((m) => m.HomePageComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products-page.component').then((m) => m.ProductsPageComponent),
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('./features/product-detail/product-detail-page.component').then(
            (m) => m.ProductDetailPageComponent,
          ),
      },
      {
        path: 'wishlist',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/wishlist/wishlist-page.component').then((m) => m.WishlistPageComponent),
      },
      {
        path: 'cart',
        canActivate: [authGuard],
        loadComponent: () => import('./features/cart/cart-page.component').then((m) => m.CartPageComponent),
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/checkout-page.component').then((m) => m.CheckoutPageComponent),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/orders/orders-page.component').then((m) => m.OrdersPageComponent),
      },
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/account-page.component').then((m) => m.AccountPageComponent),
      },
      {
        path: 'restablecer',
        loadComponent: () =>
          import('./features/auth/reset-password-page.component').then(
            (m) => m.ResetPasswordPageComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin-shell/admin-shell.component').then((m) => m.AdminShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'resumen' },
          {
            path: 'resumen',
            loadComponent: () =>
              import('./features/admin-shell/pages/admin-overview-page.component').then(
                (m) => m.AdminOverviewPageComponent,
              ),
          },
          {
            path: 'productos',
            loadComponent: () =>
              import('./features/admin-shell/pages/admin-products-page.component').then(
                (m) => m.AdminProductsPageComponent,
              ),
          },
          {
            path: 'marcas',
            loadComponent: () =>
              import('./features/admin-shell/pages/admin-brands-page.component').then(
                (m) => m.AdminBrandsPageComponent,
              ),
          },
          {
            path: 'inventario',
            loadComponent: () =>
              import('./features/admin-shell/pages/admin-inventory-page.component').then(
                (m) => m.AdminInventoryPageComponent,
              ),
          },
          {
            path: 'pedidos',
            loadComponent: () =>
              import('./features/admin-shell/pages/admin-orders-page.component').then(
                (m) => m.AdminOrdersPageComponent,
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
