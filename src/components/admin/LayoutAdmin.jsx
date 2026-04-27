import { useState } from 'react'
import SidebarAdmin from './SidebarAdmin'

export default function LayoutAdmin({ titulo, children }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  return (
    <div className="app-admin">
      <div
        className={`sidebar-overlay ${sidebarAbierto ? 'visible' : ''}`}
        onClick={() => setSidebarAbierto(false)}
      />
      <SidebarAdmin abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />
      <div className="contenido-admin">
        {titulo && (
          <div className="header-admin">
            <button
              className="btn-hamburguesa btn btn-light"
              style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, padding: 0, flexShrink: 0 }}
              onClick={() => setSidebarAbierto(true)}
            >
              <i className="bi bi-list" style={{ fontSize: 20 }}></i>
            </button>
            <h5 className="mb-0 fw-bold">{titulo}</h5>
          </div>
        )}
        <div className="pagina-admin">
          {children}
        </div>
      </div>
    </div>
  )
}
