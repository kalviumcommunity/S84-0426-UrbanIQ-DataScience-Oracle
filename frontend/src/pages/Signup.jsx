import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { getDefaultRouteForRole, signupCitizen } from '../services/auth.js'
import './auth.css'

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    if (error) {
      setError('')
    }
    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!formData.name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      const session = signupCitizen({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      navigate(getDefaultRouteForRole(session.user.role), { replace: true })
    } catch (signupError) {
      setError(signupError.message)
    }
  }

  return (
    <main className="auth-page auth-page--login auth-page--signup">
      <section className="auth-login__left">
        <div className="auth-card auth-login__card auth-signup__card">
          <div className="auth-card__intro">
            <p className="auth-eyebrow">Citizen sign-up</p>
            <h1>Create your account</h1>
            <p>
              Register once to submit complaints and follow their status from the citizen dashboard.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
            </label>

            <label>
              Email
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>

            <label>
              Password
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat the password"
                required
              />
            </label>

            {error ? <p className="auth-form__error">{error}</p> : null}

            <Button type="submit" className="auth-login__submit">
              Create citizen account
            </Button>
          </form>

          <div className="auth-card__links">
            <Link to="/get-started">Back to get started</Link>
            <Link to="/login">Already have an account? Log in</Link>
          </div>
        </div>
      </section>

      <section className="auth-login__right">
        <div className="auth-login__panel">
          <h2>Join Argus as a citizen</h2>
          <p>
            Report local issues instantly, track updates in real time, and stay informed until every case is resolved.
          </p>

          <div className="auth-login__panel-card">
            <p className="auth-login__panel-title">What you unlock</p>
            <div className="auth-login__panel-stats auth-signup__benefits">
              <div>
                <strong>Submit</strong>
                <span>Raise complaints in minutes</span>
              </div>
              <div>
                <strong>Track</strong>
                <span>Get status updates anytime</span>
              </div>
              <div>
                <strong>Resolve</strong>
                <span>See closure and response notes</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Signup
