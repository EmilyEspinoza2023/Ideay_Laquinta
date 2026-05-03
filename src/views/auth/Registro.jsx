import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

function ModalTerminos({ onAceptar, onCerrar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <h6 className="fw-bold mb-0">Términos y Condiciones</h6>
          <button onClick={onCerrar} className="btn btn-sm btn-light rounded-circle p-1" style={{ lineHeight: 1 }}>
            <i className="bi bi-x-lg" style={{ fontSize: 14 }}></i>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', flex: 1 }}>
          <p className="text-muted mb-4" style={{ fontSize: 11 }}>Última actualización: enero 2026</p>

          {[
            { titulo: '1. Aceptación de los términos', texto: 'Al crear una cuenta y usar la aplicación Ideay, aceptás estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de ellos, por favor no uses la aplicación.' },
            { titulo: '2. Uso de la aplicación', lista: ['Consultar y asistir a eventos', 'Comprar entradas y reservar mesas', 'Comunicarte con el equipo de La Quinta', 'Dejar comentarios y calificaciones sobre los eventos'], intro: 'Ideay es una plataforma exclusiva para clientes de Discoteca La Quinta, Juigalpa, Nicaragua. Podés usarla para:' },
            { titulo: '3. Registro y cuenta', texto: 'Para usar Ideay debés registrarte con información verídica. Sos responsable de mantener la confidencialidad de tu contraseña. La Quinta se reserva el derecho de suspender cuentas que incumplan estas condiciones.' },
            { titulo: '4. Compras y reservas', lista: ['Las compras son definitivas. No se realizan reembolsos salvo cancelación del evento por parte de La Quinta.', 'Las reservas de mesas tienen un tiempo de expiración. Si no se confirma antes de ese tiempo, la reserva se libera automáticamente.', 'La Quinta puede modificar o cancelar eventos por causas de fuerza mayor.'], intro: 'Al comprar una entrada o reservar una mesa:' },
            { titulo: '5. Comportamiento en la plataforma', texto: 'Está prohibido publicar comentarios ofensivos, discriminatorios o falsos. La Quinta se reserva el derecho de eliminar cualquier contenido que considere inapropiado y de suspender la cuenta del usuario responsable.' },
            { titulo: '6. Privacidad y datos', texto: 'Los datos que proporcionás (nombre, correo, foto de perfil) se usan únicamente para el funcionamiento de la aplicación. No compartimos tu información personal con terceros. Tu ubicación solo se usa para las alertas de proximidad y nunca se almacena en nuestros servidores.' },
            { titulo: '7. Notificaciones', texto: 'Al aceptar los permisos de notificación, podés recibir alertas sobre eventos, reservas y mensajes del equipo de La Quinta. Podés desactivarlas en cualquier momento desde Configuración.' },
            { titulo: '8. Modificaciones', texto: 'La Quinta puede actualizar estos términos en cualquier momento. Te notificaremos los cambios importantes a través de la aplicación. El uso continuado de Ideay implica la aceptación de los nuevos términos.' },
            { titulo: '9. Contacto', texto: 'Si tenés dudas sobre estos términos, podés escribirnos a través del chat de la aplicación o al correo codeartbyemile@gmail.com.' },
          ].map(({ titulo, texto, lista, intro }) => (
            <div key={titulo} className="mb-4">
              <p className="fw-bold mb-1" style={{ fontSize: 13, color: 'var(--rojo)' }}>{titulo}</p>
              {intro && <p className="text-muted mb-1" style={{ fontSize: 12 }}>{intro}</p>}
              {texto && <p className="text-muted mb-0" style={{ fontSize: 12, lineHeight: 1.7 }}>{texto}</p>}
              {lista && (
                <ul className="text-muted ps-3 mb-0" style={{ fontSize: 12, lineHeight: 1.7 }}>
                  {lista.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}

          <p className="text-center text-muted pb-2" style={{ fontSize: 11 }}>
            © 2026 Ideay — La Quinta. Juigalpa, Chontales, Nicaragua.
          </p>
        </div>

        {/* Botones */}
        <div className="px-4 py-3 d-flex gap-2" style={{ borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <button onClick={onCerrar} className="btn btn-light flex-fill" style={{ borderRadius: 10 }}>
            Cerrar
          </button>
          <button onClick={onAceptar} className="btn-rojo flex-fill" style={{ borderRadius: 10 }}>
            Acepto los términos
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Registro() {
  const navigate = useNavigate()
  const { cargarPerfil } = useAuth()
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', confirmar: '' })
  const [acepta, setAcepta] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [modalTerminos, setModalTerminos] = useState(false)
  const inputFotoRef = useRef(null)

  function seleccionarFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('La foto no puede superar los 2 MB'); return }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.nombre.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres')
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
            <input className="form-check-input" type="checkbox" checked={acepta}
              onChange={e => setAcepta(e.target.checked)} id="terminos" />
            <label className="form-check-label small" htmlFor="terminos">
              Acepto los{' '}
              <button type="button" className="link-rojo border-0 bg-transparent p-0 fw-medium"
                style={{ fontSize: 'inherit', textDecoration: 'underline' }}
                onClick={() => setModalTerminos(true)}>
                términos y condiciones
              </button>
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

      {modalTerminos && (
        <ModalTerminos
          onCerrar={() => setModalTerminos(false)}
          onAceptar={() => { setAcepta(true); setModalTerminos(false) }}
        />
      )}
    </div>
  )
}
