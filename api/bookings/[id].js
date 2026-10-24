import { sql } from '@vercel/postgres'
import { getUserFromReq, notify, apiError } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  const user = await getUserFromReq(req)
  if (!user) return res.status(401).json({ ok: false, error: 'Please log in.' })

  const id = Number(req.query.id)
  const { action, price } = req.body || {}
  if (!id) return res.status(400).json({ ok: false, error: 'Missing booking id.' })

  try {
    const { rows } = await sql`
      SELECT b.*, c.name AS customer_name, c.mobile AS customer_mobile
      FROM bookings b JOIN users c ON c.id = b.customer_id WHERE b.id = ${id}`
    const b = rows[0]
    if (!b) return res.status(404).json({ ok: false, error: 'Booking not found.' })

    // ---- PROVIDER ACCEPTS AN OPEN REQUEST ----
    if (action === 'accept') {
      if (user.role !== 'provider')
        return res.status(403).json({ ok: false, error: 'Only helpers can accept a request.' })
      if (b.status !== 'open')
        return res.status(409).json({ ok: false, error: 'This request is no longer open.' })
      const { rows: up } = await sql`
        UPDATE bookings SET provider_id = ${user.id}, status = 'accepted', updated_at = now()
        WHERE id = ${id} AND status = 'open' RETURNING *`
      if (!up.length) return res.status(409).json({ ok: false, error: 'Someone just took this request.' })
      await notify(b.customer_id, {
        title: `${user.name} accepted your request ✅`,
        body: `Your ${b.service} request is confirmed. Contact: ${user.mobile || 'via ManaHelp chat'}.`,
        type: 'booking_accepted',
        link: '/dashboard',
      })
      return res.status(200).json({ ok: true, booking: up[0] })
    }

    // ---- COMPLETE (either party, only when accepted) ----
    if (action === 'complete') {
      const involved = b.customer_id === user.id || b.provider_id === user.id
      if (!involved) return res.status(403).json({ ok: false, error: 'Not your booking.' })
      if (b.status !== 'accepted')
        return res.status(409).json({ ok: false, error: 'Only an accepted request can be completed.' })
      const p = price != null && price !== '' ? Number(price) : null
      const { rows: up } = await sql`
        UPDATE bookings SET status = 'completed', price = COALESCE(${p}, price), updated_at = now()
        WHERE id = ${id} RETURNING *`
      const other = user.id === b.customer_id ? b.provider_id : b.customer_id
      if (other)
        await notify(other, {
          title: 'Job marked complete 🎉',
          body: `The ${b.service} job is done${p ? ` at ₹${p}` : ''}. Thanks for using ManaHelp!`,
          type: 'booking_completed',
          link: '/dashboard',
        })
      return res.status(200).json({ ok: true, booking: up[0] })
    }

    // ---- CANCEL (customer, or assigned provider) ----
    if (action === 'cancel') {
      const allowed = b.customer_id === user.id || b.provider_id === user.id
      if (!allowed) return res.status(403).json({ ok: false, error: 'Not your booking.' })
      if (b.status === 'completed' || b.status === 'cancelled')
        return res.status(409).json({ ok: false, error: `Already ${b.status}.` })
      const { rows: up } = await sql`
        UPDATE bookings SET status = 'cancelled', updated_at = now() WHERE id = ${id} RETURNING *`
      const other = user.id === b.customer_id ? b.provider_id : b.customer_id
      if (other)
        await notify(other, {
          title: 'A request was cancelled',
          body: `The ${b.service} request was cancelled by ${user.name}.`,
          type: 'booking_cancelled',
          link: '/dashboard',
        })
      return res.status(200).json({ ok: true, booking: up[0] })
    }

    return res.status(400).json({ ok: false, error: 'Unknown action.' })
  } catch (e) {
    return res.status(500).json({ ok: false, error: apiError(e) })
  }
}
