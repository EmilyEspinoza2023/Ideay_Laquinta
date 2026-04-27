import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTema } from '../../context/TemaContext'
import { supabase } from '../../lib/supabase'
import logo from '../../assets/logo.png'

const enlaces = [
  { to: '/admin/dashboard',       icon: 'bi-speedometer2',         label: 'Dashboard' },
  { to: '/admin/eventos',         icon: 'bi-calendar-event',       label: 'Eventos' },
  { to: '/admin/mesas',           icon: 'bi-grid-1x2',             label: 'Gestión de Mesas' },
  { to: '/admin/tickets',         icon: 'bi-ticket-perforated',    label: 'Tickets' },
  { to: '/admin/reservas',        icon: 'bi-bookmark-check',       label: 'Reservas' },
  { to: '/admin/chat',            icon: 'bi-chat-dots',            label: 'Chat' },
  { to: '/admin/comentarios',     icon: 'bi-chat-square-text',     label: 'Comentarios' },
  { to: '/admin/stats',           icon: 'bi-bar-chart-line',       label: 'Estadísticas' },
  { to: '/admin/geofencing',      icon: 'bi-geo-alt',              label: 'Geofencing' },
  { to: '/admin/perfil',          icon: 'bi-person-circle',        label: 'Mi Perfil' },
]

export default function SidebarAdmin({ abierto, onCerrar }) {
  const { cerrarSesion, perfil } = useAuth()
  const { oscuro, setOscuro } = useTema()
  const navigate = useNavigate()
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    if (!perfil) return
    cargarNoLeidas()
    const sub = supabase.channel('sidebar-notif-admin-' + perfil.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${perfil.id}` }, cargarNoLeidas)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [perfil])

  async function cargarNoLeidas() {
    const { count } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', perfil.id)
      .eq('leida', false)
    setNoLeidas(count || 0)
  }

  return (
    <aside className={`sidebar-admin ${abierto ? 'abierto' : ''}`}>
      {/* Logo */}
      <div className="p-3 border-bottom d-flex align-items-center gap-2" style={{ borderColor: 'inherit' }}>
        <img src={logo} alt="Ideay" style={{ height: 40, borderRadius: 8, background: '#fff', padding: '2px 6px' }} />
        <div>
          <p className="mb-0 fw-bold" style={{ color: 'var(--rojo)', fontSize: 15 }}>¡Ideay!</p>
          <small className="text-muted" style={{ fontSize: 11 }}>Panel Admin</small>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-grow-1 py-2">
        {/* Notificaciones con badge */}
        <NavLink
          to="/admin/notificaciones"
          className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}
          onClick={onCerrar}
        >
          <div style={{ position: 'relative', width: 22, flexShrink: 0 }}>
            <i className="bi bi-bell-fill" style={{ fontSize: 18 }}></i>
            {noLeidas > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -4,
                backgroundColor: 'var(--rojo)', color: '#fff',
                fontSize: 9, fontWeight: 700, borderRadius: 10,
                padding: '1px 4px', lineHeight: 1.4,
              }}>
                {noLeidas > 99 ? '99+' : noLeidas}
              </span>
            )}
          </div>
          <span style={{ fontSize: 14 }}>Notificaciones</span>
        </NavLink>

        {enlaces.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}
            onClick={onCerrar}
          >
            <i className={`bi ${icon}`} style={{ fontSize: 18, width: 22 }}></i>
            <span style={{ fontSize: 14 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-top" style={{ borderColor: 'inherit' }}>
        <div className="d-flex align-items-center justify-content-between mb-2 px-2">
          <span className="text-muted" style={{ fontSize: 13 }}>
            <i className="bi bi-moon me-2"></i>Modo oscuro
          </span>
          <button className={`toggle ${oscuro ? 'on' : 'off'}`} onClick={() => setOscuro(!oscuro)}>
            <div className="toggle-knob" />
          </button>
        </div>
        <button
          className="btn btn-light w-100 d-flex align-items-center gap-2"
          style={{ borderRadius: 10, fontSize: 13 }}
          onClick={cerrarSesion}
        >
          <i className="bi bi-box-arrow-right" style={{ color: 'var(--rojo)' }}></i>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
