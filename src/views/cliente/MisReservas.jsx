import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function MisReservas() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [activas, setActivas] = useState([])
  const [historial, setHistorial] = useState([])
  const [tiempos, setTiempos] = useState({})
  const [cancelando, setCancelando] = useState(null) // reserva a cancelar
  const [confirmandoId, setConfirmandoId] = useState(null) // id en proceso

  useEffect(() => {
    if (perfil) {
      cargarReservas()
      const sub = supabase.channel('mis-reservas-' + perfil.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas_mesas', filter: `usuario_id=eq.${perfil.id}` }, cargarReservas)
        .subscribe()
      return () => supabase.removeChannel(sub)
    }
  }, [perfil])

  useEffect(() => {
    const interval = setInterval(() => {
      const nuevos = {}
      activas.forEach(r => {
        if (r.expira_en) nuevos[r.id] = Math.max(0, new Date(r.expira_en) - new Date())
      })
      setTiempos(nuevos)
    }, 1000)
    return () => clearInterval(interval)
  }, [activas])

  async function cargarReservas() {
    const { data } = await supabase
      .from('reservas_mesas')
      .select('*, mesas(numero, capacidad, zona), eventos(titulo, fecha)')
      .eq('usuario_id', perfil.id)
      .order('creado_en', { ascending: false })
    setActivas(data?.filter(r => ['pendiente', 'confirmada'].includes(r.estado)) || [])
    setHistorial(data?.filter(r => ['liberada', 'cancelada', 'expirada'].includes(r.estado)) || [])
  }

  async function cancelarReserva() {
    if (!cancelando) return
    setConfirmandoId(cancelando.id)
    await supabase.from('reservas_mesas').update({ estado: 'cancelada' }).eq('id', cancelando.id)
    setCancelando(null)
    setConfirmandoId(null)
    cargarReservas()
  }

  function formatTiempo(ms) {
    if (!ms) return '00:00'
    return `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`
  }

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'long' })
  }

  function badgeEstado(estado) {
    if (estado === 'confirmada') return 'badge-confirmada'
    if (estado === 'pendiente') return 'badge-pendiente'
    return 'badge-finalizado'
  }

  function labelEstado(estado) {
    return { confirmada: 'Confirmada', pendiente: 'Pendiente', liberada: 'Cancelada por La Quinta', cancelada: 'Cancelada', expirada: 'Expirada' }[estado] || estado
  }

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 800 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Mis Reservas</h4>
        </div>

        {/* Reservas activas */}
        {activas.length > 0 && (
          <>
            <p className="fw-semibold text-muted mb-2" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Activas</p>
            <div className="d-flex flex-column gap-3 mb-4">
              {activas.map(r => (
                <div key={r.id} className="card-ideay p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <p className="fw-bold mb-0">
                        Mesa M{r.mesas?.numero}
                        <span className="text-muted fw-normal" style={{ fontSize: 12 }}>
                          {' · '}{r.mesas?.zona === 'planta_baja' ? 'Planta Baja' : 'Planta Alta'}
                        </span>
                      </p>
                      <small className="text-muted">{r.eventos?.titulo}</small>
                      <small className="text-muted d-block">{formatFecha(r.eventos?.fecha)}</small>
                      {r.hora_reserva && (
                        <small className="text-muted">
                          <i className="bi bi-clock me-1" style={{ color: 'var(--rojo)' }}></i>
                          Llegada: <strong>{r.hora_reserva}</strong>
                        </small>
                      )}
                    </div>
                    <span className={`badge ${badgeEstado(r.estado)}`}>{labelEstado(r.estado)}</span>
                  </div>

                  {/* Timer si tiene expiración */}
                  {r.expira_en && tiempos[r.id] !== undefined && (
                    <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-2"
                      style={{ backgroundColor: tiempos[r.id] < 300000 ? '#fce4ec' : '#f8f9fa' }}>
                      <i className="bi bi-clock" style={{ color: tiempos[r.id] < 300000 ? 'var(--rojo)' : '#6c757d', fontSize: 14 }}></i>
                      <span className="fw-semibold" style={{ fontSize: 13, color: tiempos[r.id] < 300000 ? 'var(--rojo)' : '#6c757d' }}>
                        Tiempo restante: {formatTiempo(tiempos[r.id])}
                      </span>
                    </div>
                  )}

                  {/* Botón cancelar */}
                  <button
                    className="btn btn-sm w-100 mt-1"
                    style={{ borderRadius: 8, border: '1.5px solid #dc3545', color: '#dc3545', fontSize: 13, backgroundColor: 'transparent' }}
                    onClick={() => setCancelando(r)}>
                    <i className="bi bi-x-circle me-1"></i>Cancelar reserva
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <>
            <p className="fw-semibold text-muted mb-2" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Historial</p>
            <div className="d-flex flex-column gap-2 pb-4">
              {historial.map(r => (
                <div key={r.id} className="card-ideay p-3" style={{ opacity: 0.7 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Mesa M{r.mesas?.numero}</p>
                      <small className="text-muted">{r.eventos?.titulo} · {formatFecha(r.eventos?.fecha)}</small>
                    </div>
                    <span className={`badge ${badgeEstado(r.estado)}`}>{labelEstado(r.estado)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activas.length === 0 && historial.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x" style={{ fontSize: 48, color: '#dee2e6' }}></i>
            <p className="text-muted mt-3">No tenés reservas todavía</p>
            <button className="btn btn-sm" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }}
              onClick={() => navigate('/explorar')}>
              Ver eventos
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmación de cancelación */}
      {cancelando && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          onClick={() => setCancelando(null)}>
          <div className="card-ideay p-4" style={{ maxWidth: 360, width: '100%', borderRadius: 20 }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: 56, height: 56, backgroundColor: '#fce4ec' }}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: 24, color: '#dc3545' }}></i>
              </div>
              <h6 className="fw-bold mb-1">¿Cancelar reserva?</h6>
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                Mesa M{cancelando.mesas?.numero} · {cancelando.eventos?.titulo}
              </p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                La mesa quedará disponible para otros clientes.
              </p>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn flex-1 btn-light fw-semibold" style={{ borderRadius: 10 }}
                onClick={() => setCancelando(null)}>
                Volver
              </button>
              <button className="btn flex-1 fw-semibold text-white" style={{ backgroundColor: '#dc3545', borderRadius: 10 }}
                disabled={!!confirmandoId}
                onClick={cancelarReserva}>
                {confirmandoId ? <span className="spinner-border spinner-border-sm" /> : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
