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
        fontFamily: "Georgia, serif", fontSize: 15,
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

export default function Home({ perfil, onJugar, onSalaPrivada, onLogout, onVerTerminos, onConfig }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [mostrarReglas, setMostrarReglas] = useState(false);
  const [mostrarConfirmSalir, setMostrarConfirmSalir] = useState(false);
  const [ranking, setRanking] = useState([]);

  const winRate = perfil.partidas_jugadas > 0
    ? Math.round((perfil.partidas_ganadas / perfil.partidas_jugadas) * 100)
    : 0;

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
      justifyContent: "center", fontFamily: "Georgia, serif",
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
      }}>
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
          <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900, fontFamily: "Georgia, serif" }}>{perfil.nombre}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 16, color: "#4ade80", fontWeight: 900, fontFamily: "Georgia, serif" }}>{perfil.partidas_jugadas || 0}</div>
              <div style={{ fontSize: 9, color: "#ffffff", textTransform: "uppercase", letterSpacing: 1 }}>Jugadas</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 900, fontFamily: "Georgia, serif" }}>{perfil.partidas_ganadas || 0}</div>
              <div style={{ fontSize: 9, color: "#ffffff", textTransform: "uppercase", letterSpacing: 1 }}>Ganadas</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: "#60a5fa", fontWeight: 900, fontFamily: "Georgia, serif" }}>{winRate}%</div>
              <div style={{ fontSize: 9, color: "#ffffff", textTransform: "uppercase", letterSpacing: 1 }}>Win rate</div>
            </div>
          </div>
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
            <div style={{ fontSize: 18, color: "#4ade80", fontWeight: 900, fontFamily: "Georgia, serif" }}>Jugar ahora</div>
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
            <div style={{ fontSize: 18, color: "#a78bfa", fontWeight: 900, fontFamily: "Georgia, serif" }}>Sala privada</div>
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
            <button onClick={() => setMostrarRanking(false)} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 8, padding: "10px 28px", color: "#4ade80", fontSize: 14, cursor: "pointer", fontFamily: "Georgia" }}>Cerrar</button>
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
                <div style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.6, paddingLeft: 24 }}>{texto}</div>
              </div>
            ))}
            <button onClick={() => setMostrarReglas(false)} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 8, padding: "10px", color: "#4ade80", fontSize: 14, cursor: "pointer", fontFamily: "Georgia", marginTop: 8 }}>Cerrar</button>
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
              <button onClick={() => setMostrarConfirmSalir(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#9ca3af", fontFamily: "Georgia, serif", fontSize: 14 }}>Cancelar</button>
              <button onClick={onLogout} style={{ flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", background: "linear-gradient(135deg,#7f1d1d,#991b1b)", border: "1px solid #f87171", color: "#f87171", fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700 }}>Salir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
