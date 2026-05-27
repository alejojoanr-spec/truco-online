export default function Terminos({ onVolver }) {
  const secciones = [
    {
      titulo: "1. Registro como suscriptor, términos aplicables y cuenta",
      texto: `Al completar el registro de una cuenta de TRUCO ONLINE, el usuario ("EL SUSCRIPTOR") acepta los presentes términos y condiciones.\n\nNo está permitido registrarse a menores de 18 años. TRUCO ONLINE no está diseñado para menores de edad y no recopilará deliberadamente información personal de menores.\n\nA. Cuenta del usuario: Al registrarse se creará una cuenta asociada al usuario. Solo se permite una cuenta por usuario. La cuenta es personal, nominativa e intransferible. El usuario es responsable de mantener la confidencialidad de su contraseña, proteger el acceso a su cuenta, y toda actividad realizada desde ella. Queda prohibido vender, transferir, compartir, alquilar o permitir que terceros utilicen la cuenta.`,
    },
    {
      titulo: "2. Uso del servicio",
      texto: `TRUCO ONLINE concede al usuario una licencia limitada, personal y no comercial para utilizar el juego y sus servicios. El usuario no podrá copiar, modificar, distribuir, descompilar, hacer ingeniería inversa, explotar comercialmente ni alterar el funcionamiento del juego. Tampoco podrá utilizar hacks, bots, automatizaciones, trampas o software externo no autorizado.`,
    },
    {
      titulo: "3. Saldo y pagos",
      texto: `Todos los pagos realizados dentro de TRUCO ONLINE son anticipados y finales. Para cargar saldo, el usuario deberá utilizar los medios de pago habilitados dentro de la plataforma.`,
    },
    {
      titulo: "4. Reembolsos",
      texto: `El usuario podrá solicitar reembolsos únicamente en los casos permitidos por la política vigente. Las solicitudes deberán realizarse por correo electrónico. El plazo estimado para procesar un reembolso aprobado será de hasta 72 horas hábiles.`,
    },
    {
      titulo: "5. Sitios y servicios de terceros",
      texto: `TRUCO ONLINE puede contener enlaces o integraciones con servicios de terceros. TRUCO ONLINE no controla ni garantiza disponibilidad, funcionamiento ni seguridad de esos servicios externos.`,
    },
    {
      titulo: "6. Conducta del usuario y juego limpio",
      texto: `El usuario acepta mantener una conducta respetuosa. Queda prohibido realizar fraude, manipular partidas, utilizar trampas, acosar usuarios, suplantar identidad o afectar el funcionamiento del servicio. TRUCO ONLINE podrá suspender o bloquear cuentas permanentemente.`,
      destacado: true,
    },
    {
      titulo: "7. Contenido generado por el usuario",
      texto: `El usuario conserva los derechos sobre el contenido que genere. Al publicarlo dentro de la plataforma concede autorización no exclusiva para mostrarlo, distribuirlo y utilizarlo dentro del funcionamiento y promoción del servicio.`,
    },
    {
      titulo: "8. Renuncias de garantía",
      texto: `TRUCO ONLINE se proporciona "tal cual". No se garantiza disponibilidad permanente, ausencia de errores ni funcionamiento ininterrumpido. El usuario utiliza el servicio bajo su propia responsabilidad.`,
    },
    {
      titulo: "9. Limitación de responsabilidad",
      texto: `TRUCO ONLINE no será responsable por pérdidas económicas, pérdida de datos, interrupciones, daños indirectos ni perjuicios derivados del uso del servicio.`,
    },
    {
      titulo: "10. Vigencia y finalización",
      texto: `Estos términos permanecerán vigentes mientras el usuario utilice TRUCO ONLINE. La cancelación de una cuenta no implica devolución automática de pagos ni de saldo utilizado.`,
    },
    {
      titulo: "11. Modificaciones",
      texto: `TRUCO ONLINE podrá modificar estos términos en cualquier momento. El uso continuado de la plataforma implica la aceptación de las modificaciones.`,
    },
    {
      titulo: "12. Contacto",
      texto: `Para consultas relacionadas con soporte, reembolsos o cuenta de usuario, el usuario podrá comunicarse mediante los canales oficiales informados dentro de la plataforma.`,
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",
      padding: "32px 16px 48px",
      fontFamily: "'Lato', sans-serif",
      color: "#e2f5e9",
      boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Botón volver */}
        <button
          onClick={onVolver}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f",
            borderRadius: 8, padding: "8px 16px", color: "#4ade80",
            fontSize: 13, cursor: "pointer", fontFamily: "'Lato', sans-serif",
            marginBottom: 32,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>

        {/* Encabezado */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 4, textTransform: "uppercase", marginBottom: 6 }}>Truco Online</div>
          <div style={{ fontSize: 26, color: "#fbbf24", fontWeight: 900, lineHeight: 1.1 }}>Términos y Condiciones</div>
          <div style={{ width: 48, height: 2, background: "#2d6a4f", margin: "16px auto 0" }} />
        </div>

        {/* Secciones */}
        {secciones.map((s, i) => (
          <div key={i} style={{
            background: "rgba(0,0,0,0.35)",
            border: `1px solid ${s.destacado ? "rgba(251,191,36,0.3)" : "#2d6a4f"}`,
            borderRadius: 12, padding: "20px 22px", marginBottom: 12,
          }}>
            <div style={{
              fontSize: 11, color: s.destacado ? "#fbbf24" : "#4ade80",
              textTransform: "uppercase", letterSpacing: 2, fontWeight: 800, marginBottom: 10,
            }}>
              {s.titulo}
            </div>
            <div style={{
              fontSize: 13, color: "#9ca3af", lineHeight: 1.75,
              whiteSpace: "pre-line",
            }}>
              {s.texto}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 16px 0", borderTop: "1px solid #2d6a4f", marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#4b5563" }}>Truco Online © 2025. Todos los derechos reservados.</div>
        </div>

      </div>
    </div>
  );
}
