import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function Explorar() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const [eventos, setEventos] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [favoritos, setFavoritos] = useState([])
  const filtros = ['Todos', 'Hoy', 'Esta semana', 'Gratis']

  useEffect(() => {
    cargarDatos()
    const sub = supabase.channel('explorar-cliente')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, cargarDatos)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [filtro])

  async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0]
    let query = supabase.from('eventos').select('*, categorias(nombre), precios_evento(precio)').eq('activo', true)
    if (filtro === 'Hoy') query = query.eq('fecha', hoy)
    else if (filtro === 'Esta semana') {
      const fin = new Date(); fin.setDate(fin.getDate() + 7)
      query = query.gte('fecha', hoy).lte('fecha', fin.toISOString().split('T')[0])
    }
    const { data } = await query.order('fecha')
    let evs = data || []
    if (filtro === 'Gratis') evs = evs.filter(e => !e.precios_evento?.length || e.precios_evento.every(p => p.precio === 0))
    setEventos(evs)
    if (perfil) {
      const { data: favs } = await supabase.from('favoritos').select('evento_id').eq('usuario_id', perfil.id)
      setFavoritos(favs?.map(f => f.evento_id) || [])
    }
  }

  async function toggleFavorito(e, eventoId) {
    e.stopPropagation()
    if (!perfil) return navigate('/login')
    if (favoritos.includes(eventoId)) {
      await supabase.from('favoritos').delete().eq('usuario_id', perfil.id).eq('evento_id', eventoId)
      setFavoritos(favoritos.filter(id => id !== eventoId))
    } else {
      await supabase.from('favoritos').insert({ usuario_id: perfil.id, evento_id: eventoId })
      setFavoritos([...favoritos, eventoId])
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

  const filtrados = eventos.filter(e => e.titulo.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 1100 }}>
        <div className="pt-4 pb-3">
          <h4 className="fw-bold mb-3">Explorar</h4>
          <div className="input-group mb-3">
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input type="text" className="form-control border-start-0" placeholder="Buscar eventos..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <div className="d-flex gap-2 scroll-x pb-1">
            {filtros.map(f => (
              <button key={f} className={`chip ${filtro === f ? 'activo' : ''}`} onClick={() => setFiltro(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="row g-3 pb-4">
          {filtrados.map(ev => (
            <div key={ev.id} className="col-6 col-md-4 col-lg-3">
              <div className="card-ideay h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/evento/${ev.id}`)}>
                <div className="position-relative" style={{ height: 140, borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                  {ev.imagen_url
                    ? <img src={ev.imagen_url} alt={ev.titulo} className="w-100 h-100 object-fit-cover" />
                    : <div className="w-100 h-100" style={{ backgroundColor: 'var(--rojo)' }} />
                  }
                  <button
                    className="position-absolute bottom-0 end-0 m-2 btn btn-light btn-sm rounded-circle p-0"
                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => toggleFavorito(e, ev.id)}>
                    <i className={`bi ${favoritos.includes(ev.id) ? 'bi-heart-fill' : 'bi-heart'}`} style={{ color: 'var(--rojo)', fontSize: 13 }}></i>
                  </button>
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
            <div className="col-12 text-center py-5 text-muted">No se encontraron eventos</div>
          )}
        </div>
      </div>
    </div>
  )
}
