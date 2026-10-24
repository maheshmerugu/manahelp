import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { useServices } from '../ServicesContext.jsx'
import { CONFIG } from '../config.js'

const WHEN = ['Now', 'Today', 'Tomorrow']

function StatusPill({ s }) {
  return <span className={`pill-status st-${s}`}>{s}</span>
}

export default function Dashboard({ onHome }) {
  const { user, logout } = useAuth()
  const { services } = useServices()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [form, setForm] = useState({
    service: '',
    city: user.city || '',
    area: user.area || '',
    description: '',
    needed_by: 'Now',
  })

  const isProvider = user.role === 'provider'

  const load = async () => {
    setError('')
    try {
      const { bookings } = await api.bookings()
      setBookings(bookings)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const say = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 3500)
  }

  const postRequest = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.service) return setError('Choose a service.')
    if (!form.city.trim()) return setError('Enter your city so we can match nearby helpers.')
    try {
      await api.createBooking(form)
      setForm({ ...form, service: '', description: '', needed_by: 'Now' })
      await load()
      say(`Request posted! Helpers in ${form.city} are notified.`)
    } catch (e) {
      setError(e.message)
    }
  }

  const act = async (id, action, price) => {
    setError('')
    try {
      await api.updateBooking(id, { action, price })
      await load()
      say(action === 'accept' ? 'Request accepted. The customer is notified.' : 'Updated.')
    } catch (e) {
      setError(e.message)
    }
  }

  const openJobs = bookings.filter((b) => b.status === 'open')
  const myJobs = bookings.filter((b) => b.status !== 'open')

  return (
    <div className="dash">
      <div className="wrap">
        <div className="dash-top">
          <div>
            <h2>Hi, {user.name.split(' ')[0]} 👋</h2>
            <p className="sub">
              {isProvider
                ? `Helper · ${user.service || 'no service set'} · ${[user.area, user.city].filter(Boolean).join(', ') || CONFIG.country}`
                : `Customer · ${[user.area, user.city].filter(Boolean).join(', ') || CONFIG.country}`}
              {user.verified && <span className="vbadge">✓ Verified</span>}
            </p>
          </div>
          <div className="dash-actions">
            <button className="btn btn-ghost btn-sm" onClick={onHome}>View site</button>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
          </div>
        </div>

        {flash && <div className="flash">{flash}</div>}
        {error && <div className="err">{error}</div>}

        {isProvider ? (
          <>
            <h3 className="dash-h">Open requests near you</h3>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : openJobs.length === 0 ? (
              <p className="empty">No open {user.service} requests right now. New ones appear here instantly.</p>
            ) : (
              <div className="job-list">
                {openJobs.map((b) => (
                  <div className="job" key={b.id}>
                    <div className="job-main">
                      <b>{b.service}</b>
                      <span className="job-meta">📍 {[b.area, b.city, b.customer_area, b.customer_city].filter(Boolean).join(', ') || CONFIG.country} · ⏱ {b.needed_by}</span>
                      {b.description && <p className="job-desc">{b.description}</p>}
                      <span className="job-meta">by {b.customer_name}</span>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b.id, 'accept')}>
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="dash-h">My jobs</h3>
            {myJobs.length === 0 ? (
              <p className="empty">Jobs you accept will show up here.</p>
            ) : (
              <div className="job-list">
                {myJobs.map((b) => (
                  <div className="job" key={b.id}>
                    <div className="job-main">
                      <b>{b.service}</b> <StatusPill s={b.status} />
                      <span className="job-meta">📍 {[b.area, b.city].filter(Boolean).join(', ') || CONFIG.country} · {b.customer_name} · {b.customer_mobile || ''}</span>
                      {b.price != null && <span className="job-meta">💰 ₹{b.price}</span>}
                    </div>
                    {b.status === 'accepted' && (
                      <div className="job-btns">
                        <button className="btn btn-primary btn-sm" onClick={() => act(b.id, 'complete')}>Mark done</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => act(b.id, 'cancel')}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="post-card">
              <h3 className="dash-h">Post a request</h3>
              <form onSubmit={postRequest} className="post-form">
                <label>
                  Service
                  <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    <option value="">What do you need?</option>
                    {services.map((s) => (
                      <option key={s.name} value={s.name}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  City
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Hyderabad" />
                </label>
                <label>
                  Area
                  <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Kukatpally" />
                </label>
                <label className="wide-field">
                  Details
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Briefly describe the problem (optional)" />
                </label>
                <div className="fld">
                  <span className="fld-lbl">When</span>
                  <div className="chips">
                    {WHEN.map((w) => (
                      <button type="button" key={w} className={form.needed_by === w ? 'chip on' : 'chip'} onClick={() => setForm({ ...form, needed_by: w })}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" type="submit">Post request →</button>
              </form>
            </div>

            <h3 className="dash-h">My requests</h3>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : bookings.length === 0 ? (
              <p className="empty">You haven't posted any requests yet.</p>
            ) : (
              <div className="job-list">
                {bookings.map((b) => (
                  <div className="job" key={b.id}>
                    <div className="job-main">
                      <b>{b.service}</b> <StatusPill s={b.status} />
                      <span className="job-meta">📍 {[b.area, b.city].filter(Boolean).join(', ') || CONFIG.country} · ⏱ {b.needed_by}</span>
                      {b.description && <p className="job-desc">{b.description}</p>}
                      {b.provider_name && (
                        <span className="job-meta">
                          🧰 {b.provider_name} {b.provider_verified ? '✓' : ''} · {b.provider_mobile || ''}
                        </span>
                      )}
                      {b.price != null && <span className="job-meta">💰 ₹{b.price}</span>}
                    </div>
                    {(b.status === 'open' || b.status === 'accepted') && (
                      <div className="job-btns">
                        {b.status === 'accepted' && (
                          <button className="btn btn-primary btn-sm" onClick={() => act(b.id, 'complete')}>Mark done</button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => act(b.id, 'cancel')}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
