import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { reportsApi } from "../../api";
import { Button, Card, CardHeader, Field, Input, Spinner, StatCard, money } from "../../components/ui";
import type { DailySale, PaymentBreakdown, ReportSummary, TopProduct } from "../../types";

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface SalesReport {
  total_revenue: number;
  total_transactions: number;
  by_day: { date: string; revenue: number; count: number }[];
}

export default function Reports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [daily, setDaily] = useState<DailySale[]>([]);
  const [payments, setPayments] = useState<PaymentBreakdown[]>([]);
  const [top, setTop] = useState<TopProduct[]>([]);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, d, p, t] = await Promise.all([reportsApi.summary(), reportsApi.dailySales(30), reportsApi.paymentBreakdown(), reportsApi.topProducts(6)]);
      setSummary(s);
      setDaily(d);
      setPayments(p);
      setTop(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const runReport = async () => {
    const data = (await reportsApi.sales({ start: start || undefined, end: end || undefined })) as SalesReport;
    setReport(data);
  };

  const exportCsv = () => {
    if (!report) return;
    const rows = [["Date", "Revenue", "Transactions"], ...report.by_day.map((d) => [d.date, String(d.revenue), String(d.count)])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !summary) return <Spinner label="Loading reports…" />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue" value={money(summary.total_revenue)} tone="green" />
        <StatCard label="Profit (est.)" value={money(summary.estimated_profit)} tone="blue" />
        <StatCard label="Stock value" value={money(summary.stock_value)} tone="indigo" />
        <StatCard label="Refunds" value={money(summary.total_refunds)} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Daily sales" subtitle="Last 30 days" />
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => String(d).slice(5)} />
                <YAxis tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(value: number) => money(value)} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment methods" />
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payments} dataKey="total" nameKey="method" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {payments.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top products" subtitle="Best sellers by quantity and revenue" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Qty sold</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top.map((item) => (
                <tr key={item.name}>
                  <td className="px-4 py-3 text-slate-700">{item.name}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{item.qty}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{money(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Custom date range"
          subtitle="Generate a sales report for any period"
          action={
            report ? (
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download size={14} /> Export CSV
              </Button>
            ) : undefined
          }
        />
        <div className="flex flex-wrap items-end gap-3 p-4">
          <Field label="From">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Button onClick={runReport}>Run report</Button>
        </div>
        {report && (
          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 flex gap-6 text-sm">
              <span className="text-slate-500">Revenue: <b className="text-slate-800">{money(report.total_revenue)}</b></span>
              <span className="text-slate-500">Transactions: <b className="text-slate-800">{report.total_transactions}</b></span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2 text-right">Transactions</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.by_day.map((day) => (
                    <tr key={day.date}>
                      <td className="py-2 text-slate-600">{day.date}</td>
                      <td className="py-2 text-right text-slate-500">{day.count}</td>
                      <td className="py-2 text-right font-medium text-slate-700">{money(day.revenue)}</td>
                    </tr>
                  ))}
                  {report.by_day.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No sales in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
