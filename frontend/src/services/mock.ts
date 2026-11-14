try { localStorage.getItem('t'); } catch {
  const mem: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', { value: { getItem: (k: string) => (k in mem ? mem[k] : null), setItem: (k: string, v: unknown) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; } } });
}
// Preview-only in-memory API so the UI works without the Laravel backend.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import type { Category, Product, StockMovement, User } from '../types';

type Body = Record<string, any>;
type Result = { status: number; data: any };
const DAY = 864e5, NOW = Date.now();
const iso = (d: number) => new Date(NOW - d * DAY).toISOString();
let user: User = { id: 1, name: 'Admin', email: 'admin@saristore.test' };
let settings: Body = { store_name: 'Aling Nena Sari-Sari Store', store_description: 'Your friendly neighborhood store.' };
let cats: Category[] = ['Snacks', 'Beverages', 'Canned Goods', 'Noodles', 'Biscuits', 'Personal Care', 'Household Products', 'Other'].map((n, i) => ({ id: i + 1, category_name: n, description: '', created_at: iso(30) }));
const cid = (n: string) => cats.find((c) => c.category_name === n)!.id;
const seed: [string, string, number, number, number][] = [['Piattos', 'Snacks', 20, 25, 15], ['Coca-Cola', 'Beverages', 20, 30, 10], ['Lucky Me Pancit Canton', 'Noodles', 15, 40, 15], ['Sardines', 'Canned Goods', 25, 20, 20], ['SkyFlakes', 'Biscuits', 10, 35, 10], ['Milo Sachet', 'Beverages', 12, 15, 20], ['Kopiko', 'Snacks', 2, 100, 30], ['Palmolive Soap', 'Personal Care', 25, 12, 15]];
let products: Product[] = seed.map(([n, c, price, qty, min], i) => ({ id: i + 1, category_id: cid(c), product_name: n, product_image: null, description: '', purchase_price: +(price * 0.8).toFixed(2), selling_price: price, quantity: qty, minimum_stock: min, created_at: iso(10 - i), updated_at: iso(i) }));
let moves: StockMovement[] = products.flatMap((p): Omit<StockMovement, 'id' | 'user_id'>[] => [
  { product_id: p.id, movement_type: 'IN', quantity: p.quantity + 5, remarks: 'Initial stock', movement_date: iso(7).slice(0, 10) },
  { product_id: p.id, movement_type: 'OUT', quantity: 5, remarks: 'Sold', movement_date: iso(2).slice(0, 10) },
]).map((m, i) => ({ id: i + 1, user_id: 1, ...m }));
let nextP = 100, nextC = 100, nextM = 1000;

const withCat = (p: Product) => ({ ...p, category: cats.find((c) => c.id === p.category_id) });
const withMove = (m: StockMovement) => ({ ...m, product: withCat(products.find((p) => p.id === m.product_id)!), user: { name: user.name } });
const paginate = <T,>(list: T[], page: any, per = 10) => ({ data: list.slice(((+page || 1) - 1) * per, (+page || 1) * per), current_page: +page || 1, last_page: Math.max(1, Math.ceil(list.length / per)) });
const lowOf = (p: Product) => p.quantity > 0 && p.quantity <= p.minimum_stock;
const ok = (data: unknown): Result => ({ status: 200, data });
const fail = (status: number, message: string, errors?: Record<string, string[]>): Result => ({ status, data: { message, errors } });
const num = (v: unknown) => (v === '' || v == null ? NaN : Number(v));

function filterProducts(list: Product[], q: Body) {
  const s = (q.search || '').toLowerCase();
  return list.filter((p) => (!s || p.product_name.toLowerCase().includes(s)) && (!q.category_id || String(p.category_id) === String(q.category_id)));
}
// Keep an uploaded picture visible for the session (the preview has no server to store it).
const pickImage = (b: Body, fallback: string | null = null) =>
  typeof File !== 'undefined' && b.product_image instanceof File && b.product_image.size > 0 ? URL.createObjectURL(b.product_image) : fallback;

function validateProduct(b: Body) {
  const e: Record<string, string[]> = {};
  if (!String(b.product_name || '').trim()) e.product_name = ['The product name field is required.'];
  if (!b.category_id) e.category_id = ['The category field is required.'];
  ['purchase_price', 'selling_price', 'quantity', 'minimum_stock'].forEach((k) => { if (!(num(b[k]) >= 0)) e[k] = [`The ${k.replace('_', ' ')} must be 0 or more.`]; });
  return Object.keys(e).length ? fail(422, 'The given data was invalid.', e) : null;
}
function filterMoves(q: Body) {
  const s = (q.search || '').toLowerCase();
  return moves.map(withMove).filter((m) => (!q.movement_type || m.movement_type === q.movement_type) && (!s || m.product!.product_name.toLowerCase().includes(s)) && (!q.category_id || String(m.product!.category_id) === String(q.category_id)) && (!q.from || m.movement_date >= q.from) && (!q.to || m.movement_date <= q.to)).sort((a, b) => b.id - a.id);
}
function stockMove(type: 'IN' | 'OUT', b: Body): Result {
  const p = products.find((x) => String(x.id) === String(b.product_id));
  const qty = num(b.quantity);
  if (!p) return fail(422, 'The given data was invalid.', { product_id: ['Select a valid product.'] });
  if (!(qty > 0)) return fail(422, 'The given data was invalid.', { quantity: ['Quantity must be greater than 0.'] });
  if (type === 'OUT' && qty > p.quantity) return fail(422, 'Not enough stock.', { quantity: [`Only ${p.quantity} in stock.`] });
  p.quantity += type === 'IN' ? qty : -qty; p.updated_at = new Date().toISOString();
  moves.push({ id: nextM++, product_id: p.id, user_id: 1, movement_type: type, quantity: qty, remarks: b.remarks || '', movement_date: b.movement_date });
  return ok({ message: 'Saved' });
}

