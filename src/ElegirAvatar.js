import { useState } from "react";
import { supabase } from "./supabase";
import { AVATARES, avatarSrc } from "./avatares";

export default function ElegirAvatar({ perfil, onAvatarGuardado }) {
  const [seleccionado, setSeleccionado] = useState(AVATARES[0]);
  const [cargando, setCargando] = useState(false);

  async function handleGuardar() {
    setCargando(true);
    await supabase.from("perfiles").update({ avatar: seleccionado }).eq("usuario_id", perfil.usuario_id);
    const perfilActualizado = { ...perfil, avatar: seleccionado };
    localStorage.setItem(`truco_avatar_${perfil.usuario_id}`, seleccionado);
    localStorage.setItem(`truco_perfil_${perfil.usuario_id}`, JSON.stringify(perfilActualizado));
    onAvatarGuardado(perfilActualizado);
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
        borderRadius: 20, padding: "36px 28px", width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
        backdropFilter: "blur(8px)",
      }}>

        {/* Encabezado */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Argentino</div>
          <div style={{ fontSize: 22, color: "#fbbf24", fontWeight: 900, marginTop: 4 }}>Elegí tu avatar</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, lineHeight: 1.6 }}>
            Hola <span style={{ color: "#4ade80" }}>{perfil.nombre}</span>, ¿con qué cara jugás?
          </div>
        </div>

        {/* Avatar seleccionado grande */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: "radial-gradient(circle,#1a472a,#050f08)",
          border: "2px solid #4ade80",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 0 24px rgba(74,222,128,0.25)",
          transition: "all 0.2s",
        }}>
          <img src={avatarSrc(seleccionado)} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Grilla de avatares */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8,
          width: "100%",
        }}>
          {AVATARES.map((av) => (
            <button
              key={av}
              onClick={() => setSeleccionado(av)}
              style={{
                padding: "6px", borderRadius: 12, cursor: "pointer",
                background: seleccionado === av ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.3)",
                border: seleccionado === av ? "2px solid #4ade80" : "2px solid rgba(45,106,79,0.3)",
                transition: "all 0.15s",
                transform: seleccionado === av ? "scale(1.1)" : "scale(1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <img src={avatarSrc(av)} alt="avatar" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>

        {/* Botón */}
        <button
          onClick={handleGuardar}
          disabled={cargando}
          style={{
            width: "100%", padding: "14px", borderRadius: 10, cursor: cargando ? "not-allowed" : "pointer",
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
