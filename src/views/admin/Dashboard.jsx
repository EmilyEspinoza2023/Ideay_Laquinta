import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ eventos: 0, tickets: 0, reservas: 0, ingresos: 0 })
  const [actividad, setActividad] = useState([])

  useEffect(() => {
    cargarStats()
    const sub = supabase.channel('dashboard-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, cargarStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, cargarStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas_mesas' }, cargarStats)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function cargarStats() {
    const hoy = new Date().toISOString().split('T')[0]
    const [{ count: eventos }, { count: reservas }, { data: ticketsHoy }, { data: entradas }] = await Promise.all([
      supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('reservas_mesas').select('*', { count: 'exact', head: true }).in('estado', ['pendiente', 'confirmada']),
      supabase.from('entradas').select('cantidad').eq('estado', 'pagado').gte('comprado_en', hoy),
      supabase.from('entradas').select('total').eq('estado', 'pagado'),
    ])
    setStats({
      eventos: eventos || 0,
      tickets: ticketsHoy?.reduce((s, e) => s + e.cantidad, 0) || 0,
      reservas: reservas || 0,
      ingresos: entradas?.reduce((s, e) => s + Number(e.total), 0) || 0,
    })
    const { data: ult } = await supabase.from('entradas')
      .select('cantidad, comprado_en, perfiles(nombre), eventos(titulo)')
      .eq('estado', 'pagado').order('comprado_en', { ascending: false }).limit(5)
    setActividad(ult || [])
  }

  function formatTiempo(fecha) {
    const m = Math.floor((Date.now() - new Date(fecha)) / 60000)
    return m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)}h`
  }

  const tarjetas = [
    { label: 'Eventos Activos', valor: stats.eventos, icon: 'bi-lightning-charge', color: '#fff3cd', ic: '#856404' },
    { label: 'Tickets Hoy', valor: stats.tickets, icon: 'bi-ticket-perforated', color: '#e8f5e9', ic: '#198754' },
    { label: 'Reservas Activas', valor: stats.reservas, icon: 'bi-calendar-check', color: '#fce4ec', ic: '#8B1A1A' },
    { label: 'Ingresos Total', valor: `C$${(stats.ingresos / 1000).toFixed(1)}K`, icon: 'bi-graph-up-arrow', color: '#e3f2fd', ic: '#0d6efd' },
  ]

  const dias = [
    { dia: 'Lun', h: 30 }, { dia: 'Mar', h: 40 }, { dia: 'Mié', h: 35 },
    { dia: 'Jue', h: 50 }, { dia: 'Vie', h: 90 }, { dia: 'Sáb', h: 60 }, { dia: 'Dom', h: 45 },
  ]

  return (
    <LayoutAdmin titulo="Dashboard">
      {/* Tarjetas */}
      <div className="row g-3 mb-4">
        {tarjetas.map(({ label, valor, icon, color, ic }) => (
          <div key={label} className="col-md-3 col-6">
            <div className="card-ideay p-3 h-100">
              <div style={{ width: 40, height: 40, backgroundColor: color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <i className={`bi ${icon}`} style={{ fontSize: 20, color: ic }}></i>
              </div>
              <h3 className="fw-bold mb-0">{valor}</h3>
              <small className="text-muted">{label}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        {/* Gráfico semanal */}
        <div className="col-lg-8">
          <div className="card-ideay p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Ventas de Tickets — Esta semana</h6>
              <small className="text-muted">Esta semana</small>
            </div>
            <div className="d-flex align-items-end gap-2" style={{ height: 120 }}>
              {dias.map(({ dia, h }) => (
                <div key={dia} className="flex-fill d-flex flex-column align-items-center gap-1">
                  <div className="w-100 rounded-top" style={{ height: `${h}%`, backgroundColor: h === 90 ? 'var(--rojo)' : '#f8d7da', transition: 'height .3s' }} />
                  <small style={{ fontSize: 10, color: '#999' }}>{dia}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="col-lg-4">
          <div className="card-ideay p-4">
            <h6 className="fw-bold mb-3">Acciones rápidas</h6>
            <div className="d-flex flex-column gap-2">
              {[
                { label: 'Crear Evento', ruta: '/admin/eventos/crear', icon: 'bi-plus-circle-fill', color: 'var(--rojo)' },
                { label: 'Ver Mesas', ruta: '/admin/mesas', icon: 'bi-grid-fill', color: '#0d6efd' },
                { label: 'Ver Reservas', ruta: '/admin/reservas', icon: 'bi-bookmark-fill', color: '#198754' },
                { label: 'Ver Chats', ruta: '/admin/chat', icon: 'bi-chat-dots-fill', color: '#fd7e14' },
              ].map(({ label, ruta, icon, color }) => (
                <button key={ruta} className="btn btn-light d-flex align-items-center gap-2 text-start" style={{ borderRadius: 10 }} onClick={() => navigate(ruta)}>
                  <i className={`bi ${icon}`} style={{ color, fontSize: 18 }}></i>
                  <span style={{ fontSize: 14 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        {actividad.length > 0 && (
          <div className="col-12">
            <div className="card-ideay p-4">
              <h6 className="fw-bold mb-3">Actividad reciente</h6>
              <div className="d-flex flex-column gap-2">
                {actividad.map((a, i) => (
                  <div key={i} className="d-flex align-items-center gap-3 py-2 border-bottom border-light">
                    <div style={{ width: 36, height: 36, background: 'var(--rojo-claro)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="bi bi-ticket-perforated" style={{ color: 'var(--rojo)' }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <small>
                        <span className="fw-semibold">{a.perfiles?.nombre}</span> compró {a.cantidad} entrada{a.cantidad > 1 ? 's' : ''} para <span className="fw-semibold">{a.eventos?.titulo}</span>
                      </small>
                    </div>
                    <small className="text-muted text-nowrap">{formatTiempo(a.comprado_en)}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutAdmin>
  )
}
