export type Role = "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  phone?: string | null;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Variant {
  size?: string | null;
  color?: string | null;
  sku: string;
  stock_qty: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  fabric?: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  stock_qty: number;
  reorder_level: number;
  image_url?: string | null;
  active: boolean;
  variants: Variant[];
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  notes?: string | null;
  active: boolean;
  created_at: string;
}

export interface SaleItem {
  product_id?: string | null;
  variant_sku?: string | null;
  name: string;
  sku?: string | null;
  qty: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
}

export interface Sale {
  id: string;
  invoice_no: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  split_cash: number;
  split_card: number;
  amount_paid: number;
  change_due: number;
  customer_id?: string | null;
  customer_name?: string | null;
  cashier_id?: string | null;
  cashier_name?: string | null;
  status: string;
  note?: string | null;
  created_at: string;
}

export interface PurchaseItem {
  product_id?: string | null;
  variant_sku?: string | null;
  name: string;
  qty: number;
  unit_cost: number;
  line_total: number;
}

export interface Purchase {
  id: string;
  purchase_no: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  payment_status: string;
  notes?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface ReturnItem {
  product_id?: string | null;
  variant_sku?: string | null;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface SalesReturn {
  id: string;
  return_no: string;
  sale_id?: string | null;
  invoice_no?: string | null;
  items: ReturnItem[];
  refund_amount: number;
  reason?: string | null;
  resolution: string;
  restock: boolean;
  processed_by_name?: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  ref_type?: string | null;
  ref_id?: string | null;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  created_by_name?: string | null;
  created_at: string;
}

export interface ReportSummary {
  total_revenue: number;
  total_discount: number;
  total_tax: number;
  total_refunds: number;
  total_transactions: number;
  avg_order_value: number;
  todays_revenue: number;
  todays_transactions: number;
  estimated_profit: number;
  stock_value: number;
  low_stock_count: number;
  total_products: number;
}

export interface DailySale {
  date: string;
  revenue: number;
  count: number;
}

export interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

export interface PaymentBreakdown {
  method: string;
  total: number;
  count: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock_qty: number;
  reorder_level: number;
}

export interface CartLine {
  product: Product;
  variantSku?: string | null;
  qty: number;
  unitPrice: number;
  discount: number;
}
