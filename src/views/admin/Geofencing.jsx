import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

export default function Geofencing() {
  const [activo, setActivo] = useState(true)
  const [radio, setRadio] = useState(200)
  const [mensaje, setMensaje] = useState('¡Estás cerca de La Quinta! ¡Hay eventos increíbles hoy!')
  const [eventoId, setEventoId] = useState('')
  const [horaDesde, setHoraDesde] = useState('18:00')
  const [horaHasta, setHoraHasta] = useState('03:00')
  const [eventos, setEventos] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('geofencing_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('eventos').select('id, titulo, fecha').eq('activo', true).order('fecha'),
    ]).then(([{ data: cfg }, { data: evs }]) => {
      if (cfg) {
        setActivo(cfg.activo)
        setRadio(cfg.radio_metros)
        setMensaje(cfg.mensaje || '')
        setEventoId(cfg.evento_id || '')
        setHoraDesde(cfg.hora_desde?.slice(0, 5) || '18:00')
        setHoraHasta(cfg.hora_hasta?.slice(0, 5) || '03:00')
      }
      setEventos(evs || [])
      setCargando(false)
    })
  }, [])

  async function guardar() {
    setGuardando(true)
    await supabase.from('geofencing_config').update({
      activo,
      radio_metros: radio,
      mensaje,
      evento_id: eventoId || null,
      hora_desde: horaDesde,
      hora_hasta: horaHasta,
    }).eq('id', 1)
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  if (cargando) return (
    <LayoutAdmin titulo="Geofencing — Alertas de Proximidad">
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" style={{ color: 'var(--rojo)' }} />
      </div>
    </LayoutAdmin>
  )

  return (
    <LayoutAdmin titulo="Geofencing — Alertas de Proximidad">
      <div className="row g-4">
        <div className="col-lg-7">

          {/* Toggle activo */}
          <div className="card-ideay p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 40, height: 40, backgroundColor: '#fce4ec', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-geo-alt" style={{ color: 'var(--rojo)', fontSize: 20 }}></i>
                </div>
                <div>
                  <p className="fw-semibold mb-0">Alertas de proximidad</p>
                  <small className="text-muted">Notificá a usuarios cuando estén cerca de La Quinta</small>
                </div>
              </div>
              <div className={`toggle ${activo ? 'on' : 'off'}`} onClick={() => setActivo(!activo)}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>

          {/* Radio */}
          <div className="card-ideay p-4 mb-4">
            <h6 className="fw-bold mb-3">Radio de detección</h6>
            <div className="text-center mb-3">
              <h2 className="fw-bold mb-0" style={{ color: 'var(--rojo)' }}>{radio} m</h2>
              <small className="text-muted">desde La Quinta</small>
            </div>
            <input type="range" className="form-range" min={50} max={1000} step={50}
              value={radio} onChange={e => setRadio(Number(e.target.value))}
              style={{ accentColor: 'var(--rojo)' }} />
            <div className="d-flex justify-content-between">
              <small className="text-muted">50m</small>
              <small className="text-muted">1km</small>
            </div>
          </div>

          {/* Mensaje */}
          <div className="card-ideay p-4 mb-4">
            <h6 className="fw-bold mb-3">Mensaje de alerta</h6>
            <textarea className="form-control" rows={3} placeholder="Mensaje que verá el usuario..."
              value={mensaje} onChange={e => setMensaje(e.target.value)} style={{ resize: 'none' }} />
          </div>

          {/* Evento */}
          <div className="card-ideay p-4 mb-4">
            <h6 className="fw-bold mb-3">Evento a promocionar</h6>
            <select className="form-select" value={eventoId} onChange={e => setEventoId(e.target.value)}>
              <option value="">— Ninguno (alerta genérica) —</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.titulo}</option>
              ))}
            </select>
            <small className="text-muted mt-2 d-block">Si seleccionás un evento, al tocar la notificación irá directo a ese evento.</small>
          </div>

          {/* Horario */}
          <div className="card-ideay p-4 mb-4">
            <h6 className="fw-bold mb-3">Horario activo</h6>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label small text-muted">Desde</label>
                <input type="time" className="form-control fw-semibold"
                  value={horaDesde} onChange={e => setHoraDesde(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted">Hasta</label>
                <input type="time" className="form-control fw-semibold"
                  value={horaHasta} onChange={e => setHoraHasta(e.target.value)} />
              </div>
            </div>
          </div>

          <button className="btn-rojo" disabled={guardando} onClick={guardar}>
            {guardando
              ? <span className="spinner-border spinner-border-sm" />
              : guardado
                ? <><i className="bi bi-check-lg me-1"></i>¡Guardado!</>
                : 'Guardar configuración'
            }
          </button>
        </div>

        {/* Panel derecho */}
        <div className="col-lg-5">
          {/* Preview notificación */}
          <div className="card-ideay p-4 mb-4">
            <h6 className="fw-bold mb-3">Vista previa</h6>
            <div style={{ backgroundColor: '#1e1f2b', borderRadius: 16, padding: 16, color: '#fff' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div style={{ width: 32, height: 32, background: 'var(--rojo)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-geo-alt-fill text-white" style={{ fontSize: 14 }}></i>
                </div>
                <div>
                  <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>¡Ideay! — La Quinta</p>
                  <small style={{ color: '#aaa', fontSize: 11 }}>ahora</small>
                </div>
              </div>
              <p style={{ fontSize: 13, whiteSpace: 'pre-line', color: '#e0e0e0', marginBottom: eventoId ? 8 : 0 }}>{mensaje}</p>
              {eventoId && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px' }}>
                  <small style={{ color: '#ffd700' }}>
                    <i className="bi bi-arrow-right me-1"></i>
                    {eventos.find(e => e.id === eventoId)?.titulo || 'Ver evento'}
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Resumen config */}
          <div className="card-ideay p-4 mb-4">
            <h6 className="fw-bold mb-3">Configuración actual</h6>
            <div className="d-flex flex-column gap-2">
              {[
                { label: 'Estado', valor: activo ? 'Activo ✓' : 'Inactivo', color: activo ? '#198754' : '#6c757d' },
                { label: 'Radio', valor: `${radio} metros` },
                { label: 'Horario', valor: `${horaDesde} — ${horaHasta}` },
              ].map(({ label, valor, color }) => (
                <div key={label} className="d-flex justify-content-between py-1 border-bottom border-light">
                  <span className="text-muted" style={{ fontSize: 13 }}>{label}</span>
                  <span className="fw-semibold" style={{ fontSize: 13, color: color || 'inherit' }}>{valor}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </LayoutAdmin>
  )
}
