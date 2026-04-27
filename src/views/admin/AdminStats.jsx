import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LayoutAdmin from '../../components/admin/LayoutAdmin'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function AdminStats() {
  const [periodo, setPeriodo] = useState('Mensual')
  const [stats, setStats] = useState(null)
  const periodos = ['Semanal', 'Mensual', 'Anual']

  useEffect(() => {
    cargarStats()
    const sub = supabase.channel('admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, cargarStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfiles' }, cargarStats)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [periodo])

  async function cargarStats() {
    const ahora = new Date()
    const inicio = new Date()
    if (periodo === 'Semanal') inicio.setDate(ahora.getDate() - 7)
    else if (periodo === 'Mensual') inicio.setMonth(ahora.getMonth() - 1)
    else inicio.setFullYear(ahora.getFullYear() - 1)

    const [
      { count: totalUsuarios },
      { count: nuevosUsuarios },
      { data: entradas },
      { count: totalTickets },
    ] = await Promise.all([
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente'),
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente').gte('creado_en', inicio.toISOString()),
      supabase.from('entradas').select('total, comprado_en, eventos(titulo)').eq('estado', 'pagado'),
      supabase.from('entradas').select('*', { count: 'exact', head: true }).eq('estado', 'pagado'),
    ])

    const entradasPeriodo = (entradas || []).filter(e => new Date(e.comprado_en) >= inicio)
    const ingresos = entradasPeriodo.reduce((sum, e) => sum + Number(e.total), 0)

    // Barras: top eventos por ingreso en el periodo
    const porEvento = {}
    for (const e of entradasPeriodo) {
      const titulo = e.eventos?.titulo || 'Sin título'
      porEvento[titulo] = (porEvento[titulo] || 0) + Number(e.total)
    }
    const topEventos = Object.entries(porEvento)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    const maxEvento = Math.max(...topEventos.map(([, v]) => v), 1)
    const barras = topEventos.map(([titulo, total]) => ({
      label: titulo.length > 12 ? titulo.slice(0, 12) + '…' : titulo,
      altura: Math.max(Math.round((total / maxEvento) * 80), 8),
      total,
      esMax: total === maxEvento,
    }))

    // Línea: ingresos mensuales últimos 12 meses
    const porMes = Array(12).fill(0)
    const mesActual = ahora.getMonth()
    for (const e of entradas || []) {
      const diff = (ahora.getFullYear() - new Date(e.comprado_en).getFullYear()) * 12
        + ahora.getMonth() - new Date(e.comprado_en).getMonth()
      if (diff >= 0 && diff < 12) porMes[11 - diff] += Number(e.total)
    }
    const maxMes = Math.max(...porMes, 1)
    const lineaNorm = porMes.map(v => Math.max(Math.round((v / maxMes) * 75), 3))
    const mesesLabel = Array(12).fill(0).map((_, i) => MESES[(mesActual - 11 + i + 12) % 12])

    setStats({
      ingresos,
      totalUsuarios: totalUsuarios || 0,
      nuevosUsuarios: nuevosUsuarios || 0,
      totalTickets: totalTickets || 0,
      barras,
      linea: lineaNorm,
      mesesLabel,
    })
  }

  if (!stats) return (
    <LayoutAdmin titulo="Estadísticas">
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" style={{ color: 'var(--rojo)' }} />
      </div>
    </LayoutAdmin>
  )

  return (
    <LayoutAdmin titulo="Estadísticas">
      {/* Selector de periodo */}
      <div className="d-flex gap-1 bg-white rounded-3 p-1 mb-4 d-inline-flex" style={{ border: '1px solid #e9ecef' }}>
        {periodos.map(p => (
          <button key={p} onClick={() => setPeriodo(p)} className="btn btn-sm"
            style={{ borderRadius: 8, backgroundColor: periodo === p ? 'var(--rojo)' : 'transparent', color: periodo === p ? '#fff' : '#6c757d', padding: '6px 20px' }}>
            {p}
          </button>
        ))}
      </div>

      <div className="row g-4">
        {/* KPIs */}
        <div className="col-12">
          <div className="row g-3">
            {[
              { label: 'Ingresos del periodo', valor: `C$${stats.ingresos >= 1000 ? (stats.ingresos / 1000).toFixed(1) + 'K' : stats.ingresos.toLocaleString()}`, icon: 'bi-cash-stack', color: '#e8f5e9', ic: '#198754' },
              { label: 'Usuarios registrados', valor: stats.totalUsuarios, icon: 'bi-people', color: '#e3f2fd', ic: '#0d6efd' },
              { label: 'Nuevos este periodo', valor: `+${stats.nuevosUsuarios}`, icon: 'bi-person-plus', color: '#f3e5f5', ic: '#7b1fa2' },
            ].map(({ label, valor, icon, color, ic }) => (
              <div key={label} className="col-md-3 col-6">
                <div className="card-ideay p-3">
                  <div style={{ width: 36, height: 36, backgroundColor: color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <i className={`bi ${icon}`} style={{ color: ic, fontSize: 18 }}></i>
                  </div>
                  <h4 className="fw-bold mb-0">{valor}</h4>
                  <small className="text-muted">{label}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de barras — ingresos por evento */}
        <div className="col-12">
          <div className="card-ideay p-4">
            <h6 className="fw-bold mb-4">Ingresos por Evento</h6>
            {stats.barras.length === 0 ? (
              <div className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                <i className="bi bi-bar-chart" style={{ fontSize: 32, color: '#dee2e6', display: 'block', marginBottom: 8 }}></i>
                Sin ventas en este periodo
              </div>
            ) : (
              <div className="d-flex align-items-end gap-3" style={{ height: 160 }}>
                {stats.barras.map(({ label, altura, total, esMax }) => (
                  <div key={label} className="flex-fill d-flex flex-column align-items-center gap-1">
                    <small className="text-muted" style={{ fontSize: 9 }}>
                      {total >= 1000 ? `C$${(total / 1000).toFixed(1)}K` : `C$${total}`}
                    </small>
                    <div className="w-100 rounded-top" style={{ height: `${altura}%`, backgroundColor: esMax ? 'var(--rojo)' : '#f8d7da', transition: 'height .3s' }} />
                    <small style={{ fontSize: 9, color: '#999', textAlign: 'center', lineHeight: 1.2 }}>{label}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Tendencia de ventas */}
        <div className="col-12">
          <div className="card-ideay p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0">Tendencia de Ventas (12 meses)</h6>
              <span className="badge" style={{ backgroundColor: 'var(--rojo-claro)', color: 'var(--rojo)' }}>
                C${stats.ingresos >= 1000 ? (stats.ingresos / 1000).toFixed(1) + 'K' : stats.ingresos.toLocaleString()} este periodo
              </span>
            </div>
            <div style={{ position: 'relative', height: 100 }}>
              <svg viewBox="0 0 300 80" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                <polyline
                  points={stats.linea.map((y, i) => `${(i / (stats.linea.length - 1)) * 300},${80 - y}`).join(' ')}
                  fill="none" stroke="var(--rojo)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline
                  points={[...stats.linea.map((y, i) => `${(i / (stats.linea.length - 1)) * 300},${80 - y}`), '300,80', '0,80'].join(' ')}
                  fill="rgba(139,26,26,0.08)" stroke="none" />
              </svg>
            </div>
            <div className="d-flex justify-content-between mt-1">
              {stats.mesesLabel.map(m => <small key={m} style={{ fontSize: 9, color: '#aaa' }}>{m}</small>)}
            </div>
          </div>
        </div>
      </div>
    </LayoutAdmin>
  )
}
