import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function Favoritos() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [favoritos, setFavoritos] = useState([])

  useEffect(() => {
    if (!perfil) return
    supabase.from('favoritos')
      .select('*, eventos(*, categorias(nombre), precios_evento(precio))')
      .eq('usuario_id', perfil.id)
      .order('creado_en', { ascending: false })
      .then(({ data }) => setFavoritos(data || []))
  }, [perfil])

  async function quitarFavorito(eventoId) {
    await supabase.from('favoritos').delete().eq('usuario_id', perfil.id).eq('evento_id', eventoId)
    setFavoritos(favoritos.filter(f => f.evento_id !== eventoId))
  }

  function precioMin(ev) {
    const precios = ev?.precios_evento?.map(p => p.precio) || []
    if (!precios.length || precios.every(p => p === 0)) return 'Gratis'
    return `C$${Math.min(...precios)}`
  }

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 1100 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Favoritos</h4>
          <span className="badge ms-1" style={{ backgroundColor: 'var(--rojo-claro)', color: 'var(--rojo)' }}>{favoritos.length}</span>
        </div>

        <div className="row g-3 pb-4">
          {favoritos.map(f => (
            <div key={f.id} className="col-6 col-md-4 col-lg-3">
              <div className="card-ideay h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/evento/${f.evento_id}`)}>
                <div className="position-relative" style={{ height: 130, borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                  {f.eventos?.imagen_url
                    ? <img src={f.eventos.imagen_url} alt={f.eventos.titulo} className="w-100 h-100 object-fit-cover" />
                    : <div className="w-100 h-100" style={{ backgroundColor: 'var(--rojo)' }} />
                  }
                  <button
                    className="position-absolute bottom-0 end-0 m-2 btn btn-light btn-sm rounded-circle p-0"
                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { e.stopPropagation(); quitarFavorito(f.evento_id) }}>
                    <i className="bi bi-heart-fill" style={{ color: 'var(--rojo)', fontSize: 13 }}></i>
                  </button>
                </div>
                <div className="p-2">
                  <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: 13 }}>{f.eventos?.titulo}</p>
                  <small className="text-muted" style={{ fontSize: 11 }}>{formatFecha(f.eventos?.fecha)}</small>
                  <br />
                  <span className="fw-bold" style={{ fontSize: 12, color: 'var(--rojo)' }}>{precioMin(f.eventos)}</span>
                </div>
              </div>
            </div>
          ))}
          {favoritos.length === 0 && (
            <div className="col-12 text-center py-5">
              <i className="bi bi-heart" style={{ fontSize: 48, color: '#dee2e6' }}></i>
              <p className="text-muted mt-3">Aún no tenés favoritos</p>
              <button className="btn btn-sm" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }} onClick={() => navigate('/explorar')}>
                Explorar eventos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
