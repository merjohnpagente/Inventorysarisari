import { useEffect, useState } from 'react';
import api, { errMsg, fieldErrors } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { Field, Spinner, toast } from '../components/ui';

function Section({ title, children }) {
  return <section className="card space-y-4 p-6"><h2 className="font-semibold">{title}</h2>{children}</section>;
}

function useForm(initial, submitFn, success) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e, validate) => {
    e.preventDefault();
    const local = validate ? validate(form) : {};
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try { await submitFn(form); toast('success', success); }
    catch (err) { setErrors(fieldErrors(err)); toast('error', errMsg(err)); }
    finally { setBusy(false); }
  };
  return { form, setForm, errors, busy, set, submit };
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const { data, loading } = useFetch('/settings');

  const store = useForm({ store_name: '', store_description: '' }, (f) => api.put('/settings', f), 'Store settings saved');
  useEffect(() => { if (data) store.setForm({ store_name: data.store_name || '', store_description: data.store_description || '' }); }, [data]); // eslint-disable-line

  const profile = useForm({ name: user?.name || '', email: user?.email || '' }, async (f) => { const r = await api.put('/profile', f); setUser(r.data.user || r.data); }, 'Profile updated');
  const pw = useForm({ current_password: '', password: '', password_confirmation: '' }, async (f) => {
    await api.put('/password', f);
    pw.setForm({ current_password: '', password: '', password_confirmation: '' });
  }, 'Password changed');

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6 stagger">
      <Section title="Store information">
        <form className="space-y-4" noValidate onSubmit={(e) => store.submit(e, (f) => (f.store_name.trim() ? {} : { store_name: 'Enter your store name.' }))}>
          <Field label="Store name" error={store.errors.store_name}><input className="input" value={store.form.store_name} onChange={store.set('store_name')} /></Field>
          <Field label="Store description" error={store.errors.store_description}><textarea rows="3" className="input" value={store.form.store_description} onChange={store.set('store_description')} /></Field>
          <button className="btn-primary" disabled={store.busy}>{store.busy ? 'Saving…' : 'Save changes'}</button>
        </form>
      </Section>

      <Section title="Admin profile">
        <form className="space-y-4" noValidate onSubmit={(e) => profile.submit(e, (f) => ({ ...(f.name.trim() ? {} : { name: 'Enter your name.' }), ...(/\S+@\S+\.\S+/.test(f.email) ? {} : { email: 'Enter a valid email address.' }) }))}>
          <Field label="Name" error={profile.errors.name}><input className="input" value={profile.form.name} onChange={profile.set('name')} /></Field>
          <Field label="Email" error={profile.errors.email}><input type="email" className="input" value={profile.form.email} onChange={profile.set('email')} /></Field>
          <button className="btn-primary" disabled={profile.busy}>{profile.busy ? 'Saving…' : 'Save changes'}</button>
        </form>
      </Section>

      <Section title="Change password">
        <form className="space-y-4" noValidate onSubmit={(e) => pw.submit(e, (f) => ({
          ...(f.current_password ? {} : { current_password: 'Enter your current password.' }),
          ...(f.password.length >= 8 ? {} : { password: 'Password must be at least 8 characters.' }),
          ...(f.password === f.password_confirmation ? {} : { password_confirmation: 'Passwords do not match.' }),
        }))}>
          <Field label="Current password" error={pw.errors.current_password}><input type="password" className="input" value={pw.form.current_password} onChange={pw.set('current_password')} autoComplete="current-password" /></Field>
          <Field label="New password" error={pw.errors.password}><input type="password" className="input" value={pw.form.password} onChange={pw.set('password')} autoComplete="new-password" /></Field>
          <Field label="Confirm new password" error={pw.errors.password_confirmation}><input type="password" className="input" value={pw.form.password_confirmation} onChange={pw.set('password_confirmation')} autoComplete="new-password" /></Field>
          <button className="btn-primary" disabled={pw.busy}>{pw.busy ? 'Saving…' : 'Change password'}</button>
        </form>
      </Section>
    </div>
  );
}
