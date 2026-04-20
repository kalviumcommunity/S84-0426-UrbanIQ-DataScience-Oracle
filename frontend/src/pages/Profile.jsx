import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole, getSession, logoutUser, updateProfile } from '../services/auth.js'

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
    <main className="mx-auto mt-[2.5rem] w-[660px] max-w-full rounded-[10px] border border-[#d1d5db] bg-[#fff] p-[2rem_2.5rem_1.75rem] shadow-[0_1px_4px_rgba(0,0,0,0.06)]" aria-label="Profile page">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-[700] text-[#1a1a2e] leading-none">{name || user?.name || 'Unnamed account'}</h1>
            <span className="rounded-full border-[1.5px] border-[#555] px-[10px] py-[2px] text-[12px] font-[600] uppercase text-[#555] tracking-[0.05em]">
              {roleLabel}
            </span>
          </div>
          <p className="mt-3 text-[14px] text-[#444]">{email || user?.email || 'No email found'}</p>
        </div>

        <div className="flex flex-col gap-[18px]">
          <label className="flex flex-col" htmlFor="profile-name">
            <span className="mb-1.5 text-[11px] font-[700] uppercase tracking-[0.07em] text-[#666]">Full Name</span>
            <input
              id="profile-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (error) setError('')
                if (success) setSuccess('')
              }}
              required
              autoComplete="name"
              className="w-full rounded-[8px] border border-[#a3a3a3] bg-white px-[12px] py-[9px] text-sm text-[#111827] outline-none"
            />
          </label>

          <label className="flex flex-col" htmlFor="profile-email">
            <span className="mb-1.5 text-[11px] font-[700] uppercase tracking-[0.07em] text-[#666]">Email Address</span>
            <input
              id="profile-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (error) setError('')
                if (success) setSuccess('')
              }}
              required
              autoComplete="email"
              className="w-full rounded-[8px] border border-[#a3a3a3] bg-white px-[12px] py-[9px] text-sm text-[#111827] outline-none"
            />
          </label>

          <label className="flex flex-col" htmlFor="profile-role">
            <span className="mb-1.5 text-[11px] font-[700] uppercase tracking-[0.07em] text-[#666]">Role</span>
            <input
              id="profile-role"
              type="text"
              value={roleLabel}
              readOnly
              disabled
              className="w-full rounded-[8px] border border-[#d1d5db] bg-[#e8eaed] px-[12px] py-[9px] text-sm text-[#444] outline-none"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-5 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-5 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {success}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center border-t border-[#e5e7eb] pt-[1.25rem] gap-[12px]">
          <button
            type="submit"
            className="rounded-[8px] border border-[#2563eb] bg-[#2563eb] px-[20px] py-[8px] text-[14px] font-[500] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            className="rounded-[8px] border border-[#d1d5db] bg-white px-[16px] py-[8px] text-[14px] font-[400] text-[#111827] transition hover:bg-gray-50"
            onClick={handleBack}
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            className="ml-auto rounded-[8px] border border-[#d1d5db] bg-white px-[16px] py-[8px] text-[14px] font-[400] text-[#111827] transition hover:bg-gray-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </form>
    </main>
  )
}

export default Profile