import { useState } from "react";
import { supabase } from "./supabase";
import fondoLogin from "./Gemini_Generated_Image_wq28o3wq28o3wq28.png";export default function Auth() {
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
      backgroundImage: `url(${fondoLogin})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Georgia, serif",
padding: "0 16px 40px",    }}>
      <div style={{
        background: "rgba(0,0,0,0.82)",
        border: "1px solid #2d6a4f",
        borderRadius: 20,
        padding: "32px 32px",
        width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", gap: 14,
        backdropFilter: "blur(8px)",
      }}>

        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 4, gap: 4 }}>
          <button onClick={() => setModo("login")} style={{
            flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
            background: modo === "login" ? "#1a472a" : "transparent",
            border: modo === "login" ? "1px solid #2d6a4f" : "1px solid transparent",
            color: modo === "login" ? "#4ade80" : "#6b7280",
            fontFamily: "Georgia", fontSize: 14,
          }}>Ingresar</button>
          <button onClick={() => setModo("registro")} style={{
            flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
            background: modo === "registro" ? "#1a472a" : "transparent",
            border: modo === "registro" ? "1px solid #2d6a4f" : "1px solid transparent",
            color: modo === "registro" ? "#4ade80" : "#6b7280",
            fontFamily: "Georgia", fontSize: 14,
          }}>Registrarse</button>
        </div>

        {/* Inputs */}
        <div style={{ position: "relative" }}>
          <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#4ade80" }}>✉</div>
          <input
            type="email" placeholder="Correo electrónico" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{ width:"100%", padding:"12px 14px 12px 34px", borderRadius:10, border:"1px solid #2d6a4f", background:"rgba(0,0,0,0.5)", color:"#e2f5e9", fontFamily:"Georgia", fontSize:14, outline:"none", boxSizing:"border-box" }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#4ade80" }}>🔒</div>
          <input
            type="password" placeholder="Contraseña" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{ width:"100%", padding:"12px 14px 12px 34px", borderRadius:10, border:"1px solid #2d6a4f", background:"rgba(0,0,0,0.5)", color:"#e2f5e9", fontFamily:"Georgia", fontSize:14, outline:"none", boxSizing:"border-box" }}
          />
        </div>

        {/* Botón principal */}
        <button onClick={handleSubmit} disabled={cargando} style={{
          padding:"14px", borderRadius:10, cursor:"pointer",
          background:"linear-gradient(135deg,#1a472a,#2d6a4f)",
          border:"1px solid #4ade80", color:"#4ade80",
          fontFamily:"Georgia", fontSize:16, fontWeight:700, letterSpacing:1,
        }}>
          {cargando ? "⏳ Cargando..." : modo === "login" ? "🃏 Ingresar a jugar" : "✅ Crear cuenta"}
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
          <div style={{ fontSize:11, color:"#4b5563", letterSpacing:1 }}>O CONTINUÁ CON</div>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
        </div>

        <button onClick={handleGoogle} style={{
          padding:"12px", borderRadius:10, cursor:"pointer",
          background:"rgba(255,255,255,0.06)", border:"1px solid #374151",
          color:"#e2f5e9", fontFamily:"Georgia", fontSize:14,
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        }}>
          <span style={{ fontSize:18, fontWeight:900, color:"#4285f4" }}>G</span>
          Continuar con Google
        </button>

        {mensaje && (
          <div style={{ color:mensaje.startsWith("✅")?"#4ade80":"#f87171", fontSize:13, textAlign:"center", padding:"8px", borderRadius:8, background:"rgba(0,0,0,0.3)" }}>
            {mensaje}
          </div>
        )}

      </div>
    </div>
  );
}