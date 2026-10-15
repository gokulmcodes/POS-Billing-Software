import { Pencil, Plus, Search, Trash2, Boxes } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiErrorMessage, categoriesApi, productsApi } from "../../api";
import { Badge, Button, Card, Field, Input, Modal, Select, Spinner, cn, money } from "../../components/ui";
import type { Category, Product, Variant } from "../../types";

interface VariantRow extends Variant {
  key: string;
}

const emptyVariant = (): VariantRow => ({ key: Math.random().toString(36).slice(2), size: "", color: "", sku: "", stock_qty: 0 });

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState("0");

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        productsApi.list({ search: search || undefined, category_id: categoryId || undefined, low_stock: lowOnly || undefined }),
        categoriesApi.list(),
      ]);
      setProducts(p);
      setCategories(c);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, lowOnly]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setShowForm(true);
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await productsApi.remove(product.id);
      load();
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  };

  const applyStock = async () => {
    if (!stockTarget) return;
    try {
      await productsApi.adjustStock(stockTarget.id, Number(stockDelta));
      setStockTarget(null);
      setStockDelta("0");
      load();
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Products</h2>
          <p className="text-sm text-slate-500">{products.length} items in catalogue</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add product
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search name, SKU or barcode" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-44" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only
          </label>
        </div>
      </Card>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.sku}{product.fabric ? ` · ${product.fabric}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{product.category_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{money(product.cost_price)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{money(product.selling_price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-medium", product.stock_qty <= product.reorder_level ? "text-amber-600" : "text-slate-700")}>
                        {product.stock_qty}
                      </span>
                      {product.variants.length > 0 && <span className="ml-1 text-xs text-slate-400">({product.variants.length} var)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={product.active ? "green" : "slate"}>{product.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setStockTarget(product)} title="Adjust stock">
                          <Boxes size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)} title="Edit">
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => remove(product)} title="Delete">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <Modal
        open={Boolean(stockTarget)}
        title={`Adjust stock — ${stockTarget?.name ?? ""}`}
        onClose={() => setStockTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStockTarget(null)}>
              Cancel
            </Button>
            <Button onClick={applyStock}>Apply</Button>
          </>
        }
      >
        <p className="mb-2 text-sm text-slate-500">Use a negative number to reduce stock (e.g. -2 for damage).</p>
        <Field label="Quantity change">
          <Input type="number" value={stockDelta} onChange={(e) => setStockDelta(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    category_id: product?.category_id ?? "",
    fabric: product?.fabric ?? "",
    unit: product?.unit ?? "pcs",
    cost_price: product?.cost_price ?? 0,
    selling_price: product?.selling_price ?? 0,
    tax_rate: product?.tax_rate ?? 0,
    stock_qty: product?.stock_qty ?? 0,
    reorder_level: product?.reorder_level ?? 0,
    active: product?.active ?? true,
  });
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants?.map((v) => ({ ...v, key: Math.random().toString(36).slice(2) })) ?? [],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const variantStock = useMemo(() => variants.reduce((sum, v) => sum + Number(v.stock_qty || 0), 0), [variants]);

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload: Record<string, unknown> = {
      ...form,
      barcode: form.barcode || null,
      category_id: form.category_id || null,
      fabric: form.fabric || null,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      tax_rate: Number(form.tax_rate),
      stock_qty: variants.length > 0 ? variantStock : Number(form.stock_qty),
      reorder_level: Number(form.reorder_level),
      variants: variants.map(({ size, color, sku, stock_qty }) => ({ size: size || null, color: color || null, sku, stock_qty: Number(stock_qty) })),
    };
    try {
      if (product) {
        await productsApi.update(product.id, payload);
      } else {
        await productsApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={product ? "Edit product" : "Add product"}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={busy}>
            {busy ? "Saving…" : "Save product"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="SKU">
            <Input required value={form.sku} onChange={(e) => update("sku", e.target.value)} />
          </Field>
          <Field label="Barcode">
            <Input value={form.barcode} onChange={(e) => update("barcode", e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fabric">
            <Input value={form.fabric} onChange={(e) => update("fabric", e.target.value)} />
          </Field>
          <Field label="Unit">
            <Input value={form.unit} onChange={(e) => update("unit", e.target.value)} />
          </Field>
          <Field label="Cost price">
            <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => update("cost_price", e.target.value)} />
          </Field>
          <Field label="Selling price">
            <Input type="number" step="0.01" value={form.selling_price} onChange={(e) => update("selling_price", e.target.value)} />
          </Field>
          <Field label="Tax rate (%)">
            <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => update("tax_rate", e.target.value)} />
          </Field>
          <Field label="Reorder level">
            <Input type="number" value={form.reorder_level} onChange={(e) => update("reorder_level", e.target.value)} />
          </Field>
          {variants.length === 0 && (
            <Field label="Stock quantity">
              <Input type="number" value={form.stock_qty} onChange={(e) => update("stock_qty", e.target.value)} />
            </Field>
          )}
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} /> Active
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Variants</p>
              <p className="text-xs text-slate-400">Use variants for sizes / colours. Stock is tracked per variant.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setVariants((prev) => [...prev, emptyVariant()])}>
              <Plus size={14} /> Add variant
            </Button>
          </div>
          {variants.length === 0 && <p className="py-2 text-xs text-slate-400">No variants — stock is managed at product level.</p>}
          {variants.map((variant) => (
            <div key={variant.key} className="mb-2 grid grid-cols-[1fr_1fr_1.4fr_0.8fr_auto] items-center gap-2">
              <Input placeholder="Size" value={variant.size ?? ""} onChange={(e) => updateVariant(variant.key, { size: e.target.value })} />
              <Input placeholder="Colour" value={variant.color ?? ""} onChange={(e) => updateVariant(variant.key, { color: e.target.value })} />
              <Input placeholder="Variant SKU" value={variant.sku} onChange={(e) => updateVariant(variant.key, { sku: e.target.value })} />
              <Input type="number" value={variant.stock_qty} onChange={(e) => updateVariant(variant.key, { stock_qty: Number(e.target.value) })} />
              <Button type="button" variant="ghost" size="sm" className="text-rose-600" onClick={() => setVariants((prev) => prev.filter((v) => v.key !== variant.key))}>
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
          {variants.length > 0 && <p className="text-xs text-slate-500">Total variant stock: {variantStock}</p>}
        </div>
      </form>
    </Modal>
  );
}
