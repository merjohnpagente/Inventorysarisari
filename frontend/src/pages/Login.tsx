import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, useAnimationControls } from 'motion/react';
import { Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg, fieldErrors } from '../services/api';
import { Field } from '../components/ui';
import { playSound } from '../services/sound';
import type { FormErrors } from '../types';

export default function Login() {
  const { user, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const controls = useAnimationControls();
  const shake = () => { playSound('error'); return controls.start({ x: [0, -10, 10, -8, 8, 0], transition: { duration: 0.4 } }); };
  if (user) return <Navigate to="/" replace />;

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local: FormErrors = {};
    if (isRegister && !form.name.trim()) local.name = 'Enter your name.';
    if (isRegister ? !/\S+@\S+\.\S+/.test(form.email) : !form.email.trim()) local.email = isRegister ? 'Enter a valid email address.' : 'Enter your username.';
    if (!form.password) local.password = 'Enter your password.';
    else if (isRegister && form.password.length < 8) local.password = 'Password must be at least 8 characters.';
    if (isRegister && form.password !== form.password_confirmation) local.password_confirmation = 'Passwords do not match.';
    setErrors(local); setMessage('');
    if (Object.keys(local).length) { shake(); return; }
    setBusy(true);
    try {
      if (isRegister) await register(form); else await login(form.email, form.password);
      playSound('success');
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage(errMsg(err));
      shake();
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary p-12 text-white lg:flex">
        <div className="flex items-center gap-3"><Store size={24} /><span className="text-lg font-semibold">SariStore</span></div>
        <div className="max-w-md">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">Know what is on your shelf before it runs out.</h2>
          <p className="mt-4 text-green-100">Track products, record stock in and out, and spot low items at a glance. Made for small sari-sari stores.</p>
        </div>
        <svg viewBox="0 0 480 150" className="w-full max-w-md" fill="none" stroke="#86EFAC" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 142h464M8 76h464" />
          <rect x="24" y="36" width="34" height="40" rx="4" /><rect x="66" y="22" width="30" height="54" rx="4" /><rect x="104" y="44" width="44" height="32" rx="4" />
          <rect x="176" y="30" width="26" height="46" rx="13" /><rect x="210" y="30" width="26" height="46" rx="13" /><rect x="244" y="40" width="52" height="36" rx="4" />
          <rect x="330" y="26" width="40" height="50" rx="4" /><rect x="378" y="38" width="34" height="38" rx="4" /><rect x="420" y="20" width="32" height="56" rx="4" />
          <rect x="24" y="100" width="56" height="42" rx="4" /><rect x="90" y="108" width="36" height="34" rx="4" /><rect x="150" y="96" width="30" height="46" rx="15" />
          <rect x="196" y="104" width="64" height="38" rx="4" /><rect x="290" y="98" width="38" height="44" rx="4" /><rect x="340" y="110" width="50" height="32" rx="4" /><rect x="404" y="94" width="48" height="48" rx="4" />
        </svg>
      </aside>
      <div className="flex items-center justify-center p-4 sm:p-8">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}>
      <motion.form animate={controls} onSubmit={submit} className="card w-full space-y-4 p-8" noValidate>
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="rounded-2xl bg-primary p-3 text-white lg:hidden"><Store size={28} /></div>
          <h1 className="text-xl font-semibold text-primary">SariStore</h1>
          <p className="text-sm text-muted">{isRegister ? 'Create the administrator account' : 'Sign in to manage your inventory'}</p>
        </div>
        {import.meta.env.VITE_MOCK && <p className="rounded-xl bg-green-50 p-3 text-sm text-primary">Preview mode: enter any username and password.</p>}
        {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-danger" role="alert">{message}</p>}
        {isRegister && <Field label="Name" error={errors.name}><input className="input" placeholder="Enter name" value={form.name} onChange={set('name')} autoComplete="name" /></Field>}
        <Field label={isRegister ? 'Email' : 'Username'} error={errors.email}><input type={isRegister ? 'email' : 'text'} className="input" placeholder={isRegister ? 'Enter email' : 'Enter username'} value={form.email} onChange={set('email')} autoComplete={isRegister ? 'email' : 'username'} /></Field>
        <Field label="Password" error={errors.password}><input type="password" className="input" placeholder="Enter password" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} /></Field>
        {isRegister && <Field label="Confirm password" error={errors.password_confirmation}><input type="password" className="input" placeholder="Confirm password" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        <button type="button" className="w-full text-center text-sm text-muted hover:text-primary" onClick={() => { setIsRegister(!isRegister); setErrors({}); setMessage(''); }}>
          {isRegister ? 'Back to sign in' : 'Initial setup? Create admin account'}
        </button>
      </motion.form>
      </motion.div>
      </div>
    </div>
  );
}
