import { sql } from '@vercel/postgres'
import { getUserFromReq } from '../../lib/auth.js'

export default async function handler(req, res) {
  const user = await getUserFromReq(req)
  if (!user) return res.status(401).json({ ok: false, error: 'Please log in.' })

  // ---- LIST ----
  if (req.method === 'GET') {
    try {
      if (user.role === 'provider') {
        // Open requests for the provider's service IN THEIR CITY + everything they've taken.
        const city = (user.city || '').trim().toLowerCase()
        const { rows } = await sql`
          SELECT b.*, c.name AS customer_name, c.city AS customer_city,
                 c.area AS customer_area, c.mobile AS customer_mobile
          FROM bookings b JOIN users c ON c.id = b.customer_id
          WHERE (b.status = 'open' AND b.service = ${user.service}
                 AND LOWER(COALESCE(b.city,'')) = ${city})
             OR (b.provider_id = ${user.id})
          ORDER BY b.created_at DESC LIMIT 200`
        return res.status(200).json({ ok: true, bookings: rows })
      }
      // Customer: own bookings, with the assigned helper's contact once accepted.
      const { rows } = await sql`
        SELECT b.*, p.name AS provider_name, p.mobile AS provider_mobile, p.verified AS provider_verified
        FROM bookings b LEFT JOIN users p ON p.id = b.provider_id
        WHERE b.customer_id = ${user.id}
        ORDER BY b.created_at DESC LIMIT 200`
      return res.status(200).json({ ok: true, bookings: rows })
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message })
    }
  }

  // ---- CREATE (customers only) ----
  if (req.method === 'POST') {
    if (user.role !== 'customer')
      return res.status(403).json({ ok: false, error: 'Only customers can post a request.' })
    const { service, city, area, description, needed_by } = req.body || {}
    const svc = (service || '').toString().trim().slice(0, 60)
    const cty = (city || user.city || '').toString().trim().slice(0, 60)
    if (!svc) return res.status(400).json({ ok: false, error: 'Please choose a service.' })
    if (!cty) return res.status(400).json({ ok: false, error: 'Please enter your city.' })

    try {
      const { rows } = await sql`
        INSERT INTO bookings (customer_id, service, city, area, description, needed_by)
        VALUES (${user.id}, ${svc}, ${cty},
                ${(area || user.area || '').toString().slice(0, 80) || null},
                ${(description || '').toString().slice(0, 500) || null},
                ${(needed_by || 'Now').toString().slice(0, 40)})
        RETURNING *`
      const booking = rows[0]

      // Notify providers who offer this service IN THE SAME CITY.
      const place = [booking.area, booking.city].filter(Boolean).join(', ')
      await sql`
        INSERT INTO notifications (user_id, title, body, type, link)
        SELECT id, ${'New request: ' + svc},
               ${`${user.name} in ${place || booking.city} needs ${svc} (${booking.needed_by}).`},
               'booking_new', '/dashboard'
        FROM users
        WHERE role = 'provider' AND service = ${svc}
          AND LOWER(COALESCE(city,'')) = LOWER(${booking.city})`

      return res.status(201).json({ ok: true, booking })
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
