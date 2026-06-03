import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import Multijugador from "./Multijugador";
import Terminos from "./Terminos";
import Privacidad from "./Privacidad";
import Torneos from "./Torneos";
import Configuracion, { leerConfig } from "./Configuracion";
import ElegirNombre from "./ElegirNombre";
import ElegirAvatar from "./ElegirAvatar";
import Home from "./Home";
import Lobby from "./Lobby";
import Admin from "./Admin";
import BotonSoporte from "./Soporte";

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


function Carta({ carta, oculta, onClick, jugada, seleccionada, escala = 1 }) {
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
        width: W, height: H, borderRadius: 8 * escala, flexShrink: 0,
        overflow: "hidden", userSelect: "none", position: "relative",
        background: "white",
        cursor: onClick && !jugada ? "pointer" : "default",
        opacity: jugada ? 0.5 : 1,
        transform: seleccionada ? `translateY(${-12*escala}px) scale(1.05)` : jugada ? "scale(0.95)" : "none",
        transition: "all 0.2s",
        border: seleccionada ? `${2.5*escala}px solid #f59e0b` : "none",
        boxShadow: seleccionada
          ? "0 6px 16px rgba(0,0,0,0.6), 0 0 10px rgba(245,158,11,0.75)"
          : jugada
          ? "0 2px 5px rgba(0,0,0,0.3)"
          : "0 0 0 1px rgba(0,0,0,0.78), 0 6px 16px rgba(0,0,0,0.45)",
      }}
    >
      <img
        src={`/cartas/${carta.palo}_${carta.num}.png`}
        alt={`${carta.num} de ${carta.palo}`}
        style={{ position:"absolute", width:H, height:W, top:(H-W)/2, left:(W-H)/2, transform:"rotate(-90deg)", transformOrigin:"center center" }}
        draggable={false}
      />
    </div>
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

function PalitosPuntaje({ puntos, total=15 }) {
  const POR_GRUPO = 5;
  const GRUPOS_POR_FILA = 3;
  const POR_FILA = POR_GRUPO * GRUPOS_POR_FILA;
  const filas = total / POR_FILA;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {Array.from({ length:filas }, (_,fila) => (
        <div key={fila} style={{ display:"flex", gap:8 }}>
          {Array.from({ length:GRUPOS_POR_FILA }, (_,grupo) => {
            const base = fila*POR_FILA + grupo*POR_GRUPO;
            return <GrupoCinco key={grupo} activos={Math.min(POR_GRUPO, Math.max(0, puntos-base))} />;
          })}
        </div>
      ))}
    </div>
  );
}

const _audioCartaCache = { obj: null };
function reproducirSonidoCarta() {
  if (!leerConfig().sonidoCartas) return;
  try {
    if (!_audioCartaCache.obj) {
      _audioCartaCache.obj = new Audio("/sounds/carta.wav");
      _audioCartaCache.obj.volume = 0.45;
    }
    _audioCartaCache.obj.currentTime = 0;
    _audioCartaCache.obj.play().catch(() => {});
  } catch {}
}

const _audioPuntoCache = { obj: null };
function reproducirSonidoPunto() {
  if (!leerConfig().efectosPuntos) return;
  try {
    if (!_audioPuntoCache.obj) {
      _audioPuntoCache.obj = new Audio("/sounds/punto.wav");
      _audioPuntoCache.obj.volume = 0.45;
    }
    _audioPuntoCache.obj.currentTime = 0;
    _audioPuntoCache.obj.play().catch(() => {});
  } catch {}
}

const _audioVictoriaCache = { obj: null };
function reproducirSonidoVictoria() {
  if (!leerConfig().sonidoVictoria) return;
  try {
    if (!_audioVictoriaCache.obj) {
      _audioVictoriaCache.obj = new Audio("/sounds/victoria.wav");
      _audioVictoriaCache.obj.volume = 0.55;
    }
    _audioVictoriaCache.obj.currentTime = 0;
    _audioVictoriaCache.obj.play().catch(() => {});
  } catch {}
}

