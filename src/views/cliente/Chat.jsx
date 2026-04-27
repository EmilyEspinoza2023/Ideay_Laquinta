import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function Chat() {
  const { perfil } = useAuth()
  const [conversacion, setConversacion] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [fotoAdmin, setFotoAdmin] = useState(null)
  const [adminEnLinea, setAdminEnLinea] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.from('perfiles').select('foto_url').eq('rol', 'admin').limit(1).maybeSingle()
      .then(({ data }) => setFotoAdmin(data?.foto_url || null))
  }, [])

  // Presencia real
  useEffect(() => {
    if (!perfil) return
    const canal = supabase.channel('presencia-chat', {
      config: { presence: { key: perfil.id } }
    })
    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        const hayAdmin = Object.values(estado).flat().some(p => p.rol === 'admin')
        setAdminEnLinea(hayAdmin)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED')
          await canal.track({ rol: 'cliente', usuario_id: perfil.id })
      })
    return () => supabase.removeChannel(canal)
  }, [perfil])

  useEffect(() => { if (perfil) cargarConversacion() }, [perfil])

  useEffect(() => {
    if (!conversacion) return
    const sub = supabase.channel('mensajes-cliente-' + conversacion.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `conversacion_id=eq.${conversacion.id}` },
        payload => setMensajes(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [conversacion])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  async function cargarConversacion() {
    let { data: conv } = await supabase.from('conversaciones').select('*').eq('cliente_id', perfil.id).maybeSingle()
    if (!conv) {
      const { data: nueva } = await supabase.from('conversaciones')
        .upsert({ cliente_id: perfil.id }, { onConflict: 'cliente_id' })
        .select().maybeSingle()
      conv = nueva
    }
    if (!conv) return
    setConversacion(conv)
    await supabase.from('conversaciones').update({ no_leidos_cliente: 0 }).eq('id', conv.id)
    const { data: msgs } = await supabase.from('mensajes').select('*').eq('conversacion_id', conv.id).order('enviado_en')
    setMensajes(msgs || [])
  }

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || !conversacion) return
    await supabase.from('mensajes').insert({ conversacion_id: conversacion.id, remitente_id: perfil.id, contenido: texto.trim() })
    setTexto('')
  }

  function formatHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="page-cliente d-flex flex-column" style={{ height: '100vh' }}>
      <NavCliente />

      {/* Header del chat */}
      <div className="d-flex align-items-center gap-3 px-3 py-2 border-bottom bg-white" style={{ flexShrink: 0 }}>
        {fotoAdmin ? (
          <img src={fotoAdmin} alt="La Quinta" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            LQ
          </div>
        )}
        <div>
          <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>La Quinta</p>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', backgroundColor: adminEnLinea ? '#198754' : '#adb5bd' }}></span>
            <small className="text-muted" style={{ fontSize: 11 }}>{adminEnLinea ? 'En línea' : 'Desconectado'}</small>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-grow-1 overflow-y-auto px-3 py-3 d-flex flex-column gap-2" style={{ overflowY: 'auto' }}>
        {mensajes.length === 0 && (
          <div className="text-center text-muted py-5">
            <i className="bi bi-chat-dots" style={{ fontSize: 40, color: '#dee2e6' }}></i>
            <p className="mt-2" style={{ fontSize: 13 }}>Enviá un mensaje para iniciar la conversación con La Quinta</p>
          </div>
        )}
        {mensajes.map(msg => {
          const esMio = msg.remitente_id === perfil?.id
          return (
            <div key={msg.id} className={`d-flex flex-column ${esMio ? 'align-items-end' : 'align-items-start'}`}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', fontSize: 14,
                backgroundColor: esMio ? 'var(--rojo)' : '#fff',
                color: esMio ? '#fff' : '#212529',
                borderRadius: esMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
      <form onSubmit={enviar} className="d-flex align-items-center gap-2 px-3 py-2 border-top bg-white" style={{ flexShrink: 0 }}>
        <input type="text" className="form-control rounded-pill" style={{ fontSize: 14 }}
          placeholder="Escribí tu mensaje..." value={texto} onChange={e => setTexto(e.target.value)} />
        <button type="submit" className="btn rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 40, height: 40, backgroundColor: 'var(--rojo)', color: '#fff', flexShrink: 0 }}>
          <i className="bi bi-send-fill" style={{ fontSize: 14 }}></i>
        </button>
      </form>
    </div>
  )
}
