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

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Citizen'
  const displayName = name || user?.name || 'Admin'
  const displayEmail = email || user?.email || 'admin@gmail.com'

  return (
    <main className="min-h-screen w-full bg-white px-4 py-10 font-sans" aria-label="Profile page">
      <div className="mx-auto w-full max-w-[720px] rounded-[16px] bg-[#f7f7f9] shadow-sm">
        <header className="flex items-center gap-[16px] rounded-t-[16px] bg-[linear-gradient(135deg,#2f5be7,#4c74e6)] p-[24px] text-white">
          <div 
            className="flex shrink-0 items-center justify-center font-[600]" 
            style={{ width: '80px', height: '80px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', fontSize: '36px', color: '#ffffff' }}
          >
            A
          </div>
          <div className="flex flex-col justify-center items-start">
            <h1 className="text-[28px] font-[700] leading-[1]" style={{ margin: 0, padding: 0, color: '#ffffff' }}>{displayName}</h1>
            <p className="text-[16px] leading-[1]" style={{ margin: '4px 0 0 0', padding: 0, color: 'rgba(255, 255, 255, 0.9)' }}>{displayEmail}</p>
            <div 
              className="inline-flex items-center font-[600] leading-none" 
              style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', fontSize: '12px', color: '#ffffff' }}
            >
              <span className="mr-1.5 h-[6px] w-[6px] rounded-full bg-[#4ADE80]" aria-hidden="true" />
              ADMIN
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="p-[24px]">
          <p className="mb-[16px] text-[12px] font-[600] tracking-[1px] text-[#8b8f97]">
            PROFILE INFORMATION
          </p>

          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col">
              <label htmlFor="profile-name" className="mb-[6px] text-[12px] text-[#7a869a]">
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
                  if (success) setSuccess('')
                }}
                required
                autoComplete="name"
                className="w-full box-border rounded-[8px] border border-[#e1e5ea] bg-white px-[12px] py-[10px] text-[14px] text-[#111827] outline-none transition focus:border-[#2f5be7]"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="profile-email" className="mb-[6px] text-[12px] text-[#7a869a]">
                Email Address
              </label>
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
                className="w-full box-border rounded-[8px] border border-[#e1e5ea] bg-white px-[12px] py-[10px] text-[14px] text-[#111827] outline-none transition focus:border-[#2f5be7]"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="profile-role" className="mb-[6px] text-[12px] text-[#7a869a]">
                Role
              </label>
              <div className="relative flex w-full items-center">
                <input
                  id="profile-role"
                  type="text"
                  value={roleLabel}
                  readOnly
                  disabled
                  className="w-full box-border rounded-[8px] border border-[#e1e5ea] bg-[#eef1f5] px-[12px] py-[10px] pr-[36px] text-[14px] text-[#7a869a] outline-none"
                />
                <span className="pointer-events-none absolute right-[12px] flex items-center text-[#7a869a]" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="11" width="12" height="9" rx="2" ry="2" />
                    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-[18px] rounded-[8px] border border-red-200 bg-red-50 p-[12px] text-[14px] text-red-700" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-[18px] rounded-[8px] border border-emerald-200 bg-emerald-50 p-[12px] text-[14px] text-emerald-700" role="status">
              {success}
            </p>
          )}

          <div className="mt-[24px] flex items-center justify-between">
            <div className="flex gap-[12px]">
              <button
                type="submit"
                className="rounded-[8px] border-none bg-[#2f5be7] px-[16px] py-[10px] text-[14px] font-[500] text-white transition hover:bg-[#254ab8] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>

              <button
                type="button"
                className="rounded-[8px] border border-[#d0d5dd] bg-white px-[16px] py-[10px] text-[14px] text-[#374151] transition hover:bg-[#F9FAFB]"
                onClick={handleBack}
              >
                Back to dashboard
              </button>
            </div>

            <button
              type="button"
              className="flex items-center justify-center rounded-[8px] border border-[#f2b8b5] bg-white px-[16px] py-[10px] text-[14px] text-[#d92d20] transition hover:bg-[#FEF2F2]"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Profile