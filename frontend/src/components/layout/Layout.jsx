import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import './layout.css'

function Layout() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="app-shell__main-column">
        <Navbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
        <main className="app-shell__content">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  )
}

export default Layout