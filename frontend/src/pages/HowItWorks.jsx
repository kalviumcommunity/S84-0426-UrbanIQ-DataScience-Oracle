import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import './how-it-works.css'

const steps = [
  {
    title: '1. Report the issue',
    body: 'Open the dashboard and use the report button to submit the problem, location, and any optional photo or priority.',
  },
  {
    title: '2. City team reviews it',
    body: 'The complaint enters the work queue where it is filtered, assigned, and moved into progress.',
  },
  {
    title: '3. Track updates',
    body: 'You can search your complaints, view status changes, and check the timeline for the latest activity.',
  },
]

const expectations = [
  'Use the dashboard for live status and complaint history.',
  'Use the report form only when you need to submit a new issue.',
  'Notifications show recent updates for submitted complaints.',
]

function HowItWorks() {
  const navigate = useNavigate()

  return (
    <div className="how-it-works-page">
      <div className="how-it-works-page__hero">
        <p className="how-it-works-page__eyebrow">Citizen support</p>
        <h1>How it works</h1>
        <p>
          A short guide to using the citizen portal without sending you back to the public get started page.
        </p>
      </div>

      <div className="how-it-works-page__grid">
        <Card className="how-it-works-page__card">
          <h2>Simple flow</h2>
          <div className="how-it-works-page__timeline">
            {steps.map((step) => (
              <section key={step.title} className="how-it-works-page__step">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </section>
            ))}
          </div>
        </Card>

        <Card className="how-it-works-page__card">
          <h2>What to expect</h2>
          <ul className="how-it-works-page__list">
            {expectations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="how-it-works-page__card how-it-works-page__footer-card">
        <div>
          <h2>Ready to continue?</h2>
          <p>Go back to your complaint dashboard when you are ready to work with your reports.</p>
        </div>
        <Button className="how-it-works-page__button" onClick={() => navigate('/citizen/dashboard')}>
          Back to dashboard
        </Button>
      </Card>
    </div>
  )
}

export default HowItWorks