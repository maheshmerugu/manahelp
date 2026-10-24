import { sql } from '@vercel/postgres'
import { getUserFromReq, isAdmin } from '../../lib/auth.js'

export default async function handler(req, res) {
  const user = await getUserFromReq(req)
  if (!isAdmin(user)) return res.status(403).json({ ok: false, error: 'Admins only.' })

  const id = Number(req.query.id)
  if (!id) return res.status(400).json({ ok: false, error: 'Missing service id.' })

  try {
    const { rows } = await sql`SELECT * FROM services WHERE id = ${id}`
    const cur = rows[0]
    if (!cur) return res.status(404).json({ ok: false, error: 'Service not found.' })

    // ---- DELETE ----
    if (req.method === 'DELETE') {
      await sql`DELETE FROM services WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    // ---- UPDATE ----
    if (req.method === 'PATCH') {
      const b = req.body || {}
      const name = b.name !== undefined ? (b.name || '').toString().trim().slice(0, 60) : cur.name
      if (!name) return res.status(400).json({ ok: false, error: 'Service name cannot be empty.' })
      const icon = b.icon !== undefined ? (b.icon || '🛠️').toString().slice(0, 8) : cur.icon
      const blurb = b.blurb !== undefined ? (b.blurb || '').toString().slice(0, 140) || null : cur.blurb
      const eta = b.eta !== undefined ? (b.eta || '').toString().slice(0, 40) || null : cur.eta
      const active = b.active !== undefined ? !!b.active : cur.active
      const sort_order =
        b.sort_order !== undefined && Number.isFinite(Number(b.sort_order))
          ? Number(b.sort_order)
          : cur.sort_order

      const { rows: up } = await sql`
        UPDATE services
        SET name = ${name}, icon = ${icon}, blurb = ${blurb}, eta = ${eta},
            active = ${active}, sort_order = ${sort_order}
        WHERE id = ${id} RETURNING *`
      return res.status(200).json({ ok: true, service: up[0] })
    }

    res.setHeader('Allow', 'PATCH,DELETE')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ ok: false, error: 'A service with that name already exists.' })
    return res.status(500).json({ ok: false, error: e.message })
  }
}
