import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function AdminComentarios() {
  const { perfil } = useAuth()
  const [comentarios, setComentarios] = useState([])
  const [respuestasMap, setRespuestasMap] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [respondiendoId, setRespondiendoId] = useState(null)
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [respondiendoReplicaId, setRespondiendoReplicaId] = useState(null)
  const [textoReplicaRespuesta, setTextoReplicaRespuesta] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarComentarios()
    const sub = supabase.channel('admin-comentarios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comentarios' }, cargarComentarios)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function cargarComentarios() {
    const { data: coms } = await supabase
      .from('comentarios')
      .select('*, perfiles(nombre, apellido, foto_url), eventos(titulo)')
      .is('parent_id', null)
      .order('creado_en', { ascending: false })
    setComentarios(coms || [])

    if (coms?.length) {
      const ids = coms.map(c => c.id)
      const { data: replies } = await supabase
        .from('comentarios')
        .select('*, perfiles(nombre, apellido, foto_url)')
        .in('parent_id', ids)
        .order('creado_en', { ascending: true })
      const mapa = {}
      for (const r of replies || []) {
        if (!mapa[r.parent_id]) mapa[r.parent_id] = []
        mapa[r.parent_id].push(r)
      }
      setRespuestasMap(mapa)
    }
  }

  async function eliminar(id) {
    await supabase.from('comentarios').delete().eq('id', id)
    setComentarios(prev => prev.filter(c => c.id !== id))
    setRespuestasMap(prev => {
      const nuevo = { ...prev }
      delete nuevo[id]
      return nuevo
    })
  }

  async function eliminarReplica(id, parentId) {
    await supabase.from('comentarios').delete().eq('id', id)
    setRespuestasMap(prev => ({
      ...prev,
      [parentId]: (prev[parentId] || []).filter(r => r.id !== id)
    }))
  }

  async function guardarRespuestaReplica(e, replicaId, parentId) {
    e.preventDefault()
    if (!textoReplicaRespuesta.trim()) return
    setGuardando(true)
    await supabase.from('comentarios').update({ respuesta_admin: textoReplicaRespuesta.trim() }).eq('id', replicaId)
    setRespuestasMap(prev => ({
      ...prev,
      [parentId]: (prev[parentId] || []).map(r => r.id === replicaId ? { ...r, respuesta_admin: textoReplicaRespuesta.trim() } : r)
    }))
    setRespondiendoReplicaId(null)
    setTextoReplicaRespuesta('')
    setGuardando(false)
  }

  async function eliminarRespuestaReplica(replicaId, parentId) {
    await supabase.from('comentarios').update({ respuesta_admin: null }).eq('id', replicaId)
    setRespuestasMap(prev => ({
      ...prev,
      [parentId]: (prev[parentId] || []).map(r => r.id === replicaId ? { ...r, respuesta_admin: null } : r)
    }))
  }

  async function guardarRespuesta(e, id) {
    e.preventDefault()
    if (!textoRespuesta.trim()) return
    setGuardando(true)
    await supabase.from('comentarios').update({ respuesta_admin: textoRespuesta.trim() }).eq('id', id)
    setComentarios(prev => prev.map(c => c.id === id ? { ...c, respuesta_admin: textoRespuesta.trim() } : c))
    setRespondiendoId(null)
    setTextoRespuesta('')
    setGuardando(false)
  }

  async function eliminarRespuesta(id) {
    await supabase.from('comentarios').update({ respuesta_admin: null }).eq('id', id)
    setComentarios(prev => prev.map(c => c.id === id ? { ...c, respuesta_admin: null } : c))
  }

  function iniciales(p) {
    if (!p) return 'US'
    return `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`.toUpperCase()
  }

  function formatRelativo(fecha) {
    const m = Math.floor((Date.now() - new Date(fecha)) / 60000)
    if (m < 60) return `hace ${m} min`
    if (m < 1440) return `hace ${Math.floor(m / 60)}h`
    return `hace ${Math.floor(m / 1440)} días`
  }

  const filtrados = comentarios.filter(c => {
    const q = busqueda.toLowerCase()
    return (
      c.perfiles?.nombre?.toLowerCase().includes(q) ||
      c.eventos?.titulo?.toLowerCase().includes(q) ||
      c.contenido?.toLowerCase().includes(q)
    )
  })

  return (
    <LayoutAdmin titulo="Comentarios">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Buscar por cliente, evento o contenido..."
          style={{ maxWidth: 320, borderRadius: 10 }}
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <small className="text-muted">{filtrados.length} comentario{filtrados.length !== 1 ? 's' : ''}</small>
      </div>

      <div className="d-flex flex-column gap-3">
        {filtrados.map(c => (
          <div key={c.id} className="card-ideay p-3">
            {/* Cabecera */}
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2 flex-1 min-w-0">
                {c.perfiles?.foto_url
                  ? <img src={c.perfiles.foto_url} alt={c.perfiles.nombre} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 38, height: 38, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {iniciales(c.perfiles)}
                    </div>
                }
                <div className="min-w-0">
                  <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>{c.perfiles?.nombre} {c.perfiles?.apellido}</p>
                  <p className="text-muted mb-0 text-truncate" style={{ fontSize: 11 }}>
                    <i className="bi bi-calendar-event me-1"></i>{c.eventos?.titulo || '—'}
                    <span className="mx-1">·</span>{formatRelativo(c.creado_en)}
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2 align-items-center flex-shrink-0">
                {c.calificacion && (
                  <span style={{ color: '#ffc107', fontSize: 13 }}>
                    {'★'.repeat(c.calificacion)}<span style={{ color: '#ced4da' }}>{'★'.repeat(5 - c.calificacion)}</span>
                  </span>
                )}
                <button className="btn btn-sm btn-light" style={{ borderRadius: 8, color: '#dc3545' }} onClick={() => eliminar(c.id)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>

            {/* Contenido del comentario */}
            {c.contenido && (
              <p className="mb-2 mt-2 text-muted" style={{ fontSize: 13 }}>{c.contenido}</p>
            )}

            {/* Respuesta existente del admin */}
            {c.respuesta_admin && respondiendoId !== c.id && (
              <div className="p-2 rounded-3 d-flex gap-2 align-items-start mt-2" style={{ backgroundColor: 'var(--rojo-claro)' }}>
                {perfil?.foto_url
                  ? <img src={perfil.foto_url} alt={perfil.nombre} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 24, height: 24, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 9, flexShrink: 0 }}>LQ</div>
                }
                <div className="flex-1">
                  <p className="mb-0 fw-semibold" style={{ fontSize: 11, color: 'var(--rojo)' }}>Tu respuesta</p>
                  <p className="mb-0" style={{ fontSize: 12 }}>{c.respuesta_admin}</p>
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm p-0" style={{ color: '#6c757d', lineHeight: 1 }}
                    onClick={() => { setRespondiendoId(c.id); setTextoRespuesta(c.respuesta_admin) }}>
                    <i className="bi bi-pencil" style={{ fontSize: 12 }}></i>
                  </button>
                  <button className="btn btn-sm p-0" style={{ color: '#dc3545', lineHeight: 1 }}
                    onClick={() => eliminarRespuesta(c.id)}>
                    <i className="bi bi-x-lg" style={{ fontSize: 12 }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Respuestas cliente-a-cliente */}
            {(respuestasMap[c.id] || []).length > 0 && (
              <div className="mt-2 ps-3 d-flex flex-column gap-3" style={{ borderLeft: '2px solid #e9ecef' }}>
                {(respuestasMap[c.id] || []).map(r => (
                  <div key={r.id}>
                    {/* Réplica del cliente */}
                    <div className="d-flex align-items-start gap-2">
                      {r.perfiles?.foto_url
                        ? <img src={r.perfiles.foto_url} alt={r.perfiles.nombre} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 26, height: 26, background: '#6c757d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 9, flexShrink: 0 }}>
                            {iniciales(r.perfiles)}
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="fw-semibold mb-0" style={{ fontSize: 12 }}>{r.perfiles?.nombre} {r.perfiles?.apellido}</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12 }}>{r.contenido}</p>
                        <small className="text-muted" style={{ fontSize: 10 }}>{formatRelativo(r.creado_en)}</small>
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        {!r.respuesta_admin && respondiendoReplicaId !== r.id && (
                          <button className="btn btn-sm p-0" style={{ color: 'var(--rojo)' }}
                            onClick={() => { setRespondiendoReplicaId(r.id); setTextoReplicaRespuesta('') }}>
                            <i className="bi bi-reply" style={{ fontSize: 13 }}></i>
                          </button>
                        )}
                        <button className="btn btn-sm p-0" style={{ color: '#dc3545' }}
                          onClick={() => eliminarReplica(r.id, c.id)}>
                          <i className="bi bi-trash" style={{ fontSize: 12 }}></i>
                        </button>
                      </div>
                    </div>

                    {/* Respuesta del admin a esta réplica */}
                    {r.respuesta_admin && respondiendoReplicaId !== r.id && (
                      <div className="ms-4 mt-1 p-2 rounded-3 d-flex gap-2 align-items-start" style={{ backgroundColor: 'var(--rojo-claro)' }}>
                        {perfil?.foto_url
                          ? <img src={perfil.foto_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 20, height: 20, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 8, flexShrink: 0 }}>LQ</div>
                        }
                        <div className="flex-1">
                          <p className="mb-0 fw-semibold" style={{ fontSize: 10, color: 'var(--rojo)' }}>Tu respuesta</p>
                          <p className="mb-0" style={{ fontSize: 11 }}>{r.respuesta_admin}</p>
                        </div>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm p-0" style={{ color: '#6c757d' }}
                            onClick={() => { setRespondiendoReplicaId(r.id); setTextoReplicaRespuesta(r.respuesta_admin) }}>
                            <i className="bi bi-pencil" style={{ fontSize: 11 }}></i>
                          </button>
                          <button className="btn btn-sm p-0" style={{ color: '#dc3545' }}
                            onClick={() => eliminarRespuestaReplica(r.id, c.id)}>
                            <i className="bi bi-x-lg" style={{ fontSize: 11 }}></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Formulario de respuesta a réplica */}
                    {respondiendoReplicaId === r.id && (
                      <form onSubmit={e => guardarRespuestaReplica(e, r.id, c.id)} className="ms-4 mt-1">
                        <textarea className="form-control mb-1" rows={2}
                          placeholder="Responder como La Quinta..."
                          style={{ resize: 'none', fontSize: 12, borderRadius: 8 }}
                          value={textoReplicaRespuesta}
                          onChange={e => setTextoReplicaRespuesta(e.target.value)}
                          autoFocus />
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-sm fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 8, fontSize: 11 }} disabled={guardando}>
                            {guardando ? <span className="spinner-border spinner-border-sm" /> : 'Publicar'}
                          </button>
                          <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 8, fontSize: 11 }}
                            onClick={() => { setRespondiendoReplicaId(null); setTextoReplicaRespuesta('') }}>Cancelar</button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulario de respuesta */}
            {respondiendoId === c.id ? (
              <form onSubmit={e => guardarRespuesta(e, c.id)} className="mt-2">
                <textarea className="form-control mb-2" rows={2} placeholder="Escribí tu respuesta como La Quinta..."
                  style={{ resize: 'none', fontSize: 13, borderRadius: 10 }}
                  value={textoRespuesta} onChange={e => setTextoRespuesta(e.target.value)} autoFocus />
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-sm fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 8, fontSize: 12 }} disabled={guardando}>
                    {guardando ? <span className="spinner-border spinner-border-sm" /> : 'Publicar respuesta'}
                  </button>
                  <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 8, fontSize: 12 }}
                    onClick={() => { setRespondiendoId(null); setTextoRespuesta('') }}>Cancelar</button>
                </div>
              </form>
            ) : (
              !c.respuesta_admin && (
                <button className="btn btn-sm mt-2" style={{ fontSize: 12, color: 'var(--rojo)', padding: '4px 0' }}
                  onClick={() => { setRespondiendoId(c.id); setTextoRespuesta('') }}>
                  <i className="bi bi-reply me-1"></i>Responder como La Quinta
                </button>
              )
            )}
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="text-center text-muted py-5">
            <i className="bi bi-chat-square-text" style={{ fontSize: 40, color: '#dee2e6', display: 'block', marginBottom: 8 }}></i>
            No hay comentarios
          </div>
        )}
      </div>
    </LayoutAdmin>
  )
}
