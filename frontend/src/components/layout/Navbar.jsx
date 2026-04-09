function Navbar() {
  return (
    <header className="topbar">
      <h1 className="topbar__brand">ARGUS</h1>

      <div className="topbar__user">
        <span className="topbar__user-label">Admin</span>
        <div className="topbar__avatar" aria-hidden="true" />
      </div>
    </header>
  )
}

export default Navbar