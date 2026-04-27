import { useNavigate } from 'react-router-dom'
import NavCliente from '../../components/navegacion/NavCliente'

function Seccion({ titulo, children }) {
  return (
    <div className="card-ideay p-4 mb-3">
      <h6 className="fw-bold mb-2" style={{ color: 'var(--rojo)' }}>{titulo}</h6>
      <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.75 }}>{children}</div>
    </div>
  )
}

export default function TerminosCondiciones() {
  const navigate = useNavigate()

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 600 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Términos y Condiciones</h4>
        </div>

        <p className="text-muted mb-4" style={{ fontSize: 12 }}>
          Última actualización: enero 2026
        </p>

        <Seccion titulo="1. Aceptación de los términos">
          Al crear una cuenta y usar la aplicación <strong>Ideay</strong>, aceptás estos términos y condiciones en su totalidad.
          Si no estás de acuerdo con alguno de ellos, por favor no uses la aplicación.
        </Seccion>

        <Seccion titulo="2. Uso de la aplicación">
          <p className="mb-2">Ideay es una plataforma exclusiva para clientes de <strong>Discoteca La Quinta</strong>, Juigalpa, Nicaragua. Podés usarla para:</p>
          <ul className="mb-0 ps-3">
            <li>Consultar y asistir a eventos</li>
            <li>Comprar entradas y reservar mesas</li>
            <li>Comunicarte con el equipo de La Quinta</li>
            <li>Dejar comentarios y calificaciones sobre los eventos</li>
          </ul>
        </Seccion>

        <Seccion titulo="3. Registro y cuenta">
          Para usar Ideay debés registrarte con información verídica. Sos responsable de mantener la confidencialidad de tu contraseña.
          La Quinta se reserva el derecho de suspender cuentas que incumplan estas condiciones.
        </Seccion>

        <Seccion titulo="4. Compras y reservas">
          <p className="mb-2">Al comprar una entrada o reservar una mesa:</p>
          <ul className="mb-0 ps-3">
            <li>Las compras son definitivas. No se realizan reembolsos salvo cancelación del evento por parte de La Quinta.</li>
            <li>Las reservas de mesas tienen un tiempo de expiración. Si no se confirma antes de ese tiempo, la reserva se libera automáticamente.</li>
            <li>La Quinta puede modificar o cancelar eventos por causas de fuerza mayor.</li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Comportamiento en la plataforma">
          Está prohibido publicar comentarios ofensivos, discriminatorios o falsos.
          La Quinta se reserva el derecho de eliminar cualquier contenido que considere inapropiado
          y de suspender la cuenta del usuario responsable.
        </Seccion>

        <Seccion titulo="6. Privacidad y datos">
          Los datos que proporcionás (nombre, correo, foto de perfil) se usan únicamente para el funcionamiento
          de la aplicación. No compartimos tu información personal con terceros.
          Tu ubicación solo se usa para las alertas de proximidad y nunca se almacena en nuestros servidores.
        </Seccion>

        <Seccion titulo="7. Notificaciones">
          Al aceptar los permisos de notificación, podés recibir alertas sobre eventos, reservas y
          mensajes del equipo de La Quinta. Podés desactivarlas en cualquier momento desde Configuración.
        </Seccion>

        <Seccion titulo="8. Modificaciones">
          La Quinta puede actualizar estos términos en cualquier momento. Te notificaremos los cambios
          importantes a través de la aplicación. El uso continuado de Ideay implica la aceptación de los nuevos términos.
        </Seccion>

        <Seccion titulo="9. Contacto">
          Si tenés dudas sobre estos términos, podés escribirnos a través del chat de la aplicación
          o al correo <strong>codeartbyemile@gmail.com</strong>.
        </Seccion>

        <p className="text-center text-muted pb-4" style={{ fontSize: 11 }}>
          © 2026 Ideay — La Quinta. Juigalpa, Chontales, Nicaragua.
        </p>
      </div>
    </div>
  )
}
