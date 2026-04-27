import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const { usuario, perfil, cargando: authCargando, entrarComoInvitado } = useAuth()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Redirige si ya hay sesión activa al montar
  useEffect(() => {
    if (authCargando || !usuario) return
    navigate(perfil?.rol === 'admin' ? '/admin/dashboard' : '/inicio', { replace: true })
  }, [authCargando])

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
    if (err) { setError('Correo o contraseña incorrectos'); setCargando(false); return }

    // Leer el perfil directamente para evitar race condition con el contexto
    const { data: p } = await supabase.from('perfiles').select('rol').eq('id', data.user.id).maybeSingle()
    navigate(p?.rol === 'admin' ? '/admin/dashboard' : '/inicio', { replace: true })
  }

  return (
    <div className="pantalla-auth">
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="text-center mb-4">
          <img src={logo} alt="Ideay" style={{ width: 120, marginBottom: 12 }} />
          <h5 className="fw-bold mb-1" style={{ color: 'var(--rojo)' }}>¡Ideay!</h5>
          <p className="text-muted small">Iniciá sesión para continuar</p>
        </div>

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

          <div>
            <label className="form-label small fw-medium text-muted">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 border-2" style={{ borderColor: '#e0e0e0' }}>
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input type={verPass ? 'text' : 'password'} className="form-control border-start-0 border-end-0 border-2" style={{ borderColor: '#e0e0e0' }}
                placeholder="••••••••" value={contrasena} onChange={e => setContrasena(e.target.value)} required />
              <button type="button" className="input-group-text bg-white border-2" style={{ borderColor: '#e0e0e0' }} onClick={() => setVerPass(!verPass)}>
                <i className={`bi ${verPass ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
              </button>
            </div>
          </div>

          <div className="text-end">
            <Link to="/recuperar" className="link-rojo small">¿Olvidaste tu contraseña?</Link>
          </div>

          <button type="submit" className="btn-rojo" disabled={cargando}>
            {cargando ? <span className="spinner-border spinner-border-sm" /> : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4">
          ¿No tenés cuenta? <Link to="/registro" className="link-rojo">Registrate</Link>
        </p>

        <div className="text-center mt-2">
          <button
            type="button"
            className="btn btn-link text-muted small p-0"
            onClick={() => { entrarComoInvitado(); navigate('/inicio', { replace: true }) }}
          >
            Continuar como invitado
          </button>
        </div>
      </div>
    </div>
  )
}
