import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import fondoLogin from "./Gemini_Generated_Image_wq28o3wq28o3wq28.png";

const CINZEL = "'Cinzel', serif";
const LATO   = "'Lato', sans-serif";

/* ── Rate limiting ── */
const MAX_INTENTOS = 5;
const VENTANA_MS   = 15 * 60 * 1000; // 15 minutos

function rlKey(email) { return `truco_rl_${email.trim().toLowerCase()}`; }

function getRl(email) {
  try {
    const raw = localStorage.getItem(rlKey(email));
    if (!raw) return { intentos: 0, desde: null };
    const d = JSON.parse(raw);
    if (Date.now() - d.desde > VENTANA_MS) {
      localStorage.removeItem(rlKey(email));
      return { intentos: 0, desde: null };
    }
    return d;
  } catch { return { intentos: 0, desde: null }; }
}

function incrementarRl(email) {
  const actual = getRl(email);
  const nuevo = { intentos: actual.intentos + 1, desde: actual.desde || Date.now() };
  localStorage.setItem(rlKey(email), JSON.stringify(nuevo));
  return nuevo;
}

function resetearRl(email) { localStorage.removeItem(rlKey(email)); }

function verificarRl(email) {
  const { intentos, desde } = getRl(email);
  if (intentos >= MAX_INTENTOS && desde) {
    const restanMs = VENTANA_MS - (Date.now() - desde);
    if (restanMs > 0) return { bloqueado: true, minutos: Math.ceil(restanMs / 60000) };
  }
  return { bloqueado: false };
}

function traducirError(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Ya existe una cuenta con ese email. ¿Querés iniciar sesión?";
  if (m.includes("password should be at least") || m.includes("password must be at least") || m.includes("password is too short"))
    return "La contraseña debe tener al menos 6 caracteres";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "El email ingresado no es válido";
  if (m.includes("email not confirmed"))
    return "Todavía no confirmaste tu email. Revisá tu bandeja de entrada (y la carpeta de spam).";
  if (m.includes("too many requests") || m.includes("email rate limit"))
    return "Demasiados intentos. Esperá unos minutos antes de volver a intentar.";
  if (m.includes("user not found"))
    return "No encontramos una cuenta con ese email";
  return msg;
}

const inputStyle = {
  width:"100%", padding:"12px 14px 12px 34px", borderRadius:10,
  border:"1px solid #2d6a4f", background:"rgba(0,0,0,0.5)",
  color:"#ffffff", fontFamily:LATO, fontSize:14,
  outline:"none", boxSizing:"border-box",
};
const inputConOjoStyle = { ...inputStyle, padding:"12px 40px 12px 34px" };

