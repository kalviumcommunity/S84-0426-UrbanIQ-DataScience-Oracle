import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole, getSession, logoutUser, updateProfile } from '../services/auth.js'
import './profile.css'

function Profile() {
  const navigate = useNavigate()
  const session = getSession()
  const user = session?.user ?? null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user?.email, user?.name])

  function handleLogout() {
    logoutUser()
    navigate('/get-started', { replace: true })
  }

  function handleBack() {
    navigate(getDefaultRouteForRole(user?.role), { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!user?.email) {
      setError('No active account was found for this session.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const updatedSession = await updateProfile({
        currentEmail: user.email,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      })

      setName(updatedSession?.user?.name ?? '')
      setEmail(updatedSession?.user?.email ?? '')
      setSuccess('Profile updated successfully.')
    } catch (updateError) {
      setError(updateError.message || 'Unable to update your profile right now.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (user?.name ?? 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A'

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Citizen'

  return (
    <div className="profile-page">
      <section className="profile-page__panel" aria-label="Profile page">
        <header className="profile-page__header">
          <div className="profile-page__identity-wrap">
            <div className="profile-page__avatar" aria-hidden="true">{initials}</div>
            <div>
              <p className="profile-page__eyebrow">{roleLabel} profile</p>
              <h1 className="profile-page__title">{user?.name || 'Unnamed account'}</h1>
              <p className="profile-page__subtitle">{user?.email || 'No email found'}</p>
            </div>
          </div>
          <span className="profile-page__role-pill">{roleLabel}</span>
        </header>

        <hr className="profile-page__divider" />

        <section className="profile-page__section" aria-labelledby="profile-account-info-heading">
          <h2 id="profile-account-info-heading" className="profile-page__section-title">Account information</h2>
          <dl className="profile-page__info-grid">
            <div className="profile-page__info-item">
              <dt>Full name</dt>
              <dd>{user?.name || 'Unnamed account'}</dd>
            </div>
            <div className="profile-page__info-item">
              <dt>Email address</dt>
              <dd>{user?.email || 'No email found'}</dd>
            </div>
            <div className="profile-page__info-item">
              <dt>Role</dt>
              <dd>{roleLabel}</dd>
            </div>
          </dl>
        </section>

        <hr className="profile-page__divider" />

        <section className="profile-page__section" aria-labelledby="profile-edit-heading">
          <h2 id="profile-edit-heading" className="profile-page__section-title">Edit profile</h2>
          <form className="profile-page__form" onSubmit={handleSubmit}>
            <div className="profile-page__form-grid">
              <label className="profile-page__field" htmlFor="profile-name">
                <span>Full name</span>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (error) {
                      setError('')
                    }
                    if (success) {
                      setSuccess('')
                    }
                  }}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="profile-page__field" htmlFor="profile-email">
                <span>Email address</span>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) {
                      setError('')
                    }
                    if (success) {
                      setSuccess('')
                    }
                  }}
                  required
                  autoComplete="email"
                />
              </label>
            </div>

            {error ? <p className="profile-page__message profile-page__message--error">{error}</p> : null}
            {success ? <p className="profile-page__message profile-page__message--success">{success}</p> : null}

            <div className="profile-page__actions">
              <div className="profile-page__actions-main">
                <button type="submit" className="profile-page__btn profile-page__btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button type="button" className="profile-page__btn profile-page__btn--secondary" onClick={handleBack}>
                  Back to dashboard
                </button>
              </div>

              <button type="button" className="profile-page__btn profile-page__btn--ghost" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  )
}

export default Profile