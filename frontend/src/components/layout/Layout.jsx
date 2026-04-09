import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import './layout.css'

function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout