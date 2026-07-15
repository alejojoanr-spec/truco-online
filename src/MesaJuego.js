import { useState, useEffect } from "react";
import { Carta, PalitosPuntaje } from "./GameComponents";

const MESA_E = 0.91;
const MW = 70 * MESA_E;
const MH = 110 * MESA_E;

const FAN_OVERLAP = -18;
const FAN_ANGLE = 8;

const PANO_MARGIN_TOP = 32;

// Tamaño de "diseño" de referencia: iPhone 14 (390x844), con el que se
// calibraron a mano las ~60 medidas fijas de este archivo. El resto de la
// pantalla se escala en bloque para que el mismo layout se vea proporcional
// en cualquier dispositivo, sin tocar ninguna medida individual.
const DISENO_W = 390;
const ESCALA_MIN = 0.75;
const ESCALA_MAX = 1.5;

// Alto mínimo (a escala 1x) que necesita el contenido del lienzo para
// mostrarse completo sin cortarse (calculado sumando todos los bloques
// fijos: marcador, paño, mano, botones, gaps y padding, con margen).
// El panel de botones ahora puede ocupar 2 filas (máx. 3 por fila), así
// que se suman ~48px extra (segunda fila ~40px + gap:8) al cálculo base.
const ALTURA_MINIMA_CONTENIDO = 700;

function calcularDimensionesPantalla() {
  if (typeof window === "undefined") return { escala: 1, alturaLienzo: 844 };
  const cruda = Math.min(window.innerWidth / DISENO_W, window.innerHeight / ALTURA_MINIMA_CONTENIDO);
  const escala = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, cruda));
  const alturaLienzo = window.innerHeight / escala;
  return { escala, alturaLienzo };
}

