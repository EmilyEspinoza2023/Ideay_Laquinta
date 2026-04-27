import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function MesaReservada() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reserva, mesa, evento, horaLlegada } = location.state || {}
  const [segundos, setSegundos] = useState(null)

  useEffect(() => {
    if (!reserva?.expira_en) return
    const calc = () => Math.max(0, Math.floor((new Date(reserva.expira_en) - Date.now()) / 1000))
    setSegundos(calc())
    const timer = setInterval(() => setSegundos(calc()), 1000)
    return () => clearInterval(timer)
  }, [reserva?.expira_en])

  const tieneTimer = segundos !== null
  const min = tieneTimer ? String(Math.floor(segundos / 60)).padStart(2, '0') : null
  const seg = tieneTimer ? String(segundos % 60).padStart(2, '0') : null

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center px-3 py-5"
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>

      <div className="d-flex align-items-center justify-content-center rounded-circle mb-4"
        style={{ width: 72, height: 72, backgroundColor: '#dcfce7' }}>
        <i className="bi bi-check-lg" style={{ fontSize: 32, color: '#16a34a' }}></i>
      </div>

      <h4 className="fw-bold mb-1">¡Mesa Reservada!</h4>
      <p className="text-muted mb-4" style={{ fontSize: 14 }}>Tu reserva está pendiente de confirmación</p>

      <div className="card-ideay p-4 w-100 mb-4" style={{ maxWidth: 420 }}>
        <p className="fw-semibold mb-3" style={{ fontSize: 11, color: 'var(--rojo)', textTransform: 'uppercase', letterSpacing: 1 }}>Reserva</p>
        <p className="fw-bold mb-3" style={{ fontSize: 16 }}>Mesa M{mesa?.numero} — {evento?.titulo}</p>

        <div className="d-flex flex-column gap-2 mb-4">
          <div className="d-flex align-items-center gap-2 text-muted">
            <i className="bi bi-calendar-event" style={{ color: 'var(--rojo)', fontSize: 14 }}></i>
            <small>{formatFecha(evento?.fecha)} · {evento?.hora?.slice(0, 5)}</small>
          </div>
          <div className="d-flex align-items-center gap-2 text-muted">
            <i className="bi bi-people-fill" style={{ color: 'var(--rojo)', fontSize: 14 }}></i>
            <small>{mesa?.capacidad} personas</small>
          </div>
          <div className="d-flex align-items-center gap-2 text-muted">
            <i className="bi bi-geo-alt-fill" style={{ color: 'var(--rojo)', fontSize: 14 }}></i>
            <small>{mesa?.zona === 'planta_baja' ? 'Planta Baja' : 'Planta Alta'}</small>
          </div>
          {horaLlegada && (
            <div className="d-flex align-items-center gap-2 text-muted">
              <i className="bi bi-clock" style={{ color: 'var(--rojo)', fontSize: 14 }}></i>
              <small>Hora de llegada: <strong>{horaLlegada}</strong></small>
            </div>
          )}
        </div>

        {/* Countdown solo para eventos hoy */}
        {tieneTimer ? (
          <>
            <div className="d-flex align-items-center justify-content-center gap-2 rounded-3 py-3"
              style={{ backgroundColor: segundos < 300 ? '#fce4ec' : 'var(--rojo-claro)', color: 'var(--rojo)' }}>
              <i className="bi bi-clock-fill" style={{ fontSize: 18 }}></i>
              <span className="fw-bold" style={{ fontSize: 26, fontVariantNumeric: 'tabular-nums' }}>
                {min}:{seg}
              </span>
            </div>
            <p className="text-muted text-center mt-2 mb-0" style={{ fontSize: 12 }}>
              {segundos === 0
                ? 'El tiempo expiró. La mesa fue liberada.'
                : `Presentate antes de las ${horaLlegada} o la mesa se libera.`}
            </p>
          </>
        ) : (
          <div className="rounded-3 p-3 d-flex gap-3 align-items-start" style={{ backgroundColor: '#e3f2fd' }}>
            <i className="bi bi-info-circle-fill" style={{ color: '#1565c0', fontSize: 18, flexShrink: 0 }}></i>
            <div>
              <p className="fw-semibold mb-0" style={{ fontSize: 13, color: '#1565c0' }}>Reserva para evento futuro</p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                Tu reserva queda guardada. El equipo de La Quinta la confirmará antes del evento.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="d-flex flex-column gap-3 w-100" style={{ maxWidth: 420 }}>
        <button className="btn py-3 text-white fw-semibold"
          style={{ backgroundColor: 'var(--rojo)', borderRadius: 12 }}
          onClick={() => navigate('/reservas')}>
          Ver Mis Reservas
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
