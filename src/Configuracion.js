import { useState } from "react";

const CONFIG_KEY = "truco_config";

const DEFAULT_CONFIG = {
  voces: true,
  sonidoCartas: true,
  efectosPuntos: true,
  sonidoVictoria: true,
};

export function leerConfig() {
  try {
    const guardado = localStorage.getItem(CONFIG_KEY);
    return guardado ? { ...DEFAULT_CONFIG, ...JSON.parse(guardado) } : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function guardarConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

const OPCIONES = [
  { key: "voces",          label: "Voces",               icono: "🎙️", desc: "Narración hablada del juego" },
  { key: "sonidoCartas",   label: "Sonido de cartas",    icono: "🃏", desc: "Sonido al jugar una carta" },
  { key: "efectosPuntos",  label: "Efectos de puntos",   icono: "✨", desc: "Efectos al sumar puntos" },
  { key: "sonidoVictoria", label: "Sonido de victoria",  icono: "🏆", desc: "Fanfarria al ganar la partida" },
];

function Toggle({ activo, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
        background: activo ? "linear-gradient(135deg,#16a34a,#4ade80)" : "rgba(255,255,255,0.1)",
        position: "relative", transition: "background 0.25s", flexShrink: 0,
        boxShadow: activo ? "0 0 8px rgba(74,222,128,0.4)" : "none",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: activo ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: activo ? "#ffffff" : "rgba(255,255,255,0.4)",
        transition: "left 0.25s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        display: "block",
      }} />
    </button>
  );
}

export default function Configuracion({ onCerrar }) {
  const [config, setConfig] = useState(leerConfig);

  function toggleOpcion(key) {
    const nueva = { ...config, [key]: !config[key] };
    setConfig(nueva);
    guardarConfig(nueva);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20,
    }}>
      <div style={{
        background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",
        border: "1px solid #2d6a4f", borderRadius: 20,
        padding: "28px 28px 24px", width: "100%", maxWidth: 360,
        fontFamily: "Georgia, serif",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}>

        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Argentino</div>
            <div style={{ fontSize: 20, color: "#fbbf24", fontWeight: 900, lineHeight: 1.2 }}>⚙️ Configuración</div>
          </div>
          <button
            onClick={onCerrar}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #374151", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >✕</button>
        </div>

        {/* Sección de sonido */}
        <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
          Sonido y audio
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
          {OPCIONES.map(({ key, label, icono, desc }) => (
            <div
              key={key}
              onClick={() => toggleOpcion(key)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "rgba(0,0,0,0.3)", border: "1px solid rgba(45,106,79,0.35)",
                borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                transition: "border-color 0.2s",
                borderColor: config[key] ? "rgba(74,222,128,0.3)" : "rgba(45,106,79,0.2)",
              }}
            >
              <span style={{ fontSize: 22, width: 28, textAlign: "center", flexShrink: 0 }}>{icono}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: config[key] ? "#e2f5e9" : "#6b7280", fontSize: 14, fontWeight: 700, transition: "color 0.2s" }}>{label}</div>
                <div style={{ color: "#4b5563", fontSize: 10, marginTop: 2 }}>{desc}</div>
              </div>
              <Toggle activo={config[key]} onChange={() => toggleOpcion(key)} />
            </div>
          ))}
        </div>

        {/* Nota al pie */}
        <div style={{ fontSize: 10, color: "#374151", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
          Las preferencias se guardan automáticamente en este dispositivo
        </div>

        <button
          onClick={onCerrar}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer",
            background: "linear-gradient(135deg,#1a472a,#2d6a4f)",
            border: "1px solid #4ade80", color: "#4ade80",
            fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, letterSpacing: 1,
          }}
        >
          Listo
        </button>

      </div>
    </div>
  );
}
