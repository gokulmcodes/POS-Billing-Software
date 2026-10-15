import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiErrorMessage, suppliersApi } from "../../api";
import { Button, Card, Field, Input, Modal, Spinner, Textarea } from "../../components/ui";
import type { Supplier } from "../../types";

const blank = { name: "", contact_person: "", phone: "", email: "", address: "", gstin: "", notes: "", active: true };

export default function Suppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await suppliersApi.list(search || undefined));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setShowForm(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      gstin: supplier.gstin ?? "",
      notes: supplier.notes ?? "",
      active: supplier.active,
    });
    setShowForm(true);
  };

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (editing) {
        await suppliersApi.update(editing.id, form);
      } else {
        await suppliersApi.create(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const remove = async (supplier: Supplier) => {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;
    try {
      await suppliersApi.remove(supplier.id);
      load();
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Suppliers</h2>
          <p className="text-sm text-slate-500">Vendors you purchase stock from</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add supplier
        </Button>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search suppliers" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((supplier) => (
              <div key={supplier.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{supplier.name}</p>
                    <p className="text-xs text-slate-400">{supplier.contact_person || "—"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(supplier)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => remove(supplier)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <p>📞 {supplier.phone || "—"}</p>
                  <p>✉️ {supplier.email || "—"}</p>
                  <p>🧾 GSTIN: {supplier.gstin || "—"}</p>
                  <p className="truncate">📍 {supplier.address || "—"}</p>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-400">No suppliers found.</p>}
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        title={editing ? "Edit supplier" : "Add supplier"}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" form="supplier-form">
              Save
            </Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <Field label="Supplier name">
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Contact person">
            <Input value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="GSTIN">
            <Input value={form.gstin} onChange={(e) => update("gstin", e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
