import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGeofencing } from '../../hooks/useGeofencing'
import logo from '../../assets/logo.png'

function GeofencingActivador() {
  useGeofencing()
  return null
}

export default function NavCliente() {
  const { cerrarSesion, esInvitado } = useAuth()

  return (
    <>
      {!esInvitado && <GeofencingActivador />}
      {/* ── NAV SUPERIOR — solo desktop ── */}
      <nav className="nav-top-cliente">
        <NavLink to="/inicio" style={{ marginRight: 4 }}>
          <img src={logo} alt="Ideay" style={{ height: 32, borderRadius: 6 }} />
        </NavLink>
        <div className="d-flex align-items-center gap-1 flex-grow-1">
          <NavLink to="/inicio"><i className="bi bi-house-door"></i> Inicio</NavLink>
          <NavLink to="/explorar"><i className="bi bi-search"></i> Explorar</NavLink>
          <NavLink to="/reservas"><i className="bi bi-bookmark"></i> Reservas</NavLink>
          <NavLink to="/chat"><i className="bi bi-chat-dots"></i> Chat</NavLink>
          <NavLink to="/favoritos"><i className="bi bi-heart"></i> Favoritos</NavLink>
        </div>
        <NavLink to="/perfil" style={{ marginLeft: 'auto' }}>
          <i className="bi bi-person-circle" style={{ fontSize: 20 }}></i> Perfil
        </NavLink>
      </nav>

      {/* ── NAV INFERIOR — solo mobile ── */}
      <nav className="nav-cliente">
        <NavLink to="/inicio">
          <i className="bi bi-house-door"></i>
          Inicio
        </NavLink>
        <NavLink to="/explorar">
          <i className="bi bi-search"></i>
          Explorar
        </NavLink>
        <NavLink to="/reservas" style={{ flex: 'none' }}>
          <div className="nav-central">
            <i className="bi bi-bookmark-fill"></i>
          </div>
        </NavLink>
        <NavLink to="/chat">
          <i className="bi bi-chat-dots"></i>
          Chat
        </NavLink>
        <NavLink to="/perfil">
          <i className="bi bi-person"></i>
          Perfil
        </NavLink>
      </nav>
    </>
  )
}
