import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Printer, Search } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { rows } from '../services/api';
import { Empty, ErrorBox, Spinner, StatusBadge, fmtDate, peso } from '../components/ui';

const TABS = {
  total: { label: 'Total Products', url: '/reports/inventory', params: { type: 'total' } },
  current: { label: 'Current Stock', url: '/reports/inventory', params: { type: 'current' } },
  low: { label: 'Low Stock', url: '/reports/low-stock', params: {} },
  out: { label: 'Out of Stock', url: '/reports/inventory', params: { type: 'out' } },
  movements: { label: 'Stock Movements', url: '/reports/stock-movements', params: {} },
};
const productCols = [
  ['Product', (p) => p.product_name], ['Category', (p) => p.category?.category_name || ''], ['Purchase Price', (p) => p.purchase_price],
  ['Selling Price', (p) => p.selling_price], ['Quantity', (p) => p.quantity], ['Minimum Stock', (p) => p.minimum_stock],
];
const moveCols = [
  ['Date', (m) => m.movement_date], ['Product', (m) => m.product?.product_name || ''], ['Category', (m) => m.product?.category?.category_name || ''],
  ['Type', (m) => m.movement_type], ['Quantity', (m) => m.quantity], ['Remarks', (m) => m.remarks || ''],
];

export default function Reports() {
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(TABS[sp.get('tab')] ? sp.get('tab') : 'total');
  const [filters, setFilters] = useState({ search: '', category_id: '', from: '', to: '' });
  const t = TABS[tab];
  const isMove = tab === 'movements';
  const { data, loading, error, reload } = useFetch(t.url, { ...t.params, ...filters });
  const cats = useFetch('/categories');
  const list = rows(data);
  const cols = isMove ? moveCols : productCols;
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.map(([h]) => esc(h)).join(','), ...list.map((r) => cols.map(([, f]) => esc(f(r))).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `saristore-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        {Object.entries(TABS).map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === k ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-muted hover:bg-slate-50'}`}>{v.label}</button>
        ))}
      </div>

      <div className="no-print flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-muted" />
          <input className="input !pl-10" placeholder="Search product" value={filters.search} onChange={set('search')} />
        </div>
        <select className="input lg:w-48" value={filters.category_id} onChange={set('category_id')} aria-label="Filter by category">
          <option value="">All categories</option>
          {rows(cats.data).map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
        </select>
        <input type="date" className="input lg:w-44" value={filters.from} onChange={set('from')} aria-label="From date" />
        <input type="date" className="input lg:w-44" value={filters.to} onChange={set('to')} aria-label="To date" />
        <button className="btn-ghost" onClick={() => window.print()} disabled={!list.length}><Printer size={16} />Print</button>
        <button className="btn-primary" onClick={exportCsv} disabled={!list.length}><Download size={16} />Export CSV</button>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold">{t.label} Report</h2>
          <p className="text-sm text-muted">Generated {fmtDate(new Date())} · {list.length} record{list.length === 1 ? '' : 's'}</p>
        </div>
        {loading ? <Spinner /> : error ? <div className="p-4"><ErrorBox message={error} onRetry={reload} /></div> : !list.length ? (
          <Empty title="No records match" text="Adjust the filters or date range to see results." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>{cols.map(([h]) => <th key={h} className="th">{h}</th>)}{!isMove && <th className="th">Status</th>}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence initial={false}>{list.map((r, i) => (
<motion.tr key={r.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }} transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.3 }}>
                    {cols.map(([h, f]) => <td key={h} className="td">{h.includes('Price') ? peso(f(r)) : h === 'Date' ? fmtDate(f(r)) : f(r)}</td>)}
                    {!isMove && <td className="td"><StatusBadge product={r} /></td>}
                  </motion.tr>
                ))}</AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
