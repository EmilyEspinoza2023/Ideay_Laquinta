import { useNavigate } from 'react-router-dom'

export default function ModalInvitado({ visible, onCerrar }) {
  const navigate = useNavigate()
  if (!visible) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCerrar}
    >
      <div
        style={{ width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: '20px 20px 0 0', padding: '28px 24px 40px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div style={{ width: 56, height: 56, backgroundColor: 'var(--rojo-claro)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <i className="bi bi-lock" style={{ fontSize: 24, color: 'var(--rojo)' }}></i>
          </div>
          <h6 className="fw-bold mb-1">Creá tu cuenta</h6>
          <p className="text-muted small mb-0">Para continuar necesitás tener una cuenta en Ideay</p>
        </div>
        <div className="d-flex flex-column gap-2">
          <button className="btn-rojo" onClick={() => navigate('/registro')}>Registrate gratis</button>
          <button className="btn btn-outline-secondary rounded-3 py-2 fw-medium" onClick={() => navigate('/login')}>Iniciar Sesión</button>
          <button className="btn btn-link text-muted small" onClick={onCerrar}>Más tarde</button>
        </div>
      </div>
    </div>
  )
}
