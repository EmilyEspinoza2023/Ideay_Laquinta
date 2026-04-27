import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const R = 6371000 // radio de la Tierra en metros

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function dentroDelHorario(desde, hasta) {
  const ahora = new Date()
  const min = ahora.getHours() * 60 + ahora.getMinutes()
  const [dh, dm] = desde.slice(0, 5).split(':').map(Number)
  const [hh, hm] = hasta.slice(0, 5).split(':').map(Number)
  const d = dh * 60 + dm
  const h = hh * 60 + hm
  // Horario que cruza medianoche (ej: 18:00 → 03:00)
  if (d > h) return min >= d || min <= h
  return min >= d && min <= h
}

// Singleton a nivel de módulo para no registrar múltiples watchers
let watchId = null

export function useGeofencing() {
  useEffect(() => {
    if (watchId !== null) return // ya hay un watcher activo

    async function init() {
      const { data: config } = await supabase
        .from('geofencing_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (!config?.activo) return
      if (!navigator.geolocation) return

      // Pedir permiso de notificaciones
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      watchId = navigator.geolocation.watchPosition(
        pos => {
          // Solo notificar una vez por sesión
          if (sessionStorage.getItem('geo_notif')) return
          if (!dentroDelHorario(config.hora_desde, config.hora_hasta)) return

          const dist = haversine(
            pos.coords.latitude, pos.coords.longitude,
            parseFloat(config.lat), parseFloat(config.lng)
          )

          if (dist <= config.radio_metros) {
            sessionStorage.setItem('geo_notif', '1')
            disparar(config)
          }
        },
        null,
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      )
    }

    init()

    // No limpiamos el watcher al desmontar — queremos que siga activo
    // mientras el cliente navega por la app
  }, [])
}

function disparar(config) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const notif = new Notification('¡Ideay! — La Quinta', {
    body: config.mensaje,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'geofencing-laquinta', // evita duplicados del sistema
  })

  if (config.evento_id) {
    notif.onclick = () => {
      window.focus()
      window.location.href = `/evento/${config.evento_id}`
    }
  }
}
