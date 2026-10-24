import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Notifications() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  const load = async () => {
    if (!user) return
    try {
      const { notifications, unread } = await api.notifications()
      setItems(notifications)
      setUnread(unread)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!user) {
      setItems([])
      setUnread(0)
      return
    }
    load()
    const t = setInterval(load, 20000) // poll every 20s
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const onClick = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  const markAll = async () => {
    setUnread(0)
    setItems((p) => p.map((n) => ({ ...n, read: true })))
    try {
      await api.markRead({ all: true })
    } catch {
      /* ignore */
    }
  }
  const markOne = async (n) => {
    if (n.read) return
    setItems((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setUnread((u) => Math.max(0, u - 1))
    try {
      await api.markRead({ id: n.id })
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bell" ref={box}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="bell-drop">
          <div className="bell-head">
            <b>Notifications</b>
            {unread > 0 && (
              <button className="linkish" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          <div className="bell-list">
            {items.length === 0 && <p className="bell-empty">No notifications yet.</p>}
            {items.map((n) => (
              <button
                key={n.id}
                className={n.read ? 'bell-item' : 'bell-item unread'}
                onClick={() => markOne(n)}
              >
                <span className="bell-title">{n.title}</span>
                {n.body && <span className="bell-body">{n.body}</span>}
                <span className="bell-time">{timeAgo(n.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
