import { sql } from '@vercel/postgres'
import { getUserFromReq } from '../../lib/auth.js'

export default async function handler(req, res) {
  const user = await getUserFromReq(req)
  if (!user) return res.status(401).json({ ok: false, error: 'Please log in.' })

  // ---- LIST ----
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT id, title, body, type, link, read, created_at
        FROM notifications WHERE user_id = ${user.id}
        ORDER BY created_at DESC LIMIT 100`
      const unread = rows.filter((n) => !n.read).length
      return res.status(200).json({ ok: true, unread, notifications: rows })
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message })
    }
  }

  // ---- MARK READ ----
  if (req.method === 'POST') {
    const { id, all } = req.body || {}
    try {
      if (all) {
        await sql`UPDATE notifications SET read = true WHERE user_id = ${user.id} AND read = false`
      } else if (id) {
        await sql`UPDATE notifications SET read = true WHERE id = ${Number(id)} AND user_id = ${user.id}`
      } else {
        return res.status(400).json({ ok: false, error: 'Provide id or all:true.' })
      }
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
