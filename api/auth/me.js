import { getUserFromReq, publicUser } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const user = await getUserFromReq(req)
  if (!user) return res.status(401).json({ ok: false, error: 'Not authenticated.' })
  return res.status(200).json({ ok: true, user: publicUser(user) })
}
