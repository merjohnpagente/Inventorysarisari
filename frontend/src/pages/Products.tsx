import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Image as ImageIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { errMsg, fieldErrors, imgUrl, rows } from '../services/api';
import useFetch from '../hooks/useFetch';
import { Empty, ErrorBox, Field, Modal, Pagination, Spinner, StatusBadge, confirmDelete, fmtDate, peso, toast } from '../components/ui';
import type { Category, FormErrors, Paginated, Product } from '../types';

const blank = { product_name: '', category_id: '', purchase_price: '', selling_price: '', quantity: '', minimum_stock: '5', description: '' };
type FormState = typeof blank;
type ModalState = { mode: 'add' | 'edit' | 'view'; product?: Product } | null;

const toForm = (p?: Product): FormState => p ? {
  product_name: p.product_name, category_id: String(p.category_id), purchase_price: String(p.purchase_price), selling_price: String(p.selling_price),
  quantity: String(p.quantity), minimum_stock: String(p.minimum_stock), description: p.description || '',
} : blank;

function ProductForm({ product, categories, onSaved, onClose }: { product?: Product; categories: Category[]; onSaved: () => void; onClose: () => void }) {
  const editing = !!product;
  const [form, setForm] = useState<FormState>(toForm(product));
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local: FormErrors = {};
    if (!form.product_name.trim()) local.product_name = 'Enter a product name.';
    if (!form.category_id) local.category_id = 'Choose a category.';
    (['purchase_price', 'selling_price', 'quantity', 'minimum_stock'] as const).forEach((k) => {
      if (form[k] === '' || Number(form[k]) < 0) local[k] = 'Enter a number, 0 or higher.';
    });
    setErrors(local);
    if (Object.keys(local).length) return;
    const fd = new FormData();
    (['product_name', 'category_id', 'purchase_price', 'selling_price', 'quantity', 'minimum_stock', 'description'] as const).forEach((k) => fd.append(k, form[k] ?? ''));
    if (image) fd.append('product_image', image);
    if (editing) fd.append('_method', 'PUT');
    setBusy(true);
    try {
      await api.post(editing ? `/products/${product.id}` : '/products', fd);
      toast('success', editing ? 'Product updated' : 'Product added');
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast('error', errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Product name" error={errors.product_name}><input className="input" value={form.product_name} onChange={set('product_name')} /></Field>
      <Field label="Category" error={errors.category_id}>
        <select className="input" value={form.category_id} onChange={set('category_id')}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Purchase price (₱)" error={errors.purchase_price}><input type="number" step="0.01" min="0" className="input" value={form.purchase_price} onChange={set('purchase_price')} /></Field>
        <Field label="Selling price (₱)" error={errors.selling_price}><input type="number" step="0.01" min="0" className="input" value={form.selling_price} onChange={set('selling_price')} /></Field>
        <Field label={editing ? 'Stock quantity' : 'Initial stock'} error={errors.quantity}><input type="number" min="0" className="input" value={form.quantity} onChange={set('quantity')} /></Field>
        <Field label="Minimum stock level" error={errors.minimum_stock}><input type="number" min="0" className="input" value={form.minimum_stock} onChange={set('minimum_stock')} /></Field>
      </div>
      <Field label="Product image (optional)" error={errors.product_image}><input type="file" accept="image/*" className="input" onChange={(e) => setImage(e.target.files?.[0] ?? null)} /></Field>
      <Field label="Description (optional)" error={errors.description}><textarea rows={3} className="input" value={form.description} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>
      </div>
    </form>
  );
}

const Detail = ({ product: p }: { product: Product }) => (
  <div className="space-y-3 text-sm">
    {imgUrl(p.product_image) && <img src={imgUrl(p.product_image) ?? undefined} alt={p.product_name} className="h-40 w-full rounded-xl object-cover" />}
    <p className="text-lg font-semibold">{p.product_name}</p>
    <p className="text-muted">{p.description || 'No description.'}</p>
    <dl className="grid grid-cols-2 gap-3">
      {[['Product ID', p.id], ['Category', p.category?.category_name], ['Purchase price', peso(p.purchase_price)], ['Selling price', peso(p.selling_price)], ['Stock', p.quantity], ['Minimum stock', p.minimum_stock], ['Created', fmtDate(p.created_at)]].map(([k, v]) => (
        <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v ?? '—'}</dd></div>
      ))}
      <div><dt className="text-xs text-muted">Status</dt><dd><StatusBadge product={p} /></dd></div>
    </dl>
  </div>
);

