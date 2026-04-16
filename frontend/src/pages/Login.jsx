import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { getDefaultRouteForRole, loginUser } from '../services/auth.js'
import './auth.css'

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [role, setRole] = useState(searchParams.get('role') === 'admin' ? 'admin' : 'citizen')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setError('')
      const session = await loginUser(formData)
      navigate(getDefaultRouteForRole(session.user.role), { replace: true })
    } catch (loginError) {
      console.error('Login request failed:', loginError)
      setError(loginError.message || 'Unable to log in right now. Please try again.')
    }
  }

  return (
    <main className="auth-page auth-page--login">
      <section className="auth-login__left">
        <div className="auth-card auth-login__card">
          <div className="auth-card__intro">
            <p className="auth-eyebrow">Welcome back</p>
            <h1>Log in to your dashboard</h1>
            <p>
              Choose admin for municipal operations or citizen for issue submission and tracking.
            </p>
          </div>

          <div className="auth-role-switch auth-role-switch--pill" role="tablist" aria-label="Login role">
            <button className={role === 'citizen' ? 'auth-role-switch__button is-active' : 'auth-role-switch__button'} type="button" onClick={() => setRole('citizen')}>
              Citizen
            </button>
            <button className={role === 'admin' ? 'auth-role-switch__button is-active' : 'auth-role-switch__button'} type="button" onClick={() => setRole('admin')}>
              Admin
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
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
                  placeholder="Enter your password"
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

            {error ? <p className="auth-form__error">{error}</p> : null}

            <Button type="submit" className="auth-login__submit">
              Log in
            </Button>
          </form>

          <div className="auth-card__links">
            <Link to="/get-started">Back to get started</Link>
            <Link to="/signup">Create a citizen account</Link>
          </div>
        </div>
      </section>

      <section className="auth-login__right">
        <div className="auth-login__panel">
          <h2>Welcome to Argus</h2>
          <p>
            Monitor, analyze, and resolve city complaints efficiently.
          </p>

          <div className="auth-login__panel-card">
            <p className="auth-login__panel-title">Live system preview</p>
            <div className="auth-login__panel-stats">
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
                <span>Avg close time</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Login
