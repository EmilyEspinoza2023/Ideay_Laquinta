import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function Inicio() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [destacado, setDestacado] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [catActiva, setCatActiva] = useState('Todos')
  const [eventos, setEventos] = useState([])
  const [noLeidos, setNoLeidos] = useState(0)

  useEffect(() => {
    cargarDatos()
    const sub = supabase.channel('inicio-cliente')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, cargarDatos)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0]
    const [{ data: evs }, { data: cats }] = await Promise.all([
      supabase.from('eventos').select('*, categorias(nombre), precios_evento(precio)').eq('activo', true).gte('fecha', hoy).order('fecha'),
      supabase.from('categorias').select('*'),
    ])
    setDestacado(evs?.find(e => e.destacado) || evs?.[0])
    setCategorias(cats || [])
    setEventos(evs || [])
    if (perfil) {
      const { data: conv } = await supabase.from('conversaciones').select('no_leidos_cliente').eq('cliente_id', perfil.id).maybeSingle()
      setNoLeidos(conv?.no_leidos_cliente || 0)
    }
  }

  function precioMin(ev) {
    const ps = ev.precios_evento?.map(p => p.precio) || []
    if (!ps.length || ps.every(p => p === 0)) return 'Gratis'
    return `C$${Math.min(...ps)}`
  }

  function formatFecha(fecha) {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const filtrados = catActiva === 'Todos' ? eventos : eventos.filter(e => e.categorias?.nombre === catActiva)

  return (
    <div className="page-cliente">
      <NavCliente />

      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center pt-4 pb-3">
          <div>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>Hola, {perfil?.nombre} 👋</p>
            <h4 className="fw-bold mb-0">¿Qué hacemos esta noche?</h4>
          </div>
          <button className="btn btn-light rounded-circle position-relative p-2" onClick={() => navigate('/notificaciones')}>
            <i className="bi bi-bell fs-5"></i>
            {noLeidos > 0 && (
              <span className="position-absolute top-0 end-0 badge rounded-pill" style={{ backgroundColor: 'var(--rojo)', fontSize: 10 }}>{noLeidos}</span>
            )}
          </button>
        </div>

        {/* Evento destacado */}
        {destacado && (
          <div className="mb-4">
            <div className="position-relative rounded-4 overflow-hidden" style={{ height: 220, cursor: 'pointer' }} onClick={() => navigate(`/evento/${destacado.id}`)}>
              {destacado.imagen_url
                ? <img src={destacado.imagen_url} alt={destacado.titulo} className="w-100 h-100 object-fit-cover" />
                : <div className="w-100 h-100" style={{ backgroundColor: 'var(--rojo)' }} />
              }
              <div className="position-absolute top-0 start-0 end-0 bottom-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 40%, transparent)' }} />
              <span className="position-absolute top-0 start-0 m-2 badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', fontSize: 11 }}>DESTACADO</span>
              <div className="position-absolute bottom-0 start-0 end-0 p-3 d-flex justify-content-between align-items-end">
                <div>
                  <p className="text-white fw-bold mb-0 fs-6">{destacado.titulo}</p>
                  <small className="text-white-50">{formatFecha(destacado.fecha)} · {destacado.hora?.slice(0, 5)}</small>
                </div>
                <span className="badge" style={{ backgroundColor: 'var(--rojo)', fontSize: 12, padding: '6px 12px' }}>Ver</span>
              </div>
            </div>
          </div>
        )}

        {/* Categorías */}
        <div className="mb-3">
          <p className="fw-semibold mb-2">Categorías</p>
          <div className="d-flex gap-2 scroll-x pb-1">
            {['Todos', ...categorias.map(c => c.nombre)].map(cat => (
              <button key={cat} className={`chip ${catActiva === cat ? 'activo' : ''}`} onClick={() => setCatActiva(cat)}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Grid de eventos */}
        <p className="fw-semibold mb-3">Próximos eventos</p>
        <div className="row g-3 pb-4">
          {filtrados.map(ev => (
            <div key={ev.id} className="col-6 col-md-4 col-lg-3">
              <div className="card-ideay h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/evento/${ev.id}`)}>
                <div style={{ height: 130, borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                  {ev.imagen_url
                    ? <img src={ev.imagen_url} alt={ev.titulo} className="w-100 h-100 object-fit-cover" />
                    : <div className="w-100 h-100" style={{ backgroundColor: 'var(--rojo)' }} />
                  }
                </div>
                <div className="p-2">
                  <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: 13 }}>{ev.titulo}</p>
                  <small className="text-muted" style={{ fontSize: 11 }}>{formatFecha(ev.fecha)}</small>
                  <br />
                  <span className="fw-bold" style={{ fontSize: 12, color: 'var(--rojo)' }}>{precioMin(ev)}</span>
                </div>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="col-12 text-center py-5 text-muted">No hay eventos disponibles</div>
          )}
        </div>
      </div>
    </div>
  )
}
