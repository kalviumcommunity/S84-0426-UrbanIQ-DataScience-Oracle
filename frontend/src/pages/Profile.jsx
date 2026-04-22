import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, logoutUser, updateProfile } from '../services/auth.js'
import './profile.css'

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Germany',
  'France',
  'UAE',
  'Japan',
]

const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+65', '+49', '+33', '+971', '+81']

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Singapore',
  'Australia/Sydney',
]

function getProfilePrefsKey(email) {
  return `oracle-profile-prefs-${email || 'default'}`
}

function Profile() {
  const navigate = useNavigate()
  const session = getSession()
  const user = session?.user ?? null
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [country, setCountry] = useState('India')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    const prefsKey = getProfilePrefsKey(user?.email)
    const savedPrefs = typeof window !== 'undefined' ? window.localStorage.getItem(prefsKey) : null

    if (savedPrefs) {
      try {
        const parsedPrefs = JSON.parse(savedPrefs)
        setPhone(parsedPrefs.phone ?? '')
        setCountryCode(parsedPrefs.countryCode ?? '+91')
        setCountry(parsedPrefs.country ?? 'India')
        setTimezone(parsedPrefs.timezone ?? 'Asia/Kolkata')
        return
      } catch {
        // Fall back to session values.
      }
    }

    setPhone(user?.phone ?? '')
    setCountryCode(user?.countryCode ?? '+91')
    setCountry(user?.country ?? 'India')
    setTimezone(user?.timezone ?? 'Asia/Kolkata')
  }, [user?.email, user?.name])

  function handleLogout() {
    logoutUser()
    navigate('/get-started', { replace: true })
  }

  function handleCancel() {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    const prefsKey = getProfilePrefsKey(user?.email)
    const savedPrefs = typeof window !== 'undefined' ? window.localStorage.getItem(prefsKey) : null
    if (savedPrefs) {
      try {
        const parsedPrefs = JSON.parse(savedPrefs)
        setPhone(parsedPrefs.phone ?? '')
        setCountryCode(parsedPrefs.countryCode ?? '+91')
        setCountry(parsedPrefs.country ?? 'India')
        setTimezone(parsedPrefs.timezone ?? 'Asia/Kolkata')
      } catch {
        setPhone(user?.phone ?? '')
        setCountryCode(user?.countryCode ?? '+91')
        setCountry(user?.country ?? 'India')
        setTimezone(user?.timezone ?? 'Asia/Kolkata')
      }
    }
    setIsEditingProfile(false)
    setError('')
  }

  function showToastMessage(message) {
    setToastMessage(message)
    setShowToast(true)
    window.setTimeout(() => {
      setShowToast(false)
    }, 2600)
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

      const updatedSession = await updateProfile({
        currentEmail: user.email,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      })

      setName(updatedSession?.user?.name ?? '')
      setEmail(updatedSession?.user?.email ?? '')

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          getProfilePrefsKey(updatedSession?.user?.email ?? user?.email),
          JSON.stringify({
            phone,
            countryCode,
            country,
            timezone,
          }),
        )
      }

      setIsEditingProfile(false)
      showToastMessage('Profile updated successfully.')
    } catch (updateError) {
      setError(updateError.message || 'Unable to update your profile right now.')
    } finally {
      setSaving(false)
    }
  }

  function handleQuickEditProfile() {
    setActiveTab('settings')
    setIsEditingProfile(true)
    setError('')
  }

  function handleChangePassword() {
    showToastMessage('Password change flow started successfully.')
  }

  function handleLogoutAllDevices() {
    showToastMessage('Logged out from all active sessions.')
  }

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Citizen'
  const displayName = name || user?.name || 'Admin'
  const displayEmail = email || user?.email || 'admin@gmail.com'
  const displayPhone = phone || 'Not set'
  const displayCountry = country || 'Not set'
  const displayTimezone = timezone || 'Not set'
  const avatarLetter = (displayName || 'A').charAt(0).toUpperCase()
  const accountCreated = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Jan 2024'
  const lastLogin = user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Today'

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'settings', label: 'Account Settings' },
    { key: 'security', label: 'Security' },
  ]

  return (
    <main className="profile-page" aria-label="Profile page">
      {showToast && (
        <div className="profile-page__toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <div className="profile-page__container">
        <aside className="profile-sidebar">
          <div className="profile-sidebar__identity">
            <div className="profile-header__avatar-wrap">
              <div className="profile-header__avatar">
              {avatarLetter}
              </div>
              <button type="button" className="profile-header__camera-btn" aria-label="Upload profile photo">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M7 6.2l.9-1.3c.2-.3.5-.4.8-.4h2.6c.3 0 .6.1.8.4l.9 1.3h1.6A1.4 1.4 0 0116 7.6v5.8a1.4 1.4 0 01-1.4 1.4H5.4A1.4 1.4 0 014 13.4V7.6a1.4 1.4 0 011.4-1.4H7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <span className="profile-header__online-dot" title="Online" aria-label="Online" />
            </div>

            <div className="profile-header__identity">
              <h1>{displayName}</h1>
              <p>{displayEmail}</p>
              <span className="profile-header__badge">{roleLabel}</span>
            </div>
          </div>

          <nav className="profile-sidebar__nav" aria-label="Profile navigation">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`profile-nav-btn ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key)
                  setIsEditingProfile(false)
                  setError('')
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="profile-sidebar__footer">
            <button
              type="button"
              className="profile-btn profile-btn--danger"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="profile-content">
          <header className="profile-tabs" role="tablist" aria-label="Profile sections">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`profile-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key)
                  setIsEditingProfile(false)
                  setError('')
                }}
              >
                {tab.label}
              </button>
            ))}
          </header>

          {activeTab === 'overview' && (
            <div className="profile-panel" role="tabpanel" aria-label="Overview panel">
              <h2 className="profile-card__title">Profile Overview</h2>
              <p className="profile-card__subtitle">Review your account information at a glance.</p>

              <dl className="profile-overview-grid">
                <div className="profile-overview-item">
                  <span className="profile-overview-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="7" r="2.7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4.8 16c1.05-2.2 2.9-3.3 5.2-3.3s4.15 1.1 5.2 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <dt>Name</dt>
                  <dd>{displayName}</dd>
                </div>

                <div className="profile-overview-item">
                  <span className="profile-overview-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <rect x="3.2" y="5.2" width="13.6" height="9.6" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4.5 6.8L10 10.6l5.5-3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <dt>Email</dt>
                  <dd>{displayEmail}</dd>
                </div>

                <div className="profile-overview-item">
                  <span className="profile-overview-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <path d="M5 16V6a1 1 0 011-1h8a1 1 0 011 1v10l-2-1.2L10 16l-3-1.2L5 16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <dt>Role</dt>
                  <dd>{roleLabel}</dd>
                </div>

                <div className="profile-overview-item">
                  <span className="profile-overview-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <rect x="3.5" y="4.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6.8 3.8v2.1M13.2 3.8v2.1M6.5 9.2h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <dt>Account Created</dt>
                  <dd>{accountCreated}</dd>
                </div>

                <div className="profile-overview-item">
                  <span className="profile-overview-item__icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="6.4" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10 6.6v3.6l2.4 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <dt>Last Login</dt>
                  <dd>{lastLogin}</dd>
                </div>
              </dl>

              <section className="profile-overview-section">
                <h3 className="profile-form__heading">Recent Activity</h3>
                <ul className="profile-activity-list">
                  <li>
                    <span className="profile-activity-list__dot" aria-hidden="true" />
                    Logged in today
                  </li>
                  <li>
                    <span className="profile-activity-list__dot" aria-hidden="true" />
                    Updated profile
                  </li>
                  <li>
                    <span className="profile-activity-list__dot" aria-hidden="true" />
                    Assigned complaint to Ward 3
                  </li>
                </ul>
              </section>

              <section className="profile-overview-section">
                <h3 className="profile-form__heading">Quick Actions</h3>
                <div className="profile-security__actions">
                  <button type="button" className="profile-btn profile-btn--primary" onClick={handleQuickEditProfile}>
                    Edit Profile
                  </button>
                  <button type="button" className="profile-btn profile-btn--secondary" onClick={() => setActiveTab('security')}>
                    Change Password
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSubmit} className="profile-panel" role="tabpanel" aria-label="Account settings panel">
              <h2 className="profile-card__title">Account Settings</h2>
              <p className="profile-card__subtitle">Edit the details used across your Oracle workspace.</p>

              {!isEditingProfile ? (
                <div className="profile-settings-shell" data-state="view">
                  <div className="profile-readonly-grid">
                    <div className="profile-readonly-item">
                      <dt>Full Name</dt>
                      <dd>{displayName}</dd>
                    </div>
                    <div className="profile-readonly-item">
                      <dt>Email</dt>
                      <dd>{displayEmail}</dd>
                    </div>
                    <div className="profile-readonly-item">
                      <dt>Phone Number</dt>
                      <dd>{displayPhone === 'Not set' ? displayPhone : `${countryCode} ${displayPhone}`}</dd>
                    </div>
                    <div className="profile-readonly-item">
                      <dt>Country</dt>
                      <dd>{displayCountry}</dd>
                    </div>
                    <div className="profile-readonly-item profile-readonly-item--full">
                      <dt>Timezone</dt>
                      <dd>{displayTimezone}</dd>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <div className="profile-actions__left">
                      <button type="button" className="profile-btn profile-btn--primary" onClick={() => setIsEditingProfile(true)}>
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="profile-settings-shell" data-state="edit">
                  <div className="profile-form">
                    <h3 className="profile-form__heading">Edit Profile</h3>

                    <div className="profile-edit-grid">
                      <div className="profile-field">
                        <label htmlFor="profile-name">
                          Full Name
                        </label>
                        <input
                          id="profile-name"
                          name="name"
                          type="text"
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value)
                            if (error) setError('')
                          }}
                          required
                          autoComplete="name"
                          className="profile-input"
                        />
                      </div>

                      <div className="profile-field">
                        <label htmlFor="profile-email">
                          Email
                        </label>
                        <input
                          id="profile-email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value)
                            if (error) setError('')
                          }}
                          required
                          autoComplete="email"
                          className="profile-input"
                        />
                      </div>

                      <div className="profile-field">
                        <label htmlFor="profile-phone">
                          Phone Number
                        </label>
                        <div className="profile-phone-wrap">
                          <select
                            id="profile-country-code"
                            value={countryCode}
                            onChange={(event) => setCountryCode(event.target.value)}
                            className="profile-input profile-input--prefix"
                            aria-label="Country code"
                          >
                            {COUNTRY_CODES.map((code) => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                          <input
                            id="profile-phone"
                            name="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            className="profile-input"
                          />
                        </div>
                      </div>

                      <div className="profile-field">
                        <label htmlFor="profile-country">
                          Country
                        </label>
                        <input
                          id="profile-country"
                          name="country"
                          list="profile-country-options"
                          placeholder="Select or search country"
                          value={country}
                          onChange={(event) => setCountry(event.target.value)}
                          className="profile-input"
                        />
                        <datalist id="profile-country-options">
                          {COUNTRIES.map((item) => (
                            <option key={item} value={item} />
                          ))}
                        </datalist>
                      </div>

                      <div className="profile-field profile-field--full">
                        <label htmlFor="profile-timezone">
                          Timezone
                        </label>
                        <select
                          id="profile-timezone"
                          name="timezone"
                          value={timezone}
                          onChange={(event) => setTimezone(event.target.value)}
                          className="profile-input"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <div className="profile-actions__left">
                      <button
                        type="submit"
                        className="profile-btn profile-btn--primary"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>

                      <button
                        type="button"
                        className="profile-btn profile-btn--secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="profile-alert profile-alert--error" role="alert">
                  {error}
                </p>
              )}
            </form>
          )}

          {activeTab === 'security' && (
            <div className="profile-panel" role="tabpanel" aria-label="Security panel">
              <h2 className="profile-card__title">Security Settings</h2>
              <p className="profile-card__subtitle">Protect your account access and sign-in experience.</p>

              <div className="profile-security">
                <h3 className="profile-form__heading">Security Controls</h3>
                <div className="profile-security-list" role="list">
                  <article className="profile-security-item" role="listitem">
                    <div className="profile-security-item__icon" aria-hidden="true">
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M7.2 8.6V7.5a2.8 2.8 0 115.6 0v1.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <rect x="5" y="8.6" width="10" height="7" rx="1.7" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </div>

                    <div className="profile-security-item__body">
                      <h4>Change Password</h4>
                      <p>Update your password regularly to protect your account and complaint data.</p>
                    </div>

                    <button type="button" className="profile-btn profile-btn--secondary">
                      Change
                    </button>
                  </article>

                  <article className="profile-security-item profile-security-item--disabled" role="listitem">
                    <div className="profile-security-item__icon" aria-hidden="true">
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M10 3.8l5.2 2.2v3.6c0 3-2.1 5.7-5.2 6.6-3.1-.9-5.2-3.6-5.2-6.6V6l5.2-2.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M7.7 10l1.6 1.6 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    <div className="profile-security-item__body">
                      <h4>
                        Two-Factor Authentication
                        <span className="profile-security-item__tag">Beta</span>
                      </h4>
                      <p>Add an additional verification step during sign-in for stronger security.</p>
                    </div>

                    <button type="button" className="profile-btn profile-btn--secondary" disabled title="Coming soon">
                      Coming Soon
                    </button>
                  </article>
                </div>

                <section className="profile-security-block">
                  <h3 className="profile-form__heading">Active Sessions</h3>
                  <div className="profile-session-list">
                    <article className="profile-session-item">
                      <div>
                        <p className="profile-session-item__device">Chrome - Windows <span className="profile-session-item__current">Current</span></p>
                        <p className="profile-session-item__meta">Last active: Now</p>
                      </div>
                    </article>
                    <article className="profile-session-item">
                      <div>
                        <p className="profile-session-item__device">iPhone - Safari</p>
                        <p className="profile-session-item__meta">Last active: 2 hours ago</p>
                      </div>
                    </article>
                  </div>
                </section>

                <section className="profile-security-block profile-security-block--danger">
                  <h3 className="profile-form__heading">Danger Zone</h3>
                  <div className="profile-security__actions">
                    <button type="button" className="profile-btn profile-btn--danger-action" onClick={handleLogoutAllDevices}>
                      Logout from all devices
                    </button>
                    <button type="button" className="profile-btn profile-btn--danger-action" disabled title="Restricted action">
                      Delete Account
                    </button>
                  </div>
                </section>

                <div className="profile-security__actions profile-security__actions--footer">
                  <button type="button" className="profile-btn profile-btn--primary" onClick={handleChangePassword}>
                    Confirm Password Change
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Profile