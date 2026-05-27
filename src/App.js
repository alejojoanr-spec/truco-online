import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import Multijugador from "./Multijugador";
import Terminos from "./Terminos";
import Torneos from "./Torneos";
import Configuracion from "./Configuracion";
import ElegirNombre from "./ElegirNombre";
import ElegirAvatar from "./ElegirAvatar";
import Home from "./Home";
const PALO = { espada: "espada", basto: "basto", copa: "copa", oro: "oro" };
const MAZO = [
  { num: 1, palo: PALO.espada },{ num: 2, palo: PALO.espada },{ num: 3, palo: PALO.espada },
  { num: 4, palo: PALO.espada },{ num: 5, palo: PALO.espada },{ num: 6, palo: PALO.espada },
  { num: 7, palo: PALO.espada },{ num: 10, palo: PALO.espada },{ num: 11, palo: PALO.espada },
  { num: 12, palo: PALO.espada },{ num: 1, palo: PALO.basto },{ num: 2, palo: PALO.basto },
  { num: 3, palo: PALO.basto },{ num: 4, palo: PALO.basto },{ num: 5, palo: PALO.basto },
  { num: 6, palo: PALO.basto },{ num: 7, palo: PALO.basto },{ num: 10, palo: PALO.basto },
  { num: 11, palo: PALO.basto },{ num: 12, palo: PALO.basto },{ num: 1, palo: PALO.copa },
  { num: 2, palo: PALO.copa },{ num: 3, palo: PALO.copa },{ num: 4, palo: PALO.copa },
  { num: 5, palo: PALO.copa },{ num: 6, palo: PALO.copa },{ num: 7, palo: PALO.copa },
  { num: 10, palo: PALO.copa },{ num: 11, palo: PALO.copa },{ num: 12, palo: PALO.copa },
  { num: 1, palo: PALO.oro },{ num: 2, palo: PALO.oro },{ num: 3, palo: PALO.oro },
  { num: 4, palo: PALO.oro },{ num: 5, palo: PALO.oro },{ num: 6, palo: PALO.oro },
  { num: 7, palo: PALO.oro },{ num: 10, palo: PALO.oro },{ num: 11, palo: PALO.oro },
  { num: 12, palo: PALO.oro },
];

function valorTruco(carta) {
  if (carta.num === 1 && carta.palo === PALO.espada) return 14;
  if (carta.num === 1 && carta.palo === PALO.basto) return 13;
  if (carta.num === 7 && carta.palo === PALO.espada) return 12;
  if (carta.num === 7 && carta.palo === PALO.oro) return 11;
  if (carta.num === 3) return 10;
  if (carta.num === 2) return 9;
  if (carta.num === 1) return 8;
  if (carta.num === 12) return 7;
  if (carta.num === 11) return 6;
  if (carta.num === 10) return 5;
  if (carta.num === 7) return 4;
  if (carta.num === 6) return 3;
  if (carta.num === 5) return 2;
  if (carta.num === 4) return 1;
  return 0;
}

function valorEnvido(carta) { return carta.num >= 10 ? 0 : carta.num; }

function calcularEnvido(mano) {
  let mejor = 0;
  for (const palo of Object.values(PALO)) {
    const delPalo = mano.filter((c) => c.palo === palo);
    if (delPalo.length >= 2) {
      const vals = delPalo.map(valorEnvido).sort((a, b) => b - a);
      mejor = Math.max(mejor, 20 + vals[0] + vals[1]);
    } else if (delPalo.length === 1) {
      mejor = Math.max(mejor, valorEnvido(delPalo[0]));
    }
  }
  return mejor;
}

function mezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function repartir() {
  const mazo = mezclar(MAZO);
  return { jugador: mazo.slice(0, 3), rival: mazo.slice(3, 6) };
}


