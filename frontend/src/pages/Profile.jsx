import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole, getSession, logoutUser, updateProfile } from '../services/auth.js'

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">{value}</p>
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

  return (
    <div className="mx-auto w-full max-w-[700px] px-4 py-6 sm:px-6 sm:py-8">
      <section className="rounded-xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white" aria-hidden="true">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Admin profile</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{user?.name || 'Unnamed account'}</h1>
              <p className="mt-1 break-all text-sm text-slate-600">{user?.email || 'No email found'}</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {user?.role === 'admin' ? 'Admin' : 'Citizen'}
          </span>
        </div>

        <div className="my-6 h-px bg-slate-100" />

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Account information</p>
            <div className="mt-3 space-y-3">
              <InfoRow label="Full name" value={user?.name || 'Unnamed account'} />
              <InfoRow label="Email address" value={user?.email || 'No email found'} />
              <InfoRow label="Role" value={user?.role === 'admin' ? 'Admin' : 'Citizen'} />
            </div>
          </div>

          <div className="pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Edit profile</p>
            <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="profile-name" className="text-xs font-medium text-slate-500">Full name</label>
                <input
                  id="profile-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="text-xs font-medium text-slate-500">Email address</label>
                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              {successMessage ? <p className="text-sm font-medium text-teal-700">{successMessage}</p> : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-100 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:w-auto"
                >
                  Back to Dashboard
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-transparent px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
                >
                  Logout
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Profile