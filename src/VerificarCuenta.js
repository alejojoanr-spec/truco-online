import { useState } from "react";
import { supabase } from "./supabase";
import { PRIVACIDAD_SECCIONES } from "./Privacidad";

const PROVINCIAS = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

const TERMINOS_SECCIONES = [
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

const INPUT = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.5)",
  color: "#ffffff", fontFamily: "'Lato', sans-serif", fontSize: 15,
  outline: "none", boxSizing: "border-box",
};

const LABEL = {
  fontSize: 11, color: "#4ade80", letterSpacing: 2,
  textTransform: "uppercase", marginBottom: 6, display: "block",
};

export default function VerificarCuenta({ perfil, onVerificado, onCerrar }) {
  const [form, setForm] = useState({
    nombre_completo: "",
    fecha_nacimiento: "",
    provincia: "",
    dni: "",
    telefono: "",
    genero: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [recibeNovedades, setRecibeNovedades] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false);
  const [verPrivacidad, setVerPrivacidad] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
  }

  function validar() {
    if (!form.nombre_completo.trim()) return "Ingresá tu nombre y apellido";
    if (!form.fecha_nacimiento) return "Ingresá tu fecha de nacimiento";
    if (!form.provincia) return "Seleccioná tu provincia";
    const dniLimpio = form.dni.replace(/\D/g, "");
    if (!dniLimpio || dniLimpio.length < 7 || dniLimpio.length > 8) return "Ingresá un DNI válido (7 u 8 dígitos)";
    if (!form.telefono.trim()) return "Ingresá tu número de teléfono";
    if (!aceptaTerminos) return "Debés aceptar los términos y condiciones";
    return null;
  }

  async function handleEnviar() {
    const err = validar();
    if (err) { setError(err); return; }
    setCargando(true);
    const updatePayload = {
      is_verified: true,
      provincia: form.provincia || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero || null,
    };
    if (recibeNovedades && !perfil.recibe_novedades) {
      updatePayload.recibe_novedades = true;
    }
    const { error: dbError } = await supabase
      .from("perfiles")
      .update(updatePayload)
      .eq("usuario_id", perfil.usuario_id);
    if (dbError) {
      setError("No se pudo completar la verificación. Intentá de nuevo.");
      setCargando(false);
      return;
    }
    const actualizado = { ...perfil, is_verified: true };
    localStorage.setItem(`truco_perfil_${perfil.usuario_id}`, JSON.stringify(actualizado));
    onVerificado(actualizado);
  }

  return (
    <>
      {/* Formulario de verificación */}
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 60, padding: "16px 16px 32px", overflowY: "auto",
      }}>
        <div style={{
          background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",
          border: "1px solid #2d6a4f", borderRadius: 20, padding: "28px 24px",
          width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 18,
          fontFamily: "'Lato', sans-serif", marginTop: 16,
        }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Argentino</div>
              <div style={{ fontSize: 20, color: "#fbbf24", fontWeight: 900 }}>Verificar cuenta</div>
            </div>
            <button onClick={onCerrar} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid #374151",
              borderRadius: 8, width: 32, height: 32, cursor: "pointer",
              color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
            Completá tu información para habilitar las partidas competitivas. Tus datos están protegidos y no se comparten.
          </div>

          {/* Nombre completo */}
          <div>
            <label style={LABEL}>Nombre y apellido</label>
            <input
              type="text"
              placeholder="ej: Juan Pérez"
              value={form.nombre_completo}
              onChange={e => set("nombre_completo", e.target.value)}
              style={INPUT}
            />
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label style={LABEL}>Fecha de nacimiento</label>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={e => set("fecha_nacimiento", e.target.value)}
              style={{ ...INPUT, colorScheme: "dark" }}
            />
          </div>

          {/* Provincia */}
          <div>
            <label style={LABEL}>Provincia</label>
            <select
              value={form.provincia}
              onChange={e => set("provincia", e.target.value)}
              style={{ ...INPUT, cursor: "pointer" }}
            >
              <option value="">Seleccioná tu provincia</option>
              {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* DNI */}
          <div>
            <label style={LABEL}>DNI</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="ej: 38123456"
              value={form.dni}
              onChange={e => set("dni", e.target.value.replace(/\D/g, "").slice(0, 8))}
              style={INPUT}
            />
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 5 }}>
              Solo para verificación — no se almacena ni se comparte
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label style={LABEL}>Número de teléfono</label>
            <input
              type="tel"
              placeholder="ej: 1123456789"
              value={form.telefono}
              onChange={e => set("telefono", e.target.value)}
              style={INPUT}
            />
          </div>

          {/* Género (opcional) */}
          <div>
            <label style={LABEL}>
              Género{" "}
              <span style={{ color: "#6b7280", textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(opcional)</span>
            </label>
            <select
              value={form.genero}
              onChange={e => set("genero", e.target.value)}
              style={{ ...INPUT, cursor: "pointer" }}
            >
              <option value="">Prefiero no decir</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="no_binario">No binario</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Términos */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={e => { setAceptaTerminos(e.target.checked); setError(""); }}
              style={{ marginTop: 3, accentColor: "#4ade80", width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
              Acepto los{" "}
              <span
                onClick={e => { e.preventDefault(); e.stopPropagation(); setVerTerminos(true); }}
                style={{ color: "#4ade80", textDecoration: "underline", cursor: "pointer" }}
              >
                términos y condiciones
              </span>
              {" "}y autorizo el uso de mis datos para la verificación de identidad. Leé nuestra{" "}
              <span
                onClick={e => { e.preventDefault(); e.stopPropagation(); setVerPrivacidad(true); }}
                style={{ color: "#4ade80", textDecoration: "underline", cursor: "pointer" }}
              >
                Política de Privacidad
              </span>.
            </span>
          </label>

          {/* Novedades opt-in */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={recibeNovedades}
              onChange={e => setRecibeNovedades(e.target.checked)}
              style={{ marginTop: 3, accentColor: "#4ade80", width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
              Quiero recibir novedades y promociones de Truco Argentino{" "}
              <span style={{ color: "#6b7280" }}>(opcional)</span>
            </span>
          </label>

          {/* Error */}
          {error && (
            <div style={{
              color: "#f87171", fontSize: 13, textAlign: "center",
              padding: "10px 12px", borderRadius: 8,
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
            }}>
              {error}
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onCerrar}
              style={{
                flex: 1, padding: "13px", borderRadius: 10, cursor: "pointer",
                background: "rgba(0,0,0,0.4)", border: "1px solid #374151",
                color: "#9ca3af", fontFamily: "'Lato', sans-serif", fontSize: 15, fontWeight: 700,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={cargando}
              style={{
                flex: 2, padding: "13px", borderRadius: 10,
                cursor: cargando ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg,#1a472a,#2d6a4f)",
                border: "1px solid #4ade80", color: "#4ade80",
                fontFamily: "'Lato', sans-serif", fontSize: 15, fontWeight: 700,
                opacity: cargando ? 0.7 : 1,
              }}
            >
              {cargando ? "Verificando..." : "Continuar"}
            </button>
          </div>

        </div>
      </div>

      {/* Modal Términos y Condiciones — encima del formulario */}
      {verPrivacidad && (
        <div
          onClick={() => setVerPrivacidad(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border: "1px solid #2d6a4f", borderRadius: 20, width: "100%", maxWidth: 420, maxHeight: "80vh", display: "flex", flexDirection: "column", fontFamily: "'Lato', sans-serif" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid rgba(45,106,79,0.4)", flexShrink: 0 }}>
              <div style={{ fontSize: 17, color: "#fbbf24", fontWeight: 900 }}>Política de Privacidad</div>
              <button onClick={() => setVerPrivacidad(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #374151", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: "16px 22px 24px", flex: 1 }}>
              <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 16 }}>Última actualización: Mayo de 2026 · Ley N° 25.326</div>
              {PRIVACIDAD_SECCIONES.map((s, i) => (
                <div key={i} style={{ borderBottom: i < PRIVACIDAD_SECCIONES.length - 1 ? "1px solid rgba(45,106,79,0.2)" : "none", paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, color: s.destacado ? "#fbbf24" : "#4ade80" }}>{s.titulo}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7, whiteSpace: "pre-line" }}>{s.texto}</div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", marginTop: 8 }}>Truco Online © 2026. Todos los derechos reservados.</div>
            </div>
          </div>
        </div>
      )}

      {verTerminos && (
        <div
          onClick={() => setVerTerminos(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 70, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",
              border: "1px solid #2d6a4f", borderRadius: 20,
              width: "100%", maxWidth: 420,
              maxHeight: "80vh", display: "flex", flexDirection: "column",
              fontFamily: "'Lato', sans-serif",
            }}
          >
            {/* Header fijo */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px 14px", borderBottom: "1px solid rgba(45,106,79,0.4)",
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 17, color: "#fbbf24", fontWeight: 900 }}>Términos y Condiciones</div>
              <button
                onClick={() => setVerTerminos(false)}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid #374151",
                  borderRadius: 8, width: 32, height: 32, cursor: "pointer",
                  color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >✕</button>
            </div>

            {/* Contenido con scroll interno */}
            <div style={{ overflowY: "auto", padding: "16px 22px 24px", flex: 1 }}>
              {TERMINOS_SECCIONES.map((s, i) => (
                <div key={i} style={{
                  borderBottom: i < TERMINOS_SECCIONES.length - 1 ? "1px solid rgba(45,106,79,0.2)" : "none",
                  paddingBottom: 14, marginBottom: 14,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                    textTransform: "uppercase", marginBottom: 6,
                    color: s.destacado ? "#fbbf24" : "#4ade80",
                  }}>
                    {s.titulo}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {s.texto}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", marginTop: 8 }}>
                Truco Online © 2025. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
