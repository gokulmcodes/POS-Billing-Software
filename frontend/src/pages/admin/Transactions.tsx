import { Ban, Eye, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { apiErrorMessage, salesApi } from "../../api";
import { Badge, Button, Card, EmptyState, Input, Modal, Spinner, formatDate, money } from "../../components/ui";
import type { Sale } from "../../types";

export default function Transactions() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<Sale | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setSales(await salesApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const voidSale = async (sale: Sale) => {
    if (!window.confirm(`Void ${sale.invoice_no}? Stock will be restored.`)) return;
    try {
      await salesApi.void(sale.id);
      setDetail(null);
      load();
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  };

  const filtered = sales.filter((sale) => {
    const matchesStatus = !status || sale.status === status;
    const term = search.toLowerCase();
    const matchesSearch = !term || sale.invoice_no.toLowerCase().includes(term) || (sale.cashier_name ?? "").toLowerCase().includes(term) || (sale.customer_name ?? "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Billing / transactions</h2>
        <p className="text-sm text-slate-500">All sales recorded through the billing portal</p>
      </div>

      <Card className="flex flex-wrap gap-2 p-3">
        <Input className="min-w-[220px] flex-1" placeholder="Search invoice, cashier or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="returned">Returned</option>
          <option value="voided">Voided</option>
        </select>
      </Card>

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Cashier</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{sale.invoice_no}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(sale.created_at)}</td>
                    <td className="px-4 py-3 text-slate-500">{sale.cashier_name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{sale.payment_method}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{money(sale.total)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={sale.status === "completed" ? "green" : sale.status === "returned" ? "amber" : "red"}>{sale.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(sale)}>
                        <Eye size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(detail)}
        title={detail ? `Invoice ${detail.invoice_no}` : ""}
        size="lg"
        onClose={() => setDetail(null)}
        footer={
          detail && detail.status === "completed" ? (
            <Button variant="danger" onClick={() => voidSale(detail)}>
              <Ban size={15} /> Void sale
            </Button>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2 text-slate-500">
              <span>{formatDate(detail.created_at)}</span>
              <span>
                Cashier: <b className="text-slate-700">{detail.cashier_name}</b>
              </span>
              <Badge tone={detail.status === "completed" ? "green" : "red"}>{detail.status}</Badge>
            </div>
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Tax</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detail.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-slate-700">
                      {item.name}
                      {item.variant_sku && <span className="block text-xs text-slate-400">{item.variant_sku}</span>}
                    </td>
                    <td className="py-2 text-right">{item.qty}</td>
                    <td className="py-2 text-right">{money(item.unit_price)}</td>
                    <td className="py-2 text-right">{money(item.tax_amount)}</td>
                    <td className="py-2 text-right font-medium">{money(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <Row label="Subtotal" value={money(detail.subtotal)} />
              <Row label="Discount" value={`- ${money(detail.discount)}`} />
              <Row label="Tax" value={money(detail.tax)} />
              <div className="flex justify-between pt-1 text-base font-semibold text-slate-800">
                <span>Total</span>
                <span>{money(detail.total)}</span>
              </div>
              <Row label="Paid" value={money(detail.amount_paid)} />
              {detail.change_due > 0 && <Row label="Change" value={money(detail.change_due)} />}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-500">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
