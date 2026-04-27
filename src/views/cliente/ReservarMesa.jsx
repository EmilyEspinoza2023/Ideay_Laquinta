import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

const COLS = 4
const ROW_H = 62
const START_Y = 48

function getPosicion(i) {
  return {
    xPct: 5 + (i % COLS) * 23,
    yPx: START_Y + Math.floor(i / COLS) * ROW_H,
  }
}

function MapaMesas({ lista, titulo, seleccionada, onSeleccionar, colorMesa }) {
  const filas = Math.max(1, Math.ceil(lista.length / COLS))
  const altura = Math.max(160, START_Y + filas * ROW_H + 28)

  return (
    <div className="card-ideay p-3 mb-3">
      <p className="fw-semibold mb-2" style={{ fontSize: 13 }}>{titulo}</p>
      <div style={{ position: 'relative', backgroundColor: '#fdf6f0', borderRadius: 12, border: '1px solid #e8ddd5', height: altura }}>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fce8e8', borderRadius: 8, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="bi bi-music-note-beamed" style={{ color: 'var(--rojo)', fontSize: 11 }}></i>
          <span style={{ fontSize: 10, color: 'var(--rojo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>DJ Toña</span>
        </div>

        {lista.map((mesa, i) => {
          const { xPct, yPx } = getPosicion(i)
          const esSeleccionada = seleccionada?.id === mesa.id
          return (
            <button key={mesa.id}
              style={{
                position: 'absolute', left: `${xPct}%`, top: yPx,
                width: 44, height: 44, borderRadius: '50%',
                border: esSeleccionada ? '2px solid #fff' : 'none',
                color: '#fff', fontSize: 11, fontWeight: 700,
                cursor: mesa.disponible ? 'pointer' : 'not-allowed',
                backgroundColor: colorMesa(mesa, esSeleccionada),
                boxShadow: esSeleccionada ? '0 0 0 3px var(--rojo)' : '0 2px 8px rgba(0,0,0,0.18)',
                opacity: mesa.disponible ? 1 : 0.65,
                transition: 'transform 0.15s',
              }}
              onClick={() => mesa.disponible && onSeleccionar(mesa)}
              title={`M${mesa.numero} — ${mesa.disponible ? 'Disponible' : 'Ocupada'}`}>
              M{mesa.numero}
            </button>
          )
        })}

        {lista.length === 0 && (
          <p className="text-muted text-center mb-0" style={{ position: 'absolute', bottom: 8, left: 0, right: 0, fontSize: 12 }}>Sin mesas</p>
        )}
        <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>BAR</span>
        <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>BAÑOS</span>
      </div>
    </div>
  )
}

export default function ReservarMesa() {
  const { id: eventoId } = useParams()
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const [mesas, setMesas] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [evento, setEvento] = useState(null)
  const [horaLlegada, setHoraLlegada] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarDatos()
    const sub = supabase.channel('reservar-mesas-' + eventoId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas_mesas', filter: `evento_id=eq.${eventoId}` }, cargarDatos)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [eventoId])

  async function cargarDatos() {
    const [{ data: mesasData }, { data: evData }, { data: reservasData }] = await Promise.all([
      supabase.from('mesas').select('*').order('numero'),
      supabase.from('eventos').select('titulo, fecha, hora').eq('id', eventoId).single(),
      supabase.from('reservas_mesas').select('mesa_id').eq('evento_id', eventoId)
        .in('estado', ['pendiente', 'confirmada'])
        .or(`expira_en.is.null,expira_en.gt.${new Date().toISOString()}`),
    ])

    const reservadas = new Set(reservasData?.map(r => r.mesa_id) || [])
    const mesasConEstado = (mesasData || []).map(m => ({
      ...m,
      disponible: m.disponible && !reservadas.has(m.id),
    }))

    setMesas(mesasConEstado)
    if (evData) {
      setEvento(evData)
      setHoraLlegada(prev => prev || evData.hora?.slice(0, 5) || '')
    }

    setSeleccionada(prev => {
      if (!prev) return null
      const actualizada = mesasConEstado.find(m => m.id === prev.id)
      return actualizada?.disponible ? actualizada : null
    })
  }

  // Hora máxima = hora del evento + 3 horas
  function horaMaxima(horaEvento) {
    if (!horaEvento) return ''
    const [h, m] = horaEvento.slice(0, 5).split(':').map(Number)
    const max = new Date(2000, 0, 1, h + 3, m)
    return `${String(max.getHours()).padStart(2, '0')}:${String(max.getMinutes()).padStart(2, '0')}`
  }

  async function reservar() {
    if (!seleccionada || !perfil || !horaLlegada) return
    setCargando(true)
    setError(null)

    const ahora = new Date().toISOString()
    const { data: existente } = await supabase
      .from('reservas_mesas').select('id')
      .eq('mesa_id', seleccionada.id).eq('evento_id', eventoId)
      .in('estado', ['pendiente', 'confirmada'])
      .or(`expira_en.is.null,expira_en.gt.${ahora}`)
      .maybeSingle()

    if (existente) {
      await cargarDatos()
      setSeleccionada(null)
      setError('Esta mesa ya fue reservada por otro cliente. Por favor elegí otra.')
      setCargando(false)
      return
    }

    // expira_en = fecha del evento + hora de llegada + 30 minutos
    const llegada = new Date(`${evento.fecha}T${horaLlegada}:00`)
    const expiraEn = new Date(llegada.getTime() + 30 * 60 * 1000).toISOString()

    const { data, error: err } = await supabase.from('reservas_mesas').insert({
      usuario_id: perfil.id,
      mesa_id: seleccionada.id,
      evento_id: eventoId,
      fecha_reserva: evento.fecha,
      hora_reserva: horaLlegada,
      estado: 'pendiente',
      expira_en: expiraEn,
    }).select().single()

    if (err) {
      setError('Ocurrió un error al reservar. Intentá de nuevo.')
      setCargando(false)
      return
    }

    navigate(`/evento/${eventoId}/mesa-reservada`, {
      state: { reserva: data, mesa: seleccionada, evento, horaLlegada }
    })
    setCargando(false)
  }

  function colorMesa(mesa, esSeleccionada) {
    if (!mesa.disponible) return '#dc3545'
    if (esSeleccionada) return '#f59e0b'
    return '#198754'
  }

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'long' })
  }

  const bajas = mesas.filter(m => m.zona === 'planta_baja')
  const altas = mesas.filter(m => m.zona === 'planta_alta')
  const puedeReservar = seleccionada && horaLlegada && !cargando

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 700 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Reservar Mesa</h4>
        </div>

        {/* Info evento */}
        {evento && (
          <div className="card-ideay px-3 py-2 d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-calendar-event" style={{ color: 'var(--rojo)', fontSize: 14 }}></i>
            <small className="text-muted">{evento.titulo} · {formatFecha(evento.fecha)}</small>
          </div>
        )}

        {/* Leyenda */}
        <div className="d-flex gap-3 mb-3">
          {[
            { color: '#198754', label: 'Disponible' },
            { color: '#f59e0b', label: 'Seleccionada' },
            { color: '#dc3545', label: 'Ocupada' },
          ].map(({ color, label }) => (
            <div key={label} className="d-flex align-items-center gap-1">
              <div className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: color }} />
              <small className="text-muted" style={{ fontSize: 11 }}>{label}</small>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13, borderRadius: 10 }}>
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        {/* Mapas */}
        <MapaMesas lista={bajas} titulo="Planta Baja" seleccionada={seleccionada}
          onSeleccionar={m => { setSeleccionada(m); setError(null) }} colorMesa={colorMesa} />
        <MapaMesas lista={altas} titulo="Planta Alta" seleccionada={seleccionada}
          onSeleccionar={m => { setSeleccionada(m); setError(null) }} colorMesa={colorMesa} />

        {/* Detalle + hora de llegada */}
        {seleccionada && (
          <div className="card-ideay p-3 mb-3">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="fw-bold mb-1">Mesa M{seleccionada.numero}</p>
                <div className="d-flex align-items-center gap-1 text-muted mb-1">
                  <i className="bi bi-people-fill" style={{ fontSize: 13 }}></i>
                  <small>Capacidad: {seleccionada.capacidad} personas</small>
                </div>
                <div className="d-flex align-items-center gap-1 text-muted">
                  <i className="bi bi-geo-alt-fill" style={{ fontSize: 13 }}></i>
                  <small>{seleccionada.zona === 'planta_baja' ? 'Planta Baja' : 'Planta Alta'}</small>
                </div>
              </div>
              <span className="badge" style={{ backgroundColor: '#e8f5e9', color: '#198754', fontSize: 11 }}>Disponible</span>
            </div>

            {/* Selector de hora de llegada */}
            <div className="border-top pt-3">
              <label className="fw-semibold mb-1 d-block" style={{ fontSize: 13 }}>
                <i className="bi bi-clock me-1" style={{ color: 'var(--rojo)' }}></i>
                ¿A qué hora llegás?
              </label>
              <p className="text-muted mb-2" style={{ fontSize: 11 }}>
                La mesa se libera 30 minutos después de la hora que elegís.
              </p>
              <input
                type="time"
                className="form-control"
                style={{ borderRadius: 10, fontSize: 15, maxWidth: 160 }}
                value={horaLlegada}
                min={evento?.hora?.slice(0, 5)}
                max={horaMaxima(evento?.hora)}
                onChange={e => setHoraLlegada(e.target.value)}
              />
              {horaLlegada && (
                <small className="text-muted mt-1 d-block" style={{ fontSize: 11 }}>
                  Mesa liberada si no llegás antes de las{' '}
                  <strong>
                    {(() => {
                      const [h, m] = horaLlegada.split(':').map(Number)
                      const exp = new Date(2000, 0, 1, h, m + 30)
                      return `${String(exp.getHours()).padStart(2, '0')}:${String(exp.getMinutes()).padStart(2, '0')}`
                    })()}
                  </strong>
                </small>
              )}
            </div>
          </div>
        )}

        {/* Botón reservar */}
        <div className="pb-4">
          <button className="btn w-100 py-3 text-white fw-semibold"
            style={{ backgroundColor: 'var(--rojo)', borderRadius: 12, opacity: puedeReservar ? 1 : 0.5 }}
            disabled={!puedeReservar}
            onClick={reservar}>
            {cargando
              ? <><span className="spinner-border spinner-border-sm me-2" />Reservando...</>
              : seleccionada
                ? `Reservar Mesa M${seleccionada.numero}`
                : 'Seleccioná una mesa'}
          </button>
        </div>
      </div>
    </div>
  )
}
