import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function AdminReservas() {
  const [reservas, setReservas] = useState([])
  const [tiempos, setTiempos] = useState({})

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
        if (r.expira_en && r.estado === 'pendiente') {
          nuevos[r.id] = Math.max(0, new Date(r.expira_en) - new Date())
        }
      })
      setTiempos(nuevos)
    }, 1000)
    return () => clearInterval(interval)
  }, [reservas])

  async function cargarReservas() {
    const { data } = await supabase
      .from('reservas_mesas')
      .select('*, mesas(numero, zona), perfiles(nombre, apellido), eventos(titulo)')
      .in('estado', ['pendiente', 'confirmada'])
      .order('creado_en', { ascending: false })
    setReservas(data || [])
  }

  async function liberar(id) {
    await supabase.from('reservas_mesas').update({ estado: 'liberada' }).eq('id', id)
    cargarReservas()
  }

  async function confirmar(id) {
    await supabase.from('reservas_mesas').update({ estado: 'confirmada' }).eq('id', id)
    cargarReservas()
  }

  function formatTiempo(ms) {
    if (!ms && ms !== 0) return '—'
    const min = String(Math.floor(ms / 60000)).padStart(2, '0')
    const seg = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
    return `${min}:${seg}`
  }

  const confirmadas = reservas.filter(r => r.estado === 'confirmada').length
  const pendientes = reservas.filter(r => r.estado === 'pendiente').length
  const expirando = reservas.filter(r => r.estado === 'pendiente' && tiempos[r.id] < 300000 && tiempos[r.id] > 0).length

  return (
    <LayoutAdmin titulo="Reservas de Mesas">
      {/* Resumen */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Confirmadas', valor: confirmadas, color: '#e8f5e9', tc: '#198754', icon: 'bi-check-circle' },
          { label: 'Pendientes', valor: pendientes, color: '#fff3cd', tc: '#856404', icon: 'bi-hourglass-split' },
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

      {/* Tabla de reservas */}
      <div className="card-ideay overflow-hidden">
        <table className="table table-hover mb-0">
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th className="fw-semibold py-3 ps-4" style={{ fontSize: 13, color: '#6c757d' }}>Cliente</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Mesa</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Evento</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Estado</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Tiempo restante</th>
              <th className="fw-semibold py-3" style={{ fontSize: 13, color: '#6c757d' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map(r => {
              const expira = tiempos[r.id] !== undefined && r.estado === 'pendiente'
              const estaExpirando = expira && tiempos[r.id] < 300000
              return (
                <tr key={r.id}>
                  <td className="py-3 ps-4 align-middle">
                    <p className="mb-0 fw-semibold" style={{ fontSize: 14 }}>{r.perfiles?.nombre} {r.perfiles?.apellido}</p>
                  </td>
                  <td className="py-3 align-middle">
                    <span className="badge bg-secondary">M{r.mesas?.numero} — {r.mesas?.zona}</span>
                  </td>
                  <td className="py-3 align-middle" style={{ fontSize: 13 }}>{r.eventos?.titulo || '—'}</td>
                  <td className="py-3 align-middle">
                    <span className={`badge ${r.estado === 'confirmada' ? 'badge-confirmada' : 'badge-pendiente'}`}>
                      {r.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-3 align-middle">
                    {expira ? (
                      <span className="fw-semibold" style={{ color: estaExpirando ? '#dc3545' : 'var(--rojo)', fontSize: 14 }}>
                        <i className="bi bi-clock me-1"></i>
                        {formatTiempo(tiempos[r.id])}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 align-middle">
                    <div className="d-flex gap-2">
                      {r.estado === 'pendiente' && (
                        <button className="btn btn-sm btn-success" style={{ borderRadius: 8, fontSize: 12 }} onClick={() => confirmar(r.id)}>
                          Confirmar
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8, fontSize: 12 }} onClick={() => liberar(r.id)}>
                        Cancelar
                      </button>
                    </div>
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
    </LayoutAdmin>
  )
}
