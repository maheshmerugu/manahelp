import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

export default function AdminLogin({ onDone, onHome }) {
  const { adminLogin } = useAuth()
  const [mode, setMode] = useState('account')
  const [form, setForm] = useState({ email: '', password: '', key: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const pick = (m) => {
    setMode(m)
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await adminLogin(
        mode === 'account'
          ? { email: form.email, password: form.password }
          : { email: form.email, key: form.key }
      )
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <button className="auth-home" onClick={onHome}>← Back to site</button>
        <span className="auth-logo">🛠️ Mana<b>Help</b> admin</span>
        <h2>Admin sign in</h2>
        <p className="sub">Manage services, read the leads and see who registered.</p>

        <div className="role-pick">
          <button type="button" className={mode === 'account' ? 'role on' : 'role'} onClick={() => pick('account')}>
            <span>👤</span> Admin account
            <small>email + password</small>
          </button>
          <button type="button" className={mode === 'key' ? 'role on' : 'role'} onClick={() => pick('key')}>
            <span>🔑</span> Admin key
            <small>one-code access</small>
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            Admin email
            <input
              value={form.email}
              onChange={set('email')}
              type="email"
              placeholder={mode === 'key' ? 'optional' : 'admin@yourdomain.in'}
              autoComplete="email"
            />
          </label>

          {mode === 'account' ? (
            <label>
              Password
              <input value={form.password} onChange={set('password')} type="password" autoComplete="current-password" />
            </label>
          ) : (
            <label>
              Admin key
              <input value={form.key} onChange={set('key')} type="password" placeholder="the ADMIN_KEY value" autoComplete="off" />
            </label>
          )}

          {error && <p className="err">{error}</p>}

          <button className="btn btn-primary wide" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : 'Enter admin area →'}
          </button>
        </form>

        <p className="auth-note">
          {mode === 'account'
            ? 'Any account whose role is admin, or whose email matches the ADMIN_EMAIL variable.'
            : 'Uses the ADMIN_KEY secret set in Vercel — works even before an admin account exists.'}
        </p>
        <p className="auth-alt">
          Not the owner? <button type="button" onClick={onHome}>Back to ManaHelp</button>
        </p>
      </div>
    </div>
  )
}
