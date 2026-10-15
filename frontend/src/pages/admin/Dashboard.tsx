import { AlertTriangle, Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { reportsApi } from "../../api";
import { Card, CardHeader, EmptyState, Spinner, StatCard, money } from "../../components/ui";
import type { DailySale, LowStockItem, ReportSummary, TopProduct } from "../../types";

export default function Dashboard() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [daily, setDaily] = useState<DailySale[]>([]);
  const [top, setTop] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.summary(), reportsApi.dailySales(14), reportsApi.topProducts(5), reportsApi.lowStock()])
      .then(([s, d, t, l]) => {
        setSummary(s);
        setDaily(d);
        setTop(t);
        setLowStock(l);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) return <Spinner label="Loading dashboard…" />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total revenue" value={money(summary.total_revenue)} hint={`${summary.total_transactions} transactions`} icon={<Wallet size={18} />} tone="green" />
        <StatCard label="Today" value={money(summary.todays_revenue)} hint={`${summary.todays_transactions} sales today`} icon={<Receipt size={18} />} tone="indigo" />
        <StatCard label="Est. profit" value={money(summary.estimated_profit)} hint="Based on cost price" icon={<TrendingUp size={18} />} tone="blue" />
        <StatCard label="Low stock items" value={summary.low_stock_count} hint={`${summary.total_products} products`} icon={<AlertTriangle size={18} />} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue trend" subtitle="Last 14 days" />
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
                <YAxis tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(value: number) => money(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Top products" subtitle="By quantity sold" />
          <div className="divide-y divide-slate-100">
            {top.length === 0 && <EmptyState title="No sales yet" />}
            {top.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.qty} sold</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-600">{money(item.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Low stock alerts" subtitle="Products at or below reorder level" action={<Package size={18} className="text-slate-400" />} />
        <div className="divide-y divide-slate-100">
          {lowStock.length === 0 && <EmptyState title="All good" description="No products are below their reorder level." />}
          {lowStock.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{item.name}</p>
                <p className="text-xs text-slate-400">{item.sku}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {item.stock_qty} / {item.reorder_level}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
