import { NavLink } from 'react-router-dom'

export default function NavCliente() {
  return (
    <nav className="nav-cliente">
      <NavLink to="/inicio"><i className="bi bi-house-door"></i>Inicio</NavLink>
      <NavLink to="/explorar"><i className="bi bi-search"></i>Explorar</NavLink>
      <NavLink to="/reservas" style={{ flex: 'none' }}>
        <div className="nav-central"><i className="bi bi-bookmark-fill"></i></div>
      </NavLink>
      <NavLink to="/chat"><i className="bi bi-chat-dots"></i>Chat</NavLink>
      <NavLink to="/perfil"><i className="bi bi-person"></i>Perfil</NavLink>
    </nav>
  )
}
