import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function AdminReservas() {
  const [reservas, setReservas] = useState([])
  const [tiempos, setTiempos] = useState({})
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    cargarReservas()
    const sub = supabase.channel('reservas-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas_mesas' }, cargarReservas)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const nuevos = {}
      reservas.forEach(r => {
        if (r.expira_en && !r.llego_en)
          nuevos[r.id] = Math.max(0, new Date(r.expira_en) - new Date())
      })
      setTiempos(nuevos)
    }, 1000)
    return () => clearInterval(interval)
  }, [reservas])

  async function cargarReservas() {
    const { data } = await supabase
      .from('reservas_mesas')
      .select('*, mesas(numero, zona), perfiles(nombre, apellido), eventos(titulo)')
      .eq('estado', 'confirmada')
      .order('creado_en', { ascending: false })
    setReservas(data || [])
  }

  async function liberar(id) {
    await supabase.from('reservas_mesas').update({ estado: 'liberada' }).eq('id', id)
    cargarReservas()
  }

  function formatTiempo(ms) {
    if (!ms && ms !== 0) return '—'
    const min = String(Math.floor(ms / 60000)).padStart(2, '0')
    const seg = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
    return `${min}:${seg}`
  }

  function formatHora(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })
  }

  const conLlegada = reservas.filter(r => r.llego_en).length
  const sinLlegada = reservas.filter(r => !r.llego_en).length
  const expirando = reservas.filter(r => !r.llego_en && tiempos[r.id] < 300000 && tiempos[r.id] > 0).length

  return (
    <LayoutAdmin titulo="Reservas de Mesas">
      {/* Resumen */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Llegaron', valor: conLlegada, color: '#e8f5e9', tc: '#198754', icon: 'bi-geo-alt-fill' },
          { label: 'Sin confirmar llegada', valor: sinLlegada, color: '#fff3cd', tc: '#856404', icon: 'bi-hourglass-split' },
          { label: 'Expirando pronto', valor: expirando, color: '#fce4ec', tc: '#8B1A1A', icon: 'bi-exclamation-circle' },
          { label: 'Total activas', valor: reservas.length, color: '#e3f2fd', tc: '#0d6efd', icon: 'bi-bookmark-check' },
        ].map(({ label, valor, color, tc, icon }) => (
          <div key={label} className="col-md-3 col-6">
            <div className="card-ideay p-3 text-center">
              <div style={{ width: 40, height: 40, backgroundColor: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <i className={`bi ${icon}`} style={{ color: tc, fontSize: 18 }}></i>
              </div>
              <h4 className="fw-bold mb-0" style={{ color: tc }}>{valor}</h4>
              <small className="text-muted">{label}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Vista móvil — tarjetas */}
      {isMobile ? (
        <div className="d-flex flex-column gap-3">
          {reservas.length === 0 && (
            <p className="text-center text-muted py-5">No hay reservas activas</p>
          )}
          {reservas.map(r => {
            const tieneTimer = tiempos[r.id] !== undefined
            const estaExpirando = tieneTimer && tiempos[r.id] < 300000
            return (
              <div key={r.id} className="card-ideay p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="fw-bold mb-0" style={{ fontSize: 15 }}>
                      {r.perfiles?.nombre} {r.perfiles?.apellido}
                    </p>
                    <small className="text-muted">{r.eventos?.titulo}</small>
                  </div>
                  <span className="badge bg-secondary ms-2" style={{ flexShrink: 0 }}>
                    M{r.mesas?.numero}
                  </span>
                </div>

                {r.llego_en ? (
                  <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-2"
                    style={{ backgroundColor: '#e8f5e9' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: 13 }}></i>
                    <small className="fw-semibold" style={{ color: '#198754' }}>
                      Llegó a las {formatHora(r.llego_en)}
                    </small>
                  </div>
                ) : tieneTimer ? (
                  <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-2"
                    style={{ backgroundColor: estaExpirando ? '#fce4ec' : '#f8f9fa' }}>
                    <i className="bi bi-clock" style={{ color: estaExpirando ? 'var(--rojo)' : '#6c757d', fontSize: 13 }}></i>
                    <small className="fw-semibold" style={{ color: estaExpirando ? 'var(--rojo)' : '#6c757d' }}>
                      Tiempo restante: {formatTiempo(tiempos[r.id])}
                    </small>
                  </div>
                ) : null}

                <button className="btn btn-sm btn-outline-danger w-100" style={{ borderRadius: 8, fontSize: 12 }}
                  onClick={() => liberar(r.id)}>
                  <i className="bi bi-x-circle me-1"></i>Liberar mesa
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        /* Vista web — tabla */
        <div className="card-ideay overflow-hidden">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th className="fw-semibold py-3 ps-4" style={{ fontSize: 13, color: '#6c757d' }}>Cliente</th>
                <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Mesa</th>
                <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Evento</th>
                <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Llegada</th>
                <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Tiempo restante</th>
                <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(r => {
                const tieneTimer = tiempos[r.id] !== undefined
                const estaExpirando = tieneTimer && tiempos[r.id] < 300000
                return (
                  <tr key={r.id}>
                    <td className="py-3 ps-4 align-middle">
                      <p className="mb-0 fw-semibold" style={{ fontSize: 14 }}>
                        {r.perfiles?.nombre} {r.perfiles?.apellido}
                      </p>
                    </td>
                    <td className="py-3 align-middle">
                      <span className="badge bg-secondary">M{r.mesas?.numero} — {r.mesas?.zona}</span>
                    </td>
                    <td className="py-3 align-middle" style={{ fontSize: 13 }}>{r.eventos?.titulo || '—'}</td>
                    <td className="py-3 align-middle">
                      {r.llego_en ? (
                        <span className="d-flex align-items-center gap-1" style={{ color: '#198754', fontSize: 13 }}>
                          <i className="bi bi-check-circle-fill"></i>
                          {formatHora(r.llego_en)}
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: 13 }}>Esperando</span>
                      )}
                    </td>
                    <td className="py-3 align-middle">
                      {!r.llego_en && tieneTimer ? (
                        <span className="fw-semibold" style={{ color: estaExpirando ? '#dc3545' : 'var(--rojo)', fontSize: 14 }}>
                          <i className="bi bi-clock me-1"></i>
                          {formatTiempo(tiempos[r.id])}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 align-middle">
                      <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8, fontSize: 12 }}
                        onClick={() => liberar(r.id)}>
                        Liberar mesa
                      </button>
                    </td>
                  </tr>
                )
              })}
              {reservas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5">No hay reservas activas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </LayoutAdmin>
  )
}
