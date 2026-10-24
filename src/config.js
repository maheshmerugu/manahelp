export const CONFIG = {
  productName: 'ManaHelp',
  country: 'India',
  email: 'help@manahelp.in',
  responseTime: '15 min',
}

// Posts a signup to the Vercel Postgres-backed serverless function.
// Resolves { ok, error?, duplicate? }.
export async function submitSignup(payload) {
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return await res.json()
  } catch (e) {
    return { ok: false, error: 'Network error. Please try again.' }
  }
}

export const SERVICES = [
  { icon: '🔧', name: 'Plumber', blurb: 'Leaks, taps, fittings, bathroom fixes', eta: 'within 45 min' },
  { icon: '💡', name: 'Electrician', blurb: 'Wiring, switches, fans, inverter issues', eta: 'within 45 min' },
  { icon: '🧹', name: 'Home Cleaning', blurb: 'Deep clean, kitchen, bathroom, sofa', eta: 'same day' },
  { icon: '🛵', name: 'Bike & Car Repair', blurb: 'Doorstep service, puncture, battery', eta: 'within 60 min' },
  { icon: '❄️', name: 'AC & Appliance Service', blurb: 'AC, fridge, washing machine repair', eta: 'same day' },
  { icon: '📚', name: 'Home Tutors', blurb: '1st–10th, intermediate, competitive exams', eta: 'within 24 hrs' },
  { icon: '🛒', name: 'Grocery & Medicine Runs', blurb: 'Groceries, pharmacy, documents pickup', eta: 'within 90 min' },
  { icon: '🧓', name: 'Elder Care Assist', blurb: 'Hospital accompaniment, daily check-ins', eta: 'same day' },
  { icon: '🐶', name: 'Pet Care', blurb: 'Feeding visits, walks, vet drops', eta: 'same day' },
  { icon: '📦', name: 'Packing & Moving', blurb: 'Within-city shifting with helpers', eta: 'within 24 hrs' },
  { icon: '💇', name: 'Salon at Home', blurb: 'Haircut, facial, mehndi for women & men', eta: 'within 2 hrs' },
  { icon: '🚨', name: 'Emergency Guidance', blurb: 'Free step-by-step help till help arrives', eta: 'instant' },
]

export const STEPS = [
  {
    n: '1',
    title: 'Tell us what you need',
    text: 'Create a free account, pick a service and describe what you need. No app to install.',
  },
  {
    n: '2',
    title: 'Get matched nearby',
    text: `We ping verified helpers in your city — anywhere in ${CONFIG.country} — and confirm the first free one.`,
  },
  {
    n: '3',
    title: 'Pay after the job',
    text: 'See the price before work starts. Pay by UPI or cash only when you are happy.',
  },
]

export const TESTIMONIALS = [
  {
    quote:
      'Posted a request at 9 pm for a leaking tap. Helper reached in 40 minutes, fixed it, took UPI. No bargaining drama.',
    name: 'Srinivas R.',
    area: 'Kukatpally',
  },
  {
    quote:
      'My mother lives alone. ManaHelp sends the same helper every week for medicines and check-ins. We finally feel relaxed.',
    name: 'Divya P.',
    area: 'Madhapur',
  },
  {
    quote:
      'I joined as an electrician. Steady daily work from my own area, payment same day. It changed my income.',
    name: 'Imran K.',
    area: 'Old City',
  },
]

export const FAQS = [
  {
    q: 'Is ManaHelp free for customers?',
    a: 'Yes. You pay only the helper’s quoted price after the job. No booking fee, no subscription.',
  },
  {
    q: 'How are helpers verified?',
    a: 'Every helper submits Aadhaar/photo ID, address proof and a skill check. We keep their ID on file and show a verified badge.',
  },
  {
    q: 'What if I am not happy with the work?',
    a: 'Tell us within 24 hours and we send another helper to redo it free, or mediate a fair refund.',
  },
  {
    q: 'Do I need to install an app?',
    a: 'No. ManaHelp runs entirely in your browser — just create a free account and post a request. Built for every customer, even first-time smartphone users.',
  },
  {
    q: 'Which areas do you cover?',
    a: `Cities and towns across ${CONFIG.country}, expanding area by area. Enter your city and pin code and we will confirm coverage in minutes.`,
  },
]
