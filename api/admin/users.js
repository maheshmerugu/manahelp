import { sql } from '@vercel/postgres'
import { getUserFromReq, isAdmin } from '../../lib/auth.js'

// GET /api/admin/users — every registered account, newest first.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const user = await getUserFromReq(req)
  if (!isAdmin(user)) return res.status(403).json({ ok: false, error: 'Admins only.' })

  try {
    const [{ rows: users }, { rows: counts }] = await Promise.all([
      sql`
        SELECT id, name, email, mobile, role, city, area, service, verified, created_at
        FROM users ORDER BY created_at DESC LIMIT 500`,
      sql`SELECT role, COUNT(*)::int AS total FROM users GROUP BY role`,
    ])
    return res.status(200).json({ ok: true, users, counts })
  } catch (e) {
    if (e.code === '42703')
      return res.status(500).json({
        ok: false,
        error: 'The users table is missing the city / area / service columns — run db/migrate.sql once in the Postgres editor.',
      })
    return res.status(500).json({ ok: false, error: e.message })
  }
}
