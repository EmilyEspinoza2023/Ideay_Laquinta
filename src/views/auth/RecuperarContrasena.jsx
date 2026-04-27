import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import logo from '../../assets/logo.png'

export default function RecuperarContrasena() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: window.location.origin + '/login',
    })
    if (err) setError('Error al enviar el correo. Intentá de nuevo.')
    else setEnviado(true)
    setCargando(false)
  }

  return (
    <div className="pantalla-auth">
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="text-center mb-4">
          <img src={logo} alt="Ideay" style={{ width: 120, marginBottom: 12 }} />
          <h5 className="fw-bold mb-1" style={{ color: 'var(--rojo)' }}>Recuperar contraseña</h5>
          <p className="text-muted small">Te enviaremos un link para restablecer tu contraseña</p>
        </div>

        {enviado ? (
          <div className="text-center">
            <div style={{ width: 72, height: 72, background: 'var(--rojo-claro)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="bi bi-envelope-check" style={{ fontSize: 32, color: 'var(--rojo)' }}></i>
            </div>
            <p className="fw-semibold mb-2">¡Correo enviado!</p>
            <p className="text-muted small mb-4">Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.</p>
            <Link to="/login" className="btn-rojo" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Volver al inicio de sesión</Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small fw-medium text-muted">Correo electrónico</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 border-2" style={{ borderColor: '#e0e0e0' }}>
                    <i className="bi bi-envelope text-muted"></i>
                  </span>
                  <input type="email" className="form-control border-start-0 border-2" style={{ borderColor: '#e0e0e0' }}
                    placeholder="tu@gmail.com" value={correo} onChange={e => setCorreo(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn-rojo" disabled={cargando}>
                {cargando ? <span className="spinner-border spinner-border-sm" /> : 'Enviar link'}
              </button>
            </form>

            <p className="text-center text-muted small mt-4">
              ¿Recordaste tu contraseña? <Link to="/login" className="link-rojo">Volver al login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
