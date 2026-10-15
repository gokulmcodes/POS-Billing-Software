import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiErrorMessage, usersApi } from "../../api";
import { Badge, Button, Card, Field, Input, Modal, Select, Spinner } from "../../components/ui";
import type { Role, User } from "../../types";

const blank = { name: "", email: "", username: "", password: "", role: "staff" as Role, phone: "", active: true };

export default function Staff() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setShowForm(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, username: user.username, password: "", role: user.role, phone: user.phone ?? "", active: user.active });
    setShowForm(true);
  };

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (editing) {
        const payload: Record<string, unknown> = { name: form.name, email: form.email, username: form.username, role: form.role, phone: form.phone, active: form.active };
        if (form.password) payload.password = form.password;
        await usersApi.update(editing.id, payload);
      } else {
        await usersApi.create(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const remove = async (user: User) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    try {
      await usersApi.remove(user.id);
      load();
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Staff management</h2>
          <p className="text-sm text-slate-500">Admins manage everything; staff use the billing portal</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add staff
        </Button>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.username}</td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role === "admin" ? "indigo" : "slate"}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={user.active ? "green" : "red"}>{user.active ? "Active" : "Disabled"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => remove(user)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        title={editing ? "Edit staff" : "Add staff"}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" form="staff-form">
              Save
            </Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <Field label="Full name">
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => update("role", e.target.value)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="Username">
            <Input required value={form.username} onChange={(e) => update("username", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label={editing ? "New password (optional)" : "Password"}>
            <Input type="password" required={!editing} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} /> Active
          </label>
        </form>
      </Modal>
    </div>
  );
}
