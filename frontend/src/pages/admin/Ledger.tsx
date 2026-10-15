import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiErrorMessage, ledgerApi } from "../../api";
import { Badge, Button, Card, Field, Input, Modal, Select, Spinner, cn, formatDate, money } from "../../components/ui";
import type { LedgerEntry } from "../../types";

const typeTone: Record<string, "green" | "red" | "amber" | "blue" | "slate" | "indigo"> = {
  sale: "green",
  purchase: "red",
  return: "amber",
  expense: "red",
  payment: "blue",
  adjustment: "indigo",
};

export default function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", description: "", debit: 0 });
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setEntries(await ledgerApi.list(filter || undefined));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const totals = useMemo(() => {
    const credit = entries.reduce((s, e) => s + e.credit, 0);
    const debit = entries.reduce((s, e) => s + e.debit, 0);
    return { credit, debit, balance: credit - debit };
  }, [entries]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await ledgerApi.create(form);
      setShowForm(false);
      setForm({ type: "expense", description: "", debit: 0 });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Ledger</h2>
          <p className="text-sm text-slate-500">Running account of sales, purchases, returns and expenses</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add entry
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase text-slate-400">Total credit</p>
          <p className="text-lg font-semibold text-emerald-600">{money(totals.credit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-slate-400">Total debit</p>
          <p className="text-lg font-semibold text-rose-600">{money(totals.debit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-slate-400">Balance</p>
          <p className="text-lg font-semibold text-slate-800">{money(totals.balance)}</p>
        </Card>
      </div>

      <Card className="p-3">
        <Select className="w-52" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All entries</option>
          <option value="sale">Sales</option>
          <option value="purchase">Purchases</option>
          <option value="return">Returns</option>
          <option value="expense">Expenses</option>
          <option value="adjustment">Adjustments</option>
        </Select>
      </Card>

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={typeTone[entry.type] ?? "slate"}>{entry.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {entry.description}
                      {entry.created_by_name && <span className="block text-xs text-slate-400">by {entry.created_by_name}</span>}
                    </td>
                    <td className={cn("px-4 py-3 text-right", entry.debit ? "text-rose-600" : "text-slate-300")}>{entry.debit ? money(entry.debit) : "—"}</td>
                    <td className={cn("px-4 py-3 text-right", entry.credit ? "text-emerald-600" : "text-slate-300")}>{entry.credit ? money(entry.credit) : "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{money(entry.balance)}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      No ledger entries.
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
        title="Add ledger entry"
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" form="ledger-form">
              Save
            </Button>
          </>
        }
      >
        <form id="ledger-form" onSubmit={save} className="space-y-3">
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="expense">Expense</option>
              <option value="payment">Payment</option>
              <option value="adjustment">Adjustment</option>
            </Select>
          </Field>
          <Field label="Description">
            <Input required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </Field>
          <Field label="Amount (debit)" hint="Enter the amount for this expense/payment">
            <Input type="number" step="0.01" value={form.debit} onChange={(e) => setForm((p) => ({ ...p, debit: Number(e.target.value) }))} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
