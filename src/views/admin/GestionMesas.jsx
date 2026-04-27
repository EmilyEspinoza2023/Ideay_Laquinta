import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

const COLS = 4
const ROW_H = 62
const START_Y = 48

function getPosicion(i) {
  return {
    xPct: 5 + (i % COLS) * 23,
    yPx: START_Y + Math.floor(i / COLS) * ROW_H,
  }
}

function MapaMesas({ lista, titulo, zona, modoEdicion, mesaSeleccionada, onAgregar, onToggle, onSeleccionar, colorMesa }) {
  const filas = Math.max(1, Math.ceil(lista.length / COLS))
  const altura = Math.max(160, START_Y + filas * ROW_H + 28)

  return (
    <div className="card-ideay p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-semibold mb-0" style={{ fontSize: 13 }}>{titulo}</h6>
        {modoEdicion && (
          <button className="btn btn-sm" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 8, fontSize: 12 }}
            onClick={() => onAgregar(zona)}>
            <i className="bi bi-plus-lg me-1"></i>Agregar mesa
          </button>
        )}
      </div>

      <div className="planta-container" style={{ height: altura }}>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f8d7da', borderRadius: 8, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="bi bi-music-note-beamed" style={{ color: 'var(--rojo)', fontSize: 11 }}></i>
          <span className="zona-label" style={{ color: 'var(--rojo)' }}>DJ Toña</span>
        </div>

        {lista.map((mesa, i) => {
          const { xPct, yPx } = getPosicion(i)
          return (
            <button key={mesa.id}
              className="btn-mesa"
              style={{
                left: `${xPct}%`,
                top: yPx,
                backgroundColor: colorMesa(mesa),
                border: mesaSeleccionada?.id === mesa.id ? '2px solid #fff' : 'none',
                boxShadow: mesaSeleccionada?.id === mesa.id ? '0 0 0 3px var(--rojo)' : '0 2px 8px rgba(0,0,0,0.18)',
              }}
              onClick={() => { onToggle(mesa); onSeleccionar(mesa) }}
              title={`M${mesa.numero} — ${mesa.disponible ? 'Disponible' : 'Reservada'}`}>
              M{mesa.numero}
            </button>
          )
        })}

        <span className="zona-label" style={{ position: 'absolute', bottom: 8, left: 8 }}>BAR</span>
        <span className="zona-label" style={{ position: 'absolute', bottom: 8, right: 8 }}>BAÑOS</span>
      </div>
    </div>
  )
}

