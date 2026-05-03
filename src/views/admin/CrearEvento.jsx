import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function CrearEvento() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { perfil } = useAuth()
  const esEdicion = !!id
  const inputImagenRef = useRef(null)

  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha: '', hora: '', categoria_id: '', imagen_url: '', activo: false })
  const [precio, setPrecio] = useState({ descripcion: 'Ticket General', precio: 0, cantidad_disponible: 200 })
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [subiendoImagen, setSubiendoImagen] = useState(false)

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => setCategorias(data || []))
    if (esEdicion) {
      supabase.from('eventos').select('*, precios_evento(*)').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({ titulo: data.titulo, descripcion: data.descripcion || '', fecha: data.fecha, hora: data.hora, categoria_id: data.categoria_id || '', imagen_url: data.imagen_url || '', activo: data.activo })
          if (data.imagen_url) setImagenPreview(data.imagen_url)
          if (data.precios_evento?.[0]) {
            const p = data.precios_evento[0]
            setPrecio({ descripcion: p.descripcion, precio: p.precio, cantidad_disponible: p.cantidad_disponible || 200 })
          }
        }
      })
    }
  }, [id])

  function seleccionarImagen(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede superar los 5 MB'); return }
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
    setError('')
  }

  async function subirImagen(eventoId) {
    if (!imagenFile) return form.imagen_url
    setSubiendoImagen(true)
    const ext = imagenFile.name.split('.').pop()
    const ruta = `eventos/${eventoId}/portada.${ext}`
    const { error: errUp } = await supabase.storage.from('avatars').upload(ruta, imagenFile, { upsert: true })
    if (errUp) { setSubiendoImagen(false); throw new Error('Error al subir la imagen: ' + errUp.message) }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(ruta)
    setSubiendoImagen(false)
    return urlData.publicUrl + '?t=' + Date.now()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return setError('El título del evento no puede estar vacío')
    if (!esEdicion && form.fecha && form.fecha < new Date().toISOString().slice(0, 10))
      return setError('La fecha del evento no puede ser en el pasado')
    if (precio.cantidad_disponible < 1) return setError('La capacidad debe ser al menos 1')
    setCargando(true); setError('')
    try {
      if (esEdicion) {
        const imagen_url = await subirImagen(id)
        await supabase.from('eventos').update({ ...form, imagen_url }).eq('id', id)
        await supabase.from('precios_evento').delete().eq('evento_id', id)
        await supabase.from('precios_evento').insert({ evento_id: id, ...precio })
      } else {
        const { data: ev, error: evErr } = await supabase.from('eventos').insert({ ...form, creado_por: perfil.id }).select().single()
        if (evErr) throw evErr
        const imagen_url = await subirImagen(ev.id)
        if (imagen_url !== form.imagen_url) {
          await supabase.from('eventos').update({ imagen_url }).eq('id', ev.id)
        }
        await supabase.from('precios_evento').insert({ evento_id: ev.id, ...precio })
      }
      navigate('/admin/eventos')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const imagenActual = imagenPreview || form.imagen_url

  return (
    <LayoutAdmin titulo={esEdicion ? 'Editar Evento' : 'Crear Evento'}>
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Columna izquierda */}
          <div className="col-lg-7">
            <div className="card-ideay p-4 mb-4">
              <h6 className="fw-bold mb-3">Información del evento</h6>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label small fw-medium text-muted">Título del evento *</label>
                  <input type="text" className="form-control" placeholder="Ej: Noche de Karaoke"
                    value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label small fw-medium text-muted">Descripción</label>
                  <textarea className="form-control" rows={3} placeholder="Describí el evento..."
                    value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label small fw-medium text-muted">Fecha *</label>
                    <input type="date" className="form-control"
                      value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-medium text-muted">Hora *</label>
                    <input type="time" className="form-control"
                      value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="form-label small fw-medium text-muted">Categoría *</label>
                  <select className="form-select"
                    value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })} required>
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                {/* Imagen del evento */}
                <div>
                  <label className="form-label small fw-medium text-muted">Imagen del evento</label>
                  <div
                    onClick={() => inputImagenRef.current?.click()}
                    style={{
                      width: '100%', height: 160, borderRadius: 12, overflow: 'hidden',
                      border: '2px dashed #dee2e6', cursor: 'pointer', position: 'relative',
                      backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {imagenActual ? (
                      <>
                        <img src={imagenActual} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                          <div className="text-white text-center">
                            <i className="bi bi-camera fs-4 d-block"></i>
                            <small>Cambiar imagen</small>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted">
                        {subiendoImagen
                          ? <span className="spinner-border" style={{ color: 'var(--rojo)' }} />
                          : <>
                              <i className="bi bi-image fs-2 d-block mb-1" style={{ color: '#adb5bd' }}></i>
                              <small>Clic para subir imagen<br /><span style={{ fontSize: 11 }}>JPG, PNG, WEBP · máx 5 MB</span></small>
                            </>
                        }
                      </div>
                    )}
                  </div>
                  {imagenActual && !subiendoImagen && (
                    <button type="button" className="btn btn-sm btn-link text-danger p-0 mt-1" style={{ fontSize: 12 }}
                      onClick={() => { setImagenFile(null); setImagenPreview(null); setForm(f => ({ ...f, imagen_url: '' })) }}>
                      <i className="bi bi-trash me-1"></i>Quitar imagen
                    </button>
                  )}
                  <input ref={inputImagenRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="d-none" onChange={seleccionarImagen} />
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="col-lg-5">
            <div className="card-ideay p-4 mb-4">
              <h6 className="fw-bold mb-3">Entrada / Tickets</h6>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label small fw-medium text-muted">Descripción</label>
                  <input type="text" className="form-control"
                    value={precio.descripcion} onChange={e => setPrecio({ ...precio, descripcion: e.target.value })} />
                </div>
                <div>
                  <label className="form-label small fw-medium text-muted">Precio (C$)</label>
                  <input type="number" min="0" className="form-control"
                    value={precio.precio} onChange={e => setPrecio({ ...precio, precio: Number(e.target.value) })} />
                  <small className="text-muted">Ingresá 0 para evento gratuito</small>
                </div>
                <div>
                  <label className="form-label small fw-medium text-muted">Capacidad (tickets disponibles)</label>
                  <input type="number" min="1" className="form-control"
                    value={precio.cantidad_disponible} onChange={e => setPrecio({ ...precio, cantidad_disponible: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="card-ideay p-4 mb-4">
              <h6 className="fw-bold mb-3">Publicación</h6>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" id="activoSwitch"
                  checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                <label className="form-check-label" htmlFor="activoSwitch">
                  {form.activo ? 'Publicado — visible para clientes' : 'Borrador — no visible aún'}
                </label>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light flex-fill" style={{ borderRadius: 10 }} onClick={() => navigate('/admin/eventos')}>
                Cancelar
              </button>
              <button type="submit" className="btn flex-fill fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }} disabled={cargando || subiendoImagen}>
                {cargando || subiendoImagen ? <span className="spinner-border spinner-border-sm" /> : (esEdicion ? 'Actualizar' : 'Crear evento')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </LayoutAdmin>
  )
}
