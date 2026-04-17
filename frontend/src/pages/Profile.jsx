import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { getDefaultRouteForRole, getSession, logoutUser, updateProfile } from '../services/auth.js'
import './profile.css'

function Profile() {
  const navigate = useNavigate()
  const session = getSession()
  const user = session?.user ?? null
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setFormData({
      name: user?.name ?? '',
      email: user?.email ?? '',
    })
  }, [user?.email, user?.name])

  const profileDetails = useMemo(() => {
    const role = user?.role ?? 'citizen'

    return [
      { label: 'Full name', value: user?.name || 'Unnamed account' },
      { label: 'Email address', value: user?.email || 'No email found' },
      { label: 'Account role', value: role === 'admin' ? 'Admin' : 'Citizen' },
      { label: 'Home route', value: getDefaultRouteForRole(role) },
    ]
  }, [user])

  function handleBack() {
    navigate(getDefaultRouteForRole(user?.role), { replace: true })
  }

  function handleLogout() {
    logoutUser()
    navigate('/get-started', { replace: true })
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
    if (error) {
      setError('')
    }
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!user?.email) {
      setError('No active account was found for this session.')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      setSuccessMessage('')
      const sessionData = await updateProfile({
        currentEmail: user.email,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      })

      setFormData({
        name: sessionData.user.name ?? '',
        email: sessionData.user.email ?? '',
      })
      setSuccessMessage('Profile updated successfully.')
    } catch (updateError) {
      setError(updateError.message || 'Unable to update your profile right now.')
    } finally {
      setIsSaving(false)
    }
  }

  const initials = (user?.name ?? 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A'

  return (
    <div className="profile-page">
      <section className="profile-page__hero">
        <div className="profile-page__hero-copy">
          <p className="profile-page__eyebrow">Account profile</p>
          <h1>Your profile details</h1>
          <p>
            Review the account information currently stored for this session. The page is read-only so it will not interfere with any complaint or analytics flows.
          </p>
        </div>

        <Card className="profile-page__summary-card">
          <div className="profile-page__avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-page__summary-copy">
            <span className="profile-page__summary-label">Signed in as</span>
            <h2>{user?.name || 'Unnamed account'}</h2>
            <p>{user?.email || 'No email found'}</p>
          </div>
          <span className={`profile-page__role-badge profile-page__role-badge--${user?.role === 'admin' ? 'admin' : 'citizen'}`}>
            {user?.role === 'admin' ? 'Admin' : 'Citizen'}
          </span>
        </Card>
      </section>

      <div className="profile-page__grid">
        <Card className="profile-page__card">
          <div className="profile-page__section-header">
            <div>
              <p className="profile-page__section-kicker">Profile details</p>
              <h2>Account information</h2>
            </div>
          </div>

          <dl className="profile-page__details-list">
            {profileDetails.map((detail) => (
              <div key={detail.label} className="profile-page__detail-row">
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="profile-page__card profile-page__card--accent">
          <div className="profile-page__section-header">
            <div>
              <p className="profile-page__section-kicker">Edit profile</p>
              <h2>Update account details</h2>
            </div>
          </div>

          <form className="profile-page__form" onSubmit={handleSubmit}>
            <label className="profile-page__field">
              Full name
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </label>

            <label className="profile-page__field">
              Email address
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>

            {error ? <p className="profile-page__message profile-page__message--error">{error}</p> : null}
            {successMessage ? <p className="profile-page__message profile-page__message--success">{successMessage}</p> : null}

            <div className="profile-page__actions">
              <Button className="profile-page__button" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
              <Button className="profile-page__button profile-page__button--secondary" type="button" onClick={handleBack}>
                Back to dashboard
              </Button>
              <Button className="profile-page__button profile-page__button--secondary" type="button" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card className="profile-page__card profile-page__card--muted">
        <div className="profile-page__section-header">
          <div>
            <p className="profile-page__section-kicker">Session context</p>
            <h2>What this profile controls</h2>
          </div>
        </div>

        <ul className="profile-page__bullets">
          <li>The sidebar and top bar use this session to route you to the right workspace.</li>
          <li>Your account role determines whether you land on admin or citizen pages.</li>
          <li>Logging out clears the local session and returns you to the public landing page.</li>
        </ul>
      </Card>
    </div>
  )
}

export default Profile