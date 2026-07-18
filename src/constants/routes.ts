/**
 * Centralized route path constants, matching the route tree approved in
 * FRONTEND-ARCHITECTURE.md §2/§10. No page exists at most of these paths
 * yet — this file exists so later feature phases reference one shared path
 * definition instead of hardcoding route strings at each call site, and so
 * a future path rename touches one file, not every `<Link href>` in the app.
 */
export const routes = {
  login: "/login",
  dashboard: "/",
  customers: {
    list: "/customers",
    new: "/customers/new",
    edit: (customerId: string) => `/customers/${customerId}/edit`,
  },
  products: {
    list: "/products",
    new: "/products/new",
    details: (productId: string) => `/products/${productId}`,
    edit: (productId: string) => `/products/${productId}/edit`,
  },
  orders: {
    list: "/orders",
    new: "/orders/new",
    details: (orderId: string) => `/orders/${orderId}`,
    payment: (orderId: string) => `/orders/${orderId}/payment`,
    invoice: (orderId: string) => `/orders/${orderId}/invoice`,
  },
  settings: {
    company: "/settings",
    notifications: "/settings/notifications",
  },
  users: "/users",
  utilities: {
    list: "/utilities",
    xpsToPdf: "/utilities/xps-to-pdf",
  },
} as const;
