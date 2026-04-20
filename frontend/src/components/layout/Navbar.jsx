import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfileRouteForRole, getSession, logoutUser } from '../../services/auth.js'
import NotificationsPanel from '../notifications/NotificationsPanel.jsx'

function Navbar({ searchQuery, onSearchQueryChange, onToggleSidebar }) {
  const navigate = useNavigate()
  const session = getSession()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsPopoverRef = useRef(null)
  const notificationsButtonRef = useRef(null)

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      const popoverNode = notificationsPopoverRef.current
      const buttonNode = notificationsButtonRef.current

      if (popoverNode?.contains(event.target) || buttonNode?.contains(event.target)) {
        return
      }

      setIsNotificationsOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNotificationsOpen])

  function handleLogout() {
    logoutUser()
    navigate('/get-started', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="topbar__brand-wrap">
        <button className="topbar__menu-btn" type="button" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 5.5h12M4 10h12M4 14.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <div className="topbar__brand-avatar" aria-hidden="true">
          A
        </div>
        <div>
          <h1 className="topbar__brand">Argus</h1>
          <p className="topbar__brand-subtitle">Citizen complaint tracking</p>
        </div>
      </div>

      <div className="topbar__center">
        <label className="topbar__search" htmlFor="complaints-search">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          <input
            id="complaints-search"
            type="search"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </label>
      </div>

      <div className="topbar__actions">
        <button
          ref={notificationsButtonRef}
          className="topbar__icon-btn"
          type="button"
          aria-label="Notifications"
          aria-expanded={isNotificationsOpen}
          aria-controls="topbar-notifications-panel"
          onClick={() => setIsNotificationsOpen((value) => !value)}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 3.5a4 4 0 00-4 4v2.1c0 .62-.22 1.21-.62 1.69L4.25 12.6a.8.8 0 00.61 1.33h10.28a.8.8 0 00.61-1.33l-1.13-1.3A2.6 2.6 0 0114 9.6V7.5a4 4 0 00-4-4z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M8.2 15.2a2 2 0 003.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="topbar__badge">3</span>
        </button>

        {isNotificationsOpen ? (
          <div ref={notificationsPopoverRef} id="topbar-notifications-panel" className="topbar__notifications-popover">
            <NotificationsPanel mode="popover" onClose={() => setIsNotificationsOpen(false)} />
          </div>
        ) : null}

        <details className="topbar__profile">
          <summary className="topbar__profile-summary">
            <div className="topbar__avatar" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="2.7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4.8 16c1.05-2.2 2.9-3.3 5.2-3.3s4.15 1.1 5.2 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="topbar__user-label">{session?.user?.name ?? 'test'}</span>
              <p className="topbar__user-subtitle">{session?.user?.role === 'admin' ? 'Admin account' : 'Citizen account'}</p>
            </div>
          </summary>

          <div className="topbar__profile-menu">
            <button type="button" onClick={() => navigate(getProfileRouteForRole(session?.user?.role))}>
              View profile
            </button>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </details>
      </div>
    </header>
  )
}

export default Navbar