function useEscalaPantalla() {
  const [dimensiones, setDimensiones] = useState(calcularDimensionesPantalla);
  useEffect(() => {
    const onResize = () => setDimensiones(calcularDimensionesPantalla());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return dimensiones;
}

function useEsMobile(bp = 480) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(`(max-width:${bp}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const h = e => setM(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return m;
}

function Slot() {
  return (
    <div style={{ width:MW, height:MH, flexShrink:0 }} />
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
  rivalTimerSegundos,
  instruccion,
  botonesSlot,
  log,
  onSalir,
  esMiTurno = true,
}) {
  const esMobile = useEsMobile();
  const { escala, alturaLienzo } = useEscalaPantalla();
  const valorTimer = esMiTurno ? timerSegundos : rivalTimerSegundos;
  const colorTimer = esMiTurno ? "#4ade80" : "#f87171";

  return (
    <div style={{ height:"100dvh", width:"100%", background:"#101010", display:"flex", justifyContent:"center", alignItems:"center", overflow:"hidden", boxSizing:"border-box" }}>
    <div style={{
      width: DISENO_W,
      height: alturaLienzo,
      transform: `scale(${escala})`,
      transformOrigin: "center",
      flexShrink: 0,
      overflowX: "hidden",
      overflowY: "auto",
      background:"#101010", fontFamily:"'Lato',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 8px 4px", boxSizing:"border-box", gap:2,
    }}>

      {/* X de salir */}
      <div style={{ width:"100%", maxWidth:640, display:"flex", justifyContent:"flex-end", flexShrink:0, margin:"0 auto" }}>
        <button onClick={onSalir} style={{ width:36, height:36, borderRadius:10, border:"none", background:"rgba(0,0,0,0.6)", color:"#9ca3af", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>✕</button>
      </div>

      {/* Marcador */}
      <div style={{ background:"rgba(0,0,0,0.5)", border:"1px solid #2d6a4f", borderRadius:12, padding:"8px 14px", display:"flex", gap:12, alignItems:"flex-start", flexShrink:0, width:"100%", maxWidth:640, margin:"0 auto", boxSizing:"border-box" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5, maxWidth:128, overflow:"hidden" }}>
            <img src={avatarJugador && avatarJugador.startsWith("/avatars/") ? avatarJugador : "/avatars/avatar_01.png"} alt="" style={{ width:20, height:20, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
            <span style={{ fontSize:12, color:"#4ade80", letterSpacing:0.5, fontFamily:"'Lato',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nombreJugador}</span>
          </div>
          <PalitosPuntaje puntos={puntosJugador} total={limitePuntos} />
        </div>
        <div style={{ width:1, alignSelf:"stretch", background:"#2d6a4f", margin:"0 2px" }}/>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5, maxWidth:128, overflow:"hidden" }}>
            <img src={avatarRival && avatarRival.startsWith("/avatars/") ? avatarRival : "/avatars/avatar_01.png"} alt="" style={{ width:20, height:20, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
            <span style={{ fontSize:12, color:"#f87171", letterSpacing:0.5, fontFamily:"'Lato',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nombreRival}</span>
          </div>
          <PalitosPuntaje puntos={puntosRival} total={limitePuntos} />
        </div>
      </div>

      {/* Mesa — 3 slots fijos */}
      <div style={{ background:"#1a472a", border:"1px solid rgba(45,106,79,0.4)", borderRadius:16, padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:14, width:"100%", maxWidth: esMobile ? 300 : 420, margin:"0 auto", marginTop:PANO_MARGIN_TOP, flexGrow:1, minHeight:228 }}>
        {rondas.map((r, ri) => (
          <div key={ri} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            {r.rival ? <Carta carta={r.rival} escala={MESA_E} /> : <Slot />}
            {r.jugador ? <Carta carta={r.jugador} escala={MESA_E} /> : <Slot />}
          </div>
        ))}
      </div>

      {/* Mano del jugador */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#ffffff", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
          {instruccion}
        </div>
        <div style={{ position:"relative", display:"inline-flex", alignItems:"flex-end" }}>
          {valorTimer != null && valorTimer > 0 && (
            <svg width="44" height="44" style={{ position:"absolute", right:"100%", bottom:0, marginRight:16, transform:"scale(1.05)", filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}>
              <circle cx="22" cy="22" r="17" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
              <circle cx="22" cy="22" r="17" fill="none" stroke={colorTimer} strokeWidth="3"
                strokeDasharray={2*Math.PI*17} strokeDashoffset={2*Math.PI*17*(1 - valorTimer/15)}
                strokeLinecap="round" style={{ transform:"rotate(-90deg)", transformOrigin:"22px 22px" }}/>
              <text x="22" y="22" textAnchor="middle" dominantBaseline="middle" fill={colorTimer} fontSize="13" fontWeight="700">
                {valorTimer}
              </text>
            </svg>
          )}
          <div style={{
            display:"inline-flex",
            alignItems:"flex-end",
            filter: esMiTurno ? "none" : "grayscale(1) opacity(0.85)",
            pointerEvents: esMiTurno ? "auto" : "none",
            transition: "filter 0.2s",
          }}>
            {manoJugador.map((c, i) => {
              const n = manoJugador.length;
              const angulo = n <= 1 ? 0 : -FAN_ANGLE + i * ((2 * FAN_ANGLE) / (n - 1));
              const estaSeleccionada = cartaSeleccionada === i;
              const wrapperStyle = {
                position: "relative",
                transform: `rotate(${estaSeleccionada ? 0 : angulo}deg)`,
                transformOrigin: "bottom center",
                marginLeft: i === 0 ? 0 : FAN_OVERLAP,
                zIndex: estaSeleccionada ? 100 : i,
                transition: "transform 0.2s",
              };
              return (
                <div key={i} style={wrapperStyle}>
                  <Carta carta={c} escala={1.1} jugada={jugadasJugador.includes(i)} seleccionada={estaSeleccionada}
                    onClick={jugadasJugador.includes(i) ? undefined : () => onClickCarta(i)} />
                </div>
              );
            })}
          </div>
        </div>
        {cartaSeleccionada !== null && !jugadasJugador.includes(cartaSeleccionada) && (
          <div style={{ marginTop:6, fontSize:11, color:"#fbbf24" }}>Tocá de nuevo para confirmar</div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{
        width: "calc(100% + 16px)",
        marginLeft: -8,
        marginTop: -10,
        marginBottom: -4,
        background: "#1c1c1c",
        flexShrink: 0,
        boxSizing: "border-box",
        padding: "0 8px 4px",
        position: "relative",
        zIndex: 150,
      }}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", alignItems:"center", alignContent:"center", width:"100%", maxWidth:500, margin:"0 auto", minHeight:92 }}>
          {botonesSlot}
        </div>
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
    </div>
  );
}
