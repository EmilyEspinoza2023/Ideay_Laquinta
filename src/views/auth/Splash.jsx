import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

export default function Splash() {
  const navigate = useNavigate()
  const { usuario, perfil, cargando } = useAuth()

  useEffect(() => {
    if (cargando) return

    if (usuario) {
      navigate(perfil?.rol === 'admin' ? '/admin/dashboard' : '/inicio', { replace: true })
      return
    }

    // Solo clientes sin sesión ven la animación de bienvenida
    const t = setTimeout(() => navigate('/login', { replace: true }), 2000)
    return () => clearTimeout(t)
  }, [usuario, perfil, cargando])

  // Mientras verifica sesión: spinner neutro
  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F0EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border" style={{ color: 'var(--rojo)', width: 40, height: 40 }} />
      </div>
    )
  }

  // Sin sesión: pantalla de bienvenida para clientes
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 180, height: 180, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', marginBottom: 32 }}>
        <img src={logo} alt="Ideay" style={{ width: 130 }} />
      </div>
      <p style={{ color: '#D4AF37', fontSize: 14, marginBottom: 6 }}>Juigalpa, Chontales</p>
      <p style={{ color: 'var(--rojo)', fontSize: 18 }}>La experiencia que merecés</p>
      <div style={{ width: 40, height: 4, background: 'var(--rojo)', borderRadius: 2, marginTop: 20 }} />
    </div>
  )
}
