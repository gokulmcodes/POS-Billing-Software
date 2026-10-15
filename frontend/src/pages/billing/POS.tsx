import { Minus, Plus, Printer, ScanLine, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiErrorMessage, categoriesApi, productsApi, salesApi } from "../../api";
import { useAuth } from "../../auth";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner, cn, money } from "../../components/ui";
import type { CartLine, Category, Product, Sale } from "../../types";

const cartKey = (productId: string, variantSku?: string | null) => `${productId}::${variantSku ?? ""}`;

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([productsApi.list({ active: true }), categoriesApi.list()]);
      setProducts(p);
      setCategories(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = !categoryId || p.category_id === categoryId;
      const matchTerm = !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || (p.barcode ?? "").includes(term);
      return matchCat && matchTerm;
    });
  }, [products, search, categoryId]);

  const addToCart = (product: Product, variantSku?: string | null) => {
    if (product.stock_qty <= 0) {
      setMessage(`${product.name} is out of stock`);
      return;
    }
    if (product.variants.length > 0 && !variantSku) {
      setVariantProduct(product);
      return;
    }
    const key = cartKey(product.id, variantSku);
    setCart((prev) => {
      const existing = prev.find((line) => cartKey(line.product.id, line.variantSku) === key);
      if (existing) {
        return prev.map((line) => (cartKey(line.product.id, line.variantSku) === key ? { ...line, qty: line.qty + 1 } : line));
      }
      return [...prev, { product, variantSku, qty: 1, unitPrice: product.selling_price, discount: 0 }];
    });
    setMessage("");
  };

  const setQty = (line: CartLine, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => (cartKey(l.product.id, l.variantSku) === cartKey(line.product.id, line.variantSku) ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const setLineDiscount = (line: CartLine, discount: number) => {
    setCart((prev) => prev.map((l) => (cartKey(l.product.id, l.variantSku) === cartKey(line.product.id, line.variantSku) ? { ...l, discount: Math.max(0, discount) } : l)));
  };

  const removeLine = (line: CartLine) => setCart((prev) => prev.filter((l) => cartKey(l.product.id, l.variantSku) !== cartKey(line.product.id, line.variantSku)));

  const totals = useMemo(() => {
    let subtotal = 0;
    let lineDiscounts = 0;
    let tax = 0;
    for (const line of cart) {
      const base = line.qty * line.unitPrice;
      subtotal += base;
      lineDiscounts += line.discount;
      tax += (base - line.discount) * (line.product.tax_rate / 100);
    }
    const discount = lineDiscounts + orderDiscount;
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal: round(subtotal), discount: round(discount), tax: round(tax), total: round(total) };
  }, [cart, orderDiscount]);

  const clearSale = () => {
    setCart([]);
    setOrderDiscount(0);
    setCustomerName("");
    setMessage("");
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-slate-100">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-3">
          <div className="relative min-w-[200px] flex-1">
            <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Scan barcode or search product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && search.trim()) {
                  try {
                    const product = await productsApi.lookup(search.trim());
                    addToCart(product, product.variants[0]?.sku ?? null);
                    setSearch("");
                  } catch {
                    /* fall through to filtered list */
                  }
                }
              }}
            />
          </div>
          <Select className="w-44" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <Spinner label="Loading products…" />
          ) : filtered.length === 0 ? (
            <EmptyState title="No products" description="Try a different search or category." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_qty <= 0}
                  className={cn(
                    "flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-400 hover:shadow-sm disabled:opacity-50",
                  )}
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                    {product.name.charAt(0)}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium text-slate-700">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.category_name ?? product.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{money(product.selling_price)}</span>
                    <Badge tone={product.stock_qty <= product.reorder_level ? "amber" : "slate"}>{product.stock_qty} {product.unit}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex w-full flex-col border-t border-slate-200 bg-white lg:w-[380px] lg:border-t-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-600" />
            <span className="font-semibold text-slate-800">Current sale</span>
            <Badge tone="indigo">{cart.length}</Badge>
          </div>
          {cart.length > 0 && (
            <button className="text-xs text-rose-600 hover:underline" onClick={clearSale}>
              Clear
            </button>
          )}
        </div>

        {message && <p className="mx-4 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{message}</p>}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <EmptyState title="Cart is empty" description="Tap a product to start billing." />
          ) : (
            <div className="space-y-3">
              {cart.map((line) => (
                <div key={cartKey(line.product.id, line.variantSku)} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">{line.product.name}</p>
                      {line.variantSku && <p className="text-xs text-slate-400">{line.variantSku}</p>}
                    </div>
                    <button className="text-slate-400 hover:text-rose-600" onClick={() => removeLine(line)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="secondary" size="sm" onClick={() => setQty(line, line.qty - 1)}>
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{line.qty}</span>
                      <Button variant="secondary" size="sm" onClick={() => setQty(line, line.qty + 1)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{money(line.qty * line.unitPrice - line.discount)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>Discount</span>
                    <Input className="h-7 w-20 text-xs" type="number" step="0.01" value={line.discount} onChange={(e) => setLineDiscount(line, Number(e.target.value))} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          <Input placeholder="Customer name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mb-3" />
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="text-slate-500">Order discount</span>
            <Input className="h-8 flex-1" type="number" step="0.01" value={orderDiscount} onChange={(e) => setOrderDiscount(Number(e.target.value))} />
          </div>
          <div className="space-y-1 text-sm">
            <Line label="Subtotal" value={money(totals.subtotal)} />
            <Line label="Discount" value={`- ${money(totals.discount)}`} />
            <Line label="Tax" value={money(totals.tax)} />
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-lg font-semibold text-slate-900">
              <span>Total</span>
              <span>{money(totals.total)}</span>
            </div>
          </div>
          <Button className="mt-3 w-full" size="lg" disabled={cart.length === 0} onClick={() => setPayOpen(true)}>
            Charge {money(totals.total)}
          </Button>
        </div>
      </section>

      {variantProduct && (
        <VariantPicker
          product={variantProduct}
          onClose={() => setVariantProduct(null)}
          onPick={(sku) => {
            addToCart(variantProduct, sku);
            setVariantProduct(null);
          }}
        />
      )}

      {payOpen && (
        <PaymentModal
          total={totals.total}
          onClose={() => setPayOpen(false)}
          onConfirm={async (payload) => {
            const sale = await salesApi.create({
              items: cart.map((line) => ({
                product_id: line.product.id,
                variant_sku: line.variantSku ?? null,
                qty: line.qty,
                unit_price: line.unitPrice,
                discount: line.discount,
              })),
              discount: orderDiscount,
              payment_method: payload.method,
              split_cash: payload.splitCash,
              split_card: payload.splitCard,
              amount_paid: payload.amountPaid,
              customer_name: customerName || null,
            });
            setPayOpen(false);
            setReceipt(sale);
            clearSale();
            loadProducts();
          }}
        />
      )}

      <Modal open={Boolean(receipt)} title="Payment complete" onClose={() => setReceipt(null)} footer={
        <>
          <Button variant="secondary" onClick={() => setReceipt(null)}>
            New sale
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={16} /> Print receipt
          </Button>
        </>
      }>
        {receipt && <Receipt sale={receipt} cashier={user?.name ?? ""} />}
      </Modal>

      <div className="receipt-print">{receipt && <Receipt sale={receipt} cashier={user?.name ?? ""} plain />}</div>
    </div>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-500">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function VariantPicker({ product, onClose, onPick }: { product: Product; onClose: () => void; onPick: (sku: string) => void }) {
  return (
    <Modal open title={`Choose variant — ${product.name}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {product.variants.map((variant) => (
          <button
            key={variant.sku}
            disabled={variant.stock_qty <= 0}
            onClick={() => onPick(variant.sku)}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-left text-sm hover:border-indigo-400 disabled:opacity-40"
          >
            <span className="font-medium text-slate-700">{[variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku}</span>
            <span className="text-xs text-slate-400">{variant.stock_qty}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function PaymentModal({
  total,
  onClose,
  onConfirm,
}: {
  total: number;
  onClose: () => void;
  onConfirm: (payload: { method: string; amountPaid: number; splitCash: number; splitCard: number }) => Promise<void>;
}) {
  const [method, setMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(total);
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(total);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = method === "split" ? Math.max(0, splitCash + splitCard - total) : Math.max(0, amountPaid - total);

  const confirm = async () => {
    setError("");
    if (method === "cash" && amountPaid < total) {
      setError("Amount paid is less than the total");
      return;
    }
    if (method === "split" && splitCash + splitCard < total - 0.001) {
      setError("Split amounts are less than the total");
      return;
    }
    setBusy(true);
    try {
      await onConfirm({ method, amountPaid, splitCash, splitCard });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Take payment"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={busy}>
            {busy ? "Processing…" : `Confirm ${money(total)}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <div className="rounded-xl bg-slate-900 p-4 text-center text-white">
          <p className="text-xs uppercase text-slate-400">Amount due</p>
          <p className="text-3xl font-semibold">{money(total)}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {["cash", "card", "upi", "split"].map((option) => (
            <button
              key={option}
              onClick={() => setMethod(option)}
              className={cn(
                "rounded-lg border px-2 py-2 text-sm font-medium capitalize",
                method === option ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {method === "cash" && (
          <Field label="Cash received">
            <Input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
            <div className="mt-2 flex flex-wrap gap-2">
              {[total, 500, 1000, 2000].map((quick, i) => (
                <button key={i} onClick={() => setAmountPaid(quick)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">
                  {money(quick)}
                </button>
              ))}
            </div>
          </Field>
        )}

        {method === "split" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cash">
              <Input type="number" step="0.01" value={splitCash} onChange={(e) => setSplitCash(Number(e.target.value))} />
            </Field>
            <Field label="Card / UPI">
              <Input type="number" step="0.01" value={splitCard} onChange={(e) => setSplitCard(Number(e.target.value))} />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm">
          <span className="text-emerald-700">Change due</span>
          <span className="font-semibold text-emerald-700">{money(change)}</span>
        </div>
      </div>
    </Modal>
  );
}

export function Receipt({ sale, cashier, plain = false }: { sale: Sale; cashier: string; plain?: boolean }) {
  return (
    <div className={cn("mx-auto max-w-xs text-xs", plain ? "text-black" : "text-slate-700")}>
      <div className="text-center">
        <p className="text-sm font-bold">TEXTILE STORE</p>
        <p>Point of Sale Receipt</p>
        <p>{sale.invoice_no}</p>
        <p>{new Date(sale.created_at).toLocaleString("en-IN")}</p>
      </div>
      <div className="my-2 border-y border-dashed border-slate-300 py-2">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th>Item</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={i}>
                <td className="pr-1">{item.name}</td>
                <td className="text-center">{item.qty}</td>
                <td className="text-right">{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>- {money(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{money(sale.tax)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-slate-300 pt-1 text-sm font-bold">
          <span>Total</span>
          <span>{money(sale.total)}</span>
        </div>
        <div className="flex justify-between capitalize">
          <span>{sale.payment_method}</span>
          <span>{money(sale.amount_paid)}</span>
        </div>
        {sale.change_due > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{money(sale.change_due)}</span>
          </div>
        )}
      </div>
      <div className="mt-3 text-center">
        <p>Cashier: {cashier}</p>
        <p>Thank you, visit again!</p>
      </div>
    </div>
  );
}
