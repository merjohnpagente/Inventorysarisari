import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { errMsg, fieldErrors, rows } from '../services/api';
import useFetch from '../hooks/useFetch';
import { Empty, ErrorBox, Field, Modal, Spinner, confirmDelete, toast } from '../components/ui';
import type { Category, FormErrors } from '../types';

function CategoryForm({ category, onSaved, onClose }: { category?: Category; onSaved: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ category_name: category?.category_name || '', description: category?.description || '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.category_name.trim()) return setErrors({ category_name: 'Enter a category name.' });
    setBusy(true);
    try {
      if (category) await api.put(`/categories/${category.id}`, form); else await api.post('/categories', form);
      toast('success', category ? 'Category updated' : 'Category added');
      onSaved();
    } catch (err) { setErrors(fieldErrors(err)); toast('error', errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Category name" error={errors.category_name}><input className="input" value={form.category_name} onChange={(e) => setForm({ ...form, category_name: e.target.value })} /></Field>
      <Field label="Description (optional)" error={errors.description}><textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : category ? 'Save changes' : 'Add category'}</button>
      </div>
    </form>
  );
}

export default function Categories() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ category?: Category } | null>(null);
  const { data, loading, error, reload } = useFetch('/categories');
  const all = rows<Category>(data);
  const list = all.filter((c) => c.category_name.toLowerCase().includes(search.toLowerCase()));

  const remove = async (c: Category) => {
    try {
      if ((c.products_count ?? 0) > 0) {
        const others = all.filter((x) => x.id !== c.id);
        const options = Object.fromEntries(others.map((x) => [x.id, x.category_name]));
        const res = await Swal.fire({
          title: `Reassign ${c.products_count} product(s)`,
          text: `"${c.category_name}" still has products. Choose where to move them before deleting.`,
          input: 'select', inputOptions: options as Record<string, string>, inputPlaceholder: 'Select category',
          showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Reassign and delete',
          inputValidator: (v) => (v ? undefined : 'Choose a category to move the products to.'),
        });
        if (!res.isConfirmed) return;
        await api.delete(`/categories/${c.id}`, { params: { reassign_to: res.value } });
      } else {
        if (!(await confirmDelete(`Category "${c.category_name}" will be removed.`))) return;
        await api.delete(`/categories/${c.id}`);
      }
      toast('success', 'Category deleted');
      reload();
    } catch (e) { toast('error', errMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-muted" />
          <input className="input !pl-10" placeholder="Search categories" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => setModal({})}><Plus size={18} />Add category</button>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : !list.length ? (
        <div className="card"><Empty title="No categories found" text={search ? 'Try a different search.' : 'Add a category to organize your products.'}>{!search && <button className="btn-primary mt-3" onClick={() => setModal({})}><Plus size={18} />Add category</button>}</Empty></div>
      ) : (
        <div className="grid gap-4 stagger sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <div key={c.id} className="card card-hover flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{c.category_name}</h3>
                  {c.description && <p className="text-sm text-muted">{c.description}</p>}
                </div>
                <div className="flex shrink-0">
                  <button className="rounded-lg p-2 text-muted hover:bg-slate-100" onClick={() => setModal({ category: c })} aria-label="Edit"><Pencil size={16} /></button>
                  <button className="rounded-lg p-2 text-danger hover:bg-red-50" onClick={() => remove(c)} aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <Link to={`/products?category=${c.id}`} className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Package size={16} />{c.products_count ?? 0} product{c.products_count === 1 ? '' : 's'}
              </Link>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>{modal && (<Modal key="modal" title={modal.category ? 'Edit category' : 'Add category'} onClose={() => setModal(null)}>
          <CategoryForm category={modal.category} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />
        </Modal>)}</AnimatePresence>
    </div>
  );
}
