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
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    try {
      const session = loginUser({ ...formData, role })
      navigate(getDefaultRouteForRole(session.user.role), { replace: true })
    } catch (loginError) {
      setError(loginError.message)
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

          {role === 'admin' ? (
            <div className="auth-callout">
              <strong>Admin credentials</strong>
              <p>Email: admin@gmail.com</p>
              <p>Password: admin123</p>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>

            <label>
              Password
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />
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
