import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function CrearEvento() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { perfil } = useAuth()
  const esEdicion = !!id

  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha: '', hora: '', categoria_id: '', imagen_url: '', activo: false })
  const [precio, setPrecio] = useState({ descripcion: 'Ticket General', precio: 0, cantidad_disponible: 200 })
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => setCategorias(data || []))
    if (esEdicion) {
      supabase.from('eventos').select('*, precios_evento(*)').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({ titulo: data.titulo, descripcion: data.descripcion || '', fecha: data.fecha, hora: data.hora, categoria_id: data.categoria_id || '', imagen_url: data.imagen_url || '', activo: data.activo })
          if (data.precios_evento?.[0]) {
            const p = data.precios_evento[0]
            setPrecio({ descripcion: p.descripcion, precio: p.precio, cantidad_disponible: p.cantidad_disponible || 200 })
          }
        }
      })
    }
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true); setError('')
    try {
      if (esEdicion) {
        await supabase.from('eventos').update(form).eq('id', id)
        await supabase.from('precios_evento').delete().eq('evento_id', id)
        await supabase.from('precios_evento').insert({ evento_id: id, ...precio })
      } else {
        const { data: ev, error: evErr } = await supabase.from('eventos').insert({ ...form, creado_por: perfil.id }).select().single()
        if (evErr) throw evErr
        if (ev) await supabase.from('precios_evento').insert({ evento_id: ev.id, ...precio })
      }
      navigate('/admin/eventos')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

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
                <div>
                  <label className="form-label small fw-medium text-muted">URL de imagen (opcional)</label>
                  <input type="url" className="form-control" placeholder="https://..."
                    value={form.imagen_url} onChange={e => setForm({ ...form, imagen_url: e.target.value })} />
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
              <button type="submit" className="btn flex-fill fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }} disabled={cargando}>
                {cargando ? <span className="spinner-border spinner-border-sm" /> : (esEdicion ? 'Actualizar' : 'Crear evento')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </LayoutAdmin>
  )
}
