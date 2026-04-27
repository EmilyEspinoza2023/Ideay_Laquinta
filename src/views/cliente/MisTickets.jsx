import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function MisTickets() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('activos')
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    if (!perfil) return
    cargarTickets()
    const sub = supabase.channel('mis-tickets-' + perfil.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas', filter: `usuario_id=eq.${perfil.id}` }, cargarTickets)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [perfil, tab])

  async function cargarTickets() {
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('entradas').select('*, eventos(titulo, imagen_url, fecha, hora)')
      .eq('usuario_id', perfil.id).eq('estado', 'pagado')
      .order('comprado_en', { ascending: false })
    const activos = data?.filter(t => t.eventos?.fecha >= hoy) || []
    const historial = data?.filter(t => t.eventos?.fecha < hoy) || []
    setTickets(tab === 'activos' ? activos : historial)
  }

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 800 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Mis Tickets</h4>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-1 bg-white rounded-3 p-1 mb-4" style={{ border: '1px solid #e9ecef' }}>
          {[['activos', 'Activos'], ['historial', 'Historial']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)} className="btn btn-sm flex-fill"
              style={{ borderRadius: 8, backgroundColor: tab === val ? 'var(--rojo)' : 'transparent', color: tab === val ? '#fff' : '#6c757d', fontWeight: tab === val ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>

        <div className="d-flex flex-column gap-3 pb-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="card-ideay p-3 d-flex gap-3">
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                {ticket.eventos?.imagen_url
                  ? <img src={ticket.eventos.imagen_url} alt="" className="w-100 h-100 object-fit-cover" />
                  : <div className="w-100 h-100" style={{ backgroundColor: 'var(--rojo)' }} />
                }
              </div>
              <div className="flex-grow-1">
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>{ticket.eventos?.titulo}</p>
                <small className="text-muted">{formatFecha(ticket.eventos?.fecha)} · {ticket.eventos?.hora?.slice(0, 5)}</small>
                <div className="d-flex align-items-center justify-content-between mt-2">
                  <span className="badge badge-publicado">Entrada × {ticket.cantidad}</span>
                  <span className="fw-bold" style={{ color: 'var(--rojo)', fontSize: 14 }}>C${ticket.total}</span>
                </div>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-ticket-perforated" style={{ fontSize: 48, color: '#dee2e6' }}></i>
              <p className="text-muted mt-3">No tenés tickets {tab === 'activos' ? 'activos' : 'en el historial'}</p>
              {tab === 'activos' && (
                <button className="btn btn-sm" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }} onClick={() => navigate('/explorar')}>
                  Ver eventos
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
