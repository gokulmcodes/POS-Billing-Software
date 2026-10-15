import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiErrorMessage, categoriesApi } from "../../api";
import { Button, Card, Field, Input, Modal, Spinner, Textarea } from "../../components/ui";
import type { Category } from "../../types";

export default function Categories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await categoriesApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setShowForm(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (editing) {
        await categoriesApi.update(editing.id, { name, description });
      } else {
        await categoriesApi.create({ name, description });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    try {
      await categoriesApi.remove(category.id);
      load();
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Categories</h2>
          <p className="text-sm text-slate-500">Group products for easier management</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add category
        </Button>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((category) => (
              <div key={category.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{category.name}</p>
                  <p className="text-xs text-slate-400">{category.description || "No description"}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                    <Pencil size={15} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => remove(category)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-400">No categories yet.</p>}
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        title={editing ? "Edit category" : "Add category"}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" form="category-form">
              Save
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-3">
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <Field label="Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
