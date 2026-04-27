import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTema } from '../../context/TemaContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function Configuracion() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const { oscuro, setOscuro } = useTema()
  const [notifEmail, setNotifEmail] = useState(false)
  const [notifPush, setNotifPush] = useState(true)

  useEffect(() => {
    if (!perfil) return
    supabase.from('perfiles').select('notif_email').eq('id', perfil.id).maybeSingle()
      .then(({ data }) => setNotifEmail(data?.notif_email || false))
  }, [perfil])

  async function toggleNotifEmail() {
    const nuevo = !notifEmail
    setNotifEmail(nuevo)
    await supabase.from('perfiles').update({ notif_email: nuevo }).eq('id', perfil.id)
  }

  function Toggle({ activo, onToggle }) {
    return (
      <div onClick={onToggle} style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        backgroundColor: activo ? 'var(--rojo)' : '#ced4da',
        position: 'relative', transition: 'background-color .2s', flexShrink: 0
      }}>
        <div style={{
          position: 'absolute', top: 2, width: 20, height: 20,
          backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          transform: activo ? 'translateX(22px)' : 'translateX(2px)',
          transition: 'transform .2s'
        }} />
      </div>
    )
  }

  function Seccion({ titulo, children }) {
    return (
      <div className="mb-4">
        <p className="fw-semibold text-muted mb-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{titulo}</p>
        <div className="card-ideay overflow-hidden">{children}</div>
      </div>
    )
  }

  function Item({ label, icon, accion, toggle, activo, onToggle, ultimo }) {
    return (
      <div className={`d-flex align-items-center justify-content-between px-3 py-3 ${!ultimo ? 'border-bottom' : ''}`}
        style={{ cursor: accion ? 'pointer' : 'default' }} onClick={accion}>
        <div className="d-flex align-items-center gap-3">
          <i className={`bi ${icon} text-muted`} style={{ fontSize: 18, width: 20, textAlign: 'center' }}></i>
          <span style={{ fontSize: 14 }}>{label}</span>
        </div>
        {toggle
          ? <Toggle activo={activo} onToggle={onToggle} />
          : <i className="bi bi-chevron-right text-muted" style={{ fontSize: 14 }}></i>
        }
      </div>
    )
  }

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 800 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Configuración</h4>
        </div>

        <Seccion titulo="Apariencia">
          <Item label="Modo Oscuro" icon="bi-moon-fill" toggle activo={oscuro} onToggle={() => setOscuro(!oscuro)} ultimo />
        </Seccion>

        <Seccion titulo="Notificaciones">
          <Item label="Push Notifications" icon="bi-bell-fill" toggle activo={notifPush} onToggle={() => setNotifPush(!notifPush)} />
          <Item label="Notificaciones por email" icon="bi-envelope-fill" toggle activo={notifEmail} onToggle={toggleNotifEmail} ultimo />
        </Seccion>

        <Seccion titulo="Seguridad">
          <Item label="Cambiar contraseña" icon="bi-key-fill" accion={() => navigate('/cambiar-contrasena')} ultimo />
        </Seccion>

        <Seccion titulo="Información">
          <Item label="Acerca de Ideay" icon="bi-info-circle-fill" accion={() => navigate('/acerca-de')} />
          <Item label="Términos y condiciones" icon="bi-file-text-fill" accion={() => navigate('/terminos')} ultimo />
        </Seccion>

        <p className="text-center text-muted pb-4" style={{ fontSize: 12 }}>Ideay v1.0.0</p>
      </div>
    </div>
  )
}
