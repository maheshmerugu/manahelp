import { sql } from '@vercel/postgres'
import { getUserFromReq, isAdmin } from '../../lib/auth.js'

export default async function handler(req, res) {
  // ---- LIST ----
  if (req.method === 'GET') {
    const user = await getUserFromReq(req).catch(() => null)
    try {
      // Admins see everything (incl. inactive); the public sees active services only.
      const { rows } = isAdmin(user)
        ? await sql`SELECT * FROM services ORDER BY sort_order, id`
        : await sql`SELECT * FROM services WHERE active = true ORDER BY sort_order, id`
      return res.status(200).json({ ok: true, services: rows })
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message })
    }
  }

  // ---- CREATE (admin only) ----
  if (req.method === 'POST') {
    const user = await getUserFromReq(req)
    if (!isAdmin(user)) return res.status(403).json({ ok: false, error: 'Admins only.' })

    const { name, icon, blurb, eta, active, sort_order } = req.body || {}
    const nm = (name || '').toString().trim().slice(0, 60)
    if (!nm) return res.status(400).json({ ok: false, error: 'Service name is required.' })

    try {
      const { rows } = await sql`
        INSERT INTO services (name, icon, blurb, eta, active, sort_order)
        VALUES (${nm}, ${(icon || '🛠️').toString().slice(0, 8)},
                ${(blurb || '').toString().slice(0, 140) || null},
                ${(eta || '').toString().slice(0, 40) || null},
                ${active === false ? false : true},
                ${Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0})
        RETURNING *`
      return res.status(201).json({ ok: true, service: rows[0] })
    } catch (e) {
      if (e.code === '23505')
        return res.status(409).json({ ok: false, error: 'A service with that name already exists.' })
      return res.status(500).json({ ok: false, error: e.message })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
