import { NavLink, useNavigate } from 'react-router-dom'
import { getSession, logoutUser } from '../../services/auth.js'

function getNavItems(role) {
  if (role === 'admin') {
    return [
      {
        label: 'Admin Dashboard',
        to: '/admin/dashboard',
        icon: (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
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
  ]
}

function Sidebar() {
  const navigate = useNavigate()
  const session = getSession()
  const navItems = getNavItems(session?.user?.role)
  const heading = session?.user?.role === 'admin' ? 'Admin Controls' : 'Citizen Services'

  function handleLogout() {
    logoutUser()
    navigate('/get-started', { replace: true })
  }

  return (
    <aside className="sidebar" aria-label="Primary navigation">
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
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button className="sidebar__logout" type="button" onClick={handleLogout}>
        Log out
      </button>
    </aside>
  )
}

export default Sidebar