function Carta({ carta, oculta, onClick, jugada, seleccionada }) {
  if (oculta) return (
    <svg width="70" height="110" style={{ cursor:"default", userSelect:"none", opacity: jugada ? 0.5 : 1 }}>
      <rect width="70" height="110" rx="8" fill="#0f3d20"/>
      <rect x="3" y="3" width="64" height="104" rx="6" fill="none" stroke="#2d6a4f" stroke-width="2"/>
      <rect x="6" y="6" width="58" height="98" rx="4" fill="#1a472a"/>
      <text x="35" y="72" fontSize="48" textAnchor="middle" fill="#2d6a4f">🂠</text>
    </svg>
  );

  const palos = {
    espada: {
      color: "#1e3a8a", label: "ESPADA",
      svg: <g transform="translate(35,58)">
        <path d="M-4,-38 L4,-38 L6,10 L0,16 L-6,10 Z" fill="#3b82f6"/>
        <path d="M-1,-38 L1,-38 L1,10 L0,12 L-1,10 Z" fill="#93c5fd"/>
        <path d="M-16,-14 Q-4,-18 4,-10 Q12,-2 20,4" stroke="#dc2626" strokeWidth="2.5" fill="none"/>
        <path d="M16,-14 Q4,-18 -4,-10 Q-12,-2 -20,4" stroke="#16a34a" strokeWidth="2.5" fill="none"/>
        <path d="M-16,12 Q0,6 16,12 Q0,18 -16,12 Z" fill="#b45309"/>
        <rect x="-4" y="14" width="8" height="16" rx="3" fill="#92400e"/>
        <ellipse cx="0" cy="32" rx="7" ry="4" fill="#fbbf24"/>
      </g>
    },
    basto: {
      color: "#78350f", label: "BASTO",
      svg: <g transform="translate(35,58)">
        <path d="M-6,-44 Q-9,-22 -7,0 Q-5,22 -4,40" stroke="#78350f" strokeWidth="11" fill="none" strokeLinecap="round"/>
        <path d="M6,-44 Q9,-22 7,0 Q5,22 4,40" stroke="#78350f" strokeWidth="11" fill="none" strokeLinecap="round"/>
        <path d="M0,-44 Q0,-22 0,0 Q0,22 0,40" stroke="#b45309" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <ellipse cx="0" cy="-14" rx="13" ry="9" fill="#92400e"/>
        <ellipse cx="0" cy="-14" rx="9" ry="6" fill="#b45309"/>
        <ellipse cx="0" cy="16" rx="13" ry="9" fill="#92400e"/>
        <ellipse cx="0" cy="16" rx="9" ry="6" fill="#b45309"/>
        <path d="M-13,-28 Q-22,-36 -16,-44 Q-8,-36 -13,-28 Z" fill="#16a34a"/>
        <path d="M13,-28 Q22,-36 16,-44 Q8,-36 13,-28 Z" fill="#16a34a"/>
        <ellipse cx="0" cy="-44" rx="9" ry="6" fill="#92400e"/>
      </g>
    },
    copa: {
      color: "#dc2626", label: "COPA",
      svg: <g transform="translate(35,56)">
        <path d="M-24,-40 Q-28,-8 -16,10 Q-6,22 0,24 Q6,22 16,10 Q28,-8 24,-40 Z" fill="#dc2626"/>
        <ellipse cx="0" cy="-40" rx="24" ry="6" fill="#b91c1c"/>
        <ellipse cx="0" cy="-40" rx="18" ry="4" fill="#ef4444"/>
        <path d="M-22,-30 Q-24,-8 -14,6" stroke="#fbbf24" strokeWidth="1.5" fill="none"/>
        <path d="M22,-30 Q24,-8 14,6" stroke="#fbbf24" strokeWidth="1.5" fill="none"/>
        <rect x="-22" y="-12" width="44" height="8" rx="2" fill="#b91c1c"/>
        <rect x="-3" y="24" width="6" height="14" rx="3" fill="#6d28d9"/>
        <ellipse cx="0" cy="34" rx="9" ry="5" fill="#7c3aed"/>
        <path d="M-22,38 Q0,32 22,38 Q0,46 -22,38 Z" fill="#1d4ed8"/>
      </g>
    },
    oro: {
      color: "#b45309", label: "ORO",
      svg: <g transform="translate(35,58)">
        <circle cx="0" cy="0" r="30" fill="#b45309"/>
        <circle cx="0" cy="0" r="27" fill="#d97706"/>
        <circle cx="0" cy="0" r="23" fill="none" stroke="#92400e" strokeWidth="2"/>
        <circle cx="0" cy="0" r="19" fill="#f59e0b"/>
        <circle cx="0" cy="0" r="15" fill="none" stroke="#b45309" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="11" fill="#fbbf24"/>
        <circle cx="0" cy="0" r="6" fill="#d97706"/>
        <circle cx="0" cy="-24" r="3" fill="#fef3c7"/>
        <circle cx="0" cy="24" r="3" fill="#fef3c7"/>
        <circle cx="-24" cy="0" r="3" fill="#fef3c7"/>
        <circle cx="24" cy="0" r="3" fill="#fef3c7"/>
        <circle cx="-17" cy="-17" r="2.5" fill="#fef3c7"/>
        <circle cx="17" cy="-17" r="2.5" fill="#fef3c7"/>
        <circle cx="-17" cy="17" r="2.5" fill="#fef3c7"/>
        <circle cx="17" cy="17" r="2.5" fill="#fef3c7"/>
      </g>
    },
  };

  const p = palos[carta.palo] || palos.espada;

  return (
    <svg width="70" height="110" onClick={onClick} style={{
      cursor: onClick && !jugada ? "pointer" : "default",
      userSelect: "none",
      transform: seleccionada ? "translateY(-12px) scale(1.05)" : jugada ? "scale(0.95)" : "none",
      opacity: jugada ? 0.5 : 1,
      transition: "all 0.2s",
      filter: seleccionada ? "drop-shadow(0 0 8px rgba(245,158,11,0.8))" : "none",
    }}>
      <rect width="70" height="110" rx="8" fill="#fffef0"/>
      <rect width="70" height="110" rx="8" fill="none" stroke={seleccionada ? "#f59e0b" : jugada ? "#555" : "#c8960c"} strokeWidth={seleccionada ? "2.5" : "1.5"}/>
      <rect x="4" y="4" width="62" height="102" rx="6" fill="none" stroke="#c8960c" strokeWidth="0.6"/>
      <text x="6" y="20" style={{ fontSize:14, fontWeight:900, fontFamily:"'Lato',sans-serif", fill: jugada ? "#888" : "#1a1a1a" }}>{carta.num}</text>
      <text x="64" y="98" style={{ fontSize:14, fontWeight:900, fontFamily:"'Lato',sans-serif", fill: jugada ? "#888" : "#1a1a1a", textAnchor:"end" }}>{carta.num}</text>
      {p.svg}
      <text x="35" y="107" style={{ fontSize:7, fontWeight:800, fontFamily:"'Lato',sans-serif", fill: jugada ? "#888" : p.color, textAnchor:"middle", letterSpacing:"1.5px" }}>{p.label}</text>
    </svg>
  );
}

