import { useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { useServices } from '../ServicesContext.jsx'

const EMPTY = { name: '', icon: '🛠️', blurb: '', eta: '', sort_order: 0, active: true }
const ROLE_ICON = { customer: '🙋', provider: '🧰', admin: '🛡️' }

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function AdminPanel({ onHome }) {
  const { user, logout } = useAuth()
  const { services, reload } = useServices()
  const [tab, setTab] = useState('services')
  const [leads, setLeads] = useState(null)
  const [people, setPeople] = useState(null)
  const [loadingList, setLoadingList] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  if (!user || user.role !== 'admin') {
    return (
      <div className="dash">
        <div className="wrap">
          <p className="empty">Admins only.</p>
        </div>
      </div>
    )
  }

  const set = (k) => (e) =>
    setForm({ ...form, [k]: k === 'active' ? e.target.checked : e.target.value })

  const say = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 3000)
  }

  const reset = () => {
    setForm(EMPTY)
    setEditingId(null)
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setForm({
      name: s.name || '',
      icon: s.icon || '🛠️',
      blurb: s.blurb || '',
      eta: s.eta || '',
      sort_order: s.sort_order ?? 0,
      active: s.active !== false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Service name is required.')
    setBusy(true)
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 }
      if (editingId) {
        await api.updateService(editingId, payload)
        say('Service updated.')
      } else {
        await api.createService(payload)
        say('Service added.')
      }
      reset()
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (s) => {
    setError('')
    try {
      await api.updateService(s.id, { active: !s.active })
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return
    setError('')
    try {
      await api.deleteService(s.id)
      if (editingId === s.id) reset()
      await reload()
      say('Service deleted.')
    } catch (err) {
      setError(err.message)
    }
  }

  const loadLeads = async () => {
    setError('')
    setLoadingList(true)
    try {
      setLeads(await api.adminSignups())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingList(false)
    }
  }

  const loadPeople = async () => {
    setError('')
    setLoadingList(true)
    try {
      setPeople(await api.adminUsers())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingList(false)
    }
  }

  const openTab = (t) => {
    setTab(t)
    if (t === 'leads' && !leads) loadLeads()
    if (t === 'users' && !people) loadPeople()
  }

  const refresh = () => {
    if (tab === 'leads') loadLeads()
    if (tab === 'users') loadPeople()
  }

  const tabCount = (t) => {
    if (t === 'services') return services.length
    if (t === 'leads') return leads ? leads.total : null
    return people ? people.users.length : null
  }

  return (
    <div className="dash">
      <div className="wrap">
        <div className="dash-top">
          <div>
            <h2>Admin</h2>
            <p className="sub">Signed in as {user.email}</p>
          </div>
          <div className="dash-actions">
            <button className="btn btn-ghost btn-sm" onClick={onHome}>View site</button>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
          </div>
        </div>

        <div className="adm-tabs">
          {[
            ['services', '🛠️ Services'],
            ['leads', '📝 Leads'],
            ['users', '👥 Accounts'],
          ].map(([key, label]) => {
            const n = tabCount(key)
            return (
              <button
                key={key}
                className={tab === key ? 'adm-tab on' : 'adm-tab'}
                onClick={() => openTab(key)}
              >
                {label}
                {n != null && <span className="adm-n">{n}</span>}
              </button>
            )
          })}
          {tab !== 'services' && (
            <button className="btn btn-ghost btn-sm adm-refresh" onClick={refresh} disabled={loadingList}>
              {loadingList ? 'Loading…' : 'Refresh'}
            </button>
          )}
        </div>

        {flash && <div className="flash">{flash}</div>}
        {error && <div className="err">{error}</div>}

        {tab === 'services' && (
          <>
            <form className="post-card admin-form" onSubmit={submit}>
              <h3 className="dash-h">{editingId ? 'Edit service' : 'Add a service'}</h3>
              <div className="admin-grid">
                <label className="ico-field">
                  Icon
                  <input value={form.icon} onChange={set('icon')} maxLength={4} placeholder="🛠️" />
                </label>
                <label>
                  Name
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Carpenter" maxLength={60} />
                </label>
                <label>
                  Short description
                  <input value={form.blurb} onChange={set('blurb')} placeholder="e.g. Doors, furniture, fittings" maxLength={140} />
                </label>
                <label>
                  Typical ETA
                  <input value={form.eta} onChange={set('eta')} placeholder="e.g. within 2 hrs" maxLength={40} />
                </label>
                <label className="num-field">
                  Sort order
                  <input type="number" value={form.sort_order} onChange={set('sort_order')} />
                </label>
                <label className="chk-field">
                  <input type="checkbox" checked={form.active} onChange={set('active')} /> Active
                </label>
              </div>
              <div className="admin-btns">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add service'}
                </button>
                {editingId && (
                  <button className="btn btn-ghost" type="button" onClick={reset}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <h3 className="dash-h">All services ({services.length})</h3>
            <div className="admin-list">
              {services.map((s) => (
                <div className={s.active === false ? 'admin-row off' : 'admin-row'} key={s.id ?? s.name}>
                  <span className="admin-ico">{s.icon}</span>
                  <div className="admin-main">
                    <b>{s.name}</b>
                    {s.active === false && <span className="pill-status st-cancelled">hidden</span>}
                    <span className="job-meta">{s.blurb}</span>
                    <span className="job-meta">⏱ {s.eta || '—'} · order {s.sort_order ?? 0}</span>
                  </div>
                  <div className="admin-row-btns">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(s)} disabled={s.id == null}>
                      {s.active === false ? 'Show' : 'Hide'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)} disabled={s.id == null}>
                      Edit
                    </button>
                    <button className="btn btn-ghost btn-sm danger" onClick={() => remove(s)} disabled={s.id == null}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'leads' && (
          <>
            <h3 className="dash-h">Landing-page leads {leads ? `(${leads.total})` : ''}</h3>
            {loadingList && !leads && <p className="empty">Loading leads…</p>}
            {leads && leads.signups.length === 0 && (
              <p className="empty">No leads yet — the landing form writes here.</p>
            )}
            <div className="admin-list">
              {leads?.signups.map((s) => (
                <div className="admin-row" key={s.id}>
                  <span className="admin-ico">📝</span>
                  <div className="admin-main">
                    <b>
                      {s.name}
                      <span className="pill-status st-open">{s.service || 'no service'}</span>
                    </b>
                    <span className="job-meta">📞 {s.mobile}{s.area ? ` · ${s.area}` : ''}</span>
                    {s.note && <span className="job-meta">“{s.note}”</span>}
                    <span className="job-meta">{fmtDate(s.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'users' && (
          <>
            {people && (
              <div className="adm-chips">
                {people.counts.map((c) => (
                  <span className="adm-chip" key={c.role}>
                    {ROLE_ICON[c.role] || '•'} {c.role}: <b>{c.total}</b>
                  </span>
                ))}
              </div>
            )}
            <h3 className="dash-h">Registered accounts {people ? `(${people.users.length})` : ''}</h3>
            {loadingList && !people && <p className="empty">Loading accounts…</p>}
            {people && people.users.length === 0 && <p className="empty">Nobody has signed up yet.</p>}
            <div className="admin-list">
              {people?.users.map((u) => (
                <div className="admin-row" key={u.id}>
                  <span className="admin-ico">{ROLE_ICON[u.role] || '•'}</span>
                  <div className="admin-main">
                    <b>
                      {u.name}
                      <span className="pill-status st-open">{u.role}</span>
                    </b>
                    <span className="job-meta">
                      ✉️ {u.email}
                      {u.mobile ? ` · 📞 ${u.mobile}` : ''}
                    </span>
                    <span className="job-meta">
                      📍 {[u.area, u.city].filter(Boolean).join(', ') || 'no location'}
                      {u.service ? ` · ${u.service}` : ''}
                    </span>
                    <span className="job-meta">joined {fmtDate(u.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
