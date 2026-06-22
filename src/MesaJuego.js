import { Carta, PalitosPuntaje } from "./GameComponents";

const MESA_E = 0.91;
const MW = 70 * MESA_E;
const MH = 110 * MESA_E;

function Slot() {
  return (
    <div style={{ width:MW, height:MH, borderRadius:8*MESA_E, border:"1px solid rgba(107,114,128,0.22)", background:"rgba(0,0,0,0.12)", flexShrink:0 }} />
  );
}

export function MesaJuego({
  avatarJugador, nombreJugador, puntosJugador,
  avatarRival, nombreRival, puntosRival,
  limitePuntos,
  rivalHand,
  rondas,
  manoJugador,
  jugadasJugador = [],
  cartaSeleccionada,
  onClickCarta,
  timerSegundos,
  instruccion,
  botonesSlot,
  log,
  onSalir,
}) {
  const rivalCards = typeof rivalHand === "number"
    ? Array(rivalHand).fill({ oculta: true })
    : rivalHand;

  return (
    <div style={{ height:"100dvh", background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)", fontFamily:"'Lato',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 8px 4px", overflow:"hidden", boxSizing:"border-box", gap:4 }}>

      {/* Marcador */}
      <div style={{ background:"rgba(0,0,0,0.5)", border:"1px solid #2d6a4f", borderRadius:12, padding:"8px 14px", display:"flex", gap:12, alignItems:"flex-start", flexShrink:0 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5, maxWidth:128, overflow:"hidden" }}>
            <span style={{ fontSize:13, flexShrink:0 }}>{avatarJugador || "👤"}</span>
            <span style={{ fontSize:12, color:"#4ade80", letterSpacing:0.5, fontFamily:"'Lato',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nombreJugador}</span>
          </div>
          <PalitosPuntaje puntos={puntosJugador} total={limitePuntos} />
        </div>
        <div style={{ width:1, alignSelf:"stretch", background:"#2d6a4f", margin:"0 2px" }}/>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5, maxWidth:128, overflow:"hidden" }}>
            <span style={{ fontSize:13, flexShrink:0 }}>{avatarRival || "👤"}</span>
            <span style={{ fontSize:12, color:"#f87171", letterSpacing:0.5, fontFamily:"'Lato',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nombreRival}</span>
          </div>
          <PalitosPuntaje puntos={puntosRival} total={limitePuntos} />
        </div>
      </div>

      <button onClick={onSalir} style={{ position:"fixed", top:14, right:14, zIndex:30, width:36, height:36, borderRadius:10, border:"1px solid #374151", background:"rgba(0,0,0,0.6)", color:"#9ca3af", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>✕</button>

      {/* Mano del rival */}
      <div style={{ display:"flex", gap:8, justifyContent:"center", flexShrink:0 }}>
        {rivalCards.map((c, i) => (
          <Carta key={i} carta={c.carta} escala={0.82} oculta={c.oculta !== false} jugada={c.jugada} />
        ))}
      </div>

      {/* Mesa — 3 slots fijos */}
      <div style={{ background:"rgba(0,0,0,0.25)", border:"1px solid rgba(45,106,79,0.4)", borderRadius:16, padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:14, width:"100%", maxWidth:420, height:225, flexShrink:0 }}>
        {rondas.map((r, ri) => (
          <div key={ri} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            {r.rival ? <Carta carta={r.rival} escala={MESA_E} /> : <Slot />}
            {r.jugador ? <Carta carta={r.jugador} escala={MESA_E} /> : <Slot />}
          </div>
        ))}
      </div>

      {/* Mano del jugador */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#4ade80", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
          {instruccion}
        </div>
        <div style={{ display:"inline-flex", gap:10 }}>
          {manoJugador.map((c, i) => (
            i === 0 && timerSegundos != null ? (
              <div key={i} style={{ position:"relative" }}>
                <Carta carta={c} escala={1.1} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada === i}
                  onClick={jugadasJugador.includes(i) ? undefined : () => onClickCarta(i)} />
                {timerSegundos > 0 && (
                  <svg width="44" height="44" style={{ position:"absolute", left:-10, bottom:-10, zIndex:10, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}>
                    <circle cx="22" cy="22" r="17" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                    <circle cx="22" cy="22" r="17" fill="none" stroke="#4ade80" strokeWidth="3"
                      strokeDasharray={2*Math.PI*17} strokeDashoffset={2*Math.PI*17*(1 - timerSegundos/15)}
                      strokeLinecap="round" style={{ transform:"rotate(-90deg)", transformOrigin:"22px 22px" }}/>
                    <text x="22" y="22" textAnchor="middle" dominantBaseline="middle" fill="#4ade80" fontSize="13" fontWeight="700">
                      {timerSegundos}
                    </text>
                  </svg>
                )}
              </div>
            ) : (
              <Carta key={i} carta={c} escala={1.1} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada === i}
                onClick={jugadasJugador.includes(i) ? undefined : () => onClickCarta(i)} />
            )
          ))}
        </div>
        {cartaSeleccionada !== null && !jugadasJugador.includes(cartaSeleccionada) && (
          <div style={{ marginTop:6, fontSize:11, color:"#fbbf24" }}>Tocá de nuevo para confirmar</div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:500, flexShrink:0, paddingBottom:4 }}>
        {botonesSlot}
      </div>

      {/* Log — últimas 2 líneas */}
      {log && log.length > 0 && (
        <div style={{ background:"rgba(0,0,0,0.35)", border:"1px solid rgba(45,106,79,0.3)", borderRadius:10, padding:"6px 12px", width:"100%", maxWidth:500, flexShrink:0 }}>
          {log.slice(-2).map((msg, i, arr) => (
            <div key={i} style={{ fontSize:11, color: i === arr.length - 1 ? "#e2f5e9" : "rgba(180,220,190,0.5)", lineHeight:1.6 }}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
