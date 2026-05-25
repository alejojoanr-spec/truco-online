import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit() {
    setCargando(true);
    setMensaje("");
    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMensaje("❌ " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMensaje("❌ " + error.message);
      else setMensaje("✅ Revisá tu email para confirmar el registro");
    }
    setCargando(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center, #1a472a 0%, #0a2414 50%, #050f08 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Georgia, serif",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.6)",
        border: "1px solid #2d6a4f",
        borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco</div>
          <div style={{ fontSize: 32, color: "#fbbf24", fontWeight: 900 }}>Argentino</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setModo("login")} style={{
            flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer",
            background: modo === "login" ? "#1a472a" : "transparent",
            border: "1px solid #2d6a4f", color: modo === "login" ? "#4ade80" : "#6b7280",
            fontFamily: "Georgia",
          }}>Ingresar</button>
          <button onClick={() => setModo("registro")} style={{
            flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer",
            background: modo === "registro" ? "#1a472a" : "transparent",
            border: "1px solid #2d6a4f", color: modo === "registro" ? "#4ade80" : "#6b7280",
            fontFamily: "Georgia",
          }}>Registrarse</button>
        </div>

        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 8, border: "1px solid #2d6a4f",
            background: "rgba(0,0,0,0.4)", color: "#e2f5e9", fontFamily: "Georgia",
            fontSize: 14, outline: "none",
          }}
        />
        <input
          type="password" placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 8, border: "1px solid #2d6a4f",
            background: "rgba(0,0,0,0.4)", color: "#e2f5e9", fontFamily: "Georgia",
            fontSize: 14, outline: "none",
          }}
        />

        <button onClick={handleSubmit} disabled={cargando} style={{
          padding: "12px", borderRadius: 8, cursor: "pointer",
          background: "#1a472a", border: "1px solid #4ade80",
          color: "#4ade80", fontFamily: "Georgia", fontSize: 15, fontWeight: 700,
        }}>
          {cargando ? "Cargando..." : modo === "login" ? "Ingresar" : "Registrarse"}
        </button>

        <div style={{ textAlign: "center", color: "#4b5563", fontSize: 12 }}>— o —</div>

        <button onClick={handleGoogle} style={{
          padding: "12px", borderRadius: 8, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid #374151",
          color: "#e2f5e9", fontFamily: "Georgia", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>G</span> Continuar con Google
        </button>

        {mensaje && <div style={{ color: mensaje.startsWith("✅") ? "#4ade80" : "#f87171", fontSize: 13, textAlign: "center" }}>{mensaje}</div>}
      </div>
    </div>
  );
}