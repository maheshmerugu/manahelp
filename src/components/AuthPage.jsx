import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { useServices } from '../ServicesContext.jsx'
import { detectLocation } from '../geolocate.js'
import { CONFIG } from '../config.js'

export default function AuthPage({ mode, onSwitch, onDone, onHome }) {
  const { login, register } = useAuth()
  const { services } = useServices()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    city: '',
    area: '',
    role: 'customer',
    service: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loc, setLoc] = useState({ latitude: null, longitude: null })
  const [locStatus, setLocStatus] = useState('')
  const isReg = mode === 'register'

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const runDetect = async () => {
    setLocStatus('detecting')
    try {
      const found = await detectLocation()
      setLoc({ latitude: found.latitude, longitude: found.longitude })
      setForm((f) => ({
        ...f,
        city: found.city || f.city,
        area: found.area || f.area,
      }))
      setLocStatus(found.city ? `📍 ${found.city}` : '📍 Location captured')
    } catch (err) {
      setLocStatus(err.message)
    }
  }

  // On the sign-up form, try to capture the current location automatically.
  useEffect(() => {
    if (isReg) runDetect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isReg) await register({ ...form, latitude: loc.latitude, longitude: loc.longitude })
      else await login({ email: form.email, password: form.password })
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
        <button className="auth-home" onClick={onHome}>← Back to home</button>
        <span className="auth-logo">🤝 Mana<b>Help</b></span>
        <h2>{isReg ? 'Create your account' : 'Welcome back'}</h2>
        <p className="sub">
          {isReg
            ? `Join ${CONFIG.country}'s trusted help network — as a customer or a helper.`
            : 'Log in to post requests or find work near you.'}
        </p>

        <form onSubmit={submit}>
          {isReg && (
            <div className="role-pick">
              <button
                type="button"
                className={form.role === 'customer' ? 'role on' : 'role'}
                onClick={() => setForm({ ...form, role: 'customer' })}
              >
                <span>🙋</span> I need help
                <small>Customer</small>
              </button>
              <button
                type="button"
                className={form.role === 'provider' ? 'role on' : 'role'}
                onClick={() => setForm({ ...form, role: 'provider' })}
              >
                <span>🧰</span> I offer help
                <small>Service provider</small>
              </button>
            </div>
          )}

          {isReg && (
            <label>
              Full name
              <input value={form.name} onChange={set('name')} placeholder="e.g. Mahesh Merugu" autoComplete="name" />
            </label>
          )}

          <label>
            Email
            <input value={form.email} onChange={set('email')} type="email" placeholder="you@example.com" autoComplete="email" />
          </label>

          <label>
            Password
            <input value={form.password} onChange={set('password')} type="password" placeholder={isReg ? 'At least 6 characters' : 'Your password'} autoComplete={isReg ? 'new-password' : 'current-password'} />
          </label>

          {isReg && (
            <>
              <label>
                Mobile number
                <div className="phone">
                  <span className="cc">+91</span>
                  <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/[^\d]/g, '').slice(0, 10) })} placeholder="10-digit mobile" inputMode="numeric" autoComplete="tel" />
                </div>
              </label>
              <div className="loc-row">
                <button
                  type="button"
                  className="loc-btn"
                  onClick={runDetect}
                  disabled={locStatus === 'detecting'}
                >
                  {locStatus === 'detecting' ? '📍 Detecting…' : '📍 Use my current location'}
                </button>
                {locStatus && locStatus !== 'detecting' && (
                  <span className="loc-status">{locStatus}</span>
                )}
              </div>
              <label>
                City
                <input value={form.city} onChange={set('city')} placeholder="e.g. Hyderabad" />
              </label>
              <label>
                Your area / locality
                <input value={form.area} onChange={set('area')} placeholder="e.g. Kukatpally" />
              </label>
              {form.role === 'provider' && (
                <label>
                  Service you provide
                  <select value={form.service} onChange={set('service')}>
                    <option value="">Choose your skill…</option>
                    {services.filter((s) => s.name !== 'Emergency Guidance').map((s) => (
                      <option key={s.name} value={s.name}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          {error && <p className="err">{error}</p>}

          <button className="btn btn-primary wide" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : isReg ? 'Create account →' : 'Log in →'}
          </button>
        </form>

        <p className="auth-alt">
          {isReg ? 'Already have an account?' : "New to ManaHelp?"}{' '}
          <button type="button" onClick={onSwitch}>
            {isReg ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  )
}
