import { createContext, useContext, useEffect, useState } from 'react'

const TemaContext = createContext(null)

export function TemaProvider({ children }) {
  const [oscuro, setOscuro] = useState(() => localStorage.getItem('ideay_tema') === 'oscuro')

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', oscuro ? 'dark' : 'light')
    document.documentElement.setAttribute('data-tema', oscuro ? 'oscuro' : 'claro')
    localStorage.setItem('ideay_tema', oscuro ? 'oscuro' : 'claro')
  }, [oscuro])

  return (
    <TemaContext.Provider value={{ oscuro, setOscuro }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema() {
  return useContext(TemaContext)
}
