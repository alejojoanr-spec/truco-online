export default function Home({ perfil, onJugar, onSalaPrivada, onLogout }) {
  const winRate = perfil.partidas_jugadas > 0
    ? Math.round((perfil.partidas_ganadas / perfil.partidas_jugadas) * 100)
    : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "Georgia, serif",
      padding: "24px 16px", gap: 20,
    }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 4, textTransform: "uppercase" }}>Bienvenido a</div>
        <div style={{ fontSize: 32, color: "#fbbf24", fontWeight: 900, lineHeight: 1.1 }}>Truco Argentino</div>
      </div>

      {/* Card usuario */}
      <div style={{
        background: "rgba(0,0,0,0.5)", border: "1px solid #2d6a4f",
        borderRadius: 20, padding: "20px 28px", textAlign: "center",
        width: "100%", maxWidth: 340,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
          background: "radial-gradient(circle,#1a472a,#050f08)",
          border: "2px solid #4ade80",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36,
          boxShadow: "0 0 16px rgba(74,222,128,0.2)",
        }}>
          {perfil.avatar || "👤"}
        </div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900 }}>{perfil.nombre}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 16, color: "#4ade80", fontWeight: 700 }}>{perfil.partidas_jugadas || 0}</div>
              <div style={{ fontSize: 9, color: "#6b9", textTransform: "uppercase", letterSpacing: 1 }}>Jugadas</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 700 }}>{perfil.partidas_ganadas || 0}</div>
              <div style={{ fontSize: 9, color: "#6b9", textTransform: "uppercase", letterSpacing: 1 }}>Ganadas</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: "#60a5fa", fontWeight: 700 }}>{winRate}%</div>
              <div style={{ fontSize: 9, color: "#6b9", textTransform: "uppercase", letterSpacing: 1 }}>Win rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340 }}>

        <button onClick={onJugar} style={{
          background: "linear-gradient(135deg,#1a472a,#2d6a4f)",
          border: "1px solid #4ade80", borderRadius: 16, padding: "20px 24px",
          cursor: "pointer", textAlign: "left", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "transform 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🃏</div>
            <div style={{ fontSize: 18, color: "#4ade80", fontWeight: 900, fontFamily: "Georgia, serif" }}>Jugar ahora</div>
            <div style={{ fontSize: 12, color: "#6b9", marginTop: 2 }}>Contra la IA</div>
          </div>
          <div style={{ fontSize: 28, color: "#4ade80", opacity: 0.6 }}>→</div>
        </button>

        <button onClick={onSalaPrivada} style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid #a78bfa", borderRadius: 16, padding: "20px 24px",
          cursor: "pointer", textAlign: "left", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "transform 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>👥</div>
            <div style={{ fontSize: 18, color: "#a78bfa", fontWeight: 900, fontFamily: "Georgia, serif" }}>Sala privada</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Conectá con tus amigos</div>
          </div>
          <div style={{ fontSize: 28, color: "#a78bfa", opacity: 0.6 }}>→</div>
        </button>

      </div>

      {/* Acciones secundarias */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={onLogout} style={{
          background: "none", border: "1px solid #374151", borderRadius: 8,
          padding: "6px 14px", color: "#6b7280", fontSize: 12,
          cursor: "pointer", fontFamily: "Georgia, serif",
        }}>
          Salir
        </button>
      </div>

    </div>
  );
}
