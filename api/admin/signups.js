import { sql } from '@vercel/postgres'
import { getUserFromReq, isAdmin, apiError } from '../../lib/auth.js'

// GET /api/admin/signups — marketing leads captured by the landing-page form.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const user = await getUserFromReq(req)
  if (!isAdmin(user)) return res.status(403).json({ ok: false, error: 'Admins only.' })

  try {
    const [{ rows: signups }, { rows: totals }] = await Promise.all([
      sql`
        SELECT id, name, mobile, area, service, note, created_at
        FROM signups ORDER BY created_at DESC LIMIT 500`,
      sql`SELECT COUNT(*)::int AS total FROM signups`,
    ])
    return res.status(200).json({ ok: true, signups, total: totals[0].total })
  } catch (e) {
    return res.status(500).json({ ok: false, error: apiError(e) })
  }
}
