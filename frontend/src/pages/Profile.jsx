import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole, getSession, logoutUser, updateProfile } from '../services/auth.js'

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
      {children}
    </h2>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 break-words">{value}</dd>
    </div>
  )
}

function FormField({ id, name, type, label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-slate-500">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </div>
  )
}

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
    <main className="mx-auto w-full max-w-[720px] px-4 py-6 sm:px-6 sm:py-8">
      <section className="rounded-xl bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:p-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-semibold text-teal-700 sm:h-14 sm:w-14 sm:text-lg"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Admin profile</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {user?.name || 'Unnamed account'}
              </h1>
              <p className="mt-1 text-sm text-slate-600 break-all">{user?.email || 'No email found'}</p>
            </div>
          </div>

          <p className="inline-flex shrink-0 items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {user?.role === 'admin' ? 'Admin' : 'Citizen'}
          </p>
        </header>

        <div className="my-6 h-px bg-slate-200" />

        <section className="space-y-4">
          <SectionTitle>Account information</SectionTitle>
          <dl className="grid gap-4 sm:grid-cols-2">
            {profileDetails.map((detail) => (
              <ReadOnlyField key={detail.label} label={detail.label} value={detail.value} />
            ))}
          </dl>
        </section>

        <div className="my-6 h-px bg-slate-200" />

        <section className="space-y-4">
          <SectionTitle>Edit profile</SectionTitle>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField
              id="profile-name"
              name="name"
              type="text"
              label="Full name"
              value={formData.name}
              onChange={handleChange}
            />

            <FormField
              id="profile-email"
              name="email"
              type="email"
              label="Email address"
              value={formData.email}
              onChange={handleChange}
            />

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {successMessage ? <p className="text-sm font-medium text-teal-700">{successMessage}</p> : null}

            <div className="pt-2">
              <SectionTitle>Actions</SectionTitle>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  type="button"
                  onClick={handleBack}
                >
                  Back to Dashboard
                </button>

                <button
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg px-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}

export default Profile