function iaJugarCarta(mano, jugadas) {
  let minIdx = -1, minVal = 99;
  mano.forEach((c, i) => { if (!jugadas.includes(i) && valorTruco(c) < minVal) { minVal = valorTruco(c); minIdx = i; } });
  return minIdx;
}

function btnStyle(bg, border) {
  return { background:`${bg}88`,border:`1px solid ${border}`,borderRadius:8,padding:"7px 14px",color:border,fontSize:12,cursor:"pointer",fontFamily:"'Lato',sans-serif",letterSpacing:0.5 };
}

function CajitaPalito({ marcada }) {
  const color = marcada ? "#fbbf24" : "rgba(255,140,160,0.55)";
  const fill  = marcada ? "rgba(251,191,36,0.1)" : "rgba(255,140,160,0.07)";
  return (
    <svg width="11" height="11" style={{ flexShrink:0, display:"block" }}>
      <rect x="0.5" y="0.5" width="10" height="10" rx="1.5" fill={fill} stroke={color} strokeWidth="1"/>
      <line x1="2.5" y1="8.5" x2="8.5" y2="2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function PalitosPuntaje({ puntos, total=15 }) {
  const cols = 5;
  const rows = Math.ceil(total / cols);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      {Array.from({ length:rows }, (_,fila) => (
        <div key={fila} style={{ display:"flex", gap:2 }}>
          {Array.from({ length:cols }, (_,col) => {
            const idx = fila*cols+col;
            if (idx >= total) return null;
            return <CajitaPalito key={col} marcada={idx < puntos} />;
          })}
        </div>
      ))}
    </div>
  );
}

