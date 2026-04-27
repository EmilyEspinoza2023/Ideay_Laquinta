import { NavLink } from 'react-router-dom'

export default function NavAdmin() {
  return (
    <nav className="nav-inferior">
      <NavLink to="/admin/dashboard">
        <i className="bi bi-speedometer2"></i>
        Dashboard
      </NavLink>
      <NavLink to="/admin/eventos">
        <i className="bi bi-calendar-event"></i>
        Eventos
      </NavLink>
      <NavLink to="/admin/reservas" style={{ flex: 'none' }}>
        <div className="btn-central">
          <i className="bi bi-bookmark-fill"></i>
        </div>
      </NavLink>
      <NavLink to="/admin/chat">
        <i className="bi bi-chat-dots"></i>
        Chat
      </NavLink>
      <NavLink to="/admin/stats">
        <i className="bi bi-bar-chart-line"></i>
        Stats
      </NavLink>
    </nav>
  )
}
