import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TemaProvider } from './context/TemaContext'
import RutaProtegida from './components/rutas/RutaProtegida'

// Auth
import Splash from './views/auth/Splash'
import Login from './views/auth/Login'
import Registro from './views/auth/Registro'
import RecuperarContrasena from './views/auth/RecuperarContrasena'

// Cliente
import Inicio from './views/cliente/Inicio'
import Explorar from './views/cliente/Explorar'
import DetalleEvento from './views/cliente/DetalleEvento'
import SeleccionarEntradas from './views/cliente/SeleccionarEntradas'
import PagoSeguro from './views/cliente/PagoSeguro'
import CompraExitosa from './views/cliente/CompraExitosa'
import MisTickets from './views/cliente/MisTickets'
import ReservarMesa from './views/cliente/ReservarMesa'
import MesaReservada from './views/cliente/MesaReservada'
import MisReservas from './views/cliente/MisReservas'
import Chat from './views/cliente/Chat'
import Perfil from './views/cliente/Perfil'
import Favoritos from './views/cliente/Favoritos'
import Notificaciones from './views/cliente/Notificaciones'
import Configuracion from './views/cliente/Configuracion'
import CambiarContrasena from './views/cliente/CambiarContrasena'
import AcercaDe from './views/cliente/AcercaDe'
import TerminosCondiciones from './views/cliente/TerminosCondiciones'

// Admin
import Dashboard from './views/admin/Dashboard'
import AdminEventos from './views/admin/AdminEventos'
import CrearEvento from './views/admin/CrearEvento'
import AdminReservas from './views/admin/AdminReservas'
import AdminChat from './views/admin/AdminChat'
import AdminStats from './views/admin/AdminStats'
import GestionMesas from './views/admin/GestionMesas'
import Geofencing from './views/admin/Geofencing'
import PerfilAdmin from './views/admin/PerfilAdmin'
import AdminComentarios from './views/admin/AdminComentarios'
import AdminTickets from './views/admin/AdminTickets'
import NotificacionesAdmin from './views/admin/NotificacionesAdmin'

export default function App() {
  return (
    <BrowserRouter>
      <TemaProvider>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<RecuperarContrasena />} />

          {/* Cliente */}
          <Route path="/inicio" element={<RutaProtegida permitirInvitado><Inicio /></RutaProtegida>} />
          <Route path="/explorar" element={<RutaProtegida permitirInvitado><Explorar /></RutaProtegida>} />
          <Route path="/evento/:id" element={<RutaProtegida permitirInvitado><DetalleEvento /></RutaProtegida>} />
          <Route path="/evento/:id/entradas" element={<RutaProtegida><SeleccionarEntradas /></RutaProtegida>} />
          <Route path="/evento/:id/pago" element={<RutaProtegida><PagoSeguro /></RutaProtegida>} />
          <Route path="/evento/:id/compra-exitosa" element={<RutaProtegida><CompraExitosa /></RutaProtegida>} />
          <Route path="/mis-tickets" element={<RutaProtegida><MisTickets /></RutaProtegida>} />
          <Route path="/evento/:id/reservar" element={<RutaProtegida><ReservarMesa /></RutaProtegida>} />
          <Route path="/evento/:id/mesa-reservada" element={<RutaProtegida><MesaReservada /></RutaProtegida>} />
          <Route path="/reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />
          <Route path="/chat" element={<RutaProtegida><Chat /></RutaProtegida>} />
          <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
          <Route path="/favoritos" element={<RutaProtegida><Favoritos /></RutaProtegida>} />
          <Route path="/notificaciones" element={<RutaProtegida><Notificaciones /></RutaProtegida>} />
          <Route path="/configuracion" element={<RutaProtegida><Configuracion /></RutaProtegida>} />
          <Route path="/cambiar-contrasena" element={<RutaProtegida><CambiarContrasena /></RutaProtegida>} />
          <Route path="/acerca-de" element={<RutaProtegida><AcercaDe /></RutaProtegida>} />
          <Route path="/terminos" element={<RutaProtegida><TerminosCondiciones /></RutaProtegida>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<RutaProtegida soloAdmin><Dashboard /></RutaProtegida>} />
          <Route path="/admin/eventos" element={<RutaProtegida soloAdmin><AdminEventos /></RutaProtegida>} />
          <Route path="/admin/eventos/crear" element={<RutaProtegida soloAdmin><CrearEvento /></RutaProtegida>} />
          <Route path="/admin/eventos/editar/:id" element={<RutaProtegida soloAdmin><CrearEvento /></RutaProtegida>} />
          <Route path="/admin/reservas" element={<RutaProtegida soloAdmin><AdminReservas /></RutaProtegida>} />
          <Route path="/admin/chat" element={<RutaProtegida soloAdmin><AdminChat /></RutaProtegida>} />
          <Route path="/admin/stats" element={<RutaProtegida soloAdmin><AdminStats /></RutaProtegida>} />
          <Route path="/admin/mesas" element={<RutaProtegida soloAdmin><GestionMesas /></RutaProtegida>} />
          <Route path="/admin/geofencing" element={<RutaProtegida soloAdmin><Geofencing /></RutaProtegida>} />
          <Route path="/admin/perfil" element={<RutaProtegida soloAdmin><PerfilAdmin /></RutaProtegida>} />
          <Route path="/admin/comentarios" element={<RutaProtegida soloAdmin><AdminComentarios /></RutaProtegida>} />
          <Route path="/admin/tickets" element={<RutaProtegida soloAdmin><AdminTickets /></RutaProtegida>} />
          <Route path="/admin/notificaciones" element={<RutaProtegida soloAdmin><NotificacionesAdmin /></RutaProtegida>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </TemaProvider>
    </BrowserRouter>
  )
}
