import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiErrorMessage, returnsApi, salesApi } from "../../api";
import { Badge, Button, Card, Field, Input, Modal, Select, Spinner, Textarea, formatDate, money } from "../../components/ui";
import type { Sale, SalesReturn } from "../../types";

export default function Returns() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<SalesReturn | null>(null);

  const [saleId, setSaleId] = useState("");
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [resolution, setResolution] = useState<"refund" | "exchange">("refund");
  const [restock, setRestock] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([returnsApi.list(), salesApi.list()]);
      setReturns(r);
      setSales(s.filter((sale) => sale.status !== "voided"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedSale = useMemo(() => sales.find((s) => s.id === saleId) ?? null, [sales, saleId]);
  const refundTotal = useMemo(() => {
    if (!selectedSale) return 0;
    return selectedSale.items.reduce((sum, item, index) => sum + (qtys[`${index}`] || 0) * item.unit_price, 0);
  }, [selectedSale, qtys]);

  const openCreate = () => {
    setSaleId("");
    setQtys({});
    setResolution("refund");
    setRestock(true);
    setReason("");
    setError("");
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSale) {
      setError("Select a sale");
      return;
    }
    const items = selectedSale.items
      .map((item, index) => ({ item, index, qty: qtys[`${index}`] || 0 }))
      .filter((row) => row.qty > 0)
      .map((row) => ({ product_id: row.item.product_id, variant_sku: row.item.variant_sku, qty: row.qty }));
    if (items.length === 0) {
      setError("Select at least one item and quantity");
      return;
    }
    try {
      await returnsApi.create({ sale_id: selectedSale.id, items, reason, resolution, restock });
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
          <h2 className="text-lg font-semibold text-slate-800">Product returns</h2>
          <p className="text-sm text-slate-500">Handle refunds and exchanges, with optional restocking</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New return
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
                  <th className="px-4 py-3">Return no</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Resolution</th>
                  <th className="px-4 py-3 text-right">Refund</th>
                  <th className="px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((ret) => (
                  <tr key={ret.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetail(ret)}>
                    <td className="px-4 py-3 font-medium text-slate-800">{ret.return_no}</td>
                    <td className="px-4 py-3 text-slate-500">{ret.invoice_no ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(ret.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={ret.resolution === "refund" ? "amber" : "blue"}>{ret.resolution}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{money(ret.refund_amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{ret.processed_by_name ?? "—"}</td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      No returns yet.
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
        title="New return"
        size="lg"
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" form="return-form">
              Process return
            </Button>
          </>
        }
      >
        <form id="return-form" onSubmit={save} className="space-y-4">
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <Field label="Sale invoice">
            <Select value={saleId} onChange={(e) => { setSaleId(e.target.value); setQtys({}); }}>
              <option value="">Select an invoice</option>
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.invoice_no} · {money(sale.total)} · {sale.customer_name ?? "Walk-in"}
                </option>
              ))}
            </Select>
          </Field>

          {selectedSale && (
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">Items to return</p>
              {selectedSale.items.map((item, index) => (
                <div key={index} className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.variant_sku ? `${item.variant_sku} · ` : ""}
                      {money(item.unit_price)} · sold {item.qty}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={item.qty}
                    className="w-24"
                    value={qtys[`${index}`] ?? 0}
                    onChange={(e) => setQtys((prev) => ({ ...prev, [`${index}`]: Math.min(item.qty, Math.max(0, Number(e.target.value))) }))}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Resolution">
              <Select value={resolution} onChange={(e) => setResolution(e.target.value as "refund" | "exchange")}>
                <option value="refund">Refund</option>
                <option value="exchange">Exchange</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600">
              <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> Add items back to stock
            </label>
          </div>

          <Field label="Reason">
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>

          <div className="flex justify-end rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Refund amount: <b className="text-slate-800">{money(refundTotal)}</b></span>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} title={detail?.return_no ?? ""} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-500">
              Against {detail.invoice_no} · {formatDate(detail.created_at)} · by {detail.processed_by_name}
            </p>
            <ul className="space-y-1">
              {detail.items.map((item, i) => (
                <li key={i} className="flex justify-between border-b border-slate-100 py-2">
                  <span className="text-slate-700">
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-medium">{money(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-medium">
              <span>Total refund</span>
              <span>{money(detail.refund_amount)}</span>
            </div>
            {detail.reason && <p className="text-slate-500">Reason: {detail.reason}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
