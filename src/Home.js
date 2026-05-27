import { useState } from "react";
import { supabase } from "./supabase";

function MenuItem({ icono, label, onClick, peligro }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        width: "100%", padding: "14px 16px", background: "none",
        border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
        cursor: "pointer", textAlign: "left",
        color: peligro ? "#f87171" : "#e2f5e9",
        fontFamily: "'Lato', sans-serif", fontSize: 15,
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{icono}</span>
      {label}
    </button>
  );
}

const AVATARES = ["👨","👩","👴","👵","🧔","👱","🧑","👮","🧑‍🍳","🥷","🧙","🤠","👸","🤴","🧛","🧜","🧝","🧞","🤖","👾"];
const REGEX_NOMBRE = /^[a-zA-Z0-9.]{4,13}$/;

export default function Home({ perfil, onJugar, onSalaPrivada, onLogout, onVerTerminos, onConfig, onPerfilActualizado }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [mostrarReglas, setMostrarReglas] = useState(false);
  const [mostrarConfirmSalir, setMostrarConfirmSalir] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [nombreEdit, setNombreEdit] = useState("");
  const [avatarEdit, setAvatarEdit] = useState("");
  const [errorEdit, setErrorEdit] = useState("");
  const [cargandoEdit, setCargandoEdit] = useState(false);
  const [saldoVisible, setSaldoVisible] = useState(false);
  const [mostrarDepositar, setMostrarDepositar] = useState(false);
  const [copiado, setCopiado] = useState("");

  function abrirEditar() {
    setNombreEdit(perfil.nombre);
    setAvatarEdit(perfil.avatar || "👤");
    setErrorEdit("");
    setMostrarEditar(true);
  }

  async function guardarEdicion() {
    const nombre = nombreEdit.trim();
    if (!REGEX_NOMBRE.test(nombre)) {
      setErrorEdit("Entre 4 y 13 caracteres. Solo letras, números o puntos.");
      return;
    }
    setCargandoEdit(true);
    setErrorEdit("");
    const { error } = await supabase
      .from("perfiles")
      .update({ nombre })
      .eq("usuario_id", perfil.usuario_id);
    if (error) {
      console.error("Error al actualizar perfil:", error);
      const msg = error.code === "23505"
        ? "Ese nombre de usuario ya está en uso."
        : `No se pudo guardar (${error.message})`;
      setErrorEdit(msg);
      setCargandoEdit(false);
      return;
    }
    const perfilActualizado = { ...perfil, nombre, avatar: avatarEdit };
    localStorage.setItem(`truco_avatar_${perfil.usuario_id}`, avatarEdit);
    localStorage.setItem(`truco_perfil_${perfil.usuario_id}`, JSON.stringify(perfilActualizado));
    onPerfilActualizado(perfilActualizado);
    setCargandoEdit(false);
    setMostrarEditar(false);
  }

  const CBU = "próximamente";
  const ALIAS = "próximamente";

  function copiar(valor, key) {
    navigator.clipboard.writeText(valor);
    setCopiado(key);
    setTimeout(() => setCopiado(""), 2000);
  }

  async function abrirRanking() {
    setMenuAbierto(false);
    const { data } = await supabase
      .from("perfiles")
      .select("nombre, partidas_jugadas, partidas_ganadas")
      .order("partidas_ganadas", { ascending: false })
      .limit(10);
    if (data) setRanking(data);
    setMostrarRanking(true);
  }

  function abrirSoporte() {
    setMenuAbierto(false);
    if (window.Tawk_API && window.Tawk_API.toggle) {
      window.Tawk_API.toggle();
    } else {
      window.Tawk_API = window.Tawk_API || {};
      const prev = window.Tawk_API.onLoad;
      window.Tawk_API.onLoad = function () {
        if (prev) prev();
        window.Tawk_API.toggle();
      };
    }
  }

  return (
    <div style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "'Lato', sans-serif",
      padding: "24px 16px", gap: 20,
    }}>

      {/* Botón hamburguesa */}
      <button
        onClick={() => setMenuAbierto(true)}
        style={{
          position: "fixed", top: 16, right: 16, zIndex: 40,
          background: "rgba(0,0,0,0.5)", border: "1px solid #2d6a4f",
          borderRadius: 10, width: 40, height: 40, cursor: "pointer",
          color: "#4ade80", fontSize: 20, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >☰</button>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 4, textTransform: "uppercase" }}>Bienvenido a</div>
        <div style={{ fontSize: 32, color: "#fbbf24", fontWeight: 900, lineHeight: 1.1 }}>Truco Argentino</div>
      </div>

      {/* Card usuario */}
      <div style={{
        background: "rgba(0,0,0,0.5)", border: "1px solid #2d6a4f",
        borderRadius: 20, padding: "20px 24px",
        width: "100%", maxWidth: 340,
        display: "flex", alignItems: "center", gap: 16,
        position: "relative",
      }}>
        <button onClick={abrirEditar} style={{
          position: "absolute", top: 10, right: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(45,106,79,0.5)",
          borderRadius: 8, width: 28, height: 28, cursor: "pointer",
          color: "#4ade80", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
        }}>✏️</button>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
          background: "radial-gradient(circle,#1a472a,#050f08)",
          border: "2px solid #4ade80",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, boxShadow: "0 0 16px rgba(74,222,128,0.2)",
        }}>
          {perfil.avatar || "👤"}
        </div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900, fontFamily: "'Lato', sans-serif" }}>{perfil.nombre}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 16, color: "#ffffff", fontWeight: 700, fontFamily: "'Lato', sans-serif", letterSpacing: 0.5 }}>
              {saldoVisible
                ? `$ ${(perfil.saldo || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                : "$ ••••••"}
            </span>
            <button onClick={() => setSaldoVisible(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2, display: "flex", alignItems: "center" }}>
              {saldoVisible ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <button onClick={() => setMostrarDepositar(true)} style={{ marginTop: 10, padding: "5px 12px", borderRadius: 8, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80", fontSize: 12, cursor: "pointer", fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>
            + Depositar
          </button>
        </div>
      </div>

      {/* Opciones principales */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340 }}>
        <button onClick={onJugar} style={{
          background: "linear-gradient(135deg,#1a472a,#2d6a4f)",
          border: "1px solid #4ade80", borderRadius: 16, padding: "20px 24px",
          cursor: "pointer", textAlign: "left", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🃏</div>
            <div style={{ fontSize: 18, color: "#4ade80", fontWeight: 900, fontFamily: "'Lato', sans-serif" }}>Jugar ahora</div>
            <div style={{ fontSize: 12, color: "#ffffff", marginTop: 2 }}>Contra la IA</div>
          </div>
          <div style={{ fontSize: 28, color: "#4ade80", opacity: 0.6 }}>→</div>
        </button>

        <button onClick={onSalaPrivada} style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid #a78bfa", borderRadius: 16, padding: "20px 24px",
          cursor: "pointer", textAlign: "left", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>👥</div>
            <div style={{ fontSize: 18, color: "#a78bfa", fontWeight: 900, fontFamily: "'Lato', sans-serif" }}>Sala privada</div>
            <div style={{ fontSize: 12, color: "#ffffff", marginTop: 2 }}>Conectá con tus amigos</div>
          </div>
          <div style={{ fontSize: 28, color: "#a78bfa", opacity: 0.6 }}>→</div>
        </button>
      </div>

      {/* ── MENÚ LATERAL ── */}
      {/* Overlay oscuro */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 45 }}
        />
      )}

      {/* Panel lateral derecho */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 280, maxWidth: "85vw",
        background: "linear-gradient(180deg,#0a2414 0%,#050f08 100%)",
        borderLeft: "1px solid #2d6a4f",
        display: "flex", flexDirection: "column",
        transform: menuAbierto ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
      }}>
        {/* Header del menú */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 16px", borderBottom: "1px solid rgba(45,106,79,0.4)",
        }}>
          <div>
            <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Argentino</div>
            <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 900 }}>Menú</div>
          </div>
          <button
            onClick={() => setMenuAbierto(false)}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid #374151",
              borderRadius: 8, width: 32, height: 32, cursor: "pointer",
              color: "#9ca3af", fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Items del menú */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <MenuItem icono="👤" label="Configuración de cuenta" onClick={() => { setMenuAbierto(false); }} />
          <MenuItem icono="🏆" label="Ranking"                 onClick={abrirRanking} />
          <MenuItem icono="📖" label="Reglas"                  onClick={() => { setMenuAbierto(false); setMostrarReglas(true); }} />
          <MenuItem icono="🎮" label="Configuración del juego" onClick={() => { setMenuAbierto(false); onConfig(); }} />
          <MenuItem icono="📋" label="Términos y condiciones"  onClick={() => { setMenuAbierto(false); onVerTerminos(); }} />
          <MenuItem icono="💬" label="Soporte"                 onClick={abrirSoporte} />
        </div>

        {/* Cerrar sesión al fondo */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "8px 0" }}>
          <MenuItem icono="🚪" label="Cerrar sesión" peligro onClick={() => { setMenuAbierto(false); setMostrarConfirmSalir(true); }} />
        </div>
      </div>

      {/* ── MODAL RANKING ── */}
      {mostrarRanking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "#0a2414", border: "1px solid #2d6a4f", borderRadius: 16, padding: "28px", textAlign: "center", width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 20, color: "#fbbf24", fontWeight: 900, marginBottom: 16 }}>Ranking</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {ranking.length === 0 && <div style={{ color: "#6b7280", fontSize: 13 }}>Sin jugadores aún</div>}
              {ranking.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 18, width: 28 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</div>
                  <div style={{ fontSize: 22, width: 28 }}>{p.nombre === perfil?.nombre ? (perfil?.avatar || "👤") : "👤"}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ color: p.nombre === perfil?.nombre ? "#4ade80" : "#e2f5e9", fontSize: 13, fontWeight: 700 }}>{p.nombre}</div>
                    <div style={{ color: "#6b9", fontSize: 10 }}>{p.partidas_jugadas} jugadas</div>
                  </div>
                  <div style={{ color: "#fbbf24", fontSize: 15, fontWeight: 900 }}>{p.partidas_ganadas} 🏆</div>
                </div>
              ))}
            </div>
            <button onClick={() => setMostrarRanking(false)} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 8, padding: "10px 28px", color: "#4ade80", fontSize: 14, cursor: "pointer", fontFamily: "'Lato', sans-serif" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ── MODAL REGLAS ── */}
      {mostrarReglas && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "#0a2414", border: "1px solid #2d6a4f", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 360, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>📖</div>
            <div style={{ fontSize: 20, color: "#fbbf24", fontWeight: 900, textAlign: "center", marginBottom: 16 }}>Reglas del Truco</div>
            {[
              ["🃏", "El mazo", "Se juega con 40 cartas españolas. Cada jugador recibe 3 cartas por mano."],
              ["🏆", "Objetivo", "Llegar a 30 puntos antes que el rival ganando manos y cantando envido o truco."],
              ["⚔️", "El Truco", "Truco vale 2 pts (1 si no querido). Retruco vale 3 pts (2 si no querido). Vale Cuatro vale 4 pts (3 si no querido). En la última mano (alguien con 29 pts) no se puede cantar Truco ni Vale Cuatro."],
              ["🎯", "El Envido", "Se juega en la primera ronda. Opciones: Envido (2 pts), Envido Envido (4 pts, 2 si no querido), Real Envido (2 pts) y Falta Envido (los puntos que le faltan al rival para llegar a 30). Gana quien tenga más puntos de envido (máx. 33)."],
              ["📊", "Jerarquía", "1♠ > 1♣ > 7♠ > 7♦ > 3 > 2 > 1 > 12 > 11 > 10 > 7 > 6 > 5 > 4"],
              ["🤝", "Empate", "Si hay empate en una ronda, gana quien jugó primero. En empate total, es mano empatada."],
            ].map(([icono, titulo, texto]) => (
              <div key={titulo} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{icono}</span>
                  <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>{titulo}</span>
                </div>
                <div style={{ color: "#ffffff", fontSize: 12, lineHeight: 1.6, paddingLeft: 24 }}>{texto}</div>
              </div>
            ))}
            <button onClick={() => setMostrarReglas(false)} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 8, padding: "10px", color: "#4ade80", fontSize: 14, cursor: "pointer", fontFamily: "'Lato', sans-serif", marginTop: 8 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR PERFIL ── */}
      {mostrarEditar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border: "1px solid #2d6a4f", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Lato', sans-serif" }}>

            {/* Encabezado */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Argentino</div>
                <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900 }}>Editar perfil</div>
              </div>
              <button onClick={() => setMostrarEditar(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #374151", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Avatar seleccionado grande */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,#1a472a,#050f08)", border: "2px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 0 20px rgba(74,222,128,0.2)" }}>
                {avatarEdit}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, width: "100%" }}>
                {AVATARES.map(av => (
                  <button key={av} onClick={() => setAvatarEdit(av)} style={{ fontSize: 24, padding: "6px 0", borderRadius: 10, cursor: "pointer", background: avatarEdit === av ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.3)", border: avatarEdit === av ? "2px solid #4ade80" : "2px solid rgba(45,106,79,0.3)", transform: avatarEdit === av ? "scale(1.1)" : "scale(1)", transition: "all 0.15s" }}>{av}</button>
                ))}
              </div>
            </div>

            {/* Input nombre */}
            <div>
              <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Nombre de usuario</div>
              <input
                type="text"
                value={nombreEdit}
                maxLength={13}
                onChange={e => { setNombreEdit(e.target.value); setErrorEdit(""); }}
                style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${errorEdit ? "#f87171" : "#2d6a4f"}`, background: "rgba(0,0,0,0.5)", color: "#ffffff", fontFamily: "'Lato', sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {errorEdit ? <span style={{ fontSize: 11, color: "#f87171" }}>{errorEdit}</span> : <span />}
                <span style={{ fontSize: 10, color: nombreEdit.length > 13 ? "#f87171" : "#4b5563" }}>{nombreEdit.length}/13</span>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMostrarEditar(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#9ca3af", fontFamily: "'Lato', sans-serif", fontSize: 14 }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={cargandoEdit} style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: cargandoEdit ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#1a472a,#2d6a4f)", border: "1px solid #4ade80", color: "#4ade80", fontFamily: "'Lato', sans-serif", fontSize: 14, fontWeight: 700, opacity: cargandoEdit ? 0.7 : 1 }}>{cargandoEdit ? "⏳ Guardando..." : "✅ Guardar"}</button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL DEPOSITAR ── */}
      {mostrarDepositar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border: "1px solid #2d6a4f", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, fontFamily: "'Lato', sans-serif", display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ fontSize: 20, color: "#fbbf24", fontWeight: 900 }}>💰 Ingresar saldo</div>

            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
              ¿Querés ingresar dinero? Realizá una transferencia bancaria a nuestras cuentas.
            </div>

            {/* CBU */}
            <div>
              <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>CBU</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(45,106,79,0.5)", background: "rgba(0,0,0,0.4)", color: "#9ca3af", fontSize: 13, fontFamily: "monospace" }}>
                  {CBU}
                </div>
                <button onClick={() => copiar(CBU, "CBU")} style={{ padding: "10px 12px", borderRadius: 8, background: copiado === "CBU" ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.3)", border: "1px solid rgba(45,106,79,0.5)", color: copiado === "CBU" ? "#4ade80" : "#9ca3af", fontSize: 12, cursor: "pointer", fontFamily: "'Lato', sans-serif", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                  {copiado === "CBU" ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>
            </div>

            {/* Alias */}
            <div>
              <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>ALIAS</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(45,106,79,0.5)", background: "rgba(0,0,0,0.4)", color: "#9ca3af", fontSize: 13 }}>
                  {ALIAS}
                </div>
                <button onClick={() => copiar(ALIAS, "ALIAS")} style={{ padding: "10px 12px", borderRadius: 8, background: copiado === "ALIAS" ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.3)", border: "1px solid rgba(45,106,79,0.5)", color: copiado === "ALIAS" ? "#4ade80" : "#9ca3af", fontSize: 12, cursor: "pointer", fontFamily: "'Lato', sans-serif", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                  {copiado === "ALIAS" ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>
            </div>

            {/* Importante */}
            <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, padding: "12px" }}>
              <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>⚠️ IMPORTANTE</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                El titular de la cuenta ingresada debe coincidir con los datos de su DNI.
              </div>
            </div>

            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
              ⏱ Tiempo promedio de acreditación: 5 a 10 minutos
            </div>

            <button onClick={() => setMostrarDepositar(false)} style={{ width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#ffffff", fontFamily: "'Lato', sans-serif", fontSize: 14 }}>
              ← Volver
            </button>

          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR SALIR ── */}
      {mostrarConfirmSalir && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "#0a2414", border: "1px solid #2d6a4f", borderRadius: 20, padding: "32px 28px", textAlign: "center", maxWidth: 300, width: "100%" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900, marginBottom: 8 }}>Cerrar sesión</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24, lineHeight: 1.6 }}>¿Estás seguro que deseas cerrar sesión?</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMostrarConfirmSalir(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#9ca3af", fontFamily: "'Lato', sans-serif", fontSize: 14 }}>Cancelar</button>
              <button onClick={onLogout} style={{ flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", background: "linear-gradient(135deg,#7f1d1d,#991b1b)", border: "1px solid #f87171", color: "#f87171", fontFamily: "'Lato', sans-serif", fontSize: 14, fontWeight: 700 }}>Salir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