function handle(config: InternalAxiosRequestConfig): Result {
  const url = (config.url || '').replace(/\/$/, '');
  const method = (config.method || 'get').toLowerCase();
  const q = config.params || {};
  let b: Body = {};
  if (config.data instanceof FormData) b = Object.fromEntries((config.data as FormData).entries());
  else if (typeof config.data === 'string') b = JSON.parse(config.data);
  const [, res, id] = url.match(/^\/([\w-]+)(?:\/(\d+))?$/) || [];
  const pid = id && +id;

  if (url === '/login' || url === '/register') return ok({ token: 'demo', user });
  if (url === '/logout') return ok({});
  if (url === '/user') return ok(user);
  if (url === '/settings') { if (method === 'put') { settings = { ...settings, ...b }; } return ok(settings); }
  if (url === '/profile') { user = { ...user, ...b }; return ok({ user }); }
  if (url === '/password') return ok({});
  if (url === '/stock-in') return stockMove('IN', b);
  if (url === '/stock-out') return stockMove('OUT', b);
  if (url === '/stock-movements') return ok(paginate(filterMoves({ movement_type: q.movement_type }), q.page));
  if (url === '/dashboard') {
    const by = (k: 'created_at' | 'updated_at') => [...products].sort((a, c) => +new Date(c[k] || 0) - +new Date(a[k] || 0)).slice(0, 5);
    return ok({ total_products: products.length, total_categories: cats.length, total_stock: products.reduce((s, p) => s + p.quantity, 0), low_stock_count: products.filter(lowOf).length,
      stock_overview: products.slice(0, 8).map((p) => ({ name: p.product_name.slice(0, 10), quantity: p.quantity })), recent_products: by('created_at'), low_stock: products.filter(lowOf), recently_updated: by('updated_at') });
  }
  if (url === '/reports/inventory') {
    const t = q.type; return ok(filterProducts(products, q).filter((p) => (t === 'current' ? p.quantity > 0 : t === 'out' ? p.quantity <= 0 : true)).map(withCat));
  }
  if (url === '/reports/low-stock') return ok(filterProducts(products, q).filter(lowOf).map(withCat));
  if (url === '/reports/stock-movements') return ok(filterMoves(q));

  if (res === 'products') {
    if (!id && method === 'get') {
      const list = filterProducts(products, q).sort((a, c) => { const k = (q.sort || 'created_at') as keyof Product; const av = a[k] as any, cv = c[k] as any; const r = av > cv ? 1 : av < cv ? -1 : 0; return q.dir === 'asc' ? r : -r; }).map(withCat);
      return ok(paginate(list, q.page, +q.per_page || 10));
    }
    if (!id && method === 'post') {
      const err = validateProduct(b); if (err) return err;
      const p: Product = { id: nextP++, product_image: pickImage(b), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), description: b.description || '', product_name: b.product_name, category_id: +b.category_id, purchase_price: num(b.purchase_price), selling_price: num(b.selling_price), quantity: num(b.quantity), minimum_stock: num(b.minimum_stock) };
      products.push(p); return ok(withCat(p));
    }
    if (id && method === 'post') {
      const err = validateProduct(b); if (err) return err;
      const p = products.find((x) => x.id === pid); if (!p) return fail(404, 'Product not found.');
      Object.assign(p, { product_image: pickImage(b, p.product_image ?? null), product_name: b.product_name, category_id: +b.category_id, description: b.description || '', purchase_price: num(b.purchase_price), selling_price: num(b.selling_price), quantity: num(b.quantity), minimum_stock: num(b.minimum_stock), updated_at: new Date().toISOString() });
      return ok(withCat(p));
    }
    if (id && method === 'delete') { products = products.filter((x) => x.id !== pid); moves = moves.filter((m) => m.product_id !== pid); return ok({}); }
  }
  if (res === 'categories') {
    if (!id && method === 'get') return ok(cats.map((c) => ({ ...c, products_count: products.filter((p) => p.category_id === c.id).length })));
    if (!id && method === 'post') { if (!String(b.category_name || '').trim()) return fail(422, 'Invalid.', { category_name: ['The category name field is required.'] }); const c: Category = { id: nextC++, category_name: b.category_name, description: b.description || '', created_at: new Date().toISOString() }; cats.push(c); return ok(c); }
    if (id && method === 'put') { const c = cats.find((x) => x.id === pid); if (!String(b.category_name || '').trim()) return fail(422, 'Invalid.', { category_name: ['The category name field is required.'] }); Object.assign(c!, b); return ok(c); }
    if (id && method === 'delete') {
      const has = products.some((p) => p.category_id === pid);
      if (has && !q.reassign_to) return fail(422, 'This category still has products. Reassign them first.');
      products.forEach((p) => { if (p.category_id === pid) p.category_id = +q.reassign_to; });
      cats = cats.filter((c) => c.id !== pid); return ok({});
    }
  }
  return fail(404, 'Not found.');
}

const mockAdapter: AxiosAdapter = (config) => new Promise((resolve, reject) => setTimeout(() => {
  try {
    const r = handle(config);
    if (r.status < 400) resolve({ data: r.data, status: r.status, statusText: 'OK', headers: {}, config });
    else reject({ isAxiosError: true, config, response: { status: r.status, data: r.data } });
  } catch (e) { reject(e); }
}, 200));

export default mockAdapter;