export default function Auth() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [recibeNovedades, setRecibeNovedades] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setModo("nueva_password");
        setMensaje("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (modo !== "login" || !email) { setBloqueado(false); return; }
    const rl = verificarRl(email);
    setBloqueado(rl.bloqueado);
    if (rl.bloqueado) setMensaje(`🔒 Demasiados intentos fallidos. Esperá ${rl.minutos} minuto${rl.minutos !== 1 ? "s" : ""} antes de volver a intentar.`);
  }, [email, modo]);

  async function handleSubmit() {
    setMensaje("");

    if (modo === "login") {
      if (!email.trim()) { setMensaje("❌ Ingresá tu email"); return; }
      if (!password) { setMensaje("❌ Ingresá tu contraseña"); return; }
      const rl = verificarRl(email);
      if (rl.bloqueado) {
        setMensaje(`🔒 Demasiados intentos fallidos. Esperá ${rl.minutos} minuto${rl.minutos !== 1 ? "s" : ""} antes de volver a intentar.`);
        return;
      }
    } else {
      if (!email.trim()) { setMensaje("❌ Ingresá tu email"); return; }
      if (!/\S+@\S+\.\S+/.test(email)) { setMensaje("❌ El email ingresado no es válido"); return; }
      if (!password) { setMensaje("❌ Ingresá una contraseña"); return; }
      if (password.length < 6) { setMensaje("❌ La contraseña debe tener al menos 6 caracteres"); return; }
    }

    setCargando(true);
    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          setMensaje("❌ Todavía no confirmaste tu email. Revisá tu bandeja de entrada (y la carpeta de spam).");
        } else {
          const rl = incrementarRl(email);
          const restantes = MAX_INTENTOS - rl.intentos;
          if (rl.intentos >= MAX_INTENTOS) {
            setMensaje("🔒 Demasiados intentos fallidos. Esperá 15 minutos antes de volver a intentar.");
          } else {
            setMensaje(`❌ Email o contraseña incorrectos. ${restantes} intento${restantes !== 1 ? "s" : ""} restante${restantes !== 1 ? "s" : ""}.`);
          }
        }
      } else {
        resetearRl(email);
      }
    } else {
      localStorage.setItem("truco_mkt_pending", recibeNovedades ? "1" : "0");
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMensaje("❌ " + traducirError(error.message));
      else setMensaje("✅ ¡Cuenta creada! Revisá tu email para confirmarla. Una vez confirmada, ya podés ingresar.");
    }
    setCargando(false);
  }

  async function handleRecuperar() {
    if (!email) { setMensaje("❌ Ingresá tu email"); return; }
    setCargando(true);
    setMensaje("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setMensaje("❌ " + error.message);
    else setMensaje("✅ Te enviamos un link a tu email para restablecer la contraseña");
    setCargando(false);
  }

  async function handleNuevaPassword() {
    if (nuevaPassword !== confirmarPassword) {
      setMensaje("❌ Las contraseñas no coinciden");
      return;
    }
    if (nuevaPassword.length < 6) {
      setMensaje("❌ La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setCargando(true);
    setMensaje("");
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) setMensaje("❌ " + error.message);
    else {
      setMensaje("✅ ¡Contraseña actualizada! Ya podés ingresar");
      setModo("login");
      setNuevaPassword("");
      setConfirmarPassword("");
    }
    setCargando(false);
  }

  async function handleGoogle() {
    if (modo === "registro") {
      localStorage.setItem("truco_mkt_pending", recibeNovedades ? "1" : "0");
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  const OjoBoton = ({ visible, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#ffffff", padding:4, display:"flex", alignItems:"center" }}
    >
      {visible ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div style={{
      height: "100dvh",
      backgroundImage: `url(${fondoLogin})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: LATO,
      padding: "16px",
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.82)",
        border: "1px solid #2d6a4f",
        borderRadius: 20,
        padding: "32px 32px",
        width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", gap: 14,
        backdropFilter: "blur(8px)",
        overflowY: "auto", maxHeight: "100%",
      }}>

        {/* Logo / título */}
        <div style={{ textAlign:"center", marginBottom:4 }}>
          <div style={{ fontFamily:CINZEL, fontSize:10, color:"#4ade80", letterSpacing:4, textTransform:"uppercase" }}>Truco</div>
          <div style={{ fontFamily:CINZEL, fontSize:26, color:"#fbbf24", fontWeight:700, lineHeight:1.1, letterSpacing:1 }}>Argentino</div>
        </div>

        {/* Tabs — solo en login/registro */}
        {(modo === "login" || modo === "registro") && (
          <div style={{ display:"flex", background:"rgba(0,0,0,0.3)", borderRadius:10, padding:4, gap:4 }}>
            <button onClick={() => { setModo("login"); setMensaje(""); }} style={{
              flex:1, padding:"10px", borderRadius:8, cursor:"pointer",
              background: modo === "login" ? "#1a472a" : "transparent",
              border: modo === "login" ? "1px solid #2d6a4f" : "1px solid transparent",
              color: "#ffffff",
              fontFamily: CINZEL, fontSize:13, letterSpacing:0.5,
            }}>Ingresar</button>
            <button onClick={() => { setModo("registro"); setMensaje(""); }} style={{
              flex:1, padding:"10px", borderRadius:8, cursor:"pointer",
              background: modo === "registro" ? "#1a472a" : "transparent",
              border: modo === "registro" ? "1px solid #2d6a4f" : "1px solid transparent",
              color: "#ffffff",
              fontFamily: CINZEL, fontSize:13, letterSpacing:0.5,
            }}>Registrarse</button>
          </div>
        )}

        {/* ── FORMULARIO LOGIN / REGISTRO ── */}
        {(modo === "login" || modo === "registro") && (<>
          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#4ade80" }}>✉</div>
            <input
              type="email" autoComplete="email" placeholder="Correo electrónico" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="auth-input" style={inputStyle}
            />
          </div>

          <div>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#4ade80" }}>🔒</div>
              <input
                type={mostrarPassword ? "text" : "password"}
                autoComplete={modo === "registro" ? "new-password" : "current-password"}
                placeholder="Contraseña" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="auth-input" style={inputConOjoStyle}
              />
              <OjoBoton visible={mostrarPassword} onToggle={() => setMostrarPassword(v => !v)} />
            </div>
            {modo === "registro" && (
              <div style={{ fontSize:11, color:"#6b7280", marginTop:5, paddingLeft:2 }}>
                Mínimo 6 caracteres
              </div>
            )}
          </div>

          {modo === "login" && (
            <button
              type="button"
              onClick={() => { setModo("recuperar"); setMensaje(""); }}
              style={{ background:"none", border:"none", color:"#ffffff", fontSize:12, cursor:"pointer", textAlign:"right", padding:0, fontFamily:LATO, letterSpacing:0.3 }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {modo === "registro" && (
            <div
              onClick={() => setRecibeNovedades(v => !v)}
              style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}
            >
              <div style={{
                width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1,
                border:"1px solid #2d6a4f", background: recibeNovedades ? "#1a472a" : "rgba(0,0,0,0.4)",
                display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s",
              }}>
                {recibeNovedades && <span style={{ color:"#4ade80", fontSize:13, lineHeight:1, fontWeight:700 }}>✓</span>}
              </div>
              <span style={{ color:"rgba(255,255,255,0.75)", fontSize:12, lineHeight:1.5, fontFamily:LATO }}>
                Quiero recibir novedades y promociones de Truco Argentino
              </span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={cargando || (modo === "login" && bloqueado)} style={{
            padding:"14px", borderRadius:10, cursor: (cargando || (modo === "login" && bloqueado)) ? "not-allowed" : "pointer",
            background:"linear-gradient(135deg,#1a472a,#2d6a4f)",
            border:"1px solid #4ade80", color:"#ffffff",
            fontFamily:CINZEL, fontSize:14, fontWeight:700, letterSpacing:1.5,
            opacity: (cargando || (modo === "login" && bloqueado)) ? 0.6 : 1,
          }}>
            {cargando ? "Cargando..." : modo === "login" ? "🃏 Ingresar a jugar" : "✅ Crear cuenta"}
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
            <div style={{ fontFamily:LATO, fontSize:10, color:"#4b5563", letterSpacing:2, fontWeight:700 }}>O CONTINUÁ CON</div>
            <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
          </div>

          <button onClick={handleGoogle} style={{
            padding:"12px", borderRadius:10, cursor:"pointer",
            background:"rgba(255,255,255,0.06)", border:"1px solid #374151",
            color:"#ffffff", fontFamily:LATO, fontSize:14, fontWeight:400,
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continuar con Google
          </button>
        </>)}

        {/* ── FORMULARIO RECUPERAR CONTRASEÑA ── */}
        {modo === "recuperar" && (<>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:6 }}>🔑</div>
            <div style={{ fontFamily:CINZEL, color:"#4ade80", fontSize:15, fontWeight:700, letterSpacing:1 }}>Recuperar contraseña</div>
            <div style={{ fontFamily:LATO, color:"#9ca3af", fontSize:12, marginTop:6, lineHeight:1.5 }}>Te enviamos un link a tu email para que puedas crear una nueva</div>
          </div>

          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#4ade80" }}>✉</div>
            <input
              type="email" autoComplete="email" placeholder="Correo electrónico" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRecuperar()}
              className="auth-input" style={inputStyle}
            />
          </div>

          <button onClick={handleRecuperar} disabled={cargando} style={{
            padding:"14px", borderRadius:10, cursor:"pointer",
            background:"linear-gradient(135deg,#1a472a,#2d6a4f)",
            border:"1px solid #4ade80", color:"#ffffff",
            fontFamily:CINZEL, fontSize:13, fontWeight:700, letterSpacing:1,
          }}>
            {cargando ? "Enviando..." : "📧 Enviar link de recuperación"}
          </button>

          <button
            type="button"
            onClick={() => { setModo("login"); setMensaje(""); }}
            style={{ background:"none", border:"none", color:"#ffffff", fontSize:13, cursor:"pointer", fontFamily:LATO }}
          >
            ← Volver al inicio de sesión
          </button>
        </>)}

        {/* ── FORMULARIO NUEVA CONTRASEÑA ── */}
        {modo === "nueva_password" && (<>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:6 }}>🔐</div>
            <div style={{ fontFamily:CINZEL, color:"#4ade80", fontSize:15, fontWeight:700, letterSpacing:1 }}>Nueva contraseña</div>
            <div style={{ fontFamily:LATO, color:"#9ca3af", fontSize:12, marginTop:6, lineHeight:1.5 }}>Elegí una contraseña nueva para tu cuenta</div>
          </div>

          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#4ade80" }}>🔒</div>
            <input
              type={mostrarNuevaPassword ? "text" : "password"} placeholder="Nueva contraseña" value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="auth-input" style={inputConOjoStyle}
            />
            <OjoBoton visible={mostrarNuevaPassword} onToggle={() => setMostrarNuevaPassword(v => !v)} />
          </div>

          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#4ade80" }}>🔒</div>
            <input
              type={mostrarConfirmarPassword ? "text" : "password"} placeholder="Confirmar contraseña" value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNuevaPassword()}
              className="auth-input" style={inputConOjoStyle}
            />
            <OjoBoton visible={mostrarConfirmarPassword} onToggle={() => setMostrarConfirmarPassword(v => !v)} />
          </div>

          <button onClick={handleNuevaPassword} disabled={cargando} style={{
            padding:"14px", borderRadius:10, cursor:"pointer",
            background:"linear-gradient(135deg,#1a472a,#2d6a4f)",
            border:"1px solid #4ade80", color:"#ffffff",
            fontFamily:CINZEL, fontSize:13, fontWeight:700, letterSpacing:1,
          }}>
            {cargando ? "Guardando..." : "✅ Cambiar contraseña"}
          </button>
        </>)}

        {mensaje && (
          <div style={{ fontFamily:LATO, color:mensaje.startsWith("✅")?"#4ade80":"#f87171", fontSize:13, textAlign:"center", padding:"8px", borderRadius:8, background:"rgba(0,0,0,0.3)", lineHeight:1.5 }}>
            {mensaje}
          </div>
        )}

      </div>
    </div>
  );
}
