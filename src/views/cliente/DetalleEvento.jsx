import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import ModalInvitado from '../../components/comunes/ModalInvitado'

export default function DetalleEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { perfil, esInvitado } = useAuth()
  const [evento, setEvento] = useState(null)
  const [modalInvitado, setModalInvitado] = useState(false)
  const [esFavorito, setEsFavorito] = useState(false)
  const [comentarios, setComentarios] = useState([])
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [textoComentario, setTextoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [editTexto, setEditTexto] = useState('')
  const [editRating, setEditRating] = useState(0)
  const [editHover, setEditHover] = useState(0)
  const [respondiendoId, setRespondiendoId] = useState(null)
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [fotoAdmin, setFotoAdmin] = useState(null)

  useEffect(() => {
    supabase.from('perfiles').select('foto_url').eq('rol', 'admin').limit(1).maybeSingle()
      .then(({ data }) => setFotoAdmin(data?.foto_url || null))
  }, [])

  useEffect(() => { cargarEvento() }, [id])

  useEffect(() => {
    const sub = supabase.channel('comentarios-evento-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comentarios', filter: `evento_id=eq.${id}` },
        () => cargarEvento())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [id])

  async function cargarEvento() {
    const { data } = await supabase
      .from('eventos')
      .select('*, categorias(nombre), precios_evento(*)')
      .eq('id', id)
      .single()
    setEvento(data)

    if (perfil) {
      const { data: fav } = await supabase.from('favoritos').select('id').eq('usuario_id', perfil.id).eq('evento_id', id).maybeSingle()
      setEsFavorito(!!fav)
    }

    const { data: coms } = await supabase
      .from('comentarios')
      .select('*, perfiles(nombre, apellido, foto_url)')
      .eq('evento_id', id)
      .order('creado_en', { ascending: true })
    setComentarios(coms || [])
  }

  async function toggleFavorito() {
    if (esInvitado || !perfil) return setModalInvitado(true)
    if (esFavorito) {
      await supabase.from('favoritos').delete().eq('usuario_id', perfil.id).eq('evento_id', id)
    } else {
      await supabase.from('favoritos').insert({ usuario_id: perfil.id, evento_id: id })
    }
    setEsFavorito(!esFavorito)
  }

  async function enviarComentario(e) {
    e.preventDefault()
    if (!perfil || (!textoComentario.trim() && rating === 0)) return
    setEnviandoComentario(true)
    await supabase.from('comentarios').insert({
      evento_id: id,
      usuario_id: perfil.id,
      contenido: textoComentario.trim(),
      calificacion: rating || null,
    })
    setTextoComentario('')
    setRating(0)
    await cargarEvento()
    setEnviandoComentario(false)
  }

  async function enviarRespuesta(e, parentId) {
    e.preventDefault()
    if (!perfil || !textoRespuesta.trim()) return
    await supabase.from('comentarios').insert({
      evento_id: id,
      usuario_id: perfil.id,
      contenido: textoRespuesta.trim(),
      parent_id: parentId,
    })
    setTextoRespuesta('')
    setRespondiendoId(null)
    await cargarEvento()
  }

  function iniciarEdicion(c) {
    setEditandoId(c.id)
    setEditTexto(c.contenido || '')
    setEditRating(c.calificacion || 0)
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    const esRespuesta = comentarios.find(c => c.id === editandoId)?.parent_id !== null
    const payload = { contenido: editTexto.trim() }
    if (!esRespuesta) payload.calificacion = editRating || null
    await supabase.from('comentarios').update(payload).eq('id', editandoId)
    setEditandoId(null)
    await cargarEvento()
  }

  async function eliminarComentario(cId) {
    await supabase.from('comentarios').delete().eq('id', cId)
    await cargarEvento()
  }

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function precioMin() {
    const precios = evento?.precios_evento?.map(p => p.precio) || []
    if (!precios.length || precios.every(p => p === 0)) return 'Gratis'
    return `C$${Math.min(...precios)}`
  }

  function promedioRating() {
    const cRating = comentarios.filter(c => c.calificacion && !c.parent_id)
    if (!cRating.length) return null
    return (cRating.reduce((s, c) => s + c.calificacion, 0) / cRating.length).toFixed(1)
  }

  function formatRelativo(fecha) {
    const m = Math.floor((Date.now() - new Date(fecha)) / 60000)
    if (m < 60) return `hace ${m} min`
    if (m < 1440) return `hace ${Math.floor(m / 60)}h`
    return `hace ${Math.floor(m / 1440)} días`
  }

  function AvatarComentario({ p, size = 30 }) {
    if (p?.foto_url) return (
      <img src={p.foto_url} alt={p.nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    )
    return (
      <div style={{ width: size, height: size, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>
        {p?.nombre?.[0]?.toUpperCase() || 'U'}
      </div>
    )
  }

  if (!evento) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#F5F0EB' }}>
      <div className="spinner-border" style={{ color: 'var(--rojo)' }} />
    </div>
  )

  const prom = promedioRating()
  const topLevel = comentarios.filter(c => !c.parent_id)
  const respuestas = comentarios.filter(c => c.parent_id)

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Imagen hero */}
      <div className="relative" style={{ height: 260 }}>
        {evento.imagen_url
          ? <img src={evento.imagen_url} alt={evento.titulo} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ backgroundColor: 'var(--rojo)' }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16 }} className="d-flex justify-content-between">
          <button onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <button onClick={toggleFavorito}
            style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <i className={`bi ${esFavorito ? 'bi-heart-fill' : 'bi-heart'}`} style={{ color: 'var(--rojo)' }}></i>
          </button>
        </div>
        {prom && (
          <div style={{ position: 'absolute', bottom: 12, right: 16, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-star-fill" style={{ color: '#ffc107', fontSize: 12 }}></i>
            <span className="text-white fw-bold" style={{ fontSize: 13 }}>{prom}</span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 pt-4 pb-28">
        {/* Título y precio */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-1 me-3">
            <span className="badge mb-1" style={{ backgroundColor: 'var(--rojo-claro)', color: 'var(--rojo)', fontSize: 11 }}>{evento.categorias?.nombre}</span>
            <h4 className="fw-bold mb-0">{evento.titulo}</h4>
          </div>
          <div className="text-end">
            <p className="text-muted mb-0" style={{ fontSize: 11 }}>Desde</p>
            <h5 className="fw-bold mb-0" style={{ color: 'var(--rojo)' }}>{precioMin()}</h5>
          </div>
        </div>

        {/* Info */}
        <div className="card-ideay p-3 mb-3">
          <div className="d-flex gap-3">
            <div className="d-flex align-items-center gap-2 flex-fill">
              <i className="bi bi-calendar3" style={{ color: 'var(--rojo)' }}></i>
              <div>
                <p className="mb-0 fw-semibold" style={{ fontSize: 12 }}>{formatFecha(evento.fecha)}</p>
                <small className="text-muted">{evento.hora?.slice(0, 5)}</small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-fill">
              <i className="bi bi-geo-alt" style={{ color: 'var(--rojo)' }}></i>
              <div>
                <p className="mb-0 fw-semibold" style={{ fontSize: 12 }}>La Quinta</p>
                <small className="text-muted">Juigalpa, Chontales</small>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {evento.descripcion && (
          <div className="mb-4">
            <h6 className="fw-bold mb-2">Descripción</h6>
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{evento.descripcion}</p>
          </div>
        )}

        {/* Comentarios y ratings */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0">Opiniones</h6>
            {prom && (
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-star-fill" style={{ color: '#ffc107', fontSize: 14 }}></i>
                <span className="fw-bold" style={{ color: 'var(--rojo)' }}>{prom}</span>
                <small className="text-muted">({topLevel.filter(c => c.calificacion).length})</small>
              </div>
            )}
          </div>

          {/* Prompt para invitados */}
          {esInvitado && (
            <button className="card-ideay p-3 mb-3 w-100 border-0 text-start" style={{ background: 'var(--rojo-claro)' }} onClick={() => setModalInvitado(true)}>
              <p className="fw-semibold mb-0" style={{ fontSize: 13, color: 'var(--rojo)' }}>
                <i className="bi bi-pencil me-2"></i>Registrate para dejar tu opinión
              </p>
            </button>
          )}

          {/* Formulario de comentario propio */}
          {perfil && (
            <form onSubmit={enviarComentario} className="card-ideay p-3 mb-3">
              <p className="fw-semibold mb-2" style={{ fontSize: 13 }}>Dejar una opinión</p>
              <div className="d-flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button"
                    style={{ color: n <= (hoverRating || rating) ? '#ffc107' : '#ced4da', background: 'none', border: 'none', padding: 0, fontSize: 24 }}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}>★</button>
                ))}
              </div>
              <textarea className="form-control mb-2" rows={2} placeholder="Escribí tu comentario..." style={{ resize: 'none', fontSize: 13 }}
                value={textoComentario} onChange={e => setTextoComentario(e.target.value)} />
              <button type="submit" className="btn btn-sm fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 8 }} disabled={enviandoComentario}>
                {enviandoComentario ? <span className="spinner-border spinner-border-sm" /> : 'Publicar'}
              </button>
            </form>
          )}

          {/* Lista de comentarios top-level */}
          <div className="d-flex flex-column gap-3">
            {topLevel.map(c => {
              const esMio = perfil && c.usuario_id === perfil.id
              const enEdicion = editandoId === c.id
              const respuestasDe = respuestas.filter(r => r.parent_id === c.id)

              return (
                <div key={c.id} className="card-ideay p-3">
                  {/* Cabecera del comentario */}
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <AvatarComentario p={c.perfiles} size={30} />
                      <span className="fw-semibold" style={{ fontSize: 13 }}>{c.perfiles?.nombre}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <small className="text-muted">{formatRelativo(c.creado_en)}</small>
                      {esMio && !enEdicion && (
                        <>
                          <button className="btn btn-sm p-0" style={{ color: '#6c757d', lineHeight: 1 }} onClick={() => iniciarEdicion(c)}>
                            <i className="bi bi-pencil" style={{ fontSize: 12 }}></i>
                          </button>
                          <button className="btn btn-sm p-0" style={{ color: '#dc3545', lineHeight: 1 }} onClick={() => eliminarComentario(c.id)}>
                            <i className="bi bi-trash" style={{ fontSize: 12 }}></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contenido o formulario de edición */}
                  {enEdicion ? (
                    <form onSubmit={guardarEdicion}>
                      <div className="d-flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button"
                            style={{ color: n <= (editHover || editRating) ? '#ffc107' : '#ced4da', background: 'none', border: 'none', padding: 0, fontSize: 20 }}
                            onClick={() => setEditRating(n)}
                            onMouseEnter={() => setEditHover(n)}
                            onMouseLeave={() => setEditHover(0)}>★</button>
                        ))}
                      </div>
                      <textarea className="form-control mb-2" rows={2} style={{ resize: 'none', fontSize: 13 }}
                        value={editTexto} onChange={e => setEditTexto(e.target.value)} />
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-sm fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 8, fontSize: 12 }}>Guardar</button>
                        <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 8, fontSize: 12 }} onClick={() => setEditandoId(null)}>Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {c.calificacion && (
                        <div className="mb-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <span key={n} style={{ color: n <= c.calificacion ? '#ffc107' : '#ced4da', fontSize: 13 }}>★</span>
                          ))}
                        </div>
                      )}
                      {c.contenido && <p className="mb-0 text-muted" style={{ fontSize: 13 }}>{c.contenido}</p>}
                    </>
                  )}

                  {/* Respuesta del admin */}
                  {c.respuesta_admin && (
                    <div className="mt-2 p-2 rounded-3 d-flex gap-2" style={{ backgroundColor: 'var(--rojo-claro)' }}>
                      {fotoAdmin
                        ? <img src={fotoAdmin} alt="La Quinta" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 24, height: 24, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 9, flexShrink: 0 }}>LQ</div>
                      }
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: 11, color: 'var(--rojo)' }}>La Quinta</p>
                        <p className="mb-0" style={{ fontSize: 12 }}>{c.respuesta_admin}</p>
                      </div>
                    </div>
                  )}

                  {/* Respuestas de otros clientes */}
                  {respuestasDe.length > 0 && (
                    <div className="mt-2 d-flex flex-column gap-2 ps-3" style={{ borderLeft: '2px solid #e9ecef' }}>
                      {respuestasDe.map(r => {
                        const esMiRespuesta = perfil && r.usuario_id === perfil.id
                        const editandoRespuesta = editandoId === r.id
                        return (
                          <div key={r.id} className="d-flex gap-2 align-items-start">
                            <AvatarComentario p={r.perfiles} size={24} />
                            <div className="flex-1">
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-semibold" style={{ fontSize: 12 }}>{r.perfiles?.nombre}</span>
                                <div className="d-flex align-items-center gap-1">
                                  <small className="text-muted" style={{ fontSize: 10 }}>{formatRelativo(r.creado_en)}</small>
                                  {esMiRespuesta && !editandoRespuesta && (
                                    <>
                                      <button className="btn btn-sm p-0" style={{ color: '#6c757d', lineHeight: 1 }}
                                        onClick={() => { setEditandoId(r.id); setEditTexto(r.contenido || '') }}>
                                        <i className="bi bi-pencil" style={{ fontSize: 11 }}></i>
                                      </button>
                                      <button className="btn btn-sm p-0" style={{ color: '#dc3545', lineHeight: 1 }} onClick={() => eliminarComentario(r.id)}>
                                        <i className="bi bi-trash" style={{ fontSize: 11 }}></i>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {editandoRespuesta ? (
                                <form onSubmit={guardarEdicion} className="d-flex gap-2 mt-1 align-items-center">
                                  <input type="text" className="form-control form-control-sm flex-1"
                                    style={{ borderRadius: 20, fontSize: 12 }}
                                    value={editTexto} onChange={e => setEditTexto(e.target.value)} autoFocus />
                                  <button type="submit" className="btn btn-sm" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 20, fontSize: 11, padding: '3px 10px' }}>Guardar</button>
                                  <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 20, fontSize: 11 }} onClick={() => setEditandoId(null)}>✕</button>
                                </form>
                              ) : (
                                <>
                                  <p className="mb-0 text-muted" style={{ fontSize: 12 }}>{r.contenido}</p>
                                  {r.respuesta_admin && (
                                    <div className="mt-1 p-2 rounded-3 d-flex gap-2" style={{ backgroundColor: 'var(--rojo-claro)' }}>
                                      {fotoAdmin
                                        ? <img src={fotoAdmin} alt="La Quinta" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                        : <div style={{ width: 18, height: 18, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 7, flexShrink: 0 }}>LQ</div>
                                      }
                                      <div>
                                        <p className="mb-0 fw-semibold" style={{ fontSize: 10, color: 'var(--rojo)' }}>La Quinta</p>
                                        <p className="mb-0" style={{ fontSize: 11 }}>{r.respuesta_admin}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Botón y formulario de respuesta */}
                  {perfil && !enEdicion && (
                    <div className="mt-2">
                      {respondiendoId === c.id ? (
                        <form onSubmit={e => enviarRespuesta(e, c.id)} className="d-flex gap-2 align-items-center">
                          <AvatarComentario p={perfil} size={24} />
                          <input type="text" className="form-control form-control-sm flex-1" placeholder="Escribí tu respuesta..."
                            style={{ borderRadius: 20, fontSize: 12 }}
                            value={textoRespuesta} onChange={e => setTextoRespuesta(e.target.value)}
                            autoFocus />
                          <button type="submit" className="btn btn-sm" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 20, fontSize: 12, padding: '4px 12px' }}>Enviar</button>
                          <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 20, fontSize: 12 }} onClick={() => setRespondiendoId(null)}>✕</button>
                        </form>
                      ) : (
                        <button className="btn btn-sm p-0" style={{ fontSize: 12, color: '#6c757d' }}
                          onClick={() => { setRespondiendoId(c.id); setTextoRespuesta('') }}>
                          <i className="bi bi-reply me-1"></i>Responder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {topLevel.length === 0 && (
              <p className="text-center text-muted py-3" style={{ fontSize: 13 }}>Sé el primero en opinar sobre este evento</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones fijos */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: 16, backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 12 }}>
        <button
          onClick={() => esInvitado ? setModalInvitado(true) : navigate(`/evento/${id}/entradas`)}
          className="flex-1 py-3 fw-semibold text-white rounded-3 border-0"
          style={{ backgroundColor: 'var(--rojo)', fontSize: 14 }}>
          Comprar Entrada
        </button>
        <button
          onClick={() => esInvitado ? setModalInvitado(true) : navigate(`/evento/${id}/reservar`)}
          className="flex-1 py-3 fw-semibold rounded-3"
          style={{ border: '2px solid var(--rojo)', color: 'var(--rojo)', backgroundColor: 'transparent', fontSize: 14 }}>
          Reservar Mesa
        </button>
      </div>

      <ModalInvitado visible={modalInvitado} onCerrar={() => setModalInvitado(false)} />
    </div>
  )
}
