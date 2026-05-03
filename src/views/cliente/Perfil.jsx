import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import NavCliente from '../../components/navegacion/NavCliente'
import FotoPerfil from '../../components/comunes/FotoPerfil'

export default function Perfil() {
  const { perfil, cerrarSesion, cargarPerfil } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ tickets: 0, reservas: 0, favoritos: 0 })
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '' })
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState('')
  const [errorPerfil, setErrorPerfil] = useState('')

  useEffect(() => {
    if (!perfil) return
    setForm({ nombre: perfil.nombre || '', apellido: perfil.apellido || '', telefono: perfil.telefono || '' })
    Promise.all([
      supabase.from('entradas').select('*', { count: 'exact', head: true }).eq('usuario_id', perfil.id).eq('estado', 'pagado'),
      supabase.from('reservas_mesas').select('*', { count: 'exact', head: true }).eq('usuario_id', perfil.id),
      supabase.from('favoritos').select('*', { count: 'exact', head: true }).eq('usuario_id', perfil.id),
    ]).then(([{ count: t }, { count: r }, { count: f }]) => {
      setStats({ tickets: t || 0, reservas: r || 0, favoritos: f || 0 })
    })
  }, [perfil])

  async function guardar() {
    setErrorPerfil('')
    if (!form.nombre.trim()) return setErrorPerfil('El nombre no puede estar vacío')
    if (!form.apellido.trim()) return setErrorPerfil('El apellido no puede estar vacío')
    setGuardando(true)
    await supabase.from('perfiles').update({ nombre: form.nombre.trim(), apellido: form.apellido.trim(), telefono: form.telefono.trim() }).eq('id', perfil.id)
    if (cargarPerfil) cargarPerfil(perfil.id)
    setEditando(false)
    setOk('Perfil actualizado')
    setTimeout(() => setOk(''), 2000)
    setGuardando(false)
  }

  const iniciales = perfil ? `${perfil.nombre?.[0] || ''}${perfil.apellido?.[0] || ''}`.toUpperCase() : ''

  const menu = [
    { label: 'Mis Tickets', icon: 'bi-ticket-perforated', ruta: '/mis-tickets' },
    { label: 'Mis Reservas', icon: 'bi-calendar-check', ruta: '/reservas' },
    { label: 'Favoritos', icon: 'bi-heart', ruta: '/favoritos' },
    { label: 'Notificaciones', icon: 'bi-bell', ruta: '/notificaciones' },
    { label: 'Configuración', icon: 'bi-gear', ruta: '/configuracion' },
  ]

  return (
    <div className="contenido-principal">
      <div className="px-3 pt-4 pb-2 d-flex align-items-center justify-content-between">
        <h5 className="fw-bold mb-0">Mi Perfil</h5>
        {ok && <small style={{ color: 'var(--exito)' }}><i className="bi bi-check-circle me-1"></i>{ok}</small>}
      </div>

      {/* Avatar y datos */}
      <div className="mx-3 mb-3 card-ideay p-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <FotoPerfil perfil={perfil} size={64} onActualizar={() => cargarPerfil(perfil.id)} />
          <div className="flex-grow-1">
            {editando ? (
              <div className="d-flex flex-column gap-2">
                <div className="d-flex gap-2">
                  <input className="form-control form-control-sm" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                  <input className="form-control form-control-sm" placeholder="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
                </div>
                <input className="form-control form-control-sm" placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                {errorPerfil && <p className="text-danger mb-0" style={{ fontSize: 12 }}>{errorPerfil}</p>}
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-light" style={{ borderRadius: 8, fontSize: 12 }} onClick={() => { setEditando(false); setErrorPerfil('') }}>Cancelar</button>
                  <button className="btn btn-sm fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 8, fontSize: 12 }} onClick={guardar} disabled={guardando}>
                    {guardando ? <span className="spinner-border spinner-border-sm" /> : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h6 className="fw-bold mb-0">{perfil?.nombre} {perfil?.apellido}</h6>
                <small className="text-muted">{perfil?.correo}</small>
                {perfil?.telefono && <p className="mb-0 mt-1" style={{ fontSize: 12, color: '#6c757d' }}><i className="bi bi-telephone me-1"></i>{perfil.telefono}</p>}
                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3 mt-2" style={{ fontSize: 12 }} onClick={() => setEditando(true)}>
                  <i className="bi bi-pencil me-1"></i>Editar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-3 mb-3 card-ideay p-3">
        <div className="row text-center g-0">
          {[
            { label: 'Tickets', valor: stats.tickets },
            { label: 'Reservas', valor: stats.reservas },
            { label: 'Favoritos', valor: stats.favoritos },
          ].map(({ label, valor }) => (
            <div key={label} className="col border-end border-light last:border-0">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--rojo)' }}>{valor}</h5>
              <small className="text-muted" style={{ fontSize: 11 }}>{label}</small>
            </div>
          ))}
        </div>
      </div>

      {/* Menú */}
      <div className="mx-3 mb-3 card-ideay overflow-hidden">
        {menu.map(({ label, icon, ruta }, i) => (
          <button key={ruta} onClick={() => navigate(ruta)}
            className="w-100 btn d-flex align-items-center justify-content-between px-4 py-3 rounded-0"
            style={{ borderBottom: i < menu.length - 1 ? '1px solid #f0f0f0' : 'none', background: 'transparent', color: '#212529' }}>
            <div className="d-flex align-items-center gap-3">
              <i className={`bi ${icon}`} style={{ fontSize: 18, color: 'var(--rojo)' }}></i>
              <span className="fw-medium" style={{ fontSize: 14 }}>{label}</span>
            </div>
            <i className="bi bi-chevron-right text-muted" style={{ fontSize: 12 }}></i>
          </button>
        ))}
      </div>

      {/* Cerrar sesión */}
      <div className="mx-3 mb-3 card-ideay overflow-hidden">
        <button onClick={cerrarSesion}
          className="w-100 btn d-flex align-items-center gap-3 px-4 py-3 rounded-0"
          style={{ background: 'transparent', color: '#dc3545' }}>
          <i className="bi bi-box-arrow-right" style={{ fontSize: 18 }}></i>
          <span className="fw-medium" style={{ fontSize: 14 }}>Cerrar Sesión</span>
        </button>
      </div>

      <NavCliente />
    </div>
  )
}
