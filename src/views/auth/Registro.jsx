import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Registro() {
  const navigate = useNavigate()
  const { cargarPerfil } = useAuth()
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', confirmar: '' })
  const [acepta, setAcepta] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const inputFotoRef = useRef(null)

  function seleccionarFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.contrasena !== form.confirmar) return setError('Las contraseñas no coinciden')
    if (form.contrasena.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (!acepta) return setError('Debés aceptar los términos y condiciones')
    setCargando(true); setError('')

    const nombres = form.nombre.trim().split(' ')
    const { data, error: err } = await supabase.auth.signUp({
      email: form.correo,
      password: form.contrasena,
      options: { data: { nombre: nombres[0], apellido: nombres.slice(1).join(' ') || '' } },
    })

    if (err) {
      const msgs = {
        'User already registered': 'Este correo ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      }
      setError(msgs[err.message] || err.message)
      setCargando(false); return
    }

    // Subir foto si el usuario seleccionó una
    if (fotoFile && data.user) {
      const ext = fotoFile.name.split('.').pop()
      const path = `${data.user.id}/avatar.${ext}`
      const { error: errStorage } = await supabase.storage.from('avatars').upload(path, fotoFile, { upsert: true })
      if (!errStorage) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        const url = urlData.publicUrl + '?t=' + Date.now()
        await supabase.from('perfiles').update({ foto_url: url }).eq('id', data.user.id)
        await cargarPerfil(data.user.id)
      }
    }

    if (data.session) {
      navigate('/inicio', { replace: true })
    } else {
      setError('Revisá tu correo para confirmar tu cuenta antes de iniciar sesión.')
      setCargando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0EB', padding: '1.5rem 1.25rem' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <div className="d-flex align-items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="btn btn-sm btn-light rounded-circle p-2">
            <i className="bi bi-chevron-left"></i>
          </button>
          <h5 className="mb-0 fw-bold">Crear Cuenta</h5>
        </div>

        {/* Avatar con cámara */}
        <div className="text-center mb-4">
          <div className="position-relative d-inline-block" style={{ cursor: 'pointer' }} onClick={() => inputFotoRef.current?.click()}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {fotoPreview
                ? <img src={fotoPreview} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <i className="bi bi-person fs-2 text-secondary"></i>
              }
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, backgroundColor: '#8B1A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-camera-fill text-white" style={{ fontSize: 13 }}></i>
            </div>
          </div>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: 12 }}>
            {fotoPreview ? 'Toca para cambiar' : 'Agregar foto (opcional)'}
          </p>
          <input ref={inputFotoRef} type="file" accept="image/*" className="d-none" onChange={seleccionarFoto} />
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          {[
            { label: 'Nombre completo', key: 'nombre', type: 'text', placeholder: 'Tu nombre' },
            { label: 'Correo electrónico', key: 'correo', type: 'email', placeholder: 'tu@gmail.com' },
            { label: 'Contraseña', key: 'contrasena', type: 'password', placeholder: 'Mínimo 8 caracteres' },
            { label: 'Confirmar contraseña', key: 'confirmar', type: 'password', placeholder: 'Repetí tu contraseña' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="form-label small text-muted fw-medium">{label}</label>
              <input type={type} className="form-control" placeholder={placeholder}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}

          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} id="terminos" />
            <label className="form-check-label small" htmlFor="terminos">
              Acepto los <span className="link-rojo">términos y condiciones</span>
            </label>
          </div>

          <button type="submit" className="btn-rojo" disabled={cargando}>
            {cargando ? <span className="spinner-border spinner-border-sm" /> : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center small text-muted mt-4">
          ¿Ya tenés cuenta? <Link to="/login" className="link-rojo">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
