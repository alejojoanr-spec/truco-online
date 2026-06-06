import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { leerConfig } from "./Configuracion";
import VerificarCuenta from "./VerificarCuenta";

const _audioClickCache = { obj: null };
function reproducirSonidoClick() {
  if (!leerConfig().sonidoCartas) return;
  try {
    if (!_audioClickCache.obj) {
      _audioClickCache.obj = new Audio("/sounds/click.wav");
      _audioClickCache.obj.volume = 0.4;
    }
    _audioClickCache.obj.currentTime = 0;
    _audioClickCache.obj.play().catch(() => {});
  } catch {}
}

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

export default function Home({ perfil, onJugar, onCrearSalaPrivada, onUnirsePrivado, onLogout, onVerTerminos, onVerPrivacidad, onConfig, onPerfilActualizado, esAdmin, esAsesor, onAdmin }) {
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
  const [saldoVisible, setSaldoVisible] = useState(true);
  const [mostrarDepositar, setMostrarDepositar] = useState(false);
  const [mostrarRetirar, setMostrarRetirar] = useState(false);
  const [retiroMonto, setRetiroMonto] = useState("");
  const [retiroCbu, setRetiroCbu] = useState("");
  const [retiroError, setRetiroError] = useState("");
  const [retiroCargando, setRetiroCargando] = useState(false);
  const [retiroExito, setRetiroExito] = useState(false);
  const [mostrarVerificar, setMostrarVerificar] = useState(false);
  const [copiado, setCopiado] = useState("");
  const [mostrarSalaPrivada, setMostrarSalaPrivada] = useState(false);
  const [salaCrearApuesta, setSalaCrearApuesta] = useState("");
  const [salaUnirseCodigo, setSalaUnirseCodigo] = useState("");
  const [salaUnirseApuesta, setSalaUnirseApuesta] = useState("");
  const [salaError, setSalaError] = useState("");
  const [cuentaActiva, setCuentaActiva] = useState(null);
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMov, setCargandoMov] = useState(false);
  const [filtroMov, setFiltroMov] = useState("todos");

  useEffect(() => {
    supabase.from("cuentas_cobro").select("*").eq("activa", true).maybeSingle()
      .then(({ data }) => { if (data) setCuentaActiva(data); });
  }, []);

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
    const cambioNombre = nombre !== perfil.nombre;
    if (cambioNombre && perfil.nombre_cambiado_en) {
      const diasTranscurridos = (Date.now() - new Date(perfil.nombre_cambiado_en).getTime()) / (1000 * 60 * 60 * 24);
      const diasRestantes = Math.ceil(30 - diasTranscurridos);
      if (diasRestantes > 0) {
        setErrorEdit(`Podés cambiar tu nombre de usuario en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}.`);
        return;
      }
    }
    setCargandoEdit(true);
    setErrorEdit("");
    if (cambioNombre) {
      const { data: existe } = await supabase
        .from("perfiles")
        .select("usuario_id")
        .eq("nombre", nombre)
        .neq("usuario_id", perfil.usuario_id)
        .maybeSingle();
      if (existe) {
        setErrorEdit("Este nombre de usuario ya está en uso, elegí otro");
        setCargandoEdit(false);
        return;
      }
    }
    const ahora = new Date().toISOString();
    const updateData = { nombre, avatar: avatarEdit };
    if (cambioNombre) updateData.nombre_cambiado_en = ahora;
    const { error } = await supabase
      .from("perfiles")
      .update(updateData)
      .eq("usuario_id", perfil.usuario_id);
    if (error) {
      console.error("Error al actualizar perfil:", error);
      const msg = error.code === "23505"
        ? "Este nombre de usuario ya está en uso, elegí otro"
        : `No se pudo guardar (${error.message})`;
      setErrorEdit(msg);
      setCargandoEdit(false);
      return;
    }
    const perfilActualizado = { ...perfil, nombre, avatar: avatarEdit, ...(cambioNombre ? { nombre_cambiado_en: ahora } : {}) };
    localStorage.setItem(`truco_avatar_${perfil.usuario_id}`, avatarEdit);
    localStorage.setItem(`truco_perfil_${perfil.usuario_id}`, JSON.stringify(perfilActualizado));
    onPerfilActualizado(perfilActualizado);
    setCargandoEdit(false);
    setMostrarEditar(false);
  }

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

  async function abrirMovimientos() {
    setMenuAbierto(false);
    setFiltroMov("todos");
    setMostrarMovimientos(true);
    setCargandoMov(true);
    const { data } = await supabase
      .from("transacciones")
      .select("id, tipo, monto, estado, nota, saldo_anterior, saldo_nuevo, created_at")
      .eq("usuario_id", perfil.usuario_id)
      .order("created_at", { ascending: false })
      .limit(200);
    setMovimientos(data || []);
    setCargandoMov(false);
  }


  return (
    <div style={{
      height: "100dvh", position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Lato', sans-serif",
      padding: "24px 16px 32px", boxSizing: "border-box",
    }}>

      {/* Botón hamburguesa */}
      <button
        onClick={() => { reproducirSonidoClick(); setMenuAbierto(true); }}
        style={{
          position: "fixed", top: 16, right: 16, zIndex: 40,
          background: "rgba(0,0,0,0.5)", border: "1px solid #2d6a4f",
          borderRadius: 10, width: 40, height: 40, cursor: "pointer",
          color: "#4ade80", fontSize: 20, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >☰</button>

      {/* Logo + Card agrupados */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>

        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 4, textTransform: "uppercase" }}>Bienvenido a</div>
          <div style={{ fontSize: 44, color: "#fbbf24", fontWeight: 900, lineHeight: 1.1 }}>Truco Argentino</div>
        </div>

      {/* Card usuario */}
      <div style={{
        background: "rgba(0,0,0,0.5)", border: "1px solid #2d6a4f",
        borderRadius: 20, padding: "24px 24px",
        width: "100%", maxWidth: 340,
        display: "flex", flexDirection: "column",
        position: "relative",
      }}>
        <button onClick={abrirEditar} style={{
          position: "absolute", top: 10, right: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(45,106,79,0.5)",
          borderRadius: 8, width: 28, height: 28, cursor: "pointer",
          color: "#4ade80", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
        }}>✏️</button>

        {/* Fila avatar + nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
            background: "radial-gradient(circle,#1a472a,#050f08)",
            border: "2px solid #4ade80",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, boxShadow: "0 0 16px rgba(74,222,128,0.2)",
          }}>
            {perfil.avatar || "👤"}
          </div>
          <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900, fontFamily: "'Lato', sans-serif" }}>{perfil.nombre}</div>
        </div>

        {/* Saldo centrado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 21, color: "#ffffff", fontWeight: 700, fontFamily: "'Lato', sans-serif", letterSpacing: 0.5 }}>
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

        {/* Botones centrados */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => setMostrarDepositar(true)} style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80", fontSize: 14, cursor: "pointer", fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>
            + Depositar
          </button>
          <button onClick={() => { setMostrarRetirar(true); setRetiroMonto(""); setRetiroCbu(""); setRetiroError(""); setRetiroExito(false); }} style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171", fontSize: 14, cursor: "pointer", fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>
            − Retirar
          </button>
        </div>

        {/* Banner verificación — solo si no está verificado */}
        {!perfil.is_verified && (
          <div style={{
            marginTop: 16, paddingTop: 14,
            borderTop: "1px solid rgba(45,106,79,0.35)",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 800, fontFamily: "'Lato', sans-serif", letterSpacing: 0.3 }}>
                Cuenta incompleta
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#ffffff", lineHeight: 1.5 }}>
              Verificá tu identidad para habilitar partidas competitivas
            </div>
            <button
              onClick={() => setMostrarVerificar(true)}
              style={{
                alignSelf: "flex-start", marginTop: 4,
                padding: "6px 14px", borderRadius: 8,
                background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.45)",
                color: "#fbbf24", fontSize: 12, cursor: "pointer",
                fontFamily: "'Lato', sans-serif", fontWeight: 700,
              }}
            >
              Verificar cuenta
            </button>
          </div>
        )}
      </div>

      </div>{/* fin grupo logo+card */}

      {/* Opciones principales */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, marginTop: 24 }}>
        <button onClick={() => { reproducirSonidoClick(); onJugar(); }} style={{
          background: "linear-gradient(135deg,#1a472a,#2d6a4f)",
          border: "1px solid #4ade80", borderRadius: 16, padding: "20px 24px",
          cursor: "pointer", textAlign: "left", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <div>
            <div style={{ fontSize: 21, color: "#4ade80", fontWeight: 900, fontFamily: "'Lato', sans-serif" }}>Jugar ahora</div>
            <div style={{ fontSize: 14, color: "#ffffff", marginTop: 2 }}>Con jugadores en línea.</div>
          </div>
          <div style={{ width: 36, height: 36, border: "2px solid #4ade80", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </button>

        <button onClick={() => { reproducirSonidoClick(); setSalaCrearApuesta(""); setSalaUnirseCodigo(""); setSalaUnirseApuesta(""); setSalaError(""); setMostrarSalaPrivada(true); }} style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid #a78bfa", borderRadius: 16, padding: "20px 24px",
          cursor: "pointer", textAlign: "left", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <div>
            <div style={{ fontSize: 21, color: "#a78bfa", fontWeight: 900, fontFamily: "'Lato', sans-serif" }}>Sala privada</div>
            <div style={{ fontSize: 14, color: "#ffffff", marginTop: 2 }}>Conectá con tus amigos.</div>
          </div>
          <div style={{ width: 36, height: 36, border: "2px solid #a78bfa", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
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
          <MenuItem icono="📊" label="Mis movimientos"          onClick={abrirMovimientos} />
          <MenuItem icono="📖" label="Reglas"                  onClick={() => { setMenuAbierto(false); setMostrarReglas(true); }} />
          <MenuItem icono="🎮" label="Configuración del juego" onClick={() => { setMenuAbierto(false); onConfig(); }} />
          <MenuItem icono="📋" label="Términos y condiciones"  onClick={() => { setMenuAbierto(false); onVerTerminos(); }} />
          <MenuItem icono="🔒" label="Política de privacidad"  onClick={() => { setMenuAbierto(false); onVerPrivacidad(); }} />
          {esAdmin && <MenuItem icono="🛡️" label="Panel de administrador" onClick={() => { setMenuAbierto(false); onAdmin(); }} />}
          {esAsesor && !esAdmin && <MenuItem icono="👔" label="Panel de asesor" onClick={() => { setMenuAbierto(false); onAdmin(); }} />}
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

      {/* ── MODAL MIS MOVIMIENTOS ── */}
      {mostrarMovimientos && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", zIndex: 60 }}>
          <div style={{ background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Lato', sans-serif" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 14px", borderBottom: "1px solid rgba(45,106,79,0.4)", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 }}>Cuenta</div>
                <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900 }}>📊 Mis movimientos</div>
              </div>
              <button onClick={() => setMostrarMovimientos(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #374151", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 6, padding: "12px 16px", borderBottom: "1px solid rgba(45,106,79,0.2)", flexShrink: 0, overflowX: "auto" }}>
              {[
                { id: "todos",    label: "Todos" },
                { id: "deposito", label: "Depósitos" },
                { id: "retiro",   label: "Retiros" },
                { id: "apuesta",  label: "Apuestas" },
                { id: "premio",   label: "Ganancias" },
              ].map(f => (
                <button key={f.id} onClick={() => setFiltroMov(f.id)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Lato', sans-serif",
                  background: filtroMov === f.id ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.3)",
                  border: `1px solid ${filtroMov === f.id ? "#4ade80" : "rgba(45,106,79,0.4)"}`,
                  color: filtroMov === f.id ? "#4ade80" : "#9ca3af",
                  transition: "all 0.15s",
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {cargandoMov ? (
                <div style={{ textAlign: "center", color: "#4ade80", padding: 40, fontSize: 14 }}>Cargando...</div>
              ) : (() => {
                const TIPO_LABEL_MOV = {
                  deposito:  "Depósito",
                  retiro:    "Retiro",
                  ajuste:    "Ajuste",
                  premio:    "Ganancia",
                  apuesta:   "Apuesta",
                  rake:      "Comisión",
                  reembolso: "Reembolso",
                };
                const ES_INGRESO = new Set(["deposito", "premio", "reembolso", "ajuste"]);
                const filtrados = filtroMov === "todos"
                  ? movimientos
                  : movimientos.filter(m => m.tipo === filtroMov);

                if (filtrados.length === 0) return (
                  <div style={{ textAlign: "center", color: "#6b7280", padding: 40, fontSize: 13 }}>
                    No hay movimientos{filtroMov !== "todos" ? " de este tipo" : ""}
                  </div>
                );

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtrados.map(m => {
                      const esIngreso = ES_INGRESO.has(m.tipo);
                      const monto = parseFloat(m.monto) || 0;
                      const [entero, dec] = monto.toFixed(2).split(".");
                      const montoStr = "$" + entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
                      const fecha = new Date(m.created_at);
                      const fechaStr = `${String(fecha.getDate()).padStart(2,"0")}/${String(fecha.getMonth()+1).padStart(2,"0")}/${fecha.getFullYear()}`;
                      const horaStr = `${String(fecha.getHours()).padStart(2,"0")}:${String(fecha.getMinutes()).padStart(2,"0")}`;
                      return (
                        <div key={m.id} style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(45,106,79,0.3)", borderRadius: 12, padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {/* Tipo + fecha */}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, letterSpacing: 0.5,
                                  background: esIngreso ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.1)",
                                  color: esIngreso ? "#4ade80" : "#f87171",
                                  border: `1px solid ${esIngreso ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.25)"}`,
                                }}>
                                  {TIPO_LABEL_MOV[m.tipo] || m.tipo}
                                </span>
                                <span style={{ fontSize: 11, color: "#6b7280" }}>{fechaStr} · {horaStr}</span>
                              </div>
                              {/* Nota */}
                              {m.nota && (
                                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {m.nota}
                                </div>
                              )}
                              {/* Saldo resultante */}
                              {m.saldo_nuevo != null && (
                                <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>
                                  Saldo: ${(parseFloat(m.saldo_nuevo) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                                </div>
                              )}
                            </div>
                            {/* Monto */}
                            <div style={{ fontSize: 16, fontWeight: 900, color: esIngreso ? "#4ade80" : "#f87171", flexShrink: 0 }}>
                              {esIngreso ? "+" : "−"}{montoStr}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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

            {/* Datos de la cuenta activa */}
            {cuentaActiva ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Alias */}
                <div>
                  <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Alias</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(45,106,79,0.5)", background: "rgba(0,0,0,0.4)", color: "#ffffff", fontSize: 13, fontFamily: "monospace", wordBreak: "break-all" }}>
                      {cuentaActiva.alias}
                    </div>
                    <button onClick={() => copiar(cuentaActiva.alias, "ALIAS")} style={{ padding: "10px 12px", borderRadius: 8, background: copiado === "ALIAS" ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.3)", border: "1px solid rgba(45,106,79,0.5)", color: copiado === "ALIAS" ? "#4ade80" : "#ffffff", fontSize: 12, cursor: "pointer", fontFamily: "'Lato', sans-serif", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                      {copiado === "ALIAS" ? "✓ Copiado" : "📋 Copiar"}
                    </button>
                  </div>
                </div>
                {/* CBU/CVU */}
                <div>
                  <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>CBU / CVU</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(45,106,79,0.5)", background: "rgba(0,0,0,0.4)", color: "#ffffff", fontSize: 12, fontFamily: "monospace", wordBreak: "break-all", letterSpacing: "0.03em" }}>
                      {cuentaActiva.cbu}
                    </div>
                    <button onClick={() => copiar(cuentaActiva.cbu, "CBU")} style={{ padding: "10px 12px", borderRadius: 8, background: copiado === "CBU" ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.3)", border: "1px solid rgba(45,106,79,0.5)", color: copiado === "CBU" ? "#4ade80" : "#ffffff", fontSize: 12, cursor: "pointer", fontFamily: "'Lato', sans-serif", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                      {copiado === "CBU" ? "✓ Copiado" : "📋 Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(45,106,79,0.3)", background: "rgba(0,0,0,0.3)", color: "#6b7280", fontSize: 13 }}>
                Próximamente
              </div>
            )}

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

      {/* ── MODAL RETIRAR ── */}
      {mostrarRetirar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border: "1px solid #2d6a4f", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, fontFamily: "'Lato', sans-serif", display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ fontSize: 20, color: "#fbbf24", fontWeight: 900 }}>💸 Solicitud de retiro</div>

            {retiroExito ? (
              <>
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>¡Solicitud enviada!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                    Tu retiro quedó pendiente de aprobación. Lo verás reflejado en tu cuenta en breve.
                  </div>
                </div>
                <button onClick={() => setMostrarRetirar(false)} style={{ width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer", background: "linear-gradient(135deg,#1a472a,#2d6a4f)", border: "1px solid #4ade80", color: "#4ade80", fontFamily: "'Lato', sans-serif", fontSize: 14, fontWeight: 700 }}>
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                  ¿Querés retirar dinero? Realizá una solicitud por un monto mayor a $500 y en breve lo verás reflejado en tu cuenta.
                </div>

                <div style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 8, padding: "8px 12px" }}>
                  Máximo 2 retiros diarios · Monto mínimo $500
                </div>

                {/* Monto */}
                <div>
                  <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Monto</div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 15, fontWeight: 700 }}>$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={retiroMonto}
                      min="0"
                      onChange={e => { setRetiroMonto(e.target.value < 0 ? "0" : e.target.value); setRetiroError(""); }}
                      style={{ width: "100%", padding: "11px 14px 11px 26px", borderRadius: 10, border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.5)", color: "#ffffff", fontFamily: "'Lato', sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    de {((perfil.saldo || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} disponibles
                  </div>
                </div>

                {/* CBU/CVU o Alias */}
                <div>
                  <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>CBU / CVU o Alias destino</div>
                  <input
                    type="text"
                    placeholder="ej: 0000003100012345678901 o mi.alias"
                    value={retiroCbu}
                    onChange={e => { setRetiroCbu(e.target.value); setRetiroError(""); }}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.5)", color: "#ffffff", fontFamily: "'Lato', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {retiroError && (
                  <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                    {retiroError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setMostrarRetirar(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#9ca3af", fontFamily: "'Lato', sans-serif", fontSize: 14 }}>
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      const monto = parseFloat(retiroMonto);
                      if (!retiroMonto || isNaN(monto) || monto < 500) { setRetiroError("El monto mínimo es $500."); return; }
                      if (monto > (perfil.saldo || 0)) { setRetiroError("No tenés saldo suficiente."); return; }
                      if (!retiroCbu.trim()) { setRetiroError("Ingresá el CBU, CVU o Alias de destino."); return; }
                      setRetiroCargando(true);
                      // Verificar límite diario
                      const inicioDia = new Date(); inicioDia.setHours(0,0,0,0);
                      const { count } = await supabase.from("transacciones")
                        .select("*", { count: "exact", head: true })
                        .eq("usuario_id", perfil.usuario_id)
                        .eq("tipo", "retiro")
                        .gte("created_at", inicioDia.toISOString());
                      if (count >= 2) { setRetiroError("Alcanzaste el límite de 2 retiros diarios."); setRetiroCargando(false); return; }
                      const saldoAnterior = perfil.saldo || 0;
                      const { error } = await supabase.from("transacciones").insert({
                        usuario_id: perfil.usuario_id,
                        tipo: "retiro",
                        monto,
                        estado: "pendiente",
                        nota: retiroCbu.trim(),
                        ejecutado_por: perfil.nombre || perfil.usuario_id,
                        saldo_anterior: saldoAnterior,
                        saldo_nuevo: saldoAnterior - monto,
                      });
                      if (error) { console.error("[Home] retiro insert error:", error); setRetiroError("No se pudo enviar la solicitud. Intentá de nuevo."); setRetiroCargando(false); return; }
                      setRetiroExito(true);
                      setRetiroCargando(false);
                    }}
                    disabled={retiroCargando}
                    style={{ flex: 2, padding: "12px", borderRadius: 10, cursor: retiroCargando ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#7f1d1d,#991b1b)", border: "1px solid #f87171", color: "#f87171", fontFamily: "'Lato', sans-serif", fontSize: 14, fontWeight: 700, opacity: retiroCargando ? 0.7 : 1 }}
                  >
                    {retiroCargando ? "Enviando..." : "Solicitar"}
                  </button>
                </div>
              </>
            )}

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

      {/* ── MODAL SALA PRIVADA ── */}
      {mostrarSalaPrivada && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 60, padding: "16px 16px 32px", overflowY: "auto" }}>
          <div style={{ background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border: "1px solid #2d6a4f", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Lato', sans-serif", marginTop: 16 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: 3, textTransform: "uppercase" }}>Truco Argentino</div>
                <div style={{ fontSize: 20, color: "#fbbf24", fontWeight: 900 }}>¿Cómo querés jugar?</div>
              </div>
              <button onClick={() => setMostrarSalaPrivada(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #374151", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* SECCIÓN 1 — Crear partida */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 14, color: "#a78bfa", fontWeight: 900 }}>Jugar partida personalizada</div>

              <div>
                <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Monto</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 15, fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={salaCrearApuesta}
                    min="0"
                    onChange={e => setSalaCrearApuesta(e.target.value < 0 ? "0" : e.target.value)}
                    style={{ width: "100%", padding: "11px 14px 11px 28px", borderRadius: 10, border: `1px solid ${parseFloat(salaCrearApuesta) > (perfil.saldo || 0) ? "#f87171" : "#2d6a4f"}`, background: "rgba(0,0,0,0.5)", color: "#ffffff", fontFamily: "'Lato',sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {parseFloat(salaCrearApuesta) > (perfil.saldo || 0) ? (
                  <div style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>Saldo insuficiente.</div>
                ) : (!salaCrearApuesta || parseFloat(salaCrearApuesta) === 0) ? (
                  <div style={{ fontSize: 12, color: "#4ade80", marginTop: 5 }}>Vas a jugar GRATIS</div>
                ) : null}
              </div>

              <button
                onClick={() => { onCrearSalaPrivada(parseFloat(salaCrearApuesta) || 0); setMostrarSalaPrivada(false); }}
                disabled={parseFloat(salaCrearApuesta) > (perfil.saldo || 0)}
                style={{ width: "100%", padding: "13px", borderRadius: 10, cursor: parseFloat(salaCrearApuesta) > (perfil.saldo || 0) ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#3b0764,#5b21b6)", border: "1px solid #a78bfa", color: "#a78bfa", fontFamily: "'Lato',sans-serif", fontSize: 15, fontWeight: 700, opacity: parseFloat(salaCrearApuesta) > (perfil.saldo || 0) ? 0.45 : 1, transition: "opacity 0.15s" }}
              >
                ¡Crear partida!
              </button>
            </div>

            {/* Separador */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(45,106,79,0.35)" }} />
              <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>¿Ya tenés un código?</span>
              <div style={{ flex: 1, height: 1, background: "rgba(45,106,79,0.35)" }} />
            </div>

            {/* SECCIÓN 2 — Unirse con código */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 14, color: "#a78bfa", fontWeight: 900 }}>Jugar partida por código</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>Ingresá el código de la partida aquí:</div>

              <div>
                <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Código</div>
                <input
                  type="text"
                  placeholder="ej: XKCD42"
                  value={salaUnirseCodigo}
                  onChange={e => { setSalaUnirseCodigo(e.target.value.toUpperCase()); setSalaError(""); }}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.5)", color: "#ffffff", fontFamily: "'Lato',sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box", letterSpacing: 2 }}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Monto</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 15, fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={salaUnirseApuesta}
                    min="0"
                    onChange={e => setSalaUnirseApuesta(e.target.value < 0 ? "0" : e.target.value)}
                    style={{ width: "100%", padding: "11px 14px 11px 28px", borderRadius: 10, border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.5)", color: "#ffffff", fontFamily: "'Lato',sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {salaError && (
                <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "8px 12px" }}>{salaError}</div>
              )}

              <button
                onClick={() => {
                  if (!salaUnirseCodigo.trim()) { setSalaError("Ingresá el código de la partida."); return; }
                  onUnirsePrivado(salaUnirseCodigo.trim(), parseFloat(salaUnirseApuesta) || 0);
                  setMostrarSalaPrivada(false);
                }}
                style={{ width: "100%", padding: "13px", borderRadius: 10, cursor: "pointer", background: "rgba(167,139,250,0.08)", border: "1px solid #a78bfa", color: "#a78bfa", fontFamily: "'Lato',sans-serif", fontSize: 15, fontWeight: 700 }}
              >
                Entrar a la partida
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL VERIFICAR CUENTA ── */}
      {mostrarVerificar && (
        <VerificarCuenta
          perfil={perfil}
          onVerificado={(perfilActualizado) => {
            onPerfilActualizado(perfilActualizado);
            setMostrarVerificar(false);
          }}
          onCerrar={() => setMostrarVerificar(false)}
        />
      )}

    </div>
  );
}
