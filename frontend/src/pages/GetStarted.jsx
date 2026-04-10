import { Link } from 'react-router-dom'
import LiveTicker from '../components/ui/LiveTicker.jsx'
import './auth.css'

const features = [
  {
    title: 'Complaint tracking',
    description: 'Capture every issue with location, category, and live status so nothing gets lost in the queue.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 6.5A1.5 1.5 0 016.5 5h11A1.5 1.5 0 0119 6.5v8A1.5 1.5 0 0117.5 16H12l-4 3v-3H6.5A1.5 1.5 0 015 14.5v-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Admin workflow',
    description: 'Review the queue, monitor analytics, and mark complaints resolved once the field team closes the case.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 7h12M6 12h12M6 17h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M16 16l1.7 1.7L21 14.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Shared insights',
    description: 'Both citizens and admins read from the same complaint record, keeping status and reporting aligned.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 18V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M9 18V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M13 18V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M17 18V13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
]

const steps = [
  {
    title: 'Citizen submits issue',
    description: 'Residents file complaints with location, category, and context details.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 6.5A1.5 1.5 0 016.5 5h11A1.5 1.5 0 0119 6.5v8A1.5 1.5 0 0117.5 16H12l-4 3v-3H6.5A1.5 1.5 0 015 14.5v-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Admin verifies and assigns',
    description: 'Operations team triages priority and routes the task to field teams.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 7h12M6 12h12M6 17h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M16 16l1.7 1.7L21 14.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Issue is resolved and updated',
    description: 'Resolution status syncs to both dashboards with timestamps and metrics.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function GetStarted() {
  return (
    <main className="auth-page auth-page--landing auth-page--landing-modern">
      <section className="landing-shell">
        <LiveTicker />

        <div className="landing-hero">
          <div className="landing-hero__copy">
            <p className="auth-eyebrow">Argus municipal grievance system</p>
            <h1>Manage and resolve city issues, faster.</h1>
            <p className="auth-lead">
              Real-time insights for smarter municipal decisions. Keep complaints moving with a clear path for review and resolution.
            </p>

            <div className="auth-hero__actions">
              <Link className="auth-link-button" to="/login">
                Get Started
              </Link>
            </div>

            <div className="landing-trust-line">
              <span className="landing-trust-line__dot" aria-hidden="true" />
              <p>Real-time insights for smarter municipal decisions.</p>
            </div>
          </div>

          <div className="landing-preview-card">
            <div className="landing-preview-card__header">
              <div>
                <p className="landing-preview-card__eyebrow">Live operations</p>
                <h2>Resolution overview</h2>
              </div>
              <span className="landing-preview-card__badge">Today</span>
            </div>

            <div className="landing-preview-card__stats">
              <div>
                <strong>128</strong>
                <span>Open cases</span>
              </div>
              <div>
                <strong>87%</strong>
                <span>Resolution rate</span>
              </div>
              <div>
                <strong>2.8d</strong>
                <span>Average close time</span>
              </div>
            </div>

            <div className="landing-preview-card__queue">
              <div className="landing-preview-card__queue-row is-hot">
                <span>Water supply</span>
                <strong>Ward 12</strong>
                <em>In progress</em>
              </div>
              <div className="landing-preview-card__queue-row">
                <span>Garbage</span>
                <strong>Ward 5</strong>
                <em>Pending</em>
              </div>
              <div className="landing-preview-card__queue-row is-closed">
                <span>Street lights</span>
                <strong>Ward 3</strong>
                <em>Resolved</em>
              </div>
            </div>
          </div>
        </div>

        <section className="landing-feature-grid">
          {features.map((feature) => (
            <div key={feature.title} className="landing-feature-card">
              <div className="landing-feature-card__icon">{feature.icon}</div>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="landing-steps" aria-label="How it works">
          <div className="landing-steps__header">
            <p className="auth-eyebrow">How it works</p>
            <h2>Complaint lifecycle from report to resolution</h2>
          </div>
          <div className="landing-steps__line" aria-hidden="true" />
          <div className="landing-steps__grid">
            {steps.map((step, index) => (
              <div className="landing-step-card" key={step.title}>
                <div className="landing-step-card__icon-wrap">
                  <span className="landing-step-card__icon">{step.icon}</span>
                  <span className="landing-step-card__number">0{index + 1}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

      </section>
    </main>
  )
}

export default GetStarted