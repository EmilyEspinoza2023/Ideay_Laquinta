import { useNavigate } from 'react-router-dom'
import NavCliente from '../../components/navegacion/NavCliente'
import logo from '../../assets/logo.png'

export default function AcercaDe() {
  const navigate = useNavigate()

  return (
    <div className="page-cliente">
      <NavCliente />
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: 600 }}>
        <div className="pt-4 pb-3 d-flex align-items-center gap-2">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left" style={{ fontSize: 16 }}></i>
          </button>
          <h4 className="fw-bold mb-0">Acerca de Ideay</h4>
        </div>

        {/* Logo y versión */}
        <div className="text-center mb-4">
          <img src={logo} alt="Ideay" style={{ height: 80, borderRadius: 16, marginBottom: 12 }} />
          <h5 className="fw-bold mb-0" style={{ color: 'var(--rojo)' }}>¡Ideay!</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Versión 1.0.0</p>
        </div>

        {/* Sobre la app */}
        <div className="card-ideay p-4 mb-3">
          <h6 className="fw-bold mb-2">¿Qué es Ideay?</h6>
          <p className="text-muted mb-0" style={{ fontSize: 14, lineHeight: 1.7 }}>
            Ideay es la aplicación oficial de <strong>Discoteca La Quinta</strong>, Juigalpa, Chontales.
            Fue creada para que los clientes puedan descubrir eventos, reservar mesas, comprar entradas
            y mantenerse conectados con todo lo que pasa en La Quinta — directamente desde su celular.
          </p>
        </div>

        {/* Características */}
        <div className="card-ideay p-4 mb-3">
          <h6 className="fw-bold mb-3">¿Qué podés hacer?</h6>
          <div className="d-flex flex-column gap-3">
            {[
              { icon: 'bi-calendar-event', texto: 'Ver y explorar todos los eventos de La Quinta' },
              { icon: 'bi-ticket-perforated', texto: 'Comprar entradas de forma rápida y segura' },
              { icon: 'bi-bookmark-check', texto: 'Reservar mesas para vos y tus amigos' },
              { icon: 'bi-chat-dots', texto: 'Chatear directamente con el equipo de La Quinta' },
              { icon: 'bi-star', texto: 'Calificar y comentar los eventos que viviste' },
              { icon: 'bi-heart', texto: 'Guardar tus eventos favoritos' },
              { icon: 'bi-geo-alt', texto: 'Recibir alertas cuando estés cerca de La Quinta' },
            ].map(({ icon, texto }) => (
              <div key={icon} className="d-flex align-items-center gap-3">
                <div style={{ width: 36, height: 36, background: 'var(--rojo-claro)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${icon}`} style={{ color: 'var(--rojo)', fontSize: 16 }}></i>
                </div>
                <p className="mb-0 text-muted" style={{ fontSize: 13 }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desarrolladora */}
        <div className="card-ideay p-4 mb-3">
          <h6 className="fw-bold mb-3">Desarrolladora</h6>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 50, height: 50, background: 'var(--rojo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
              EE
            </div>
            <div>
              <p className="fw-bold mb-0" style={{ fontSize: 15 }}>Emily Espinoza</p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>Desarrolladora de Software</p>
            </div>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: 13, lineHeight: 1.7 }}>
            Estudiante de Ingeniería en Sistemas de Información en la
            <strong> UNAN-CUR Chontales</strong>, Juigalpa, Nicaragua.
            Apasionada por el desarrollo de aplicaciones móviles y web que resuelven
            necesidades reales en su comunidad.
          </p>
        </div>

        {/* Contacto */}
        <div className="card-ideay p-4 mb-4">
          <h6 className="fw-bold mb-2">Contacto</h6>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-envelope" style={{ color: 'var(--rojo)', fontSize: 15 }}></i>
              <span className="text-muted" style={{ fontSize: 13 }}>codeartbyemile@gmail.com</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt" style={{ color: 'var(--rojo)', fontSize: 15 }}></i>
              <span className="text-muted" style={{ fontSize: 13 }}>Juigalpa, Chontales, Nicaragua</span>
            </div>
          </div>
        </div>

        <p className="text-center text-muted pb-4" style={{ fontSize: 11 }}>
          © 2026 Ideay — La Quinta. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
