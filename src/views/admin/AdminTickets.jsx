import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEvento, setFiltroEvento] = useState('')
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    cargarTickets()
    supabase.from('eventos').select('id, titulo').order('fecha', { ascending: false })
      .then(({ data }) => setEventos(data || []))

    const sub = supabase.channel('admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, cargarTickets)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function cargarTickets() {
    const { data } = await supabase
      .from('entradas')
      .select('*, perfiles(nombre, apellido, foto_url), eventos(id, titulo, fecha, imagen_url)')
      .eq('estado', 'pagado')
      .order('comprado_en', { ascending: false })
    setTickets(data || [])
  }

  function iniciales(p) {
    if (!p) return 'US'
    return `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`.toUpperCase()
  }

  function formatFecha(fecha) {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formatFechaHora(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const hoy = new Date().toISOString().split('T')[0]

  const filtrados = tickets.filter(t => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
      t.perfiles?.nombre?.toLowerCase().includes(q) ||
      t.perfiles?.apellido?.toLowerCase().includes(q) ||
      t.eventos?.titulo?.toLowerCase().includes(q)
    const matchEvento = !filtroEvento || t.eventos?.id === filtroEvento
    return matchQ && matchEvento
  })

  const totalRecaudado = filtrados.reduce((acc, t) => acc + (t.total || 0), 0)
  const totalEntradas = filtrados.reduce((acc, t) => acc + (t.cantidad || 0), 0)

  return (
    <LayoutAdmin titulo="Tickets vendidos">
      {/* Filtros */}
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-4">
        <div className="d-flex gap-2 flex-wrap">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar cliente o evento..."
            style={{ maxWidth: 260, borderRadius: 10 }}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 220, borderRadius: 10 }}
            value={filtroEvento}
            onChange={e => setFiltroEvento(e.target.value)}
          >
            <option value="">Todos los eventos</option>
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.titulo}</option>
            ))}
          </select>
        </div>
        <small className="text-muted">{filtrados.length} ticket{filtrados.length !== 1 ? 's' : ''}</small>
      </div>

      {/* Resumen */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total recaudado', valor: `C$${totalRecaudado.toLocaleString()}`, icon: 'bi-cash-stack', color: '#198754' },
          { label: 'Entradas vendidas', valor: totalEntradas, icon: 'bi-ticket-perforated', color: 'var(--rojo)' },
          { label: 'Compradores', valor: filtrados.length, icon: 'bi-people', color: '#1565c0' },
        ].map(({ label, valor, icon, color }) => (
          <div key={label} className="col-6 col-md-4">
            <div className="card-ideay p-3 d-flex align-items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`bi ${icon}`} style={{ color, fontSize: 18 }}></i>
              </div>
              <div>
                <p className="fw-bold mb-0" style={{ fontSize: 16 }}>{valor}</p>
                <small className="text-muted" style={{ fontSize: 11 }}>{label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de tickets */}
      <div className="d-flex flex-column gap-3">
        {filtrados.map(t => {
          const esActivo = t.eventos?.fecha >= hoy
          return (
            <div key={t.id} className="card-ideay p-3">
              <div className="d-flex align-items-start gap-3">
                {/* Imagen evento */}
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--rojo)' }}>
                  {t.eventos?.imagen_url && (
                    <img src={t.eventos.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Evento */}
                  <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: 14 }}>{t.eventos?.titulo}</p>
                  <small className="text-muted" style={{ fontSize: 11 }}>
                    <i className="bi bi-calendar-event me-1"></i>{formatFecha(t.eventos?.fecha)}
                    <span className="ms-1 badge" style={{ fontSize: 10, backgroundColor: esActivo ? '#e8f5e9' : '#f3f4f6', color: esActivo ? '#198754' : '#6c757d', borderRadius: 6, fontWeight: 500 }}>
                      {esActivo ? 'Próximo' : 'Pasado'}
                    </span>
                  </small>

                  {/* Separador */}
                  <div className="border-top my-2" />

                  {/* Cliente */}
                  <div className="d-flex align-items-center gap-2">
                    {t.perfiles?.foto_url
                      ? <img src={t.perfiles.foto_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 28, height: 28, background: '#6c757d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                          {iniciales(t.perfiles)}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: 13 }}>{t.perfiles?.nombre} {t.perfiles?.apellido}</p>
                      <small className="text-muted" style={{ fontSize: 10 }}>Comprado {formatFechaHora(t.comprado_en)}</small>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="fw-bold mb-0" style={{ color: 'var(--rojo)', fontSize: 14 }}>C${t.total?.toLocaleString()}</p>
                      <small className="text-muted" style={{ fontSize: 11 }}>{t.cantidad} entrada{t.cantidad !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filtrados.length === 0 && (
          <div className="text-center text-muted py-5">
            <i className="bi bi-ticket-perforated" style={{ fontSize: 40, color: '#dee2e6', display: 'block', marginBottom: 8 }}></i>
            No hay tickets
          </div>
        )}
      </div>
    </LayoutAdmin>
  )
}
