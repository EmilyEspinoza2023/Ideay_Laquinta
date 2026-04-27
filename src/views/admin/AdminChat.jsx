import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function AdminChat() {
  const { perfil } = useAuth()
  const [conversaciones, setConversaciones] = useState([])
  const [activa, setActiva] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [clientesEnLinea, setClientesEnLinea] = useState(new Set())
  const bottomRef = useRef(null)

  useEffect(() => { cargarConversaciones() }, [])

  // Presencia real
  useEffect(() => {
    if (!perfil) return
    const canal = supabase.channel('presencia-chat', {
      config: { presence: { key: perfil.id } }
    })
    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        const enLinea = new Set()
        Object.values(estado).flat().forEach(p => {
          if (p.rol === 'cliente') enLinea.add(p.usuario_id)
        })
        setClientesEnLinea(enLinea)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED')
          await canal.track({ rol: 'admin', usuario_id: perfil.id })
      })
    return () => supabase.removeChannel(canal)
  }, [perfil])

  useEffect(() => {
    if (!activa) return
    cargarMensajes(activa)
    const sub = supabase.channel('admin-chat-' + activa.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `conversacion_id=eq.${activa.id}` },
        payload => setMensajes(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [activa])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  async function cargarConversaciones() {
    const { data } = await supabase.from('conversaciones')
      .select('*, perfiles(nombre, apellido, foto_url)')
      .order('ultimo_mensaje_en', { ascending: false })
    setConversaciones(data || [])
  }

  async function cargarMensajes(conv) {
    await supabase.from('conversaciones').update({ no_leidos_admin: 0 }).eq('id', conv.id)
    const { data } = await supabase.from('mensajes').select('*, perfiles(nombre)').eq('conversacion_id', conv.id).order('enviado_en')
    setMensajes(data || [])
  }

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || !activa || !perfil) return
    await supabase.from('mensajes').insert({ conversacion_id: activa.id, remitente_id: perfil.id, contenido: texto.trim() })
    setTexto('')
  }

  function iniciales(p) {
    if (!p) return 'US'
    return `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`.toUpperCase()
  }

  function AvatarCliente({ p, size = 42 }) {
    if (p?.foto_url) return (
      <img src={p.foto_url} alt={p.nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    )
    return (
      <div style={{ width: size, height: size, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.33, flexShrink: 0 }}>
        {iniciales(p)}
      </div>
    )
  }

  function formatHora(fecha) {
    if (!fecha) return ''
    return new Date(fecha).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })
  }

  const sinLeer = conversaciones.filter(c => c.no_leidos_admin > 0).length

  return (
    <LayoutAdmin titulo="Chat con Clientes">
      <div className="card-ideay overflow-hidden" style={{ height: 'calc(100vh - 160px)', display: 'flex' }}>
        {/* Panel izquierdo — lista de conversaciones */}
        <div style={{ width: 300, borderRight: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0">Conversaciones</h6>
              {sinLeer > 0 && <span className="badge" style={{ backgroundColor: 'var(--rojo)' }}>{sinLeer} nuevos</span>}
            </div>
            <input type="text" className="form-control form-control-sm" placeholder="Buscar usuario..." />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversaciones.length === 0 && (
              <p className="text-center text-muted py-4 small">No hay conversaciones</p>
            )}
            {conversaciones.map(conv => (
              <div key={conv.id}
                onClick={() => setActiva(conv)}
                className="p-3 d-flex align-items-center gap-3 border-bottom"
                style={{ cursor: 'pointer', backgroundColor: activa?.id === conv.id ? 'var(--rojo-claro)' : 'transparent' }}>
                <div style={{ position: 'relative' }}>
                  <AvatarCliente p={conv.perfiles} size={42} />
                  <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', backgroundColor: clientesEnLinea.has(conv.cliente_id) ? '#198754' : '#adb5bd' }} />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold" style={{ fontSize: 13 }}>{conv.perfiles?.nombre} {conv.perfiles?.apellido}</span>
                    <small className="text-muted" style={{ fontSize: 10 }}>{formatHora(conv.ultimo_mensaje_en)}</small>
                  </div>
                  <p className="text-muted mb-0 text-truncate" style={{ fontSize: 12 }}>{conv.ultimo_mensaje || 'Sin mensajes'}</p>
                </div>
                {conv.no_leidos_admin > 0 && (
                  <span className="badge rounded-pill" style={{ backgroundColor: 'var(--rojo)', fontSize: 10 }}>{conv.no_leidos_admin}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho — chat activo */}
        {activa ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="p-3 border-bottom d-flex align-items-center gap-3">
              <AvatarCliente p={activa.perfiles} size={38} />
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{activa.perfiles?.nombre} {activa.perfiles?.apellido}</p>
                <div className="d-flex align-items-center gap-1">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: clientesEnLinea.has(activa.cliente_id) ? '#198754' : '#adb5bd' }}></div>
                  <small className="text-muted" style={{ fontSize: 11 }}>{clientesEnLinea.has(activa.cliente_id) ? 'En línea' : 'Desconectado'}</small>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="d-flex flex-column gap-2">
              {mensajes.map(msg => {
                const esMio = msg.remitente_id === perfil?.id
                return (
                  <div key={msg.id} className={`d-flex flex-column ${esMio ? 'align-items-end' : 'align-items-start'}`}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', fontSize: 13,
                      backgroundColor: esMio ? 'var(--rojo)' : '#f1f3f5',
                      color: esMio ? '#fff' : '#212529',
                      borderRadius: esMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}>
                      {msg.contenido}
                    </div>
                    <small className="text-muted mt-1" style={{ fontSize: 10 }}>{formatHora(msg.enviado_en)}</small>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={enviar} className="p-3 border-top d-flex gap-2">
              <input type="text" className="form-control" placeholder="Escribir mensaje..."
                value={texto} onChange={e => setTexto(e.target.value)} />
              <button type="submit" className="btn" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10, flexShrink: 0 }}>
                <i className="bi bi-send-fill"></i>
              </button>
            </form>
          </div>
        ) : (
          <div style={{ flex: 1 }} className="d-flex flex-column align-items-center justify-content-center text-muted">
            <i className="bi bi-chat-dots" style={{ fontSize: 48, color: '#dee2e6' }}></i>
            <p className="mt-2" style={{ fontSize: 14 }}>Seleccioná una conversación para ver los mensajes</p>
          </div>
        )}
      </div>
    </LayoutAdmin>
  )
}
