import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg, fieldErrors } from '../services/api';
import { Field } from '../components/ui';

export default function Login() {
  const { user, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (isRegister && !form.name.trim()) local.name = 'Enter your name.';
    if (isRegister ? !/\S+@\S+\.\S+/.test(form.email) : !form.email.trim()) local.email = isRegister ? 'Enter a valid email address.' : 'Enter your username.';
    if (!form.password) local.password = 'Enter your password.';
    else if (isRegister && form.password.length < 8) local.password = 'Password must be at least 8 characters.';
    if (isRegister && form.password !== form.password_confirmation) local.password_confirmation = 'Passwords do not match.';
    setErrors(local); setMessage('');
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      if (isRegister) await register(form); else await login(form.email, form.password);
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8" noValidate>
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="rounded-2xl bg-primary p-3 text-white"><Store size={28} /></div>
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
      </form>
    </div>
  );
}
