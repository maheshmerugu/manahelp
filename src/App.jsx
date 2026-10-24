import { useEffect, useState } from 'react'
import { CONFIG, STEPS, TESTIMONIALS, FAQS } from './config.js'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import { ServicesProvider, useServices } from './ServicesContext.jsx'
import Notifications from './components/Notifications.jsx'
import AuthPage from './components/AuthPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import AdminLogin from './components/AdminLogin.jsx'

function Navbar({ view, setView }) {
  const { user } = useAuth()
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); setView('home') }}>
          <span className="logo-mark">🤝</span> Mana<span className="logo-accent">Help</span>
        </a>
        {view === 'home' && (
          <nav className="links">
            <a href="#services">Services</a>
            <a href="#how">How it works</a>
            <a href="#helpers">Become a helper</a>
            <a href="#faq">FAQ</a>
          </nav>
        )}
        <div className="nav-cta">
          {/* A key-only admin has no account row, so the bell and customer dashboard don't apply. */}
          {user && user.id != null && <Notifications />}
          {user ? (
            <>
              {user.role === 'admin' && view !== 'admin' && (
                <button className="btn btn-ghost btn-sm" onClick={() => setView('admin')}>
                  Admin
                </button>
              )}
              {view !== 'dashboard' && user.id != null && (
                <button className="btn btn-primary btn-sm" onClick={() => setView('dashboard')}>
                  Dashboard
                </button>
              )}
              <span className="who">{user.name.split(' ')[0]}</span>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setView('login')}>
                Log in
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setView('register')}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Hero({ onBook, onRegister }) {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-in">
        <div className="hero-copy">
          <span className="pill">📍 Serving cities across {CONFIG.country} · avg reply {CONFIG.responseTime}</span>
          <h1>
            Your city&rsquo;s help, <span className="grad">one tap away.</span>
          </h1>
          <p className="lead">
            ManaHelp connects every customer across {CONFIG.country} with verified local helpers —
            plumber, electrician, tutor, medicine runs, elder care and more. Create a free account
            to post a request, or join as a helper and get work from your own area.
          </p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={onBook}>
              Request help now
            </button>
            <button className="btn btn-ghost" onClick={onRegister}>
              Create free account
            </button>
          </div>
          <div className="trust">
            <span>✅ ID-verified helpers</span>
            <span>💰 Pay after the job</span>
            <span>🗣 Telugu · Hindi · English</span>
          </div>
        </div>
        <div className="hero-card" aria-hidden="true">
          <div className="chat">
            <div className="chat-head">
              <span className="dot" /> ManaHelp · online
            </div>
            <div className="msg out">Tap leaking under kitchen sink 🙏</div>
            <div className="msg in">Verified plumber Suresh is 12 min away. Price ₹249 fixed. OK?</div>
            <div className="msg out">OK ✅</div>
            <div className="msg in">Job done. Pay by UPI after you check. Thank you! 🤝</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const items = [
    ['12+', 'everyday services'],
    [CONFIG.responseTime, 'average reply time'],
    ['100%', 'ID-verified helpers'],
    ['₹0', 'booking fee for customers'],
  ]
  return (
    <section className="stats">
      <div className="wrap stats-in">
        {items.map(([v, l]) => (
          <div className="stat" key={l}>
            <b>{v}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Services({ onBook }) {
  const { services } = useServices()
  return (
    <section className="section" id="services">
      <div className="wrap">
        <h2>Help for every need, every customer</h2>
        <p className="sub">
          From a leaking tap to your child&rsquo;s maths tutor — one place, verified people, fair prices.
        </p>
        <div className="grid">
          {services.map((s) => (
            <button className="card" key={s.name} onClick={() => onBook(s.name)}>
              <span className="card-icon">{s.icon}</span>
              <h3>{s.name}</h3>
              <p>{s.blurb}</p>
              <span className="eta">⏱ {s.eta}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function How() {
  return (
    <section className="section alt" id="how">
      <div className="wrap">
        <h2>How ManaHelp works</h2>
        <p className="sub">Three steps. Sixty seconds. No app to install.</p>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Helpers({ onRegister }) {
  return (
    <section className="section" id="helpers">
      <div className="wrap helpers-in">
        <div>
          <h2>Earn with ManaHelp — become a helper</h2>
          <p className="sub">
            Plumber, electrician, tutor, driver, cook? Get steady daily work from your own area,
            same-day payment, and zero commission for your first 10 jobs.
          </p>
          <ul className="ticks">
            <li>Free ID verification &amp; profile page</li>
            <li>Jobs matched inside your locality — no long trips</li>
            <li>Same-day UPI payout after every job</li>
          </ul>
          <button className="btn btn-primary" onClick={onRegister}>
            Join as a helper
          </button>
        </div>
        <div className="helper-card">
          <b>₹18,000–₹32,000</b>
          <span>typical monthly earnings for active helpers in their own area</span>
        </div>
      </div>
    </section>
  )
}

function Voices() {
  return (
    <section className="section alt" id="voices">
      <div className="wrap">
        <h2>People of our city, talking</h2>
        <div className="quotes">
          {TESTIMONIALS.map((t) => (
            <figure className="quote" key={t.name}>
              <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption>
                <b>{t.name}</b> · {t.area}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="section" id="faq">
      <div className="wrap narrow">
        <h2>Quick answers</h2>
        {FAQS.map((f) => (
          <details className="faq" key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function Footer({ onAdmin }) {
  return (
    <footer className="footer">
      <div className="wrap foot-in">
        <div>
          <span className="logo">
            <span className="logo-mark">🤝</span> Mana<span className="logo-accent">Help</span>
          </span>
          <p>Our city. Our people. Our help.</p>
        </div>
        <div>
          <b>Contact</b>
          <a href={`mailto:${CONFIG.email}`}>{CONFIG.email}</a>
          <button className="foot-admin" onClick={onAdmin}>Admin login</button>
        </div>
        <div>
          <b>Coverage</b>
          <span>Cities &amp; towns across {CONFIG.country}</span>
          <span>Expanding area by area</span>
        </div>
      </div>
      <div className="wrap copy">© {new Date().getFullYear()} ManaHelp · Made with love in {CONFIG.country}</div>
    </footer>
  )
}

// (The old WhatsApp request modal was removed — requests now go through accounts.)

function Landing({ setView, book, onRegister }) {
  return (
    <>
      <Hero onBook={book} onRegister={onRegister} />
      <Stats />
      <Services onBook={book} />
      <How />
      <Helpers onRegister={onRegister} />
      <Voices />
      <Faq />
      <Footer onAdmin={() => setView('admin')} />
    </>
  )
}

function Shell() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('home')

  // A logged-out customer can't sit on the dashboard; /admin shows the admin sign-in instead.
  useEffect(() => {
    if (!loading && !user && view === 'dashboard') setView('home')
  }, [user, loading, view])

  const onRegister = () => setView(user ? 'dashboard' : 'register')

  // "Request help" opens the dashboard for account holders, otherwise sign-up.
  const book = () => setView(user ? 'dashboard' : 'register')

  return (
    <>
      <Navbar view={view} setView={setView} />
      {view === 'login' && (
        <AuthPage mode="login" onSwitch={() => setView('register')} onDone={() => setView('dashboard')} onHome={() => setView('home')} />
      )}
      {view === 'register' && (
        <AuthPage mode="register" onSwitch={() => setView('login')} onDone={() => setView('dashboard')} onHome={() => setView('home')} />
      )}
      {view === 'dashboard' && user && <Dashboard onHome={() => setView('home')} />}
      {view === 'admin' &&
        (user && user.role === 'admin' ? (
          <AdminPanel onHome={() => setView('home')} />
        ) : (
          <AdminLogin onDone={() => setView('admin')} onHome={() => setView('home')} />
        ))}
      {view === 'home' && <Landing setView={setView} book={book} onRegister={onRegister} />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ServicesProvider>
        <Shell />
      </ServicesProvider>
    </AuthProvider>
  )
}