export default function GestionMesas() {
  const [mesas, setMesas] = useState([])
  const [modoEdicion, setModoEdicion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)

  useEffect(() => {
    cargarMesas()
    const sub = supabase.channel('gestion-mesas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, cargarMesas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas_mesas' }, cargarMesas)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function cargarMesas() {
    const { data } = await supabase.from('mesas').select('*').order('numero')
    setMesas(data || [])
  }

  async function guardarCambios() {
    setGuardando(true)
    for (const mesa of mesas) {
      await supabase.from('mesas').update({ disponible: mesa.disponible }).eq('id', mesa.id)
    }
    setGuardando(false)
    setModoEdicion(false)
    setMesaSeleccionada(null)
  }

  async function agregarMesa(zona) {
    const siguiente = mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1
    const { data, error } = await supabase
      .from('mesas')
      .insert({ numero: siguiente, zona, disponible: true, capacidad: 4 })
      .select()
      .single()
    if (data) setMesas(prev => [...prev, data])
    if (error) console.error('Error al agregar mesa:', error)
  }

  async function eliminarMesa(id) {
    await supabase.from('mesas').delete().eq('id', id)
    setMesas(prev => prev.filter(m => m.id !== id))
    if (mesaSeleccionada?.id === id) setMesaSeleccionada(null)
  }

  function toggleDisponible(mesa) {
    if (!modoEdicion) return
    setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, disponible: !m.disponible } : m))
  }

  function colorMesa(mesa) {
    return mesa.disponible ? '#198754' : '#dc3545'
  }

  const bajas = mesas.filter(m => m.zona === 'planta_baja')
  const altas = mesas.filter(m => m.zona === 'planta_alta')
  const disponibles = mesas.filter(m => m.disponible).length
  const reservadas = mesas.filter(m => !m.disponible).length

  return (
    <LayoutAdmin titulo="Gestión de Mesas">
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex gap-3 align-items-center">
              {[{ color: '#198754', label: 'Disponible' }, { color: '#dc3545', label: 'Reservada' }].map(({ color, label }) => (
                <span key={label} className="d-flex align-items-center gap-2" style={{ fontSize: 12 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
                  {label}
                </span>
              ))}
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: 13 }}>Modo edición</span>
              <div className={`toggle ${modoEdicion ? 'on' : 'off'}`} onClick={() => { setModoEdicion(!modoEdicion); setMesaSeleccionada(null) }}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>

          <MapaMesas
            lista={bajas} titulo="Planta Baja" zona="planta_baja"
            modoEdicion={modoEdicion} mesaSeleccionada={mesaSeleccionada}
            onAgregar={agregarMesa} onToggle={toggleDisponible}
            onSeleccionar={setMesaSeleccionada} colorMesa={colorMesa}
          />
          <MapaMesas
            lista={altas} titulo="Planta Alta" zona="planta_alta"
            modoEdicion={modoEdicion} mesaSeleccionada={mesaSeleccionada}
            onAgregar={agregarMesa} onToggle={toggleDisponible}
            onSeleccionar={setMesaSeleccionada} colorMesa={colorMesa}
          />

          {modoEdicion && (
            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-light flex-fill" style={{ borderRadius: 10 }}
                onClick={() => { setModoEdicion(false); setMesaSeleccionada(null); cargarMesas() }}>
                Cancelar
              </button>
              <button className="btn flex-fill fw-semibold" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }}
                disabled={guardando} onClick={guardarCambios}>
                {guardando ? <span className="spinner-border spinner-border-sm" /> : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="card-ideay p-3 mb-3">
            <h6 className="fw-bold mb-3">Resumen</h6>
            <div className="d-flex flex-column gap-2">
              {[
                { label: 'Total mesas', valor: mesas.length, color: '#0d6efd' },
                { label: 'Disponibles', valor: disponibles, color: '#198754' },
                { label: 'Reservadas', valor: reservadas, color: '#dc3545' },
                { label: 'Planta Baja', valor: bajas.length, color: '#6c757d' },
                { label: 'Planta Alta', valor: altas.length, color: '#6c757d' },
              ].map(({ label, valor, color }) => (
                <div key={label} className="d-flex justify-content-between align-items-center py-1 border-bottom border-light">
                  <span className="text-muted" style={{ fontSize: 13 }}>{label}</span>
                  <span className="fw-semibold" style={{ color, fontSize: 14 }}>{valor}</span>
                </div>
              ))}
            </div>
          </div>

          {mesaSeleccionada && modoEdicion && (
            <div className="card-ideay p-3">
              <h6 className="fw-bold mb-3">Mesa seleccionada</h6>
              <p className="mb-1"><span className="text-muted">Número:</span> <strong>M{mesaSeleccionada.numero}</strong></p>
              <p className="mb-1"><span className="text-muted">Zona:</span> {mesaSeleccionada.zona === 'planta_baja' ? 'Planta Baja' : 'Planta Alta'}</p>
              <p className="mb-3">
                <span className="text-muted">Estado: </span>
                <span className={`badge ${mesas.find(m => m.id === mesaSeleccionada.id)?.disponible ? 'badge-publicado' : 'badge-expirado'}`}>
                  {mesas.find(m => m.id === mesaSeleccionada.id)?.disponible ? 'Disponible' : 'Reservada'}
                </span>
              </p>
              <button className="btn btn-sm btn-outline-danger w-100" style={{ borderRadius: 8 }} onClick={() => eliminarMesa(mesaSeleccionada.id)}>
                <i className="bi bi-trash me-1"></i>Eliminar mesa
              </button>
            </div>
          )}

          {!modoEdicion && (
            <div className="card-ideay p-3 text-center">
              <i className="bi bi-pencil-square" style={{ fontSize: 32, color: '#dee2e6' }}></i>
              <p className="text-muted mt-2" style={{ fontSize: 13 }}>Activá el modo edición para modificar las mesas, cambiar su estado o agregar nuevas.</p>
            </div>
          )}
        </div>
      </div>
    </LayoutAdmin>
  )
}
