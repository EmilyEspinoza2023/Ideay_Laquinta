import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

const iconos = {
  evento:     { bg: '#fff3cd', color: '#856404', icon: 'bi-lightning-fill' },
  reserva:    { bg: '#e8f5e9', color: '#198754', icon: 'bi-check-lg' },
  proximidad: { bg: '#e3f2fd', color: '#1565c0', icon: 'bi-geo-alt-fill' },
  general:    { bg: '#f3e5f5', color: '#7b1fa2', icon: 'bi-bell-fill' },
}

export default function Notificaciones() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('notificaciones')
  const [notifs, setNotifs] = useState([])
  const [misComentarios, setMisComentarios] = useState([])
  const [respuestasMap, setRespuestasMap] = useState({})
  const [misRespuestas, setMisRespuestas] = useState([])
  const [fotoAdmin, setFotoAdmin] = useState(null)

  useEffect(() => {
    supabase.from('perfiles').select('foto_url').eq('rol', 'admin').limit(1).maybeSingle()
      .then(({ data }) => setFotoAdmin(data?.foto_url || null))
  }, [])

  useEffect(() => {
    if (!perfil) return
    cargarNotificaciones()
    cargarMisComentarios()

    const sub = supabase.channel('notificaciones-cliente-' + perfil.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${perfil.id}` },
        cargarNotificaciones)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comentarios' },
        cargarMisComentarios)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [perfil])

  async function cargarNotificaciones() {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', perfil.id)
      .order('creado_en', { ascending: false })
    setNotifs(data || [])
  }

  async function cargarMisComentarios() {
    // Comentarios principales del cliente
    const { data: coms } = await supabase
      .from('comentarios')
      .select('*, eventos(id, titulo, imagen_url)')
      .eq('usuario_id', perfil.id)
      .is('parent_id', null)
      .order('creado_en', { ascending: false })

    setMisComentarios(coms || [])

    if (coms?.length) {
      const ids = coms.map(c => c.id)
      const { data: respuestas } = await supabase
        .from('comentarios')
        .select('*, perfiles(nombre, foto_url)')
        .in('parent_id', ids)
        .order('creado_en', { ascending: true })

      const mapa = {}
      for (const r of respuestas || []) {
        if (!mapa[r.parent_id]) mapa[r.parent_id] = []
        mapa[r.parent_id].push(r)
      }
      setRespuestasMap(mapa)
    }

    // Respuestas que el cliente dejó en comentarios de otros
    const { data: resps } = await supabase
      .from('comentarios')
      .select('*, eventos(id, titulo, imagen_url)')
      .eq('usuario_id', perfil.id)
      .not('parent_id', 'is', null)
      .order('creado_en', { ascending: false })
    setMisRespuestas(resps || [])
  }

  async function marcarLeidas() {
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', perfil.id).eq('leida', false)
    setNotifs(notifs.map(n => ({ ...n, leida: true })))
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

  function formatRelativo(fecha) {
    const m = Math.floor((Date.now() - new Date(fecha)) / 60000)
    if (m < 60) return `hace ${m} min`
    if (m < 1440) return `hace ${Math.floor(m / 60)}h`
    return `hace ${Math.floor(m / 1440)} días`
  }

  const noLeidas = notifs.filter(n => !n.leida).length

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="pt-4 pb-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn-back" onClick={() => navigate(-1)}>
              <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
            </button>
            <h4 className="fw-bold mb-0">Notificaciones</h4>
          </div>
          {tab === 'notificaciones' && noLeidas > 0 && (
            <button className="btn btn-link p-0" style={{ color: 'var(--rojo)', fontSize: 13 }} onClick={marcarLeidas}>
              Marcar leídas
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="d-flex gap-1 bg-white rounded-3 p-1 mb-4" style={{ border: '1px solid #e9ecef' }}>
          {[
            { key: 'notificaciones', label: 'Notificaciones', badge: noLeidas },
            { key: 'comentarios', label: 'Mis comentarios' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="btn btn-sm flex-1 d-flex align-items-center justify-content-center gap-1"
              style={{ borderRadius: 8, backgroundColor: tab === t.key ? 'var(--rojo)' : 'transparent', color: tab === t.key ? '#fff' : '#6c757d', fontWeight: tab === t.key ? 600 : 400, padding: '7px 12px' }}>
              {t.label}
              {t.badge > 0 && (
                <span className="badge rounded-pill" style={{ backgroundColor: tab === t.key ? '#fff' : 'var(--rojo)', color: tab === t.key ? 'var(--rojo)' : '#fff', fontSize: 10 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Notificaciones del sistema */}
        {tab === 'notificaciones' && (
          <div className="d-flex flex-column gap-2 pb-4">
            {notifs.map(n => {
              const { bg, color, icon } = iconos[n.tipo] || iconos.general
              const tappeable = !!n.referencia_id
              return (
                <div key={n.id}
                  className="card-ideay p-3 d-flex gap-3 align-items-start"
                  style={{ borderLeft: !n.leida ? '3px solid var(--rojo)' : '3px solid transparent', cursor: tappeable ? 'pointer' : 'default' }}
                  onClick={async () => {
                    if (!n.leida) {
                      await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id)
                      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x))
                    }
                    if (tappeable) navigate(`/evento/${n.referencia_id}`)
                  }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: bg }}>
                    <i className={`bi ${icon}`} style={{ color, fontSize: 16 }}></i>
                  </div>
                  <div className="flex-grow-1">
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
                <p className="text-muted mt-3" style={{ fontSize: 14 }}>No tenés notificaciones</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Mis comentarios */}
        {tab === 'comentarios' && (
          <div className="d-flex flex-column gap-3 pb-4">
            {misComentarios.map(c => {
              const respuestasDe = respuestasMap[c.id] || []
              return (
                <div key={c.id} className="card-ideay p-3" style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/evento/${c.eventos?.id}`)}>
                  {/* Evento */}
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--rojo)' }}>
                      {c.eventos?.imagen_url && <img src={c.eventos.imagen_url} alt={c.eventos.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>{c.eventos?.titulo}</p>
                      <small className="text-muted" style={{ fontSize: 11 }}>{formatRelativo(c.creado_en)}</small>
                    </div>
                  </div>

                  {/* Tu comentario */}
                  {c.calificacion && (
                    <div className="mb-1">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ color: n <= c.calificacion ? '#ffc107' : '#ced4da', fontSize: 12 }}>★</span>
                      ))}
                    </div>
                  )}
                  {c.contenido && <p className="mb-0 text-muted" style={{ fontSize: 13 }}>{c.contenido}</p>}

                  {/* Respuesta del admin */}
                  {c.respuesta_admin && (
                    <div className="mt-2 p-2 rounded-3 d-flex gap-2" style={{ backgroundColor: 'var(--rojo-claro)' }}>
                      {fotoAdmin
                        ? <img src={fotoAdmin} alt="La Quinta" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 22, height: 22, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 9, flexShrink: 0 }}>LQ</div>
                      }
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: 11, color: 'var(--rojo)' }}>La Quinta respondió</p>
                        <p className="mb-0" style={{ fontSize: 12 }}>{c.respuesta_admin}</p>
                      </div>
                    </div>
                  )}

                  {/* Respuestas de otros clientes */}
                  {respuestasDe.length > 0 && (
                    <div className="mt-2 ps-3 d-flex flex-column gap-2" style={{ borderLeft: '2px solid #e9ecef' }}>
                      {respuestasDe.map(r => (
                        <div key={r.id}>
                          <div className="d-flex gap-2 align-items-start">
                            {r.perfiles?.foto_url
                              ? <img src={r.perfiles.foto_url} alt={r.perfiles.nombre} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: 22, height: 22, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                                  {r.perfiles?.nombre?.[0]?.toUpperCase()}
                                </div>
                            }
                            <div>
                              <span className="fw-semibold" style={{ fontSize: 12 }}>{r.perfiles?.nombre} </span>
                              <span className="text-muted" style={{ fontSize: 12 }}>{r.contenido}</span>
                              <small className="text-muted d-block" style={{ fontSize: 10 }}>{formatRelativo(r.creado_en)}</small>
                            </div>
                          </div>
                          {r.respuesta_admin && (
                            <div className="mt-1 ms-4 p-2 rounded-3 d-flex gap-2" style={{ backgroundColor: 'var(--rojo-claro)' }}>
                              {fotoAdmin
                                ? <img src={fotoAdmin} alt="La Quinta" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                : <div style={{ width: 18, height: 18, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 7, flexShrink: 0 }}>LQ</div>
                              }
                              <div>
                                <p className="mb-0 fw-semibold" style={{ fontSize: 10, color: 'var(--rojo)' }}>La Quinta respondió</p>
                                <p className="mb-0" style={{ fontSize: 11 }}>{r.respuesta_admin}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Indicador si no hay respuestas */}
                  {!c.respuesta_admin && respuestasDe.length === 0 && (
                    <p className="mb-0 mt-2 text-muted" style={{ fontSize: 11 }}>
                      <i className="bi bi-chat me-1"></i>Sin respuestas aún
                    </p>
                  )}
                </div>
              )
            })}
            {/* Mis respuestas a comentarios de otros */}
            {misRespuestas.length > 0 && (
              <>
                <p className="fw-semibold text-muted mb-2 mt-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Mis respuestas</p>
                {misRespuestas.map(r => (
                  <div key={r.id} className="card-ideay p-3" style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/evento/${r.eventos?.id}`)}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--rojo)' }}>
                        {r.eventos?.imagen_url && <img src={r.eventos.imagen_url} alt={r.eventos.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div>
                        <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>{r.eventos?.titulo}</p>
                        <small className="text-muted" style={{ fontSize: 11 }}>{formatRelativo(r.creado_en)}</small>
                      </div>
                    </div>
                    <div className="d-flex gap-1 align-items-start ps-2" style={{ borderLeft: '2px solid var(--rojo)' }}>
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: 11, color: 'var(--rojo)' }}>Tu respuesta</p>
                        <p className="mb-0 text-muted" style={{ fontSize: 13 }}>{r.contenido}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {misComentarios.length === 0 && misRespuestas.length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-chat-square-text" style={{ fontSize: 48, color: '#dee2e6' }}></i>
                <p className="text-muted mt-3" style={{ fontSize: 14 }}>No has comentado ningún evento todavía</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
