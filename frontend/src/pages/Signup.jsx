import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { getDefaultRouteForRole, signupCitizen } from '../services/auth.js'
import './auth.css'

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  async function handleSubmit(event) {
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
      const session = await signupCitizen({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      navigate(getDefaultRouteForRole(session.user.role), { replace: true })
    } catch (signupError) {
      console.error('Signup request failed:', signupError)
      setError(signupError.message || 'Unable to create your account right now. Please try again.')
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
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 5.09A9.77 9.77 0 0112 4c5.23 0 9.27 3.11 10.5 8-1 3.38-3.32 5.86-6.37 7.1" />
                        <path d="M6.61 6.61C4.58 8.02 3.08 9.93 1.5 12c.75 2.96 2.84 5.73 5.73 7.28" />
                      </>
                    ) : (
                      <>
                        <path d="M1.5 12C2.73 7.11 6.77 4 12 4s9.27 3.11 10.5 8c-1.23 4.89-5.27 8-10.5 8S2.73 16.89 1.5 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </label>

            <label>
              Confirm password
              <div className="auth-password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat the password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {showConfirmPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 5.09A9.77 9.77 0 0112 4c5.23 0 9.27 3.11 10.5 8-1 3.38-3.32 5.86-6.37 7.1" />
                        <path d="M6.61 6.61C4.58 8.02 3.08 9.93 1.5 12c.75 2.96 2.84 5.73 5.73 7.28" />
                      </>
                    ) : (
                      <>
                        <path d="M1.5 12C2.73 7.11 6.77 4 12 4s9.27 3.11 10.5 8c-1.23 4.89-5.27 8-10.5 8S2.73 16.89 1.5 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
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
          <h2>Join Oracle as a citizen</h2>
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
