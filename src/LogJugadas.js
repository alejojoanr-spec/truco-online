import { useState, useEffect } from "react";

// Mismo patrón que useEsMobile() de MesaJuego.js, pero para el otro extremo:
// oculta el panel por debajo de 1366px de ancho de viewport (ver justificación
// del breakpoint: a esa medida la caja del juego mide ~460px, dejando ~450px
// de margen de sobra de cada lado — más que suficiente para 300px de panel).
function useAnchoDesktop(bp = 1366) {
  const [d, setD] = useState(() => typeof window !== "undefined" && window.matchMedia(`(min-width:${bp}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width:${bp}px)`);
    const h = e => setD(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return d;
}

export function LogJugadas({ entries }) {
  const esDesktop = useAnchoDesktop(1366);
  if (!esDesktop) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, height: "100vh", width: 300,
      background: "linear-gradient(180deg, rgba(10,36,20,0.92), rgba(5,15,8,0.92))",
      borderRight: "1px solid rgba(45,106,79,0.5)",
      display: "flex", flexDirection: "column",
      padding: "20px 16px", boxSizing: "border-box",
      fontFamily: "'Lato',sans-serif", zIndex: 20,
    }}>
      <div style={{ fontSize: 13, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14, flexShrink: 0 }}>
        Registro de jugadas
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column-reverse", gap: 8 }}>
        {entries.length === 0 && (
          <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Todavía no pasó nada.
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 700, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {entry.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
