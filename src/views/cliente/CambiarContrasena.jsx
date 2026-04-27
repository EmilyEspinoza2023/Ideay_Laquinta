import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import NavCliente from '../../components/navegacion/NavCliente'

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [verActual, setVerActual] = useState(false)
  const [verNueva, setVerNueva] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres')
    if (form.nueva !== form.confirmar) return setError('Las contraseñas no coinciden')
    setCargando(true)

    // Verificar contraseña actual
    const { error: errLogin } = await supabase.auth.signInWithPassword({
      email: usuario.email,
      password: form.actual,
    })
    if (errLogin) {
      setError('La contraseña actual es incorrecta')
      setCargando(false)
      return
    }

    // Actualizar con la nueva
    const { error: errUpdate } = await supabase.auth.updateUser({ password: form.nueva })
    if (errUpdate) {
      setError('Error al cambiar la contraseña. Intentá de nuevo.')
      setCargando(false)
      return
    }

    setExito(true)
    setCargando(false)
    setTimeout(() => navigate(-1), 2000)
  }

  function Campo({ label, campo, ver, setVer }) {
    return (
      <div>
        <label className="form-label small fw-medium text-muted">{label}</label>
        <div className="input-group">
          <input
            type={ver ? 'text' : 'password'}
            className="form-control border-end-0"
            placeholder="••••••••"
            value={form[campo]}
            onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))}
            required
          />
          <button type="button" className="input-group-text bg-white" style={{ cursor: 'pointer' }}
            onClick={() => setVer(!ver)}>
            <i className={`bi ${ver ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 500 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Cambiar contraseña</h4>
        </div>

        {exito ? (
          <div className="text-center py-5">
            <div style={{ width: 72, height: 72, background: 'var(--rojo-claro)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="bi bi-check-lg" style={{ fontSize: 32, color: 'var(--rojo)' }}></i>
            </div>
            <p className="fw-semibold mb-1">¡Contraseña actualizada!</p>
            <p className="text-muted" style={{ fontSize: 13 }}>Volviendo atrás...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <Campo label="Contraseña actual" campo="actual" ver={verActual} setVer={setVerActual} />
            <Campo label="Nueva contraseña" campo="nueva" ver={verNueva} setVer={setVerNueva} />
            <Campo label="Confirmar nueva contraseña" campo="confirmar" ver={verConfirmar} setVer={setVerConfirmar} />

            <button type="submit" className="btn-rojo mt-2" disabled={cargando}>
              {cargando ? <span className="spinner-border spinner-border-sm" /> : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
