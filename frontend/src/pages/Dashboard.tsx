import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FolderTree, Layers, Package } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useFetch from '../hooks/useFetch';
import { Empty, ErrorBox, Spinner, StatCard, StatusBadge, fmtDate } from '../components/ui';
import type { Dashboard as DashboardData, Product } from '../types';

const List = ({ title, items, render, link }: { title: string; items?: Product[]; render: (p: Product) => ReactNode; link?: string }) => (
  <div className="card p-5">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      {link && <Link to={link} className="text-sm text-primary hover:underline">View all</Link>}
    </div>
    {items?.length ? <ul className="divide-y divide-slate-100 stagger">{items.map(render)}</ul> : <Empty title="Nothing here yet" text="Items will appear as you add products and record stock." />}
  </div>
);

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch<DashboardData>('/dashboard');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const d = data || {};

  return (
    <div className="space-y-6 stagger">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Total Products" value={d.total_products ?? 0} />
        <StatCard icon={FolderTree} label="Total Categories" value={d.total_categories ?? 0} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={Layers} label="Total Stock Quantity" value={d.total_stock ?? 0} tone="bg-emerald-50 text-emerald-700" />
        <StatCard icon={AlertTriangle} label="Low Stock Products" value={d.low_stock_count ?? 0} tone="bg-amber-50 text-warn" />
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Stock Overview</h2>
        {d.stock_overview?.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.stock_overview}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} interval={0} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="quantity" name="Quantity" fill="#22C55E" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <Empty title="No stock data" text="Add products to see your stock levels here." />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <List title="Recent Products" link="/products" items={d.recent_products}
          render={(p) => <li key={p.id} className="flex justify-between py-2.5 text-sm"><span>{p.product_name}</span><span className="text-muted">{fmtDate(p.created_at)}</span></li>} />
        <List title="Low Stock Alerts" link="/reports?tab=low" items={d.low_stock}
          render={(p) => <li key={p.id} className="flex items-center justify-between py-2.5 text-sm"><span>{p.product_name} <span className="text-muted">({p.quantity} left)</span></span><StatusBadge product={p} /></li>} />
        <List title="Recently Updated" items={d.recently_updated}
          render={(p) => <li key={p.id} className="flex justify-between py-2.5 text-sm"><span>{p.product_name}</span><span className="text-muted">{fmtDate(p.updated_at)}</span></li>} />
      </div>
    </div>
  );
}
