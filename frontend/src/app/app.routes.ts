import { Routes } from '@angular/router';

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
        loadComponent: () =>
          import('./features/wishlist/wishlist-page.component').then((m) => m.WishlistPageComponent),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart-page.component').then((m) => m.CartPageComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout-page.component').then((m) => m.CheckoutPageComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders-page.component').then((m) => m.OrdersPageComponent),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin-shell/admin-dashboard-page.component').then(
            (m) => m.AdminDashboardPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
