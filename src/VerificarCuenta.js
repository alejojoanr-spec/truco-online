import { useState } from "react";
import { supabase } from "./supabase";
import Terminos from "./Terminos";

const PROVINCIAS = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
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
  const [verTerminos, setVerTerminos] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (verTerminos) return <Terminos onVolver={() => setVerTerminos(false)} />;

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
    const { error: dbError } = await supabase
      .from("perfiles")
      .update({ is_verified: true })
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
              onClick={(e) => { e.preventDefault(); setVerTerminos(true); }}
              style={{ color: "#4ade80", textDecoration: "underline", cursor: "pointer" }}
            >
              términos y condiciones
            </span>
            {" "}y autorizo el uso de mis datos para la verificación de identidad.
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
  );
}