const _audioDerrotaCache = { obj: null };
function reproducirSonidoDerrota() {
  if (!leerConfig().sonidoVictoria) return;
  try {
    if (!_audioDerrotaCache.obj) {
      _audioDerrotaCache.obj = new Audio("/sounds/derrota.wav");
      _audioDerrotaCache.obj.volume = 0.55;
    }
    _audioDerrotaCache.obj.currentTime = 0;
    _audioDerrotaCache.obj.play().catch(() => {});
  } catch {}
}

const _vozQueue = [];
let _vozPlaying = false;
function _procesarVozQueue() {
  if (_vozPlaying || _vozQueue.length === 0) return;
  _vozPlaying = true;
  const audio = new Audio(`/sounds/${_vozQueue.shift()}.mp3`);
  audio.onended = () => { _vozPlaying = false; _procesarVozQueue(); };
  audio.onerror  = () => { _vozPlaying = false; _procesarVozQueue(); };
  audio.play().catch(() => { _vozPlaying = false; _procesarVozQueue(); });
}
function reproducirVoz(nombre) {
  if (!leerConfig().voces) return;
  _vozQueue.push(nombre);
  _procesarVozQueue();
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
  // eslint-disable-next-line no-unused-vars
  const addLog = useCallback((_msg) => {}, []);


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
    setCartaSeleccionada(null);
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
    reproducirSonidoCarta();
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
    reproducirSonidoCarta();
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
              reproducirSonidoCarta();
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
        reproducirSonidoVictoria();
      } else {
        reproducirSonidoPunto();
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
        reproducirSonidoDerrota();
      } else {
        reproducirSonidoPunto();
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
    reproducirVoz('truco');
    setEstadoTruco("truco"); setTrucoCantadoPor("jugador"); addLog("Vos: ¡TRUCO!");
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        reproducirVoz('no_quiero');
        setEstadoTruco("noquiero"); addLog("Rival: No quiero");
        addLog("✅ Ganaste 1 punto"); setPuntosJugador(p => p + 1); reproducirSonidoPunto();
      } else if (rand < 0.55) {
        reproducirVoz('retruco');
        setEstadoTruco("retruco"); setTrucoCantadoPor("rival"); addLog("Rival: ¡RETRUCO!");
      } else {
        reproducirVoz('quiero');
        setEstadoTruco("quiero"); setPtsTrucoApostados(2); addLog("Rival: ¡Quiero!");
      }
    }, 1000);
  }

  function responderRetruco(respuesta) {
    if (respuesta === "quiero") {
      reproducirVoz('quiero');
      setEstadoTruco("quiero"); setPtsTrucoApostados(3); addLog("Vos: ¡Quiero!");
    } else if (respuesta === "noquiero") {
      reproducirVoz('no_quiero');
      setEstadoTruco("noquiero"); addLog("Vos: No quiero");
      addLog("❌ Rival gana 2 puntos"); setPuntosRival(p => p + 2); reproducirSonidoPunto();
    } else {
      reproducirVoz('vale_cuatro');
      setEstadoTruco("valecuatro"); setTrucoCantadoPor("jugador"); addLog("Vos: ¡VALE CUATRO!");
      setTimeout(() => {
        if (Math.random() > 0.35) {
          reproducirVoz('quiero');
          setEstadoTruco("quiero"); setPtsTrucoApostados(4); addLog("Rival: ¡Quiero!");
        } else {
          reproducirVoz('no_quiero');
          setEstadoTruco("noquiero"); addLog("Rival: No quiero");
          addLog("✅ Ganaste 3 puntos"); setPuntosJugador(p => p + 3); reproducirSonidoPunto();
        }
      }, 1000);
    }
  }

  function cantarEnvido(tipo) {
    if (turno !== "jugador" || fasePartida !== "jugando" || estadoEnvido) return;
    const vozEnv = tipo === 'realenvido' ? 'real_envido' : tipo === 'faltaenvido' ? 'falta_envido' : 'envido';
    reproducirVoz(vozEnv);
    setEstadoEnvido(tipo); addLog(`Vos: ¡${tipo === "envido-envido" ? "ENVIDO ENVIDO" : tipo.toUpperCase()}!`);
    const ptsJ = puntosJugador;
    const ptsR = puntosRival;
    setTimeout(() => {
      const envidoRival = calcularEnvido(manoRival);
      const r = envidoRival >= 25 || Math.random() > 0.5 ? "quiero" : "noquiero";
      reproducirVoz(r === 'quiero' ? 'quiero' : 'no_quiero');
      setEstadoEnvido(r); addLog(`Rival: ${r === "quiero" ? "¡Quiero!" : "No quiero"}`);
      if (r === "quiero") {
        const envJ = calcularEnvido(manoJugador);
        addLog(`Vos: ${envJ} - Rival: ${envidoRival}`);
        const jugadorGana = envJ >= envidoRival;
        if (tipo === "faltaenvido") {
          const pts = jugadorGana ? 30 - ptsR : 30 - ptsJ;
          if (jugadorGana) { addLog(`✅ Ganaste Falta Envido (+${pts})`); setPuntosJugador(p => p + pts); reproducirSonidoPunto(); }
          else { addLog(`❌ Rival ganó Falta Envido (+${pts})`); setPuntosRival(p => p + pts); reproducirSonidoPunto(); }
        } else if (tipo === "envido-envido") {
          if (jugadorGana) { addLog("✅ Ganaste Envido Envido (+4)"); setPuntosJugador(p => p + 4); reproducirSonidoPunto(); }
          else { addLog("❌ Rival ganó Envido Envido (+4)"); setPuntosRival(p => p + 4); reproducirSonidoPunto(); }
        } else {
          if (jugadorGana) { addLog("✅ Ganaste envido (+2)"); setPuntosJugador(p => p + 2); reproducirSonidoPunto(); }
          else { addLog("❌ Rival ganó envido (+2)"); setPuntosRival(p => p + 2); reproducirSonidoPunto(); }
        }
      } else {
        const ptsNoQ = tipo === "envido-envido" ? 2 : 1;
        addLog(`✅ Ganaste ${ptsNoQ} punto${ptsNoQ > 1 ? "s" : ""} por envido`);
        setPuntosJugador(p => p + ptsNoQ); reproducirSonidoPunto();
      }
    }, 1000);
  }

  function irseAlMazo() {
    reproducirVoz('me_voy_al_mazo');
    addLog("Te fuiste al mazo."); setPuntosRival(p=>p+1); reproducirSonidoPunto();
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
          <PalitosPuntaje puntos={puntosJugador} total={30} />
        </div>
        <div style={{ width:1,alignSelf:"stretch",background:"#2d6a4f",margin:"0 2px" }}/>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:5,maxWidth:128,overflow:"hidden" }}>
            <span style={{ fontSize:13,flexShrink:0 }}>{rivalAvatar}</span>
            <span style={{ fontSize:12,color:"#f87171",letterSpacing:0.5,fontFamily:"'Lato',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{rivalNombre}</span>
          </div>
          <PalitosPuntaje puntos={puntosRival} total={30} />
        </div>
      </div>

      {/* Botón X para abandonar */}
      <button
        onClick={()=>setMostrarConfirmSalir(true)}
        style={{ position:"fixed",top:14,right:14,zIndex:30,width:36,height:36,borderRadius:10,border:"1px solid #374151",background:"rgba(0,0,0,0.6)",color:"#9ca3af",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}
      >✕</button>

      {/* Mano del rival */}
      <div style={{ display:"flex",gap:8,justifyContent:"center",flexShrink:0 }}>
        {manoRival.map((c,i)=>(
          <Carta key={i} carta={c} escala={1.1} oculta={!jugadasRival.includes(i)} jugada={jugadasRival.includes(i)} />
        ))}
      </div>

      {/* Mesa — 3 slots fijos (1 por ronda) */}
      <div style={{ background:"rgba(0,0,0,0.25)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:16,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:14,width:"100%",maxWidth:420,height:190,flexShrink:0 }}>
        {[0,1,2].map(ri => {
          const mc = mesaJugador[ri] || null;
          const rc = mesaRival[ri] || null;
          const MESA_E = 0.68;
          const MW = 70*MESA_E, MH = 110*MESA_E;
          const Slot = () => (
            <div style={{ width:MW,height:MH,borderRadius:8*MESA_E,border:"1px dashed rgba(107,114,128,0.22)",background:"rgba(0,0,0,0.12)",flexShrink:0 }} />
          );
          return (
            <div key={ri} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
              {rc ? <Carta carta={rc} escala={MESA_E} /> : <Slot />}
              {mc ? <Carta carta={mc} escala={MESA_E} /> : <Slot />}
            </div>
          );
        })}
      </div>

      {/* Mano del jugador */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0 }}>
        <div style={{ fontSize:10,color:"#4ade80",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>
          {puedeJugar?"👆 Tocá una carta para jugar":turno==="rival"?"Esperando rival...":"Tu mano"}
        </div>
        <div style={{ display:"inline-flex",gap:10 }}>
          {manoJugador.map((c,i)=>(
            i===0 ? (
              <div key={i} style={{ position:"relative" }}>
                <Carta carta={c} escala={1.1} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada===i}
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
              <Carta key={i} carta={c} escala={1.1} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada===i}
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
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,padding:16 }}>
          {ganadorPartida==="jugador" ? (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16 }}>
              <div style={{ fontSize:64 }}>🏆</div>
              <div style={{ fontSize:32,fontWeight:900,color:"#fbbf24" }}>¡GANASTE!</div>
              <div style={{ color:"#9ca3af",fontSize:14 }}>{puntosJugador} – {puntosRival}</div>
              {perfil&&<div style={{ color:"#4ade80",fontSize:13 }}>Partidas ganadas: {perfil.partidas_ganadas} / {perfil.partidas_jugadas}</div>}
              <button onClick={iniciarPartida} style={{ ...btnStyle("#1a472a","#4ade80"),fontSize:16,padding:"12px 32px",marginTop:8 }}>Jugar de nuevo</button>
            </div>
          ) : (
            <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:24,padding:"36px 28px",maxWidth:300,width:"100%",textAlign:"center",fontFamily:"'Lato',sans-serif",boxShadow:"0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(248,113,113,0.12)" }}>
              <div style={{ fontSize:56,marginBottom:12 }}>😞</div>
              <div style={{ fontSize:28,fontWeight:900,color:"#f87171",marginBottom:6 }}>¡Perdiste!</div>
              <div style={{ fontSize:14,color:"#9ca3af",marginBottom:4 }}>Volvé a intentarlo</div>
              <div style={{ fontSize:13,color:"#4b5563",marginBottom:20 }}>{puntosJugador} – {puntosRival}</div>
              {perfil&&<div style={{ fontSize:12,color:"#6b7280",marginBottom:20 }}>Partidas ganadas: {perfil.partidas_ganadas} / {perfil.partidas_jugadas}</div>}
              <button onClick={iniciarPartida} style={{ width:"100%",padding:"13px",borderRadius:12,cursor:"pointer",background:"linear-gradient(135deg,#1a472a,#2d6a4f)",border:"1px solid #4ade80",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>
                Nueva partida
              </button>
            </div>
          )}
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
  const [modoJuego, setModoJuego] = useState(null); // null=home, "lobby", "single", "multi"
  const [codigoUnirse, setCodigoUnirse] = useState(null);
  const [autoCrearSala, setAutoCrearSala] = useState(false);
  const [apuestaInicial, setApuestaInicial] = useState(0);
  const [codigoYaCreadoInicial, setCodigoYaCreadoInicial] = useState(null);
  const [origenMulti, setOrigenMulti] = useState("home");
  const [verTerminos, setVerTerminos] = useState(false);
  const [verPrivacidad, setVerPrivacidad] = useState(false);
  const [verTorneos, setVerTorneos] = useState(false);
  const [mostrarConfigHome, setMostrarConfigHome] = useState(false);
  const [esBaneado, setEsBaneado] = useState(false);
  const [verAdmin, setVerAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [codigoRejoin, setCodigoRejoin] = useState(null);

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
        setEsBaneado(false);
        setVerAdmin(false);
        sessionStorage.removeItem('truco_panel');
        setCargando(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function cargarPerfil(u) {
    const cacheKey = `truco_perfil_${u.id}`;
    // Siempre fetchea de DB para verificar ban; cache solo como fallback si falla la red
    const { data, error } = await supabase.from("perfiles").select("*").eq("usuario_id", u.id).maybeSingle();
    if (error || !data) {
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
      setNecesitaNombre(true);
      setCargando(false);
      return;
    }
    if (data.is_banned) {
      setEsBaneado(true);
      setCargando(false);
      return;
    }
    if (data.nombre) {
      const avatar = data.avatar || localStorage.getItem(`truco_avatar_${u.id}`) || "👤";
      const perfilCompleto = { ...data, avatar };
      localStorage.setItem(cacheKey, JSON.stringify(perfilCompleto));
      setPerfil(perfilCompleto);
      supabase.from("perfiles").update({ ultimo_acceso: new Date().toISOString() }).eq("usuario_id", u.id).then(() => {});
      const esAdminUser = data.rol === 'admin';
      const esAsesorUser = data.rol === 'asesor';
      if ((esAdminUser || esAsesorUser) && sessionStorage.getItem('truco_panel') === '1') {
        setVerAdmin(true);
      }
      // Verificar si hay una partida activa guardada (para recuperar tras recarga)
      const savedCodigo = sessionStorage.getItem(`truco_partida_${u.id}`);
      if (savedCodigo) {
        const { data: p } = await supabase
          .from("partidas")
          .select("jugador1_id, jugador2_id, estado")
          .eq("codigo", savedCodigo)
          .maybeSingle();
        if (p?.estado === "jugando" &&
            (p.jugador1_id === u.id || p.jugador2_id === u.id)) {
          setCodigoRejoin(savedCodigo);
          setModoJuego("multi");
        } else {
          sessionStorage.removeItem(`truco_partida_${u.id}`);
        }
      }
    } else {
      setNecesitaNombre(true);
    }
    setCargando(false);
  }

  async function handleLogout() { sessionStorage.removeItem('truco_panel'); await supabase.auth.signOut(); }

  if (cargando) return (
    <div style={{ minHeight:"100vh",background:"#050f08",display:"flex",alignItems:"center",justifyContent:"center",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:18 }}>Cargando...</div>
  );
  if (!user) return <Auth />;
  if (esBaneado) return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at center,#1a0505 0%,#050505 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:320 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🚫</div>
        <div style={{ fontSize:20, color:"#f87171", fontWeight:900, marginBottom:10 }}>Tu cuenta fue suspendida</div>
        <div style={{ fontSize:13, color:"#9ca3af", lineHeight:1.7, marginBottom:28 }}>Contactá al soporte para más información.</div>
        <button onClick={handleLogout} style={{ padding:"11px 28px", borderRadius:10, cursor:"pointer", background:"rgba(255,255,255,0.05)", border:"1px solid #374151", color:"#9ca3af", fontFamily:"'Lato',sans-serif", fontSize:14 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
  if (necesitaNombre) return <ElegirNombre user={user} onPerfilCreado={(p) => { localStorage.setItem(`truco_perfil_${user.id}`, JSON.stringify(p)); setPerfil(p); setNecesitaNombre(false); setNecesitaAvatar(true); }} />;
  if (necesitaAvatar) return <ElegirAvatar perfil={perfil} onAvatarGuardado={(p) => { setPerfil(p); setNecesitaAvatar(false); }} />;
  if (verTerminos) return <Terminos onVolver={()=>setVerTerminos(false)} />;
  if (verPrivacidad) return <Privacidad onVolver={()=>setVerPrivacidad(false)} />;
  if (verTorneos) return (
    <>
      <Torneos user={user} perfil={perfil} onVolver={()=>setVerTorneos(false)} />
      <BotonSoporte perfil={perfil} />
    </>
  );
  const esAdmin = perfil?.rol === 'admin';
  const esAsesor = perfil?.rol === 'asesor';
  if (verAdmin && (esAdmin || esAsesor)) return <Admin onVolver={()=>{ sessionStorage.removeItem('truco_panel'); setVerAdmin(false); }} rol={esAdmin ? 'admin' : 'asesor'} ejecutadoPor={perfil?.nombre || user?.email || ''} usuarioId={user?.id || ''} />;
  if (modoJuego === "lobby") return (
    <>
      <Lobby
        user={user}
        perfil={perfil}
        onJugarIA={() => setModoJuego("single")}
        onUnirse={(cod) => {
          setCodigoUnirse(cod);
          setOrigenMulti("lobby");
          setAutoCrearSala(false);
          setModoJuego("multi");
        }}
        onPartidaIniciada={(codigo) => {
          setCodigoYaCreadoInicial(codigo);
          setOrigenMulti("lobby");
          setModoJuego("multi");
        }}
        onVolver={() => setModoJuego(null)}
      />
      <BotonSoporte perfil={perfil} />
    </>
  );
  if (modoJuego === "multi") return (
    <Multijugador
      user={user}
      perfil={perfil}
      codigoInicial={codigoUnirse}
      autoCrear={autoCrearSala}
      apuesta={apuestaInicial}
      codigoYaCreado={codigoYaCreadoInicial}
      codigoRejoin={codigoRejoin}
      onVolver={() => {
        setCodigoRejoin(null);
        setCodigoUnirse(null);
        setAutoCrearSala(false);
        setCodigoYaCreadoInicial(null);
        setModoJuego(origenMulti === "lobby" ? "lobby" : null);
        setOrigenMulti("home");
      }}
    />
  );
  if (modoJuego === "single") return (
    <TrucoApp user={user} perfil={perfil} setPerfil={setPerfil} onLogout={handleLogout} onMultijugador={()=>setModoJuego("multi")} onVerTerminos={()=>setVerTerminos(true)} onVerTorneos={()=>setVerTorneos(true)} onHome={()=>setModoJuego(null)} />
  );
  return (
    <>
      <Home
        perfil={perfil}
        onJugar={() => setModoJuego("lobby")}
        onCrearSalaPrivada={(apuesta) => { setCodigoUnirse(null); setApuestaInicial(apuesta); setAutoCrearSala(true); setOrigenMulti("home"); setModoJuego("multi"); }}
        onUnirsePrivado={(codigo, apuesta) => { setCodigoUnirse(codigo); setApuestaInicial(apuesta); setAutoCrearSala(false); setOrigenMulti("home"); setModoJuego("multi"); }}
        onLogout={handleLogout}
        onVerTerminos={()=>setVerTerminos(true)}
        onVerPrivacidad={()=>setVerPrivacidad(true)}
        onConfig={()=>setMostrarConfigHome(true)}
        onPerfilActualizado={setPerfil}
        esAdmin={esAdmin}
        esAsesor={esAsesor}
        onAdmin={()=>{ sessionStorage.setItem('truco_panel', '1'); setVerAdmin(true); }}
      />
      {mostrarConfigHome && <Configuracion onCerrar={()=>setMostrarConfigHome(false)} />}
      <BotonSoporte perfil={perfil} />
    </>
  );
}