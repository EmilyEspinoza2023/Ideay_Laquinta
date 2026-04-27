import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

const ICONOS = {
  reserva:    { bg: '#e8f5e9', color: '#198754', icon: 'bi-bookmark-check-fill' },
  mensaje:    { bg: '#e3f2fd', color: '#1565c0', icon: 'bi-chat-dots-fill' },
  venta:      { bg: '#fff3cd', color: '#856404', icon: 'bi-ticket-perforated-fill' },
  comentario: { bg: '#f3e5f5', color: '#7b1fa2', icon: 'bi-chat-square-text-fill' },
  general:    { bg: '#f8f9fa', color: '#6c757d', icon: 'bi-bell-fill' },
}

const DESTINO = {
  reserva:    '/admin/reservas',
  mensaje:    '/admin/chat',
  venta:      '/admin/tickets',
  comentario: '/admin/comentarios',
}

export default function NotificacionesAdmin() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    if (!perfil) return
    cargar()
    const sub = supabase.channel('notif-admin-vista-' + perfil.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${perfil.id}` }, cargar)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [perfil])

  async function cargar() {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', perfil.id)
      .order('creado_en', { ascending: false })
    setNotifs(data || [])
  }

  async function marcarTodasLeidas() {
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', perfil.id).eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  async function handleClick(n) {
    if (!n.leida) {
      await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x))
    }
    const destino = DESTINO[n.tipo]
    if (destino) navigate(destino)
  }

  function formatTiempo(fecha) {
    const diff = Date.now() - new Date(fecha).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Hace unos minutos'
    if (h < 24) return `Hace ${h}h`
    const d = Math.floor(h / 24)
    if (d === 1) return 'Ayer'
    return `Hace ${d} días`
  }

  const noLeidas = notifs.filter(n => !n.leida).length

  return (
    <LayoutAdmin titulo="Notificaciones">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
        </p>
        {noLeidas > 0 && (
          <button className="btn btn-sm btn-link p-0" style={{ color: 'var(--rojo)', fontSize: 13 }}
            onClick={marcarTodasLeidas}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="d-flex flex-column gap-2">
        {notifs.map(n => {
          const { bg, color, icon } = ICONOS[n.tipo] || ICONOS.general
          const tappeable = !!DESTINO[n.tipo]
          return (
            <div key={n.id}
              className="card-ideay p-3 d-flex gap-3 align-items-start"
              style={{
                borderLeft: !n.leida ? '3px solid var(--rojo)' : '3px solid transparent',
                cursor: tappeable ? 'pointer' : 'default',
              }}
              onClick={() => handleClick(n)}>
              <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: 42, height: 42, backgroundColor: bg }}>
                <i className={`bi ${icon}`} style={{ color, fontSize: 17 }}></i>
              </div>
              <div className="flex-1">
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{n.titulo}</p>
                <p className="text-muted mb-0" style={{ fontSize: 12 }}>{n.cuerpo}</p>
              </div>
              <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                <small className="text-muted" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{formatTiempo(n.creado_en)}</small>
                {!n.leida && <div className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: 'var(--rojo)' }} />}
                {tappeable && <i className="bi bi-chevron-right text-muted" style={{ fontSize: 10 }}></i>}
              </div>
            </div>
          )
        })}

        {notifs.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-bell" style={{ fontSize: 48, color: '#dee2e6' }}></i>
            <p className="text-muted mt-3" style={{ fontSize: 14 }}>No hay notificaciones</p>
          </div>
        )}
      </div>
    </LayoutAdmin>
  )
}
