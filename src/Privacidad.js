export const PRIVACIDAD_SECCIONES = [
  {
    titulo: "Introducción",
    texto: `Esta Política de Privacidad describe cómo Truco Online recopila, utiliza y protege la información personal de sus usuarios, en cumplimiento de la Ley N° 25.326 de Protección de Datos Personales de la República Argentina y su normativa reglamentaria.\n\nAl utilizar la plataforma, el usuario acepta las prácticas descritas en este documento.`,
  },
  {
    titulo: "1. Responsable del tratamiento de datos",
    texto: `Truco Online es responsable del tratamiento de los datos personales recopilados a través de esta plataforma digital.`,
  },
  {
    titulo: "2. Datos que recopilamos",
    texto: `Al registrarte y completar la verificación de identidad, recopilamos los siguientes datos personales:\n\n• Nombre y apellido\n• Fecha de nacimiento\n• Provincia de residencia\n• Número de DNI (solo para validación — no se almacena)\n• Número de teléfono\n• Género (opcional)\n• Dirección de correo electrónico`,
  },
  {
    titulo: "3. Finalidad del tratamiento",
    texto: `Utilizamos tu información personal exclusivamente para:\n\n• Verificar tu identidad y confirmar que sos mayor de 18 años\n• Garantizar la seguridad de la plataforma y prevenir el fraude\n• Habilitar el acceso a funciones competitivas de la app\n• Recuperación y protección de tu cuenta en caso de pérdida de acceso\n• Cumplir con obligaciones legales aplicables`,
  },
  {
    titulo: "4. El DNI no se almacena",
    texto: `El número de DNI ingresado durante el proceso de verificación se utiliza exclusivamente para validar tu identidad en ese momento. No se guarda en nuestra base de datos, no se procesa posteriormente ni se comparte con ningún tercero bajo ninguna circunstancia.`,
    destacado: true,
  },
  {
    titulo: "5. Compartir datos con terceros",
    texto: `Truco Online no vende, alquila ni comparte tus datos personales con terceros con fines comerciales o de cualquier otra índole. Tus datos son utilizados únicamente dentro de la plataforma para los fines descritos en esta política.`,
  },
  {
    titulo: "6. Proveedor de base de datos",
    texto: `Utilizamos Supabase como proveedor de infraestructura de base de datos. Supabase almacena la información en servidores seguros con cifrado en tránsito (TLS) y en reposo, cumpliendo con estándares internacionales de seguridad de la información.`,
  },
  {
    titulo: "7. Tus derechos — Ley 25.326",
    texto: `De acuerdo con la Ley N° 25.326 de Protección de Datos Personales (art. 14 y siguientes), tenés derecho a:\n\n• Acceder gratuitamente a tus datos personales almacenados\n• Rectificar datos inexactos, incompletos o desactualizados\n• Solicitar la supresión (eliminación) de tus datos cuando ya no sean necesarios\n• Oponerte al tratamiento de tus datos en determinadas circunstancias\n\nPara ejercer cualquiera de estos derechos, contactá al soporte desde dentro de la app. La DIRECCIÓN NACIONAL DE PROTECCIÓN DE DATOS PERSONALES es el organismo de control competente para recibir denuncias.`,
    destacado: false,
  },
  {
    titulo: "8. Eliminación de datos",
    texto: `Podés solicitar la eliminación completa de tu cuenta y todos tus datos personales en cualquier momento, contactando al soporte desde la sección correspondiente dentro de la app. Procesaremos tu solicitud dentro de los plazos establecidos por la Ley 25.326.`,
  },
  {
    titulo: "9. Seguridad",
    texto: `Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos personales contra el acceso no autorizado, la alteración, divulgación o destrucción. Sin embargo, ningún sistema es completamente invulnerable y no podemos garantizar seguridad absoluta.`,
  },
  {
    titulo: "10. Modificaciones",
    texto: `Podemos actualizar esta Política de Privacidad en cualquier momento. Te notificaremos sobre cambios significativos a través de la plataforma. El uso continuado de Truco Online después de la publicación de modificaciones implica la aceptación de la política vigente.`,
  },
];

export default function Privacidad({ onVolver }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",
      fontFamily: "'Lato', sans-serif", color: "#e2f5e9",
    }}>
      {/* Header sticky */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 16px", borderBottom: "1px solid rgba(45,106,79,0.4)",
        position: "sticky", top: 0,
        background: "rgba(5,15,8,0.96)", backdropFilter: "blur(8px)", zIndex: 10,
      }}>
        <button
          onClick={onVolver}
          style={{
            background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f",
            borderRadius: 8, padding: "7px 13px", color: "#4ade80",
            fontSize: 13, cursor: "pointer", fontFamily: "'Lato',sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver
        </button>
        <div>
          <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Online</div>
          <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900 }}>Política de Privacidad</div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 48px" }}>

        <div style={{
          background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 24,
          fontSize: 12, color: "#4ade80",
        }}>
          Última actualización: Mayo de 2026 · Ley N° 25.326 — Argentina
        </div>

        {PRIVACIDAD_SECCIONES.map((s, i) => (
          <div key={i} style={{
            borderBottom: i < PRIVACIDAD_SECCIONES.length - 1 ? "1px solid rgba(45,106,79,0.2)" : "none",
            paddingBottom: 18, marginBottom: 18,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
              textTransform: "uppercase", marginBottom: 8,
              color: s.destacado ? "#fbbf24" : "#4ade80",
            }}>
              {s.titulo}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.75, whiteSpace: "pre-line" }}>
              {s.texto}
            </div>
          </div>
        ))}

        <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", marginTop: 16 }}>
          Truco Online © 2026 · Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}
