import { useState } from "react";
import { supabase } from "./supabase";

const REGEX = /^[a-zA-Z0-9.]{4,13}$/;

function validar(nombre) {
  if (nombre.length < 4)  return "Debe tener al menos 4 caracteres";
  if (nombre.length > 13) return "Debe tener como máximo 13 caracteres";
  if (!REGEX.test(nombre)) return "Solo letras, números o puntos. Sin espacios ni caracteres especiales";
  return null;
}

function Regla({ cumple, texto }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12, color: cumple ? "#4ade80" : "#6b7280", transition:"color 0.2s" }}>
      <span style={{ fontSize:14, lineHeight:1.3, flexShrink:0 }}>{cumple ? "✅" : "⬜"}</span>
      <span>{texto}</span>
    </div>
  );
}

export default function ElegirNombre({ user, onPerfilCreado }) {
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cumpleLongitud = nombre.length >= 4 && nombre.length <= 13;
  const cumpleCaracteres = nombre.length > 0 && /^[a-zA-Z0-9.]+$/.test(nombre);

  async function handleGuardar() {
    const err = validar(nombre);
    if (err) { setError(err); return; }
    setCargando(true);
    setError("");
    const recibeNovedades = localStorage.getItem("truco_mkt_pending") === "1";
    localStorage.removeItem("truco_mkt_pending");
    const { data, error: dbError } = await supabase
      .from("perfiles")
      .insert({ usuario_id: user.id, nombre, email: user.email, partidas_jugadas: 0, partidas_ganadas: 0, recibe_novedades: recibeNovedades })
      .select()
      .single();
    if (dbError) {
      setError("❌ No se pudo guardar. Intentá de nuevo.");
      setCargando(false);
      return;
    }
    onPerfilCreado(data);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Georgia, serif", padding: "16px",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.82)", border: "1px solid #2d6a4f",
        borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 360,
        display: "flex", flexDirection: "column", gap: 20,
        backdropFilter: "blur(8px)",
      }}>

        {/* Encabezado */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
          <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Argentino</div>
          <div style={{ fontSize: 24, color: "#fbbf24", fontWeight: 900, marginTop: 4 }}>Crea tu usuario</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>
            Elegí el nombre con el que te van a ver los demás jugadores
          </div>
        </div>

        {/* Input */}
        <div>
          <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Usuario
          </div>
          <input
            type="text"
            placeholder="ej: Maradona.10"
            value={nombre}
            maxLength={13}
            onChange={(e) => { setNombre(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
            style={{
              width: "100%", padding: "13px 14px", borderRadius: 10,
              border: `1px solid ${error ? "#f87171" : "#2d6a4f"}`,
              background: "rgba(0,0,0,0.5)", color: "#ffffff",
              fontFamily: "Georgia, serif", fontSize: 16,
              outline: "none", boxSizing: "border-box", letterSpacing: 0.5,
            }}
          />
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
            <span style={{ fontSize:10, color: nombre.length > 13 ? "#f87171" : "#4b5563" }}>
              {nombre.length}/13
            </span>
          </div>
        </div>

        {/* Reglas */}
        <div style={{
          background: "rgba(0,0,0,0.3)", border: "1px solid rgba(45,106,79,0.3)",
          borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
        }}>
          <Regla
            cumple={cumpleLongitud}
            texto="Debe tener entre 4 y 13 caracteres"
          />
          <Regla
            cumple={cumpleCaracteres}
            texto="Solo letras, números o puntos. No puede contener espacios, guiones o caracteres especiales"
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: "#f87171", fontSize: 12, textAlign: "center", padding: "8px", borderRadius: 8, background: "rgba(0,0,0,0.3)" }}>
            {error}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleGuardar}
          disabled={cargando}
          style={{
            padding: "14px", borderRadius: 10, cursor: cargando ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#1a472a,#2d6a4f)",
            border: "1px solid #4ade80", color: "#4ade80",
            fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, letterSpacing: 1,
            opacity: cargando ? 0.7 : 1,
          }}
        >
          {cargando ? "⏳ Guardando..." : "✅ Guardar"}
        </button>

      </div>
    </div>
  );
}
