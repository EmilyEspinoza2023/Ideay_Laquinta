import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import LayoutAdmin from '../../components/admin/LayoutAdmin'
import FotoPerfil from '../../components/comunes/FotoPerfil'

export default function PerfilAdmin() {
  const { perfil, cargarPerfil } = useAuth()
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', telefono: '', bio: '' })
  const [contrasenas, setContrasenas] = useState({ actual: '', nueva: '', confirmar: '' })
  const [guardando, setGuardando] = useState(false)
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (perfil) {
      setForm({
        nombre: perfil.nombre || '',
        apellido: perfil.apellido || '',
        correo: perfil.correo || '',
        telefono: perfil.telefono || '',
        bio: perfil.bio || '',
      })
    }
  }, [perfil])

  async function guardarPerfil(e) {
    e.preventDefault()
    setGuardando(true); setOk(''); setError('')
    const { error: err } = await supabase.from('perfiles').update({
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      bio: form.bio,
    }).eq('id', perfil.id)
    if (err) setError(err.message)
    else { setOk('Perfil actualizado correctamente'); if (cargarPerfil) cargarPerfil(perfil.id) }
    setGuardando(false)
  }

  async function cambiarContrasena(e) {
    e.preventDefault()
    if (contrasenas.nueva !== contrasenas.confirmar) { setError('Las contraseñas no coinciden'); return }
    if (contrasenas.nueva.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setGuardandoPass(true); setOk(''); setError('')
    const { error: err } = await supabase.auth.updateUser({ password: contrasenas.nueva })
    if (err) setError(err.message)
    else { setOk('Contraseña actualizada'); setContrasenas({ actual: '', nueva: '', confirmar: '' }) }
    setGuardandoPass(false)
  }

  return (
    <LayoutAdmin titulo="Mi Perfil">
      {ok && <div className="alert alert-success mb-4"><i className="bi bi-check-circle me-2"></i>{ok}</div>}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="row g-4">
        {/* Info personal */}
        <div className="col-lg-7">
          <div className="card-ideay p-4 mb-4">
            {/* Avatar */}
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <FotoPerfil perfil={perfil} size={72} onActualizar={() => cargarPerfil(perfil.id)} />
              <div>
                <h5 className="fw-bold mb-0">{form.nombre} {form.apellido}</h5>
                <span className="badge" style={{ backgroundColor: 'var(--rojo-claro)', color: 'var(--rojo)' }}>Administrador</span>
              </div>
            </div>

            <h6 className="fw-bold mb-3">Información personal</h6>
            <form onSubmit={guardarPerfil} className="d-flex flex-column gap-3">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label small fw-medium text-muted">Nombre</label>
                  <input type="text" className="form-control" value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-medium text-muted">Apellido</label>
                  <input type="text" className="form-control" value={form.apellido}
                    onChange={e => setForm({ ...form, apellido: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label small fw-medium text-muted">Correo electrónico</label>
                <input type="email" className="form-control" value={form.correo} disabled style={{ backgroundColor: '#f8f9fa' }} />
                <small className="text-muted">El correo no se puede cambiar</small>
              </div>
              <div>
                <label className="form-label small fw-medium text-muted">Teléfono</label>
                <input type="tel" className="form-control" placeholder="+505 8xxx-xxxx" value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div>
                <label className="form-label small fw-medium text-muted">Bio</label>
                <textarea className="form-control" rows={2} placeholder="Breve descripción..." value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'none' }} />
              </div>
              <button type="submit" className="btn fw-semibold align-self-start px-4" style={{ backgroundColor: 'var(--rojo)', color: '#fff', borderRadius: 10 }} disabled={guardando}>
                {guardando ? <span className="spinner-border spinner-border-sm" /> : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="col-lg-5">
          <div className="card-ideay p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-shield-lock me-2" style={{ color: 'var(--rojo)' }}></i>
              Cambiar contraseña
            </h6>
            <form onSubmit={cambiarContrasena} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small fw-medium text-muted">Contraseña nueva</label>
                <input type="password" className="form-control" placeholder="••••••••"
                  value={contrasenas.nueva} onChange={e => setContrasenas({ ...contrasenas, nueva: e.target.value })} required />
              </div>
              <div>
                <label className="form-label small fw-medium text-muted">Confirmar contraseña nueva</label>
                <input type="password" className="form-control" placeholder="••••••••"
                  value={contrasenas.confirmar} onChange={e => setContrasenas({ ...contrasenas, confirmar: e.target.value })} required />
              </div>
              <button type="submit" className="btn-rojo-outline" disabled={guardandoPass}>
                {guardandoPass ? <span className="spinner-border spinner-border-sm" /> : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </LayoutAdmin>
  )
}
