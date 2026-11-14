import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronsLeft, ChevronsRight, FolderTree, LayoutDashboard, LogOut, Menu, Package, Settings, ArrowLeftRight, FileText, Store, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/stock', label: 'Stock Management', icon: ArrowLeftRight },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const { data: dash } = useFetch('/dashboard', { _: pathname });
  const title = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))?.label || 'SariStore';
  const lowCount = dash?.low_stock_count || 0;

  const Sidebar = ({ mobile }) => (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="rounded-xl bg-primary p-2 text-white"><Store size={20} /></div>
        {(mobile || !collapsed) && <span className="text-lg font-semibold text-primary">SariStore</span>}
        {mobile && <button className="ml-auto p-1" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={20} /></button>}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setDrawer(false)} title={label}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-green-50 text-primary border-l-4 border-primary' : 'text-muted hover:bg-slate-50 border-l-4 border-transparent'}`}>
            <Icon size={20} className="shrink-0" />
            {(mobile || !collapsed) && label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-100 p-3">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50">
          <LogOut size={20} className="shrink-0" />{(mobile || !collapsed) && 'Logout'}
        </button>
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-slate-50 lg:flex" aria-label="Toggle sidebar">
            {collapsed ? <ChevronsRight size={20} /> : <><ChevronsLeft size={20} />Collapse</>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 transition-[width] lg:block ${collapsed ? 'w-20' : 'w-64'}`}><Sidebar /></aside>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl"><Sidebar mobile /></div>
        </div>
      )}
      <div className={`transition-[padding] ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{title}</h1>
            <p className="hidden text-xs text-muted sm:block">{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button className="relative rounded-xl p-2 text-muted hover:bg-slate-100" onClick={() => navigate('/reports?tab=low')} aria-label={`${lowCount} low stock alerts`}>
            <Bell size={20} />
            {lowCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] text-white">{lowCount}</span>}
          </button>
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
              <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
            </button>
            {menu && (
              <div className="card absolute right-0 mt-2 w-48 p-1.5" onMouseLeave={() => setMenu(false)}>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setMenu(false); navigate('/settings'); }}>Settings</button>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-50" onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
