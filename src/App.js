import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import Multijugador from "./Multijugador";
import Terminos from "./Terminos";
import Torneos from "./Torneos";
import Configuracion from "./Configuracion";
import ElegirNombre from "./ElegirNombre";
import ElegirAvatar from "./ElegirAvatar";
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
      <text x="6" y="20" style={{ fontSize:14, fontWeight:900, fontFamily:"Georgia,serif", fill: jugada ? "#888" : "#1a1a1a" }}>{carta.num}</text>
      <text x="64" y="98" style={{ fontSize:14, fontWeight:900, fontFamily:"Georgia,serif", fill: jugada ? "#888" : "#1a1a1a", textAnchor:"end" }}>{carta.num}</text>
      {p.svg}
      <text x="35" y="107" style={{ fontSize:7, fontWeight:800, fontFamily:"Georgia,serif", fill: jugada ? "#888" : p.color, textAnchor:"middle", letterSpacing:"1.5px" }}>{p.label}</text>
    </svg>
  );
}

function iaJugarCarta(mano, jugadas) {
  let minIdx = -1, minVal = 99;
  mano.forEach((c, i) => { if (!jugadas.includes(i) && valorTruco(c) < minVal) { minVal = valorTruco(c); minIdx = i; } });
  return minIdx;
}

const QUICK_CHAT = ["¡Buena mano!", "Vamos 💪", "¡Qué suerte!", "Jajaja 😄", "Buena partida 🤝"];
function btnStyle(bg, border) {
  return { background:`${bg}88`,border:`1px solid ${border}`,borderRadius:8,padding:"7px 14px",color:border,fontSize:12,cursor:"pointer",fontFamily:"Georgia",letterSpacing:0.5 };
}

