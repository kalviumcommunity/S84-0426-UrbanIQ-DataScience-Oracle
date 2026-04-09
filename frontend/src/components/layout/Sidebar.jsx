import { NavLink } from 'react-router-dom'

const navItems = [
  {
    label: 'Dashboard',
    to: '/',
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
    label: 'Complaints',
    to: '/complaints',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 5.2A1.2 1.2 0 015.2 4h9.6A1.2 1.2 0 0116 5.2v7.6a1.2 1.2 0 01-1.2 1.2H9l-3 2v-2H5.2A1.2 1.2 0 014 12.8V5.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 7.5h6M7 10.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <p className="sidebar__heading">Navigation</p>
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar