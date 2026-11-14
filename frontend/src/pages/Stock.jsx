import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import api, { errMsg, fieldErrors, rows } from '../services/api';
import useFetch from '../hooks/useFetch';
import { Empty, ErrorBox, Field, Pagination, Spinner, StatusBadge, fmtDate, toast } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);

export default function Stock() {
  const [type, setType] = useState('IN');
  const [form, setForm] = useState({ product_id: '', quantity: '', movement_date: today(), remarks: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const products = useFetch('/products', { per_page: 500, sort: 'product_name', dir: 'asc' });
  const history = useFetch('/stock-movements', { movement_type: filter, page });
  const productList = rows(products.data);
  const selected = productList.find((p) => String(p.id) === String(form.product_id));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.product_id) local.product_id = 'Select a product.';
    if (!(Number(form.quantity) > 0)) local.quantity = 'Enter a quantity greater than 0.';
    if (type === 'OUT' && selected && Number(form.quantity) > selected.quantity) local.quantity = `Only ${selected.quantity} in stock.`;
    if (!form.movement_date) local.movement_date = 'Choose a date.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await api.post(type === 'IN' ? '/stock-in' : '/stock-out', form);
      toast('success', type === 'IN' ? 'Stock added' : 'Stock removed');
      setForm({ product_id: '', quantity: '', movement_date: today(), remarks: '' });
      products.reload(); history.reload();
    } catch (err) { setErrors(fieldErrors(err)); toast('error', errMsg(err)); }
    finally { setBusy(false); }
  };

  const list = rows(history.data);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <form onSubmit={submit} className="card h-fit space-y-4 p-5" noValidate>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {[['IN', 'Stock In', ArrowDownToLine], ['OUT', 'Stock Out', ArrowUpFromLine]].map(([t, label, Icon]) => (
            <button type="button" key={t} onClick={() => { setType(t); setErrors({}); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${type === t ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
        <Field label="Product" error={errors.product_id}>
          <select className="input" value={form.product_id} onChange={set('product_id')}>
            <option value="">Select product</option>
            {productList.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
          </select>
        </Field>
        {selected && <p className="-mt-2 text-sm text-muted">Current stock: <span className="font-medium text-ink">{selected.quantity}</span></p>}
        <Field label="Quantity" error={errors.quantity}><input type="number" min="1" className="input" value={form.quantity} onChange={set('quantity')} /></Field>
        <Field label="Date" error={errors.movement_date}><input type="date" className="input" value={form.movement_date} onChange={set('movement_date')} /></Field>
        <Field label="Remarks (optional)" error={errors.remarks}><textarea rows="2" className="input" value={form.remarks} onChange={set('remarks')} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : type === 'IN' ? 'Record stock in' : 'Record stock out'}</button>
      </form>

      <div className="card overflow-hidden xl:col-span-2">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-semibold">Stock movement history</h2>
          <select className="input !w-36" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Filter movements">
            <option value="">All</option><option value="IN">Stock In</option><option value="OUT">Stock Out</option>
          </select>
        </div>
        {history.loading ? <Spinner /> : history.error ? <div className="p-4"><ErrorBox message={history.error} onRetry={history.reload} /></div> : !list.length ? (
          <Empty title="No movements yet" text="Stock in and stock out records will be listed here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>{['Date', 'Product', 'Type', 'Qty', 'Remarks', 'By'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="td whitespace-nowrap">{fmtDate(m.movement_date)}</td>
                    <td className="td font-medium">{m.product?.product_name}</td>
                    <td className="td"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.movement_type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{m.movement_type === 'IN' ? 'Stock In' : 'Stock Out'}</span></td>
                    <td className="td">{m.quantity}</td>
                    <td className="td text-muted">{m.remarks || '—'}</td>
                    <td className="td text-muted">{m.user?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={history.data} onPage={setPage} />
      </div>
    </div>
  );
}