function TrucoApp({ user, perfil, setPerfil, onLogout, onMultijugador, onVerTerminos, onVerTorneos }) {
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
  const [log, setLog] = useState([]);
  const [rondaActual, setRondaActual] = useState(1);
  const [ganadoresRondas, setGanadoresRondas] = useState([]);
  const [fasePartida, setFasePartida] = useState("jugando");
  const [ganadorPartida, setGanadorPartida] = useState(null);
  const [chatMsg, setChatMsg] = useState(null);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarConfirmSalir, setMostrarConfirmSalir] = useState(false);
  const [cambiarAvatar, setCambiarAvatar] = useState(false);

  const AVATARES = ["👨","👩","👴","👵","🧔","👱","🧑","👮","🧑‍🍳","🥷","🧙","🤠","👸","🤴","🧛","🧜","🧝","🧞","🤖","👾"];

  function guardarAvatar(av) {
    localStorage.setItem(`truco_avatar_${user.id}`, av);
    setPerfil(p => ({ ...p, avatar: av }));
    setCambiarAvatar(false);
  }
  const [ranking, setRanking] = useState([]);

  const addLog = useCallback((msg) => { setLog((prev) => [...prev.slice(-8), msg]); }, []);

  useEffect(() => { iniciarPartida(); }, []);

  function iniciarPartida() {
    const { jugador, rival } = repartir();
    setManoJugador(jugador); setManoRival(rival);
    setJugadasJugador([]); setJugadasRival([]);
    setMesaJugador([]); setMesaRival([]);
    setTurno("jugador"); setEstadoTruco(null); setEstadoEnvido(null);
    setTrucoCantadoPor(null); setRondaActual(1); setGanadoresRondas([]);
    setFasePartida("jugando"); setGanadorPartida(null);
    setLog(["🃏 Nueva partida. ¡A jugar!"]); setCartaSeleccionada(null);
  }

  async function cargarRanking() {
    const { data } = await supabase.from("perfiles").select("nombre, partidas_jugadas, partidas_ganadas").order("partidas_ganadas", { ascending: false }).limit(10);
    if (data) setRanking(data);
    setMostrarRanking(true);
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
    const ptsTruco = estadoTruco==="quiero"?2:1;
    let juegoTerminado = false;
    if (ganador==="jugador") {
      const nuevos = puntosJugador + ptsTruco;
      addLog(`🏆 Ganaste la mano (+${ptsTruco} pts)`);
      if (nuevos >= 15) {
        juegoTerminado = true;
        setFasePartida("fin"); setGanadorPartida("jugador");
        actualizarEstadisticas(true);
        addLog("🏆 ¡GANASTE LA PARTIDA!");
      }
      setPuntosJugador(nuevos);
    } else if (ganador==="rival") {
      const nuevos = puntosRival + ptsTruco;
      addLog(`💀 El rival ganó la mano (+${ptsTruco} pts)`);
      if (nuevos >= 15) {
        juegoTerminado = true;
        setFasePartida("fin"); setGanadorPartida("rival");
        actualizarEstadisticas(false);
        addLog("💀 El rival ganó la partida");
      }
      setPuntosRival(nuevos);
    } else addLog("🤝 Mano empatada");
    setTimeout(() => {
      if (!juegoTerminado && fasePartida!=="fin") {
        const { jugador, rival } = repartir();
        setManoJugador(jugador); setManoRival(rival);
        setJugadasJugador([]); setJugadasRival([]);
        setMesaJugador([]); setMesaRival([]);
        setTurno("jugador"); setEstadoTruco(null); setEstadoEnvido(null);
        setTrucoCantadoPor(null); setRondaActual(1); setGanadoresRondas([]);
        setCartaSeleccionada(null); addLog("🃏 Nueva mano repartida");
      }
    }, 2000);
  }

  function cantarTruco() {
    if (turno!=="jugador"||fasePartida!=="jugando"||estadoTruco) return;
    setEstadoTruco("truco"); setTrucoCantadoPor("jugador"); addLog("Vos: ¡TRUCO!");
    setTimeout(() => {
      const r = Math.random()>0.35?"quiero":"noquiero";
      setEstadoTruco(r); addLog(`Rival: ${r==="quiero"?"¡Quiero!":"No quiero"}`);
      if (r==="noquiero") { addLog("✅ Ganaste 1 punto"); setPuntosJugador(p=>p+1); }
    }, 1000);
  }

  function cantarEnvido(tipo) {
    if (turno!=="jugador"||fasePartida!=="jugando"||estadoEnvido) return;
    setEstadoEnvido(tipo); addLog(`Vos: ¡${tipo.toUpperCase()}!`);
    setTimeout(() => {
      const envidoRival = calcularEnvido(manoRival);
      const r = envidoRival>=25||Math.random()>0.5?"quiero":"noquiero";
      setEstadoEnvido(r); addLog(`Rival: ${r==="quiero"?"¡Quiero!":"No quiero"}`);
      if (r==="quiero") {
        const envJ = calcularEnvido(manoJugador);
        addLog(`Vos: ${envJ} - Rival: ${envidoRival}`);
        if (envJ>=envidoRival) { addLog("✅ Ganaste envido (+2)"); setPuntosJugador(p=>p+2); }
        else { addLog("❌ Rival ganó envido (+2)"); setPuntosRival(p=>p+2); }
      } else { addLog("✅ Ganaste 1 punto por envido"); setPuntosJugador(p=>p+1); }
    }, 1000);
  }

  function irseAlMazo() {
    addLog("Te fuiste al mazo."); setPuntosRival(p=>p+1);
    setTimeout(()=>resolverMano("rival"),500);
  }

  const envidoDisponible = !estadoEnvido&&rondaActual===1&&jugadasJugador.length===0;
  const trucoDisponible = !estadoTruco&&turno==="jugador"&&fasePartida==="jugando";
  const puedeJugar = turno==="jugador"&&fasePartida==="jugando"&&!(estadoTruco&&!["quiero","noquiero"].includes(estadoTruco)&&trucoCantadoPor==="rival");
  const winRate = perfil && perfil.partidas_jugadas > 0 ? Math.round((perfil.partidas_ganadas/perfil.partidas_jugadas)*100) : 0;

  return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 8px",overflow:"hidden" }}>

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",maxWidth:600,marginBottom:12 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10,color:"#4ade80",letterSpacing:3,textTransform:"uppercase" }}>Truco</div>
          <div style={{ fontSize:28,color:"#fbbf24",fontWeight:900,lineHeight:1 }}>Argentino</div>
        </div>
        <div style={{ background:"rgba(0,0,0,0.5)",border:"1px solid #2d6a4f",borderRadius:12,padding:"8px 20px",textAlign:"center" }}>
          <div style={{ fontSize:9,color:"#6b9",letterSpacing:2,textTransform:"uppercase" }}>Puntos</div>
          <div style={{ display:"flex",gap:16,alignItems:"center",marginTop:2 }}>
            <div><div style={{ fontSize:10,color:"#9ca",marginBottom:2 }}>Vos</div><div style={{ fontSize:28,color:"#4ade80",fontWeight:900,lineHeight:1 }}>{puntosJugador}</div></div>
            <div style={{ color:"#2d6a4f",fontSize:18 }}>–</div>
            <div><div style={{ fontSize:10,color:"#9ca",marginBottom:2 }}>Rival</div><div style={{ fontSize:28,color:"#f87171",fontWeight:900,lineHeight:1 }}>{puntosRival}</div></div>
          </div>
          <div style={{ fontSize:9,color:"#4a7",marginTop:2 }}>Meta: 15 pts</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          <div style={{ fontSize:10,color:"#4ade80",textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4 }}>
            <span style={{ fontSize:18 }}>{perfil?.avatar || "👤"}</span>
            {perfil?.nombre || user.email?.split("@")[0]}
          </div>
          <button onClick={()=>setMostrarPerfil(true)} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:8,padding:"4px 10px",color:"#4ade80",fontSize:10,cursor:"pointer" }}>Mi perfil</button>
          <button onClick={cargarRanking} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #fbbf24",borderRadius:8,padding:"4px 10px",color:"#fbbf24",fontSize:10,cursor:"pointer" }}>🏆 Ranking</button>
          <button onClick={onMultijugador} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #a78bfa",borderRadius:8,padding:"4px 10px",color:"#a78bfa",fontSize:10,cursor:"pointer" }}>👥 2 Jugadores</button>
          <button onClick={iniciarPartida} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:8,padding:"4px 10px",color:"#4ade80",fontSize:10,cursor:"pointer" }}>Nueva</button>
          <button onClick={()=>setMostrarConfirmSalir(true)} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #7f1d1d",borderRadius:8,padding:"4px 10px",color:"#f87171",fontSize:10,cursor:"pointer" }}>Salir</button>
          <button onClick={onVerTorneos} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #fbbf24",borderRadius:8,padding:"4px 10px",color:"#fbbf24",fontSize:10,cursor:"pointer" }}>🏆 Torneos</button>
          <button onClick={()=>setMostrarConfig(true)} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #6b7280",borderRadius:8,padding:"4px 10px",color:"#9ca3af",fontSize:10,cursor:"pointer" }}>⚙️ Config</button>
        </div>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:10 }}>
        {[1,2,3].map(r=>(
          <div key={r} style={{ width:28,height:8,borderRadius:4,background:r<rondaActual?(ganadoresRondas[r-1]==="jugador"?"#4ade80":ganadoresRondas[r-1]==="rival"?"#f87171":"#888"):r===rondaActual?"#fbbf24":"rgba(255,255,255,0.1)",border:r===rondaActual?"1px solid #fbbf24":"1px solid transparent" }} />
        ))}
      </div>

      <div style={{ marginBottom:16,textAlign:"center" }}>
        <div style={{ fontSize:10,color:"#f87171",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{turno==="rival"?"⟳ Rival piensa...":"Rival"}</div>
        <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
          {manoRival.map((c,i)=><Carta key={i} carta={c} oculta={!jugadasRival.includes(i)} jugada={jugadasRival.includes(i)} />)}
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.25)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:16,padding:"12px 24px",marginBottom:16,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",gap:24,width:"100%",maxWidth:400,minWidth:280 }}>
        <div style={{ textAlign:"center" }}>
          {mesaRival.length>0?(<><div style={{ fontSize:9,color:"#9ca",marginBottom:4 }}>RIVAL</div><Carta carta={mesaRival[mesaRival.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
        <div style={{ color:"#2d6a4f",fontSize:20 }}>VS</div>
        <div style={{ textAlign:"center" }}>
          {mesaJugador.length>0?(<><div style={{ fontSize:9,color:"#4ade80",marginBottom:4 }}>VOS</div><Carta carta={mesaJugador[mesaJugador.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(45,106,79,0.3)",borderRadius:10,padding:"8px 12px",width:"100%",maxWidth:500,marginBottom:12,maxHeight:80,overflowY:"auto" }}>
        {log.slice(-4).map((msg,i)=><div key={i} style={{ fontSize:11,color:i===log.slice(-4).length-1?"#e2f5e9":"rgba(180,220,190,0.5)",lineHeight:1.6 }}>{msg}</div>)}
      </div>

      <div style={{ marginBottom:14,textAlign:"center" }}>
        <div style={{ fontSize:10,color:"#4ade80",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{puedeJugar?"👆 Tocá una carta para jugar":turno==="rival"?"Esperando rival...":"Tu mano"}</div>
        <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
          {manoJugador.map((c,i)=>(
            <Carta key={i} carta={c} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada===i}
              onClick={()=>{ if(!puedeJugar||jugadasJugador.includes(i))return; if(cartaSeleccionada===i)jugarCarta(i); else setCartaSeleccionada(i); }} />
          ))}
        </div>
        {cartaSeleccionada!==null&&!jugadasJugador.includes(cartaSeleccionada)&&<div style={{ marginTop:6,fontSize:11,color:"#fbbf24" }}>Tocá de nuevo para confirmar</div>}
      </div>

      <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",maxWidth:500,marginBottom:10 }}>
        {trucoDisponible&&<button onClick={cantarTruco} style={btnStyle("#b45309","#fbbf24")}>🗣 Truco</button>}
        {envidoDisponible&&<><button onClick={()=>cantarEnvido("envido")} style={btnStyle("#1d4ed8","#60a5fa")}>Envido</button><button onClick={()=>cantarEnvido("realenvido")} style={btnStyle("#5b21b6","#a78bfa")}>Real Envido</button><button onClick={()=>cantarEnvido("faltaenvido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button></>}
        <button onClick={irseAlMazo} style={btnStyle("#7f1d1d","#f87171")}>Ir al mazo</button>
      </div>

      <div style={{ display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center" }}>
        {QUICK_CHAT.map((msg,i)=>(
          <button key={i} onClick={()=>{ setChatMsg(msg); addLog(`Vos: "${msg}"`); setTimeout(()=>setChatMsg(null),2000); }} style={{ background:"rgba(0,0,0,0.3)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:20,padding:"4px 10px",color:"#9ca3af",fontSize:10,cursor:"pointer" }}>{msg}</button>
        ))}
      </div>

      {chatMsg&&<div style={{ position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#1a472a",border:"1px solid #4ade80",borderRadius:20,padding:"8px 16px",color:"#4ade80",fontSize:13,zIndex:10 }}>💬 {chatMsg}</div>}

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

      {mostrarRanking&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20 }}>
          <div style={{ background:"#0a2414",border:"1px solid #2d6a4f",borderRadius:16,padding:"32px",textAlign:"center",minWidth:320,maxWidth:420 }}>
            <div style={{ fontSize:32,marginBottom:8 }}>🏆</div>
            <div style={{ fontSize:22,color:"#fbbf24",fontWeight:900,marginBottom:16 }}>Ranking</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:16 }}>
              {ranking.length===0&&<div style={{ color:"#6b7280",fontSize:13 }}>Sin jugadores aún</div>}
              {ranking.map((p,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:12,background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"10px 16px" }}>
                  <div style={{ fontSize:20,width:32 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}</div>
                  <div style={{ fontSize:26,width:32,textAlign:"center" }}>{p.nombre===perfil?.nombre?(perfil?.avatar||"👤"):"👤"}</div>
                  <div style={{ flex:1,textAlign:"left" }}>
                    <div style={{ color: p.nombre===perfil?.nombre?"#4ade80":"#e2f5e9",fontSize:13,fontWeight:700 }}>{p.nombre}</div>
                    <div style={{ color:"#6b9",fontSize:10 }}>{p.partidas_jugadas} jugadas</div>
                  </div>
                  <div style={{ color:"#fbbf24",fontSize:16,fontWeight:900 }}>{p.partidas_ganadas} 🏆</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setMostrarRanking(false)} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:8,padding:"8px 24px",color:"#4ade80",fontSize:14,cursor:"pointer",fontFamily:"Georgia" }}>Cerrar</button>
          </div>
        </div>
      )}

      {mostrarConfig&&<Configuracion onCerrar={()=>setMostrarConfig(false)} />}

      {mostrarConfirmSalir&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:30 }}>
          <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid #2d6a4f",borderRadius:20,padding:"32px 28px",textAlign:"center",maxWidth:320,width:"100%",fontFamily:"Georgia,serif" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🚪</div>
            <div style={{ fontSize:18,color:"#fbbf24",fontWeight:900,marginBottom:8 }}>Cerrar sesión</div>
            <div style={{ fontSize:13,color:"#9ca3af",marginBottom:24,lineHeight:1.6 }}>¿Estás seguro que deseas cerrar sesión?</div>
            <div style={{ display:"flex",gap:10 }}>
              <button
                onClick={()=>setMostrarConfirmSalir(false)}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.05)",border:"1px solid #374151",color:"#9ca3af",fontFamily:"Georgia,serif",fontSize:14 }}
              >Cancelar</button>
              <button
                onClick={onLogout}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#7f1d1d,#991b1b)",border:"1px solid #f87171",color:"#f87171",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700 }}
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
  const [modoMulti, setModoMulti] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false);
  const [verTorneos, setVerTorneos] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user);
      else setCargando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user);
      else { setPerfil(null); setCargando(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function cargarPerfil(u) {
    const { data } = await supabase.from("perfiles").select("*").eq("usuario_id", u.id).single();
    if (!data) {
      setNecesitaNombre(true);
    } else {
      const avatarLocal = localStorage.getItem(`truco_avatar_${u.id}`);
      setPerfil(avatarLocal ? { ...data, avatar: avatarLocal } : data);
    }
    setCargando(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  if (cargando) return (
    <div style={{ minHeight:"100vh",background:"#050f08",display:"flex",alignItems:"center",justifyContent:"center",color:"#4ade80",fontFamily:"Georgia",fontSize:18 }}>Cargando...</div>
  );
  if (!user) return <Auth />;
  if (necesitaNombre) return <ElegirNombre user={user} onPerfilCreado={(p) => { setPerfil(p); setNecesitaNombre(false); }} />;
  if (perfil && !perfil.avatar) return <ElegirAvatar perfil={perfil} onAvatarGuardado={(p) => setPerfil(p)} />;
  if (modoMulti) return <Multijugador user={user} perfil={perfil} onVolver={()=>setModoMulti(false)} />;
  if (verTerminos) return <Terminos onVolver={()=>setVerTerminos(false)} />;
  if (verTorneos) return <Torneos user={user} perfil={perfil} onVolver={()=>setVerTorneos(false)} />;
return <TrucoApp user={user} perfil={perfil} setPerfil={setPerfil} onLogout={handleLogout} onMultijugador={()=>setModoMulti(true)} onVerTerminos={()=>setVerTerminos(true)} onVerTorneos={()=>setVerTorneos(true)} />;}