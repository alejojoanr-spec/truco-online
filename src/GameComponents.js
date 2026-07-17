export function btnStyle() {
  return { background:"#3f3f3f",border:"1px solid #6b7280",borderRadius:8,padding:"7px 14px",color:"#ffffff",fontSize:14,cursor:"pointer",fontFamily:"'Lato',sans-serif",letterSpacing:0.5,minHeight:50,display:"flex",alignItems:"center",justifyContent:"center" };
}

function GrupoCinco({ activos }) {
  const a = "#fbbf24";
  const i = "rgba(255,140,160,0.35)";
  const c = (n) => activos >= n ? a : i;
  return (
    <svg width="28" height="20" style={{ flexShrink:0 }}>
      <line x1="4"  y1="1" x2="4"  y2="19" stroke={c(1)} strokeWidth="2" strokeLinecap="round"/>
      <line x1="11" y1="1" x2="11" y2="19" stroke={c(2)} strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="1" x2="18" y2="19" stroke={c(3)} strokeWidth="2" strokeLinecap="round"/>
      <line x1="25" y1="1" x2="25" y2="19" stroke={c(4)} strokeWidth="2" strokeLinecap="round"/>
      <line x1="27" y1="1" x2="1"  y2="19" stroke={c(5)} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function PalitosPuntaje({ puntos, total = 15 }) {
  const POR_GRUPO = 5;
  const GRUPOS_POR_FILA = 3;
  const puntosEscalados = Math.round(puntos / (total / 15));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      <div style={{ display:"flex", gap:8 }}>
        {Array.from({ length:GRUPOS_POR_FILA }, (_, grupo) => {
          const base = grupo * POR_GRUPO;
          return <GrupoCinco key={grupo} activos={Math.min(POR_GRUPO, Math.max(0, puntosEscalados - base))} />;
        })}
      </div>
      <div style={{ fontSize:8, color:"#4b5563", textAlign:"right", lineHeight:1 }}>/ {total}</div>
    </div>
  );
}

export function Carta({ carta, oculta, onClick, jugada, seleccionada, escala = 1 }) {
  const W = 70 * escala, H = 110 * escala;
  if (oculta) return (
    <svg width={W} height={H} viewBox="0 0 70 110" style={{ cursor:"default", userSelect:"none", flexShrink:0, opacity: jugada ? 0.5 : 1, filter:"drop-shadow(0 5px 14px rgba(0,0,0,0.45)) drop-shadow(0 2px 5px rgba(0,0,0,0.3))" }}>
      <defs>
        <pattern id="dorso-rombos" x="0" y="0" width="10" height="8" patternUnits="userSpaceOnUse">
          <polygon points="5,0 10,4 5,8 0,4" fill="#0e2617" stroke="#3a7a55" strokeWidth="0.9"/>
        </pattern>
      </defs>
      <rect width="70" height="110" rx="8" fill="#0f3d20"/>
      <rect x="3" y="3" width="64" height="104" rx="6" fill="none" stroke="#2d6a4f" strokeWidth="2"/>
      <rect x="6" y="6" width="58" height="98" rx="4" fill="#1a472a"/>
      <rect x="10" y="15" width="50" height="80" rx="2" fill="url(#dorso-rombos)"/>
      <rect x="10" y="15" width="50" height="80" rx="2" fill="none" stroke="#2d6a4f" strokeWidth="0.8"/>
      <rect width="70" height="110" rx="8" fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="1"/>
    </svg>
  );

  return (
    <div
      onClick={onClick}
      style={{
        width: W, height: H, flexShrink: 0,
        userSelect: "none", position: "relative",
        background: "transparent",
        cursor: onClick && !jugada ? "pointer" : "default",
        opacity: jugada ? 0.5 : 1,
        transform: jugada ? "scale(0.95)" : "none",
        transition: "all 0.2s",
        filter: seleccionada
          ? "drop-shadow(0 6px 10px rgba(0,0,0,0.6)) drop-shadow(0 0 6px rgba(245,158,11,0.75))"
          : jugada
          ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
          : "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
      }}
    >
      <img
        src={`/cartas/${carta.palo}_${carta.num}.png`}
        alt={`${carta.num} de ${carta.palo}`}
        style={{ width:"100%", height:"100%", display:"block", objectFit:"contain" }}
        draggable={false}
      />
    </div>
  );
}
