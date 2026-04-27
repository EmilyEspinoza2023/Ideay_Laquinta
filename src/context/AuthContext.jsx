import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [esInvitado, setEsInvitado] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else setCargando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
      if (session?.user) { setCargando(true); cargarPerfil(session.user.id) }
      else { setPerfil(null); setCargando(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(userId) {
    try {
      const { data } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()
      setPerfil(data)
    } finally {
      setCargando(false)
    }
  }

  async function cerrarSesion() {
    setEsInvitado(false)
    await supabase.auth.signOut()
  }

  function entrarComoInvitado() {
    setEsInvitado(true)
    setCargando(false)
  }

  return (
    <AuthContext.Provider value={{ usuario, perfil, cargando, cerrarSesion, cargarPerfil, esInvitado, entrarComoInvitado }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
