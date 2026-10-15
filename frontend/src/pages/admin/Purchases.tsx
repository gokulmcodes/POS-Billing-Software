import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiErrorMessage, productsApi, purchasesApi, suppliersApi } from "../../api";
import { Badge, Button, Card, Field, Input, Modal, Select, Spinner, formatDate, money } from "../../components/ui";
import type { Product, Purchase, Supplier } from "../../types";

interface Line {
  key: string;
  product_id: string;
  variant_sku: string;
  name: string;
  qty: number;
  unit_cost: number;
  update_stock: boolean;
}

const newLine = (): Line => ({ key: Math.random().toString(36).slice(2), product_id: "", variant_sku: "", name: "", qty: 1, unit_cost: 0, update_stock: true });

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Purchase | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [tax, setTax] = useState(0);
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [p, prod, sup] = await Promise.all([purchasesApi.list(), productsApi.list(), suppliersApi.list()]);
      setPurchases(p);
      setProducts(prod);
      setSuppliers(sup);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setSupplierId("");
    setTax(0);
    setLines([newLine()]);
    setError("");
    setShowForm(true);
  };

  const updateLine = (key: string, patch: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const onPickProduct = (key: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    updateLine(key, { product_id: productId, name: product?.name ?? "", unit_cost: product?.cost_price ?? 0 });
  };

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.unit_cost || 0), 0);
    return { subtotal: Math.round(subtotal * 100) / 100, total: Math.round((subtotal + Number(tax || 0)) * 100) / 100 };
  }, [lines, tax]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const items = lines.filter((l) => l.name && l.qty > 0);
    if (items.length === 0) {
      setError("Add at least one item");
      return;
    }
    try {
      await purchasesApi.create({
        supplier_id: supplierId || null,
        items: items.map((l) => ({ product_id: l.product_id || null, variant_sku: l.variant_sku || null, name: l.name, qty: Number(l.qty), unit_cost: Number(l.unit_cost), update_stock: l.update_stock })),
        tax: Number(tax),
        amount_paid: totals.total,
        payment_status: "paid",
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Purchases</h2>
          <p className="text-sm text-slate-500">Record stock purchased from suppliers</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New purchase
        </Button>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">PO number</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetail(purchase)}>
                    <td className="px-4 py-3 font-medium text-slate-800">{purchase.purchase_no}</td>
                    <td className="px-4 py-3 text-slate-500">{purchase.supplier_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(purchase.created_at)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{purchase.items.length}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{money(purchase.total)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={purchase.payment_status === "paid" ? "green" : "amber"}>{purchase.payment_status}</Badge>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      No purchases recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        title="New purchase"
        size="xl"
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" form="purchase-form">
              Save purchase
            </Button>
          </>
        }
      >
        <form id="purchase-form" onSubmit={save} className="space-y-4">
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Supplier">
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tax / other charges">
              <Input type="number" step="0.01" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
            </Field>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Items</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => setLines((prev) => [...prev, newLine()])}>
                <Plus size={14} /> Add item
              </Button>
            </div>
            {lines.map((line) => {
              const product = products.find((p) => p.id === line.product_id);
              return (
                <div key={line.key} className="mb-2 grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4">
                    <Select value={line.product_id} onChange={(e) => onPickProduct(line.key, e.target.value)}>
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {product?.variants.length ? (
                    <div className="col-span-2">
                      <Select value={line.variant_sku} onChange={(e) => updateLine(line.key, { variant_sku: e.target.value })}>
                        <option value="">Variant</option>
                        {product.variants.map((v) => (
                          <option key={v.sku} value={v.sku}>
                            {[v.size, v.color].filter(Boolean).join(" / ")}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <div className="col-span-2" />
                  )}
                  <Input className="col-span-2" type="number" min={1} value={line.qty} onChange={(e) => updateLine(line.key, { qty: Number(e.target.value) })} />
                  <Input className="col-span-2" type="number" step="0.01" value={line.unit_cost} onChange={(e) => updateLine(line.key, { unit_cost: Number(e.target.value) })} />
                  <div className="col-span-2 text-right text-sm font-medium text-slate-600">{money((line.qty || 0) * (line.unit_cost || 0))}</div>
                  <Button type="button" variant="ghost" size="sm" className="col-span-1 text-rose-600" onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-6 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Subtotal: <b className="text-slate-700">{money(totals.subtotal)}</b></span>
            <span className="text-slate-500">Total: <b className="text-slate-800">{money(totals.total)}</b></span>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} title={detail?.purchase_no ?? ""} size="lg" onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-500">
              {detail.supplier_name} · {formatDate(detail.created_at)} · by {detail.created_by_name}
            </p>
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit cost</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detail.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-slate-700">{item.name}</td>
                    <td className="py-2 text-right">{item.qty}</td>
                    <td className="py-2 text-right">{money(item.unit_cost)}</td>
                    <td className="py-2 text-right font-medium">{money(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between border-t border-slate-100 pt-3 font-medium">
              <span>Total</span>
              <span>{money(detail.total)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
