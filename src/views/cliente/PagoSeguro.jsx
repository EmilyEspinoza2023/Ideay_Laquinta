import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function PagoSeguro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { perfil } = useAuth()
  const { cantidad, precio, total } = location.state || {}

  const [form, setForm] = useState({ numero: '', vencimiento: '', cvv: '', titular: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  function formatNumero(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatVencimiento(val) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  async function handlePago(e) {
    e.preventDefault()
    setCargando(true)
    setError('')

    const { data: entrada, error: errEntrada } = await supabase.from('entradas').insert({
      usuario_id: perfil.id,
      evento_id: id,
      precio_id: precio?.id || null,
      cantidad,
      precio_unitario: precio?.precio || 0,
      estado: 'pagado',
    }).select().single()

    if (errEntrada) { setError('Error al procesar la compra'); setCargando(false); return }

    const numDigits = form.numero.replace(/\s/g, '')
    await supabase.from('transacciones').insert({
      entrada_id: entrada.id,
      usuario_id: perfil.id,
      nombre_titular: form.titular,
      numero_tarjeta_ultimos4: numDigits.slice(-4),
      mes_vencimiento: form.vencimiento.split('/')[0] || '00',
      anio_vencimiento: form.vencimiento.split('/')[1] || '00',
      monto: total,
      estado: 'aprobado',
    })

    navigate(`/evento/${id}/compra-exitosa`, { state: { entrada, cantidad, total }, replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 px-3 pt-4 pb-3 bg-white border-bottom">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
        </button>
        <h5 className="fw-bold mb-0">Pago Seguro</h5>
      </div>

      <div className="container-fluid px-3 py-4" style={{ maxWidth: 500 }}>
        {/* Procesador */}
        <div className="card-ideay p-3 d-flex align-items-center justify-content-between mb-4"
          style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div>
            <p className="text-muted mb-0" style={{ fontSize: 11, textTransform: 'uppercase' }}>Procesado por</p>
            <p className="fw-bold mb-0" style={{ color: '#15803d' }}>Banpro</p>
          </div>
          <i className="bi bi-shield-fill-check" style={{ color: '#16a34a', fontSize: 22 }}></i>
        </div>

        {/* Monto */}
        <div className="text-center mb-4">
          <p className="text-muted mb-1" style={{ fontSize: 13 }}>Monto a pagar</p>
          <p className="fw-bold mb-0" style={{ fontSize: 36, color: 'var(--rojo)' }}>C${total}.00</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handlePago} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label" style={{ fontSize: 13 }}>Número de tarjeta</label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-credit-card text-muted"></i>
              </span>
              <input type="text" className="form-control" style={{ fontFamily: 'monospace' }}
                placeholder="0000 0000 0000 0000"
                value={form.numero}
                onChange={e => setForm({ ...form, numero: formatNumero(e.target.value) })}
                inputMode="numeric" required />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 13 }}>Vencimiento</label>
              <input type="text" className="form-control" placeholder="MM/AA"
                value={form.vencimiento}
                onChange={e => setForm({ ...form, vencimiento: formatVencimiento(e.target.value) })}
                required />
            </div>
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 13 }}>CVV</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-lock-fill text-muted" style={{ fontSize: 13 }}></i>
                </span>
                <input type="password" className="form-control" placeholder="•••"
                  maxLength={4} inputMode="numeric"
                  value={form.cvv}
                  onChange={e => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 13 }}>Nombre del titular</label>
            <input type="text" className="form-control" placeholder="Como aparece en la tarjeta"
              value={form.titular}
              onChange={e => setForm({ ...form, titular: e.target.value })}
              required />
          </div>

          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
            <i className="bi bi-shield-check text-success"></i>
            Tu información está protegida con cifrado SSL
          </div>

          {error && <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={cargando}
            className="btn w-100 py-3 text-white fw-semibold mt-2"
            style={{ backgroundColor: 'var(--rojo)', borderRadius: 12 }}>
            {cargando ? (
              <><span className="spinner-border spinner-border-sm me-2" />Procesando...</>
            ) : `Pagar C$${total}.00`}
          </button>
        </form>
      </div>
    </div>
  )
}
