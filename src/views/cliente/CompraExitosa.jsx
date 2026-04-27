import { useLocation, useNavigate } from 'react-router-dom'

export default function CompraExitosa() {
  const navigate = useNavigate()
  const location = useLocation()
  const { entrada, cantidad, total } = location.state || {}

  return (
    <div className="d-flex flex-column align-items-center justify-content-center px-3 py-5"
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Icono éxito */}
      <div className="d-flex align-items-center justify-content-center rounded-circle mb-4"
        style={{ width: 72, height: 72, backgroundColor: '#dcfce7' }}>
        <i className="bi bi-check-lg" style={{ fontSize: 32, color: '#16a34a' }}></i>
      </div>

      <h4 className="fw-bold mb-1">¡Compra Exitosa!</h4>
      <p className="text-muted mb-4" style={{ fontSize: 14 }}>Tu entrada está confirmada</p>

      {/* Ticket */}
      <div className="card-ideay p-4 w-100 mb-4" style={{ maxWidth: 420 }}>
        <p className="fw-semibold mb-3" style={{ fontSize: 11, color: 'var(--rojo)', textTransform: 'uppercase', letterSpacing: 1 }}>Entrada</p>

        <div className="d-flex gap-3 align-items-start">
          <div className="flex-grow-1">
            <p className="fw-bold mb-3" style={{ fontSize: 16 }}>Halloween Party</p>
            <div className="d-flex flex-column gap-2 mb-3">
              <div className="d-flex align-items-center gap-2 text-muted">
                <i className="bi bi-calendar-event" style={{ color: 'var(--rojo)', fontSize: 14 }}></i>
                <small>Sáb 31 Octubre, 10:00 PM</small>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted">
                <i className="bi bi-ticket-perforated" style={{ color: 'var(--rojo)', fontSize: 14 }}></i>
                <small>Ticket · Entradas × {cantidad || 1}</small>
              </div>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: 11 }}>TOTAL</p>
            <p className="fw-bold mb-0" style={{ fontSize: 22, color: 'var(--rojo)' }}>C${total || 0}.00</p>
          </div>
          <i className="bi bi-qr-code flex-shrink-0" style={{ fontSize: 48, color: '#dee2e6' }}></i>
        </div>

        <div className="border-top mt-3 pt-3">
          <p className="text-center text-muted mb-0" style={{ fontSize: 11 }}>
            ID: TKT-{entrada?.id?.slice(0, 12).toUpperCase() || '2026-00001'}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="d-flex flex-column gap-3 w-100" style={{ maxWidth: 420 }}>
        <button className="btn py-3 text-white fw-semibold"
          style={{ backgroundColor: 'var(--rojo)', borderRadius: 12 }}
          onClick={() => navigate('/mis-tickets')}>
          Ver Mis Tickets
        </button>
        <button className="btn py-3 fw-semibold"
          style={{ border: '2px solid var(--rojo)', color: 'var(--rojo)', borderRadius: 12 }}
          onClick={() => navigate('/inicio')}>
          Volver al Inicio
        </button>
      </div>
    </div>
  )
}
