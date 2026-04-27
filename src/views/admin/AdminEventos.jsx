import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function AdminEventos() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Todos')
  const [eventos, setEventos] = useState([])
  const tabs = ['Todos', 'Activos', 'Borradores']

  useEffect(() => {
    cargarEventos()
    const sub = supabase.channel('admin-eventos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, cargarEventos)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [tab])

  async function cargarEventos() {
    let query = supabase.from('eventos').select('*, categorias(nombre), precios_evento(precio, cantidad_disponible)').order('fecha', { ascending: false })
    if (tab === 'Activos') query = query.eq('activo', true)
    if (tab === 'Borradores') query = query.eq('activo', false)
    const { data } = await query
    setEventos(data || [])
  }

  async function toggleActivo(ev) {
    await supabase.from('eventos').update({ activo: !ev.activo }).eq('id', ev.id)
    cargarEventos()
  }

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function estadoLabel(ev) {
    if (!ev.activo) return { label: 'Borrador', clase: 'badge-borrador' }
    const hoy = new Date().toISOString().split('T')[0]
    if (ev.fecha < hoy) return { label: 'Finalizado', clase: 'badge-finalizado' }
    return { label: 'Publicado', clase: 'badge-publicado' }
  }

  return (
    <LayoutAdmin titulo="Gestión de Eventos">
      {/* Header acciones */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex gap-1 bg-white rounded-3 p-1" style={{ border: '1px solid #e9ecef' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="btn btn-sm"
              style={{ borderRadius: 8, backgroundColor: tab === t ? 'var(--rojo)' : 'transparent', color: tab === t ? '#fff' : '#6c757d', fontWeight: tab === t ? 600 : 400, padding: '6px 16px' }}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn btn-sm d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }}
          onClick={() => navigate('/admin/eventos/crear')}>
          <i className="bi bi-plus-lg"></i> Crear evento
        </button>
      </div>

      {/* Tabla */}
      <div className="card-ideay overflow-hidden">
        <table className="table table-hover mb-0">
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th className="fw-semibold py-3 ps-4" style={{ fontSize: 13, color: '#6c757d' }}>Evento</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Fecha</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Categoría</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Estado</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map(ev => {
              const { label, clase } = estadoLabel(ev)
              return (
                <tr key={ev.id}>
                  <td className="py-3 ps-4">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--rojo)' }}>
                        {ev.imagen_url && <img src={ev.imagen_url} alt={ev.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div>
                        <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{ev.titulo}</p>
                        <small className="text-muted">{ev.hora?.slice(0, 5)}</small>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 align-middle" style={{ fontSize: 13 }}>{formatFecha(ev.fecha)}</td>
                  <td className="py-3 align-middle"><span className="badge bg-light text-secondary">{ev.categorias?.nombre || '—'}</span></td>
                  <td className="py-3 align-middle"><span className={`badge ${clase}`}>{label}</span></td>
                  <td className="py-3 align-middle">
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-light" style={{ borderRadius: 8 }} onClick={() => navigate(`/admin/eventos/editar/${ev.id}`)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-light" style={{ borderRadius: 8 }} onClick={() => toggleActivo(ev)}
                        title={ev.activo ? 'Ocultar' : 'Publicar'}>
                        <i className={`bi ${ev.activo ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {eventos.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-5">No hay eventos en esta categoría</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </LayoutAdmin>
  )
}