function TrucoApp({ user, perfil, setPerfil, onLogout, onMultijugador, onVerTerminos, onVerTorneos, onHome, rivalNombre = "IA", rivalAvatar = "🤖" }) {
  const [manoJugador, setManoJugador] = useState([]);
  const [manoRival, setManoRival] = useState([]);
  const [jugadasJugador, setJugadasJugador] = useState([]);
  const [jugadasRival, setJugadasRival] = useState([]);
  const [mesaJugador, setMesaJugador] = useState([]);
  const [mesaRival, setMesaRival] = useState([]);
  const [turno, setTurno] = useState("jugador");
  const [puntosJugador, setPuntosJugador] = useState(0);
  const [puntosRival, setPuntosRival] = useState(0);
  const [estadoTruco, setEstadoTruco] = useState(null);
  const [estadoEnvido, setEstadoEnvido] = useState(null);
  const [trucoCantadoPor, setTrucoCantadoPor] = useState(null);
  const [ptsTrucoApostados, setPtsTrucoApostados] = useState(0);
  const [log, setLog] = useState([]);
  const [rondaActual, setRondaActual] = useState(1);
  const [ganadoresRondas, setGanadoresRondas] = useState([]);
  const [fasePartida, setFasePartida] = useState("jugando");
  const [ganadorPartida, setGanadorPartida] = useState(null);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarConfirmSalir, setMostrarConfirmSalir] = useState(false);
  const [cambiarAvatar, setCambiarAvatar] = useState(false);

  const AVATARES = ["👨","👩","👴","👵","🧔","👱","🧑","👮","🧑‍🍳","🥷","🧙","🤠","👸","🤴","🧛","🧜","🧝","🧞","🤖","👾"];

  const [timerSegundos, setTimerSegundos] = useState(15);
  const timerRef = useRef(null);

  function guardarAvatar(av) {
    localStorage.setItem(`truco_avatar_${user.id}`, av);
    setPerfil(p => ({ ...p, avatar: av }));
    setCambiarAvatar(false);
  }
  const addLog = useCallback((msg) => { setLog((prev) => [...prev.slice(-8), msg]); }, []);

  useEffect(() => {
    window.Tawk_API?.hideWidget?.();
    return () => { window.Tawk_API?.showWidget?.(); };
  }, []);

  useEffect(() => { iniciarPartida(); }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (turno === "jugador" && fasePartida === "jugando") {
      setTimerSegundos(15);
      timerRef.current = setInterval(() => {
        setTimerSegundos(s => s - 1);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [turno, fasePartida]);

  useEffect(() => {
    if (timerSegundos <= 0 && turno === "jugador" && fasePartida === "jugando") {
      if (timerRef.current) clearInterval(timerRef.current);
      irseAlMazo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSegundos, turno, fasePartida]);

  function iniciarPartida() {
    const { jugador, rival } = repartir();
    setManoJugador(jugador); setManoRival(rival);
    setJugadasJugador([]); setJugadasRival([]);
    setMesaJugador([]); setMesaRival([]);
    setTurno("jugador"); setEstadoTruco(null); setEstadoEnvido(null);
    setTrucoCantadoPor(null); setPtsTrucoApostados(0); setRondaActual(1); setGanadoresRondas([]);
    setFasePartida("jugando"); setGanadorPartida(null);
    setLog(["🃏 Nueva partida. ¡A jugar!"]); setCartaSeleccionada(null);
  }

  async function actualizarEstadisticas(gano) {
    if (!perfil) return;
    const nuevasJugadas = (perfil.partidas_jugadas || 0) + 1;
    const nuevasGanadas = (perfil.partidas_ganadas || 0) + (gano ? 1 : 0);
    await supabase.from("perfiles").update({
      partidas_jugadas: nuevasJugadas,
      partidas_ganadas: nuevasGanadas,
    }).eq("usuario_id", user.id);
    setPerfil({ ...perfil, partidas_jugadas: nuevasJugadas, partidas_ganadas: nuevasGanadas });
  }

  function jugarCarta(idx) {
    if (turno !== "jugador" || fasePartida !== "jugando") return;
    if (jugadasJugador.includes(idx)) return;
    if (estadoTruco && !["quiero","noquiero"].includes(estadoTruco) && trucoCantadoPor === "rival") return;
    const carta = manoJugador[idx];
    const nuevasJugadas = [...jugadasJugador, idx];
    const nuevaMesa = [...mesaJugador, carta];
    setJugadasJugador(nuevasJugadas); setMesaJugador(nuevaMesa);
    addLog(`Vos jugaste: ${carta.num} de ${carta.palo}`);
    setCartaSeleccionada(null); setTurno("rival");
    if (mesaRival.length > 0) {
      // El rival ya jugó primero esta ronda, evaluar directamente
      const mesaRivalActual = mesaRival;
      const jugadasRivalActual = jugadasRival;
      setTimeout(() => evaluarRonda(nuevaMesa, mesaRivalActual, nuevasJugadas, jugadasRivalActual), 600);
    } else {
      setTimeout(() => jugarRival(nuevasJugadas, nuevaMesa), 900);
    }
  }

  function jugarRival(jugadasJ, mesaJ, jugadasR = jugadasRival) {
    const idxRival = iaJugarCarta(manoRival, jugadasR);
    if (idxRival === -1) return;
    const carta = manoRival[idxRival];
    const nuevasJugadasR = [...jugadasR, idxRival];
    const nuevaMesaR = [...mesaRival, carta];
    setJugadasRival(nuevasJugadasR); setMesaRival(nuevaMesaR);
    addLog(`Rival jugó: ${carta.num} de ${carta.palo}`);
    setTimeout(() => evaluarRonda(mesaJ, nuevaMesaR, jugadasJ, nuevasJugadasR), 600);
  }

  function evaluarRonda(mesaJ, mesaR, jugadasJ, jugadasR) {
    const cartaJ = mesaJ[mesaJ.length-1], cartaR = mesaR[mesaR.length-1];
    const vJ = valorTruco(cartaJ), vR = valorTruco(cartaR);
    const ganador = vJ > vR ? "jugador" : vR > vJ ? "rival" : "empate";
    addLog(ganador==="jugador"?`✅ Ganaste la ronda ${rondaActual}`:ganador==="rival"?`❌ El rival ganó la ronda ${rondaActual}`:`🤝 Empate en ronda ${rondaActual}`);
    const nuevosGanadores = [...ganadoresRondas, ganador];
    setGanadoresRondas(nuevosGanadores);
    setTimeout(() => {
      setMesaJugador([]); setMesaRival([]);
      const ganadorMano = determinarGanadorMano(nuevosGanadores);
      if (ganadorMano || rondaActual+1 > 3 || jugadasJ.length >= 3) {
        resolverMano(ganadorMano || "empate");
      } else {
        setRondaActual(rondaActual+1);
        if (ganador === "rival") {
          // El rival ganó la ronda: juega primero en la siguiente
          setTurno("rival");
          const idxRival = iaJugarCarta(manoRival, jugadasR);
          if (idxRival !== -1) {
            const cartaRival = manoRival[idxRival];
            const nuevasJugadasR = [...jugadasR, idxRival];
            setTimeout(() => {
              setJugadasRival(nuevasJugadasR);
              setMesaRival([cartaRival]);
              addLog(`Rival jugó: ${cartaRival.num} de ${cartaRival.palo}`);
              setTurno("jugador");
            }, 900);
          }
        } else {
          setTurno("jugador");
        }
      }
    }, 1200);
  }

  function determinarGanadorMano(ganadores) {
    const j = ganadores.filter(g=>g==="jugador").length;
    const r = ganadores.filter(g=>g==="rival").length;
    if (j>=2) return "jugador";
    if (r>=2) return "rival";
    if (ganadores.length===3) return ganadores[0]==="jugador"?"jugador":ganadores[0]==="rival"?"rival":"empate";
    return null;
  }

  function resolverMano(ganador) {
    const ptsTruco = estadoTruco === "quiero" ? ptsTrucoApostados : 1;
    let juegoTerminado = false;
    if (ganador === "jugador") {
      const nuevos = puntosJugador + ptsTruco;
      addLog(`🏆 Ganaste la mano (+${ptsTruco} pts)`);
      if (nuevos >= 30) {
        juegoTerminado = true;
        setFasePartida("fin"); setGanadorPartida("jugador");
        actualizarEstadisticas(true);
        addLog("🏆 ¡GANASTE LA PARTIDA!");
      }
      setPuntosJugador(nuevos);
    } else if (ganador === "rival") {
      const nuevos = puntosRival + ptsTruco;
      addLog(`💀 El rival ganó la mano (+${ptsTruco} pts)`);
      if (nuevos >= 30) {
        juegoTerminado = true;
        setFasePartida("fin"); setGanadorPartida("rival");
        actualizarEstadisticas(false);
        addLog("💀 El rival ganó la partida");
      }
      setPuntosRival(nuevos);
    } else addLog("🤝 Mano empatada");
    setTimeout(() => {
      if (!juegoTerminado && fasePartida !== "fin") {
        const { jugador, rival } = repartir();
        setManoJugador(jugador); setManoRival(rival);
        setJugadasJugador([]); setJugadasRival([]);
        setMesaJugador([]); setMesaRival([]);
        setTurno("jugador"); setEstadoTruco(null); setEstadoEnvido(null);
        setTrucoCantadoPor(null); setPtsTrucoApostados(0); setRondaActual(1); setGanadoresRondas([]);
        setCartaSeleccionada(null); addLog("🃏 Nueva mano repartida");
      }
    }, 2000);
  }

  function cantarTruco() {
    if (!trucoDisponible) return;
    setEstadoTruco("truco"); setTrucoCantadoPor("jugador"); addLog("Vos: ¡TRUCO!");
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        setEstadoTruco("noquiero"); addLog("Rival: No quiero");
        addLog("✅ Ganaste 1 punto"); setPuntosJugador(p => p + 1);
      } else if (rand < 0.55) {
        setEstadoTruco("retruco"); setTrucoCantadoPor("rival"); addLog("Rival: ¡RETRUCO!");
      } else {
        setEstadoTruco("quiero"); setPtsTrucoApostados(2); addLog("Rival: ¡Quiero!");
      }
    }, 1000);
  }

  function responderRetruco(respuesta) {
    if (respuesta === "quiero") {
      setEstadoTruco("quiero"); setPtsTrucoApostados(3); addLog("Vos: ¡Quiero!");
    } else if (respuesta === "noquiero") {
      setEstadoTruco("noquiero"); addLog("Vos: No quiero");
      addLog("❌ Rival gana 2 puntos"); setPuntosRival(p => p + 2);
    } else {
      setEstadoTruco("valecuatro"); setTrucoCantadoPor("jugador"); addLog("Vos: ¡VALE CUATRO!");
      setTimeout(() => {
        if (Math.random() > 0.35) {
          setEstadoTruco("quiero"); setPtsTrucoApostados(4); addLog("Rival: ¡Quiero!");
        } else {
          setEstadoTruco("noquiero"); addLog("Rival: No quiero");
          addLog("✅ Ganaste 3 puntos"); setPuntosJugador(p => p + 3);
        }
      }, 1000);
    }
  }

  function cantarEnvido(tipo) {
    if (turno !== "jugador" || fasePartida !== "jugando" || estadoEnvido) return;
    setEstadoEnvido(tipo); addLog(`Vos: ¡${tipo === "envido-envido" ? "ENVIDO ENVIDO" : tipo.toUpperCase()}!`);
    const ptsJ = puntosJugador;
    const ptsR = puntosRival;
    setTimeout(() => {
      const envidoRival = calcularEnvido(manoRival);
      const r = envidoRival >= 25 || Math.random() > 0.5 ? "quiero" : "noquiero";
      setEstadoEnvido(r); addLog(`Rival: ${r === "quiero" ? "¡Quiero!" : "No quiero"}`);
      if (r === "quiero") {
        const envJ = calcularEnvido(manoJugador);
        addLog(`Vos: ${envJ} - Rival: ${envidoRival}`);
        const jugadorGana = envJ >= envidoRival;
        if (tipo === "faltaenvido") {
          const pts = jugadorGana ? 30 - ptsR : 30 - ptsJ;
          if (jugadorGana) { addLog(`✅ Ganaste Falta Envido (+${pts})`); setPuntosJugador(p => p + pts); }
          else { addLog(`❌ Rival ganó Falta Envido (+${pts})`); setPuntosRival(p => p + pts); }
        } else if (tipo === "envido-envido") {
          if (jugadorGana) { addLog("✅ Ganaste Envido Envido (+4)"); setPuntosJugador(p => p + 4); }
          else { addLog("❌ Rival ganó Envido Envido (+4)"); setPuntosRival(p => p + 4); }
        } else {
          if (jugadorGana) { addLog("✅ Ganaste envido (+2)"); setPuntosJugador(p => p + 2); }
          else { addLog("❌ Rival ganó envido (+2)"); setPuntosRival(p => p + 2); }
        }
      } else {
        const ptsNoQ = tipo === "envido-envido" ? 2 : 1;
        addLog(`✅ Ganaste ${ptsNoQ} punto${ptsNoQ > 1 ? "s" : ""} por envido`);
        setPuntosJugador(p => p + ptsNoQ);
      }
    }, 1000);
  }

  function irseAlMazo() {
    addLog("Te fuiste al mazo."); setPuntosRival(p=>p+1);
    setTimeout(()=>resolverMano("rival"),500);
  }

  const esManoDeLasAceites = puntosJugador >= 29 || puntosRival >= 29;
  const envidoDisponible = !estadoEnvido && rondaActual === 1 && jugadasJugador.length === 0;
  const trucoDisponible = !estadoTruco && turno === "jugador" && fasePartida === "jugando" && !esManoDeLasAceites;
  const esperandoRespuestaRetruco = estadoTruco === "retruco" && trucoCantadoPor === "rival";
  const puedeJugar = turno === "jugador" && fasePartida === "jugando" && !esperandoRespuestaRetruco && !(estadoTruco && !["quiero","noquiero"].includes(estadoTruco) && trucoCantadoPor === "rival");
  const winRate = perfil && perfil.partidas_jugadas > 0 ? Math.round((perfil.partidas_ganadas/perfil.partidas_jugadas)*100) : 0;
  const nombreJugador = perfil?.nombre || user.email?.split("@")[0] || "Vos";

  return (
    <div style={{ height:"100dvh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",fontFamily:"'Lato',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 8px 4px",overflow:"hidden",boxSizing:"border-box",gap:4 }}>



      <div style={{ background:"rgba(0,0,0,0.5)",border:"1px solid #2d6a4f",borderRadius:12,padding:"8px 14px",display:"flex",gap:12,alignItems:"flex-start",flexShrink:0 }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:5,maxWidth:128,overflow:"hidden" }}>
            <span style={{ fontSize:13,flexShrink:0 }}>{perfil?.avatar || "👤"}</span>
            <span style={{ fontSize:12,color:"#4ade80",letterSpacing:0.5,fontFamily:"'Lato',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{nombreJugador}</span>
          </div>
          <PalitosPuntaje puntos={puntosJugador} />
        </div>
        <div style={{ width:1,alignSelf:"stretch",background:"#2d6a4f",margin:"0 2px" }}/>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:5,maxWidth:128,overflow:"hidden" }}>
            <span style={{ fontSize:13,flexShrink:0 }}>{rivalAvatar}</span>
            <span style={{ fontSize:12,color:"#f87171",letterSpacing:0.5,fontFamily:"'Lato',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{rivalNombre}</span>
          </div>
          <PalitosPuntaje puntos={puntosRival} />
        </div>
      </div>

      {/* Botón X para abandonar */}
      <button
        onClick={()=>setMostrarConfirmSalir(true)}
        style={{ position:"fixed",top:14,right:14,zIndex:30,width:36,height:36,borderRadius:10,border:"1px solid #374151",background:"rgba(0,0,0,0.6)",color:"#9ca3af",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}
      >✕</button>

      <div style={{ display:"flex",gap:6,flexShrink:0 }}>
        {[1,2,3].map(r=>(
          <div key={r} style={{ width:28,height:8,borderRadius:4,background:r<rondaActual?(ganadoresRondas[r-1]==="jugador"?"#4ade80":ganadoresRondas[r-1]==="rival"?"#f87171":"#888"):r===rondaActual?"#fbbf24":"rgba(255,255,255,0.1)",border:r===rondaActual?"1px solid #fbbf24":"1px solid transparent" }} />
        ))}
      </div>

      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:0 }}>
        <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
          {manoRival.map((c,i)=><Carta key={i} carta={c} oculta={!jugadasRival.includes(i)} jugada={jugadasRival.includes(i)} />)}
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.25)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:16,padding:"8px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:24,width:"100%",maxWidth:400,minWidth:280,flexShrink:0 }}>
        <div style={{ textAlign:"center" }}>
          {mesaRival.length>0?(<><div style={{ fontSize:9,color:"#9ca",marginBottom:4 }}>RIVAL</div><Carta carta={mesaRival[mesaRival.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
        <div style={{ color:"#2d6a4f",fontSize:20 }}>VS</div>
        <div style={{ textAlign:"center" }}>
          {mesaJugador.length>0?(<><div style={{ fontSize:9,color:"#4ade80",marginBottom:4 }}>VOS</div><Carta carta={mesaJugador[mesaJugador.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(45,106,79,0.3)",borderRadius:10,padding:"8px 12px",width:"100%",maxWidth:500,flexShrink:0 }}>
        {log.slice(-2).map((msg,i)=><div key={i} style={{ fontSize:11,color:"#ffffff",lineHeight:1.6,fontFamily:"'Lato',sans-serif" }}>{msg}</div>)}
      </div>

      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:0 }}>
        <div style={{ fontSize:10,color:"#4ade80",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{puedeJugar?"👆 Tocá una carta para jugar":turno==="rival"?"Esperando rival...":"Tu mano"}</div>
        <div style={{ display:"inline-flex", gap:10 }}>
          {manoJugador.map((c,i)=>(
            i===0 ? (
              <div key={i} style={{ position:"relative" }}>
                <Carta carta={c} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada===i}
                  onClick={()=>{ if(!puedeJugar||jugadasJugador.includes(i))return; if(cartaSeleccionada===i)jugarCarta(i); else setCartaSeleccionada(i); }} />
                {turno==="jugador"&&fasePartida==="jugando"&&timerSegundos>0&&(
                  <svg width="44" height="44" style={{ position:"absolute",left:-10,bottom:-10,zIndex:10,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}>
                    <circle cx="22" cy="22" r="17" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                    <circle cx="22" cy="22" r="17" fill="none"
                      stroke={timerSegundos>10?"#4ade80":timerSegundos>5?"#fbbf24":"#f87171"} strokeWidth="3"
                      strokeDasharray={2*Math.PI*17} strokeDashoffset={2*Math.PI*17*(1-timerSegundos/15)}
                      strokeLinecap="round" style={{transform:"rotate(-90deg)",transformOrigin:"22px 22px"}}/>
                    <text x="22" y="22" textAnchor="middle" dominantBaseline="middle"
                      fill={timerSegundos>10?"#4ade80":timerSegundos>5?"#fbbf24":"#f87171"} fontSize="13" fontWeight="700">
                      {timerSegundos}
                    </text>
                  </svg>
                )}
              </div>
            ) : (
              <Carta key={i} carta={c} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada===i}
                onClick={()=>{ if(!puedeJugar||jugadasJugador.includes(i))return; if(cartaSeleccionada===i)jugarCarta(i); else setCartaSeleccionada(i); }} />
            )
          ))}
        </div>
        {cartaSeleccionada!==null&&!jugadasJugador.includes(cartaSeleccionada)&&<div style={{ marginTop:6,fontSize:11,color:"#fbbf24" }}>Tocá de nuevo para confirmar</div>}
      </div>

      <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",maxWidth:500,flexShrink:0,paddingBottom:4 }}>
        {trucoDisponible && <button onClick={cantarTruco} style={btnStyle("#b45309","#fbbf24")}>🗣 Truco</button>}
        {esperandoRespuestaRetruco && <>
          <button onClick={()=>responderRetruco("quiero")} style={btnStyle("#065f46","#4ade80")}>✅ Quiero (3 pts)</button>
          <button onClick={()=>responderRetruco("noquiero")} style={btnStyle("#7f1d1d","#f87171")}>❌ No quiero</button>
          {!esManoDeLasAceites && <button onClick={()=>responderRetruco("valecuatro")} style={btnStyle("#92400e","#fbbf24")}>🗣 Vale Cuatro</button>}
        </>}
        {envidoDisponible && <>
          <button onClick={()=>cantarEnvido("envido")} style={btnStyle("#1d4ed8","#60a5fa")}>Envido</button>
          <button onClick={()=>cantarEnvido("realenvido")} style={btnStyle("#5b21b6","#a78bfa")}>Real Envido</button>
          <button onClick={()=>cantarEnvido("faltaenvido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button>
        </>}
        <button onClick={irseAlMazo} style={btnStyle("#7f1d1d","#f87171")}>Ir al mazo</button>
      </div>


      {mostrarPerfil&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,padding:"16px" }}>
          <div style={{ background:"#0a2414",border:"1px solid #2d6a4f",borderRadius:16,padding:"28px",textAlign:"center",width:"100%",maxWidth:320 }}>

            {/* Avatar + botón cambiar */}
            <div style={{ position:"relative",display:"inline-block",marginBottom:8 }}>
              <div style={{ fontSize:72,lineHeight:1 }}>{perfil?.avatar || "👤"}</div>
              <button
                onClick={()=>setCambiarAvatar(v=>!v)}
                style={{ position:"absolute",bottom:-4,right:-8,background:"#1a472a",border:"1px solid #4ade80",borderRadius:"50%",width:24,height:24,fontSize:12,cursor:"pointer",color:"#4ade80",display:"flex",alignItems:"center",justifyContent:"center" }}
              >✏️</button>
            </div>

            {/* Picker de avatar inline */}
            {cambiarAvatar&&(
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10,color:"#4ade80",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>Elegí un avatar</div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6 }}>
                  {AVATARES.map(av=>(
                    <button
                      key={av}
                      onClick={()=>guardarAvatar(av)}
                      style={{ fontSize:24,padding:"6px 0",borderRadius:10,cursor:"pointer",
                        background: perfil?.avatar===av?"rgba(74,222,128,0.15)":"rgba(0,0,0,0.3)",
                        border: perfil?.avatar===av?"2px solid #4ade80":"2px solid rgba(45,106,79,0.3)",
                        transform: perfil?.avatar===av?"scale(1.1)":"scale(1)",
                        transition:"all 0.15s",
                      }}
                    >{av}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize:22,color:"#fbbf24",fontWeight:900,marginBottom:16 }}>{perfil?.nombre || user.email?.split("@")[0]}</div>
            <div style={{ display:"flex",gap:12,justifyContent:"center",marginBottom:16 }}>
              <div style={{ background:"rgba(0,0,0,0.4)",borderRadius:10,padding:"10px 16px" }}>
                <div style={{ fontSize:24,color:"#4ade80",fontWeight:900 }}>{perfil?.partidas_jugadas||0}</div>
                <div style={{ fontSize:10,color:"#6b9",textTransform:"uppercase",letterSpacing:1 }}>Jugadas</div>
              </div>
              <div style={{ background:"rgba(0,0,0,0.4)",borderRadius:10,padding:"10px 16px" }}>
                <div style={{ fontSize:24,color:"#fbbf24",fontWeight:900 }}>{perfil?.partidas_ganadas||0}</div>
                <div style={{ fontSize:10,color:"#6b9",textTransform:"uppercase",letterSpacing:1 }}>Ganadas</div>
              </div>
              <div style={{ background:"rgba(0,0,0,0.4)",borderRadius:10,padding:"10px 16px" }}>
                <div style={{ fontSize:24,color:"#60a5fa",fontWeight:900 }}>{winRate}%</div>
                <div style={{ fontSize:10,color:"#6b9",textTransform:"uppercase",letterSpacing:1 }}>Win rate</div>
              </div>
            </div>
            <button onClick={()=>{ setMostrarPerfil(false); setCambiarAvatar(false); }} style={{ ...btnStyle("#1a472a","#4ade80"),fontSize:14,padding:"10px 24px" }}>Cerrar</button>
          </div>
        </div>
      )}



      {mostrarConfig&&<Configuracion onCerrar={()=>setMostrarConfig(false)} />}

      {mostrarConfirmSalir&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:30 }}>
          <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid #2d6a4f",borderRadius:20,padding:"32px 28px",textAlign:"center",maxWidth:320,width:"100%",fontFamily:"'Lato',sans-serif" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🚪</div>
            <div style={{ fontSize:18,color:"#fbbf24",fontWeight:900,marginBottom:24,lineHeight:1.4 }}>¿Querés abandonar la partida?</div>
            <div style={{ display:"flex",gap:10 }}>
              <button
                onClick={()=>setMostrarConfirmSalir(false)}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.05)",border:"1px solid #374151",color:"#ffffff",fontFamily:"'Lato',sans-serif",fontSize:14 }}
              >Cancelar</button>
              <button
                onClick={onHome}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#7f1d1d,#991b1b)",border:"1px solid #f87171",color:"#ffffff",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700 }}
              >Salir</button>
            </div>
          </div>
        </div>
      )}

      {fasePartida==="fin"&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,flexDirection:"column",gap:16 }}>
          <div style={{ fontSize:64 }}>{ganadorPartida==="jugador"?"🏆":"💀"}</div>
          <div style={{ fontSize:32,fontWeight:900,color:ganadorPartida==="jugador"?"#fbbf24":"#f87171" }}>{ganadorPartida==="jugador"?"¡GANASTE!":"PERDISTE"}</div>
          <div style={{ color:"#9ca3af",fontSize:14 }}>{puntosJugador} – {puntosRival}</div>
          {perfil&&<div style={{ color:"#4ade80",fontSize:13 }}>Partidas ganadas: {perfil.partidas_ganadas} / {perfil.partidas_jugadas}</div>}
          <button onClick={iniciarPartida} style={{ ...btnStyle("#1a472a","#4ade80"),fontSize:16,padding:"12px 32px",marginTop:8 }}>Jugar de nuevo</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [necesitaNombre, setNecesitaNombre] = useState(false);
  const [necesitaAvatar, setNecesitaAvatar] = useState(false);
  const [modoJuego, setModoJuego] = useState(null); // null=home, "single"=vs IA, "multi"=multijugador
  const [verTerminos, setVerTerminos] = useState(false);
  const [verTorneos, setVerTorneos] = useState(false);
  const [mostrarConfigHome, setMostrarConfigHome] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        cargarPerfil(u);
      } else {
        setPerfil(null);
        setNecesitaNombre(false);
        setNecesitaAvatar(false);
        setCargando(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function cargarPerfil(u) {
    const cacheKey = `truco_perfil_${u.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const p = JSON.parse(cached);
        if (p && p.nombre) {
          const avatar = localStorage.getItem(`truco_avatar_${u.id}`) || p.avatar || "👤";
          setPerfil({ ...p, avatar });
          setCargando(false);
          return;
        }
      } catch {}
    }
    const { data } = await supabase.from("perfiles").select("*").eq("usuario_id", u.id).maybeSingle();
    if (data && data.nombre) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      const avatar = localStorage.getItem(`truco_avatar_${u.id}`) || "👤";
      setPerfil({ ...data, avatar });
    } else {
      setNecesitaNombre(true);
    }
    setCargando(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  if (cargando) return (
    <div style={{ minHeight:"100vh",background:"#050f08",display:"flex",alignItems:"center",justifyContent:"center",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:18 }}>Cargando...</div>
  );
  if (!user) return <Auth />;
  if (necesitaNombre) return <ElegirNombre user={user} onPerfilCreado={(p) => { localStorage.setItem(`truco_perfil_${user.id}`, JSON.stringify(p)); setPerfil(p); setNecesitaNombre(false); setNecesitaAvatar(true); }} />;
  if (necesitaAvatar) return <ElegirAvatar perfil={perfil} onAvatarGuardado={(p) => { setPerfil(p); setNecesitaAvatar(false); }} />;
  if (verTerminos) return <Terminos onVolver={()=>setVerTerminos(false)} />;
  if (verTorneos) return <Torneos user={user} perfil={perfil} onVolver={()=>setVerTorneos(false)} />;
  if (modoJuego === "multi") return <Multijugador user={user} perfil={perfil} onVolver={()=>setModoJuego(null)} />;
  if (modoJuego === "single") return <TrucoApp user={user} perfil={perfil} setPerfil={setPerfil} onLogout={handleLogout} onMultijugador={()=>setModoJuego("multi")} onVerTerminos={()=>setVerTerminos(true)} onVerTorneos={()=>setVerTorneos(true)} onHome={()=>setModoJuego(null)} />;
  return (
    <>
      <Home perfil={perfil} onJugar={()=>setModoJuego("single")} onSalaPrivada={()=>setModoJuego("multi")} onLogout={handleLogout} onVerTerminos={()=>setVerTerminos(true)} onConfig={()=>setMostrarConfigHome(true)} onPerfilActualizado={setPerfil} />
      {mostrarConfigHome && <Configuracion onCerrar={()=>setMostrarConfigHome(false)} />}
    </>
  );
}