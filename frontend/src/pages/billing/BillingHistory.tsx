import { Printer, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { salesApi } from "../../api";
import { useAuth } from "../../auth";
import { Badge, Button, Card, Input, Modal, Spinner, formatDate, money } from "../../components/ui";
import type { Sale } from "../../types";

export default function BillingHistory() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Sale | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

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

  const filtered = sales.filter((sale) => {
    const matchesMine = !mineOnly || sale.cashier_id === user?.id;
    const term = search.toLowerCase();
    const matchesSearch = !term || sale.invoice_no.toLowerCase().includes(term) || (sale.customer_name ?? "").toLowerCase().includes(term);
    return matchesMine && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Sales history</h2>
          <p className="text-sm text-slate-500">Recent transactions and receipts</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} /> My sales only
        </label>
      </div>

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search invoice or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Cashier</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{sale.invoice_no}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(sale.created_at)}</td>
                    <td className="px-4 py-3 text-slate-500">{sale.customer_name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-slate-500">{sale.cashier_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{money(sale.total)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={sale.status === "completed" ? "green" : sale.status === "returned" ? "amber" : "red"}>{sale.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(sale)}>
                        <Printer size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No sales found.
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
        title={detail ? `Receipt ${detail.invoice_no}` : ""}
        onClose={() => setDetail(null)}
        footer={
          <Button onClick={() => window.print()}>
            <Printer size={16} /> Print
          </Button>
        }
      >
        {detail && <ReceiptView sale={detail} />}
      </Modal>
    </div>
  );
}

function ReceiptView({ sale }: { sale: Sale }) {
  return (
    <div className="receipt-print mx-auto max-w-xs text-xs text-black" style={{ display: "block", position: "static", visibility: "visible" }}>
      <div className="text-center">
        <p className="text-sm font-bold">TEXTILE STORE</p>
        <p>{sale.invoice_no}</p>
        <p>{new Date(sale.created_at).toLocaleString("en-IN")}</p>
      </div>
      <div className="my-2 border-y border-dashed border-slate-400 py-2">
        {sale.items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>
              {item.name} × {item.qty}
            </span>
            <span>{money(item.line_total)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>{money(sale.total)}</span>
      </div>
      <p className="mt-2 text-center">Cashier: {sale.cashier_name}</p>
    </div>
  );
}