export default function Products() {
  const [sp] = useSearchParams();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState(sp.get('category') || '');
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);
  const { data, loading, error, reload } = useFetch<Paginated<Product>>('/products', { search: q, category_id: category, sort, dir, page });
  const { data: catData } = useFetch('/categories');
  const categories = rows<Category>(catData);
  const list = rows<Product>(data);

  const remove = async (p: Product) => {
    if (!(await confirmDelete(`"${p.product_name}" and its stock history will be removed.`))) return;
    try { await api.delete(`/products/${p.id}`); toast('success', 'Product deleted'); reload(); }
    catch (e) { toast('error', errMsg(e)); }
  };
  const done = () => { setModal(null); reload(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-muted" />
          <input className="input !pl-10" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input lg:w-48" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
        </select>
        <select className="input lg:w-52" value={`${sort}:${dir}`} onChange={(e) => { const [s, d] = e.target.value.split(':'); setSort(s); setDir(d); }} aria-label="Sort products">
          <option value="created_at:desc">Newest first</option>
          <option value="product_name:asc">Name A–Z</option>
          <option value="product_name:desc">Name Z–A</option>
          <option value="selling_price:asc">Price: low to high</option>
          <option value="selling_price:desc">Price: high to low</option>
          <option value="quantity:asc">Stock: low to high</option>
          <option value="quantity:desc">Stock: high to low</option>
        </select>
        <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}><Plus size={18} />Add product</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : error ? <div className="p-4"><ErrorBox message={error} onRetry={reload} /></div> : !list.length ? (
          <Empty title="No products found" text={q || category ? 'Try a different search or category.' : 'Add your first product to start tracking stock.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>{['ID', 'Product', 'Category', 'Purchase', 'Selling', 'Stock', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence initial={false}>{list.map((p, i) => (
<motion.tr key={p.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }} transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.3 }} className="hover:bg-slate-50">
                    <td className="td text-muted">{p.id}</td>
                    <td className="td font-medium"><div className="flex items-center gap-3">{imgUrl(p.product_image) ? <img src={imgUrl(p.product_image) ?? undefined} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" loading="lazy" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300"><ImageIcon size={16} /></div>}<span>{p.product_name}</span></div></td>
                    <td className="td">{p.category?.category_name || '—'}</td>
                    <td className="td">{peso(p.purchase_price)}</td>
                    <td className="td">{peso(p.selling_price)}</td>
                    <td className="td">{p.quantity}</td>
                    <td className="td"><StatusBadge product={p} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-2 text-muted hover:bg-slate-100" onClick={() => setModal({ mode: 'view', product: p })} aria-label="View"><Eye size={16} /></button>
                        <button className="rounded-lg p-2 text-muted hover:bg-slate-100" onClick={() => setModal({ mode: 'edit', product: p })} aria-label="Edit"><Pencil size={16} /></button>
                        <button className="rounded-lg p-2 text-danger hover:bg-red-50" onClick={() => remove(p)} aria-label="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}</AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={data} onPage={setPage} />
      </div>

      <AnimatePresence>{modal && (<Modal key="modal" title={{ add: 'Add product', edit: 'Edit product', view: 'Product details' }[modal.mode]} onClose={() => setModal(null)}>
          {modal.mode === 'view' ? <Detail product={modal.product!} /> : <ProductForm product={modal.product} categories={categories} onSaved={done} onClose={() => setModal(null)} />}
        </Modal>)}</AnimatePresence>
    </div>
  );
}
