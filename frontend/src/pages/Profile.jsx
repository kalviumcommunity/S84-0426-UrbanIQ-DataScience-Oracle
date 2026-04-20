import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole, getSession, logoutUser, updateProfile } from '../services/auth.js'

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </p>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="space-y-1 rounded-lg bg-slate-50/70 px-4 py-3 ring-1 ring-slate-100">
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function Field({ id, label, type, name, value, onChange, autoComplete }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
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
  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Citizen'

  return (
    <main className="mx-auto w-full max-w-[740px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="rounded-xl bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
          <header className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-base font-semibold text-teal-700 ring-1 ring-teal-100"
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{roleLabel} profile</p>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
                    {user?.name || 'Unnamed account'}
                  </h1>
                  <p className="break-all text-sm text-slate-600">{user?.email || 'No email found'}</p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {roleLabel}
              </span>
            </div>

            <div className="h-px bg-slate-200" />
          </header>

          <section className="space-y-3" aria-labelledby="account-information-heading">
            <SectionTitle>Account information</SectionTitle>
            <h2 id="account-information-heading" className="sr-only">
              Account information
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Full name" value={user?.name || 'Unnamed account'} />
              <DetailRow label="Email address" value={user?.email || 'No email found'} />
              <DetailRow label="Role" value={roleLabel} />
            </dl>
          </section>

          <div className="h-px bg-slate-200" />

          <section className="space-y-3" aria-labelledby="edit-profile-heading">
            <SectionTitle>Edit profile</SectionTitle>
            <h2 id="edit-profile-heading" className="sr-only">
              Edit profile
            </h2>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="profile-name"
                  type="text"
                  name="name"
                  label="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                />

                <Field
                  id="profile-email"
                  type="email"
                  name="email"
                  label="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-3">
                {error ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}
                {successMessage ? (
                  <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700" role="status">
                    {successMessage}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 sm:w-auto"
                  >
                    Back to Dashboard
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 sm:w-auto sm:self-center"
                >
                  Logout
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  )
}

export default Profile