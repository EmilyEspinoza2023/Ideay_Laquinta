import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SeleccionarEntradas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [precioSeleccionado, setPrecioSeleccionado] = useState(null)

  useEffect(() => {
    supabase.from('eventos').select('*, precios_evento(*)').eq('id', id).single()
      .then(({ data }) => {
        setEvento(data)
        if (data?.precios_evento?.length) setPrecioSeleccionado(data.precios_evento[0])
      })
  }, [id])

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'long' })
  }

  const total = (precioSeleccionado?.precio || 0) * cantidad

  if (!evento) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 px-3 pt-4 pb-3 bg-white border-bottom">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
        </button>
        <h5 className="fw-bold mb-0">Seleccionar Entradas</h5>
      </div>

      <div className="container-fluid px-3 py-4 flex-grow-1" style={{ maxWidth: 500 }}>
        {/* Info evento */}
        <div className="card-ideay p-3 d-flex gap-3 align-items-center mb-4">
          <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            {evento.imagen_url
              ? <img src={evento.imagen_url} alt={evento.titulo} className="w-100 h-100 object-fit-cover" />
              : <div className="w-100 h-100" style={{ backgroundColor: 'var(--rojo)' }} />
            }
          </div>
          <div>
            <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{evento.titulo}</p>
            <small className="text-muted">{formatFecha(evento.fecha)} · {evento.hora?.slice(0, 5)}</small>
          </div>
        </div>

        {/* Precios */}
        <p className="fw-semibold mb-3" style={{ fontSize: 14 }}>Tipo de entrada</p>
        <div className="d-flex flex-column gap-3 mb-4">
          {evento.precios_evento?.map(precio => (
            <div key={precio.id} className="card-ideay p-3"
              style={{ border: `2px solid ${precioSeleccionado?.id === precio.id ? 'var(--rojo)' : 'transparent'}`, cursor: 'pointer' }}
              onClick={() => setPrecioSeleccionado(precio)}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  {precioSeleccionado?.id === precio.id && (
                    <span className="d-block mb-1" style={{ fontSize: 11, color: 'var(--rojo)', fontWeight: 600 }}>SELECCIONADO</span>
                  )}
                  <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{precio.descripcion}</p>
                  <p className="fw-bold mb-0" style={{ color: 'var(--rojo)', fontSize: 16 }}>C${precio.precio}</p>
                </div>
                {precioSeleccionado?.id === precio.id && (
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-outline-danger rounded-circle d-flex align-items-center justify-content-center p-0"
                      style={{ width: 32, height: 32 }}
                      onClick={e => { e.stopPropagation(); setCantidad(Math.max(1, cantidad - 1)) }}>
                      <i className="bi bi-dash" style={{ fontSize: 14 }}></i>
                    </button>
                    <span className="fw-semibold" style={{ minWidth: 20, textAlign: 'center' }}>{cantidad}</span>
                    <button className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center p-0"
                      style={{ width: 32, height: 32, backgroundColor: 'var(--rojo)', borderColor: 'var(--rojo)' }}
                      onClick={e => {
                        e.stopPropagation()
                        const max = Math.min(10, precioSeleccionado?.cantidad_disponible ?? 10)
                        setCantidad(Math.min(max, cantidad + 1))
                      }}>
                      <i className="bi bi-plus" style={{ fontSize: 14 }}></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {precioSeleccionado && (
          <p className="text-muted mb-3" style={{ fontSize: 12 }}>
            Máximo {Math.min(10, precioSeleccionado.cantidad_disponible ?? 10)} entradas por compra
            · {precioSeleccionado.cantidad_disponible ?? 0} disponibles
          </p>
        )}

        {/* Resumen */}
        <div className="card-ideay p-3 mb-4">
          <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: 13 }}>
            <span>{cantidad}× Entradas</span>
            <span>C${total}</span>
          </div>
          <div className="d-flex justify-content-between fw-bold" style={{ color: 'var(--rojo)' }}>
            <span>Total</span>
            <span>C${total}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 pb-4 bg-white border-top pt-3" style={{ maxWidth: 500, width: '100%', margin: '0 auto' }}>
        <button className="btn w-100 py-3 text-white fw-semibold"
          style={{ backgroundColor: 'var(--rojo)', borderRadius: 12 }}
          onClick={() => navigate(`/evento/${id}/pago`, { state: { cantidad, precio: precioSeleccionado, total } })}>
          Continuar al Pago · C${total}
        </button>
      </div>
    </div>
  )
}
