import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function FotoPerfil({ perfil, size = 64, onActualizar }) {
  const [subiendo, setSubiendo] = useState(false)
  const inputRef = useRef()

  const iniciales = `${perfil?.nombre?.[0] || ''}${perfil?.apellido?.[0] || ''}`.toUpperCase()

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setSubiendo(true)
    const ext = archivo.name.split('.').pop()
    const ruta = `${perfil.id}/avatar.${ext}`

    const { error: errUp } = await supabase.storage
      .from('avatars')
      .upload(ruta, archivo, { upsert: true })

    if (!errUp) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(ruta)
      const url = `${data.publicUrl}?t=${Date.now()}`
      await supabase.from('perfiles').update({ foto_url: url }).eq('id', perfil.id)
      onActualizar?.()
    }
    setSubiendo(false)
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {perfil?.foto_url ? (
        <img
          src={perfil.foto_url}
          alt="Avatar"
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          backgroundColor: 'var(--rojo)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: size * 0.35,
        }}>
          {iniciales}
        </div>
      )}

      <button
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.36, height: size * 0.36,
          borderRadius: '50%', border: '2px solid #fff',
          backgroundColor: subiendo ? '#aaa' : 'var(--rojo)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
        }}
      >
        {subiendo
          ? <span className="spinner-border text-white" style={{ width: size * 0.18, height: size * 0.18, borderWidth: 2 }} />
          : <i className="bi bi-camera-fill text-white" style={{ fontSize: size * 0.18 }}></i>
        }
      </button>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }} onChange={handleArchivo} />
    </div>
  )
}
