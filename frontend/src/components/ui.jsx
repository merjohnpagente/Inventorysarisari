import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Swal from 'sweetalert2';
import { X, Loader2, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export const toast = (icon, title) =>
  Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true }).fire({ icon, title });

export const confirmDelete = (text) =>
  Swal.fire({ title: 'Delete this item?', text, icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' }).then((r) => r.isConfirmed);

export const peso = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export const stockStatus = (p) => (Number(p.quantity) <= 0 ? 'out' : Number(p.quantity) <= Number(p.minimum_stock) ? 'low' : 'in');
const STATUS = { in: ['In Stock', 'bg-green-100 text-green-800'], low: ['Low Stock', 'bg-amber-100 text-amber-800'], out: ['Out of Stock', 'bg-red-100 text-red-800'] };
export const StatusBadge = ({ product }) => {
  const [label, cls] = STATUS[stockStatus(product)];
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
};

export const Spinner = () => (
  <div className="space-y-3 p-5" role="status" aria-label="Loading">
    {[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-10 rounded-xl" style={{ animationDelay: `${i * 120}ms` }} />)}
  </div>
);

export const Empty = ({ title, text, children }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center anim-fade">
    <Inbox className="text-slate-300" size={40} />
    <p className="font-medium">{title}</p>
    {text && <p className="max-w-xs text-sm text-muted">{text}</p>}
    {children}
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="card flex items-center justify-between gap-3 p-4 text-sm text-danger">
    <span>{message}</span>
    {onRetry && <button className="btn-ghost" onClick={onRetry}>Try again</button>}
  </div>
);

export const Modal = ({ title, onClose, children }) => (
  <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <motion.div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" role="dialog" aria-modal="true" aria-label={title}
      initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 24, stiffness: 320 }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export const Field = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
  </label>
);

export const Pagination = ({ meta, onPage }) => {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <div className="no-print flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-muted">
      <span>Page {meta.current_page} of {meta.last_page}</span>
      <div className="flex gap-2">
        <button className="btn-ghost !px-3 !py-1.5" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
        <button className="btn-ghost !px-3 !py-1.5" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = Number(target) || 0;
    let raf, start;
    const step = (ts) => {
      start ??= ts;
      const p = Math.min((ts - start) / ms, 1);
      setV(Math.round(t * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export const StatCard = ({ icon: Icon, label, value, tone = 'text-primary bg-green-50' }) => {
  const shown = useCountUp(value);
  return (
    <motion.div className="card group flex items-center gap-4 p-5" whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <div className={`rounded-xl p-3 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${tone}`}><Icon size={22} /></div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{shown}</p>
      </div>
    </motion.div>
  );
};
