import axios from "axios";
import type {
  Category,
  DailySale,
  LedgerEntry,
  LowStockItem,
  PaymentBreakdown,
  Product,
  Purchase,
  ReportSummary,
  Sale,
  SalesReturn,
  Supplier,
  TopProduct,
  User,
} from "./types";

const TOKEN_KEY = "pos_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? "";
    if (error?.response?.status === 401 && !url.includes("/auth/login")) {
      tokenStore.clear();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return error.message;
  }
  return "Something went wrong";
}

// ---- Auth ----
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ access_token: string; token_type: string; user: User }>("/auth/login", { username, password }).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.post("/auth/change-password", { current_password, new_password }).then((r) => r.data),
};

// ---- Users ----
export const usersApi = {
  list: (params?: { role?: string; search?: string }) => api.get<User[]>("/users", { params }).then((r) => r.data),
  create: (data: Partial<User> & { password: string }) => api.post<User>("/users", data).then((r) => r.data),
  update: (id: string, data: Partial<User> & { password?: string }) => api.put<User>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};

// ---- Categories ----
export const categoriesApi = {
  list: () => api.get<Category[]>("/categories").then((r) => r.data),
  create: (data: { name: string; description?: string }) => api.post<Category>("/categories", data).then((r) => r.data),
  update: (id: string, data: { name?: string; description?: string }) => api.put<Category>(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
};

// ---- Products ----
export const productsApi = {
  list: (params?: { search?: string; category_id?: string; active?: boolean; low_stock?: boolean }) =>
    api.get<Product[]>("/products", { params }).then((r) => r.data),
  get: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  lookup: (code: string) => api.get<Product>(`/products/barcode/${encodeURIComponent(code)}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post<Product>("/products", data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put<Product>(`/products/${id}`, data).then((r) => r.data),
  adjustStock: (id: string, quantity: number, note?: string) => api.post<Product>(`/products/${id}/stock`, { quantity, note }).then((r) => r.data),
  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
};

// ---- Suppliers ----
export const suppliersApi = {
  list: (search?: string) => api.get<Supplier[]>("/suppliers", { params: { search } }).then((r) => r.data),
  create: (data: Partial<Supplier>) => api.post<Supplier>("/suppliers", data).then((r) => r.data),
  update: (id: string, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/suppliers/${id}`).then((r) => r.data),
};

// ---- Sales ----
export const salesApi = {
  list: (status?: string) => api.get<Sale[]>("/sales", { params: { status } }).then((r) => r.data),
  get: (id: string) => api.get<Sale>(`/sales/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post<Sale>("/sales", data).then((r) => r.data),
  void: (id: string) => api.post<Sale>(`/sales/${id}/void`).then((r) => r.data),
};

// ---- Returns ----
export const returnsApi = {
  list: () => api.get<SalesReturn[]>("/returns").then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post<SalesReturn>("/returns", data).then((r) => r.data),
};

// ---- Purchases ----
export const purchasesApi = {
  list: () => api.get<Purchase[]>("/purchases").then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post<Purchase>("/purchases", data).then((r) => r.data),
};

// ---- Ledger ----
export const ledgerApi = {
  list: (type?: string) => api.get<LedgerEntry[]>("/ledger", { params: { type } }).then((r) => r.data),
  create: (data: { type: string; description: string; debit?: number; credit?: number }) =>
    api.post<LedgerEntry>("/ledger", data).then((r) => r.data),
};

// ---- Reports ----
export const reportsApi = {
  summary: () => api.get<ReportSummary>("/reports/summary").then((r) => r.data),
  dailySales: (days = 14) => api.get<DailySale[]>("/reports/daily-sales", { params: { days } }).then((r) => r.data),
  topProducts: (limit = 5) => api.get<TopProduct[]>("/reports/top-products", { params: { limit } }).then((r) => r.data),
  paymentBreakdown: () => api.get<PaymentBreakdown[]>("/reports/payment-breakdown").then((r) => r.data),
  lowStock: () => api.get<LowStockItem[]>("/reports/low-stock").then((r) => r.data),
  sales: (params: { start?: string; end?: string }) => api.get("/reports/sales", { params }).then((r) => r.data),
};
