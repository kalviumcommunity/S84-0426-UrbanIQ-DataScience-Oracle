import { NavLink, useNavigate } from 'react-router-dom'
import { getSession, logoutUser } from '../../services/auth.js'

function getNavItems(role) {
  if (role === 'admin') {
    return [
      {
        label: 'Overview',
        to: '/admin/overview',
        icon: (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        label: 'Work Queue',
        to: '/admin/work-queue',
        icon: (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 8h8M6 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Analytics',
        to: '/admin/analytics',
        icon: (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 14V9m4 5V6m4 8v-4m4 4V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Team Management',
        to: '/admin/team-management',
        icon: (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="7" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="13" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3.8 14.5c.7-1.6 2-2.4 3.8-2.4 1.8 0 3 .8 3.8 2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11.3 14.2c.5-1.2 1.4-1.8 2.7-1.8 1.2 0 2.1.6 2.7 1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ]
  }

  return [
    {
      label: 'Citizen Dashboard',
      to: '/citizen/dashboard',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 5.2A1.2 1.2 0 015.2 4h9.6A1.2 1.2 0 0116 5.2v7.6a1.2 1.2 0 01-1.2 1.2H9l-3 2v-2H5.2A1.2 1.2 0 014 12.8V5.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M7 7.5h6M7 10.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'How it works',
      to: '/citizen/how-it-works',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6.8v.2M10 9v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ]
}

function Sidebar({ collapsed = false }) {
  const navigate = useNavigate()
  const session = getSession()
  const navItems = getNavItems(session?.user?.role)
  const heading = session?.user?.role === 'admin' ? 'Admin Controls' : 'Citizen Services'

  function handleLogout() {
    logoutUser()
    navigate('/get-started', { replace: true })
  }

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`} aria-label="Primary navigation">
      <p className="sidebar__heading">{heading}</p>
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__link-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {session?.user?.role !== 'admin' ? (
        <div className="sidebar__support">
          <p className="sidebar__support-label">Support</p>
          <NavLink to="/citizen/how-it-works" className="sidebar__support-link">
            <span className="sidebar__icon">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6.8v.2M10 9v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="sidebar__support-text">How it works</span>
          </NavLink>
        </div>
      ) : null}

      <div className="sidebar__footer">
        <div className="sidebar__footer-rule" />
        <button className="sidebar__logout" type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
