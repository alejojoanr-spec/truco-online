import { useState, useEffect, useCallback, useRef } from "react";
import { btnStyle } from "./GameComponents";
import { MesaJuego } from "./MesaJuego";
import { supabase } from "./supabase";
import { sumarPuntosRanking } from "./ranking";
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


function iaJugarCarta(mano, jugadas) {
  let minIdx = -1, minVal = 99;
  mano.forEach((c, i) => { if (!jugadas.includes(i) && valorTruco(c) < minVal) { minVal = valorTruco(c); minIdx = i; } });
  return minIdx;
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

function reproducirSonidoVictoria() {
  if (!leerConfig().sonidoVictoria) return;
  new Audio("/sounds/victoria.wav").play().catch(() => {});
}

function reproducirSonidoDerrota() {
  if (!leerConfig().sonidoVictoria) return;
  new Audio("/sounds/derrota.wav").play().catch(() => {});
}

const _audioRepartirCache = { obj: null };
function reproducirSonidoRepartir() {
  if (!leerConfig().sonidoCartas) return;
  try {
    if (!_audioRepartirCache.obj) {
      _audioRepartirCache.obj = new Audio("/sounds/repartir.mp3");
      _audioRepartirCache.obj.volume = 0.55;
    }
    _audioRepartirCache.obj.currentTime = 0;
    _audioRepartirCache.obj.play().catch(() => {});
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
  const [rivalMsg, setRivalMsg] = useState("");
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

  const [limitePuntos, setLimitePuntos] = useState(() => parseInt(localStorage.getItem('truco_limite')) || 30);
  const [eligiendo, setEligiendo] = useState(true);
  const [timerSegundos, setTimerSegundos] = useState(15);
  const timerRef = useRef(null);
  const rivalFueAlMazoRef = useRef(false);
  const pendingJugarRivalRef = useRef(null);
  const puntosJugadorRef = useRef(0);
  const puntosRivalRef = useRef(0);
  const [envidoCantadoPor, setEnvidoCantadoPor] = useState(null);
  const [envidoMonto, setEnvidoMonto] = useState({ quiero: 0, noquiero: 0 });
  const [envidoGlobos, setEnvidoGlobos] = useState(null);
  const [log, setLog] = useState([]);

  function guardarAvatar(av) {
    localStorage.setItem(`truco_avatar_${user.id}`, av);
    setPerfil(p => ({ ...p, avatar: av }));
    setCambiarAvatar(false);
  }

  function mostrarGlobosEnvido(textoJugador, textoRival) {
    setEnvidoGlobos({ jugador: textoJugador, rival: textoRival, visible: true });
    setTimeout(() => setEnvidoGlobos(g => g ? { ...g, visible: false } : null), 2000);
    setTimeout(() => setEnvidoGlobos(null), 2500);
  }
  const addLog = useCallback((msg) => setLog(prev => [...prev.slice(-6), msg]), []);


  function confirmarLimite(n) {
    localStorage.setItem('truco_limite', String(n));
    setLimitePuntos(n);
    setEligiendo(false);
  }

  useEffect(() => { if (!eligiendo) iniciarPartida(); }, [eligiendo]); // eslint-disable-line

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
    setEnvidoCantadoPor(null); setEnvidoMonto({ quiero: 0, noquiero: 0 });
    setEnvidoGlobos(null);
    pendingJugarRivalRef.current = null; rivalFueAlMazoRef.current = false;
    reproducirSonidoRepartir();
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
    if (mesaRival.length >= nuevasJugadas.length) {
      // Rival ya jugó primero en esta ronda → evaluarRonda
      const mesaRivalActual = mesaRival;
      const jugadasRivalActual = jugadasRival;
      setTimeout(() => evaluarRonda(nuevaMesa, mesaRivalActual, nuevasJugadas, jugadasRivalActual, "rival"), 500);
    } else {
      // Rival aún no jugó en esta ronda → jugarRival
      setTimeout(() => jugarRival(nuevasJugadas, nuevaMesa), 700);
    }
  }

  function jugarRival(jugadasJ, mesaJ, jugadasR = jugadasRival) {
    // Feature 2: IA canta envido por iniciativa propia (ronda 1, antes de su primera carta)
    if (rondaActual === 1 && jugadasR.length === 0 && !estadoEnvido && !estadoTruco) {
      const envRival = calcularEnvido(manoRival);
      if (envRival > 25 && Math.random() < 0.65) {
        const tipo = envRival > 28 ? "realenvido" : "envido";
        pendingJugarRivalRef.current = { jugadasJ, mesaJ, jugadasR };
        reproducirVoz(tipo === "realenvido" ? 'real_envido' : 'envido');
        mostrarRivalMsg(`🃏 ¡${tipo === "realenvido" ? "REAL ENVIDO" : "ENVIDO"}!`);
        setEstadoEnvido(tipo);
        setEnvidoCantadoPor("rival");
        setEnvidoMonto({ quiero: tipo === "realenvido" ? 3 : 2, noquiero: 1 });
        addLog(`Rival: ¡${tipo === "realenvido" ? "REAL ENVIDO" : "ENVIDO"}!`);
        return;
      }
    }

    // Feature 1: IA canta truco por iniciativa propia
    if (!estadoTruco && !(puntosJugador >= limitePuntos - 1 || puntosRival >= limitePuntos - 1)) {
      const disponibles = manoRival.filter((_, i) => !jugadasR.includes(i));
      const tieneCartaFuerte = disponibles.some(c => valorTruco(c) >= 10);
      if (tieneCartaFuerte && Math.random() < 0.7) {
        pendingJugarRivalRef.current = { jugadasJ, mesaJ, jugadasR };
        reproducirVoz('truco');
        mostrarRivalMsg("🗣 ¡TRUCO!");
        setEstadoTruco("truco");
        setTrucoCantadoPor("rival");
        addLog("Rival: ¡TRUCO!");
        return;
      }
    }

    // Feature 4: IA se va al mazo (perdió ronda 1 y sus cartas son débiles)
    if (ganadoresRondas.length >= 1 && ganadoresRondas[0] === "jugador") {
      const disponibles = manoRival.filter((_, i) => !jugadasR.includes(i));
      if (disponibles.every(c => valorTruco(c) < 5) && Math.random() < 0.4) {
        mostrarRivalMsg("🏳️ El rival se fue al mazo");
        addLog("Rival: Me voy al mazo.");
        rivalFueAlMazoRef.current = true;
        setTimeout(() => resolverMano("jugador"), 500);
        return;
      }
    }

    // Jugar carta normalmente
    const idxRival = iaJugarCarta(manoRival, jugadasR);
    if (idxRival === -1) return;
    const carta = manoRival[idxRival];
    const nuevasJugadasR = [...jugadasR, idxRival];
    const nuevaMesaR = [...mesaRival, carta];
    setJugadasRival(nuevasJugadasR); setMesaRival(nuevaMesaR);
    reproducirSonidoCarta();
    addLog(`Rival jugó: ${carta.num} de ${carta.palo}`);
    setTimeout(() => evaluarRonda(mesaJ, nuevaMesaR, jugadasJ, nuevasJugadasR, "jugador"), 500);
  }

  // primerEnRonda: quién jugó primero en esta ronda ("jugador" | "rival")
  // Determina quién abre la siguiente en caso de empate
  function evaluarRonda(mesaJ, mesaR, jugadasJ, jugadasR, primerEnRonda = "jugador") {
    const cartaJ = mesaJ[mesaJ.length-1], cartaR = mesaR[mesaR.length-1];
    const vJ = valorTruco(cartaJ), vR = valorTruco(cartaR);
    const ganador = vJ > vR ? "jugador" : vR > vJ ? "rival" : "empate";
    addLog(ganador==="jugador"?`✅ Ganaste la ronda ${rondaActual}`:ganador==="rival"?`❌ El rival ganó la ronda ${rondaActual}`:`🤝 Empate en ronda ${rondaActual}`);
    const nuevosGanadores = [...ganadoresRondas, ganador];
    setGanadoresRondas(nuevosGanadores);
    setTimeout(() => {
      const ganadorMano = determinarGanadorMano(nuevosGanadores);
      if (ganadorMano || rondaActual+1 > 3 || jugadasJ.length >= 3) {
        resolverMano(ganadorMano || "empate");
      } else {
        setRondaActual(r => r + 1);
        // Quién abre la próxima ronda:
        // - rival ganó → rival abre
        // - empate → quien abrió esta ronda abre la siguiente (regla oficial)
        // - jugador ganó → jugador abre
        const rivalAbre = ganador === "rival" || (ganador === "empate" && primerEnRonda === "rival");
        if (rivalAbre) {
          setTurno("rival");
          const idxRival = iaJugarCarta(manoRival, jugadasR);
          if (idxRival !== -1) {
            const cartaRival = manoRival[idxRival];
            const nuevasJugadasR = [...jugadasR, idxRival];
            setTimeout(() => {
              setJugadasRival(nuevasJugadasR);
              setMesaRival(prev => [...prev, cartaRival]);
              reproducirSonidoCarta();
              addLog(`Rival jugó: ${cartaRival.num} de ${cartaRival.palo}`);
              setTurno("jugador");
            }, 600);
          } else {
            // Seguridad: si por alguna razón no hay carta disponible, devolver turno
            setTurno("jugador");
          }
        } else {
          setTurno("jugador");
        }
      }
    }, 800);
  }

  function determinarGanadorMano(ganadores) {
    const j = ganadores.filter(g=>g==="jugador").length;
    const r = ganadores.filter(g=>g==="rival").length;
    if (j>=2) return "jugador";
    if (r>=2) return "rival";
    // Después de 3 rondas: quien ganó más rondas; empate total → jugador (es siempre el mano)
    if (ganadores.length===3) return j > r ? "jugador" : r > j ? "rival" : "jugador";
    return null;
  }

  function resolverMano(ganador) {
    const ptsTruco = estadoTruco === "quiero" ? ptsTrucoApostados : 1;
    // Usar refs para leer los puntos actuales: evita que un closure stale
    // (por ej. responderEnvido → pending jugarRival) produzca un puntosJugador viejo
    // y omita la detección del fin de partida.
    const ptsJ = puntosJugadorRef.current;
    const ptsR = puntosRivalRef.current;
    let juegoTerminado = false;
    if (ganador === "jugador") {
      const nuevos = ptsJ + ptsTruco;
      addLog(`🏆 Ganaste la mano (+${ptsTruco} pts)`);
      if (nuevos >= limitePuntos) {
        juegoTerminado = true;
        setFasePartida("fin"); setGanadorPartida("jugador");
        actualizarEstadisticas(true);
        sumarPuntosRanking(user, perfil, ptsR, rivalFueAlMazoRef.current).catch(() => {});
        addLog("🏆 ¡GANASTE LA PARTIDA!");
        reproducirSonidoVictoria();
      } else {
        reproducirSonidoPunto();
      }
      setPuntosJugador(nuevos);
    } else if (ganador === "rival") {
      const nuevos = ptsR + ptsTruco;
      addLog(`💀 El rival ganó la mano (+${ptsTruco} pts)`);
      if (nuevos >= limitePuntos) {
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
        setCartaSeleccionada(null); setRivalMsg(""); addLog("🃏 Nueva mano repartida");
        setEnvidoCantadoPor(null); setEnvidoMonto({ quiero: 0, noquiero: 0 });
        pendingJugarRivalRef.current = null; rivalFueAlMazoRef.current = false;
        reproducirSonidoRepartir();
      }
    }, 1500);
  }

  function mostrarRivalMsg(txt) {
    setRivalMsg(txt);
    setTimeout(() => setRivalMsg(""), 2800);
  }

  function cantarTruco() {
    if (!trucoDisponible) return;
    reproducirVoz('truco');
    setEstadoTruco("truco"); setTrucoCantadoPor("jugador"); addLog("Vos: ¡TRUCO!");
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        reproducirVoz('no_quiero');
        mostrarRivalMsg("🙅 El rival se fue al mazo");
        rivalFueAlMazoRef.current = true;
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
          mostrarRivalMsg("🙅 El rival se fue al mazo");
          rivalFueAlMazoRef.current = true;
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

      // Feature 3: IA escala el envido del jugador
      if (tipo === "envido") {
        const debeEscalar = envidoRival > 28 || (envidoRival >= 25 && Math.random() < 0.5);
        if (debeEscalar) {
          const escTipo = envidoRival > 30 ? "realenvido" : "envido";
          reproducirVoz(escTipo === "realenvido" ? 'real_envido' : 'envido');
          mostrarRivalMsg(`🃏 ¡${escTipo === "realenvido" ? "REAL ENVIDO" : "ENVIDO"}!`);
          const ptsQ = escTipo === "realenvido" ? 5 : 4;
          setEstadoEnvido("escalado");
          setEnvidoCantadoPor("rival");
          setEnvidoMonto({ quiero: ptsQ, noquiero: 2 });
          addLog(`Rival: ¡${escTipo === "realenvido" ? "REAL ENVIDO" : "ENVIDO"}! (${ptsQ} pts si querés)`);
          return;
        }
      }

      const r = envidoRival >= 25 || Math.random() > 0.5 ? "quiero" : "noquiero";
      reproducirVoz(r === 'quiero' ? 'quiero' : 'no_quiero');
      setEstadoEnvido(r); addLog(`Rival: ${r === "quiero" ? "¡Quiero!" : "No quiero"}`);
      if (r === "quiero") {
        const envJ = calcularEnvido(manoJugador);
        addLog(`Vos: ${envJ} - Rival: ${envidoRival}`);
        const jugadorGana = envJ >= envidoRival;
        if (tipo === "faltaenvido") {
          const pts = jugadorGana ? limitePuntos - ptsJ : limitePuntos - ptsR;
          if (jugadorGana) { addLog(`✅ Ganaste Falta Envido (+${pts})`); setPuntosJugador(p => p + pts); reproducirSonidoPunto(); }
          else { addLog(`❌ Rival ganó Falta Envido (+${pts})`); setPuntosRival(p => p + pts); reproducirSonidoPunto(); }
        } else if (tipo === "envido-envido") {
          if (jugadorGana) { addLog("✅ Ganaste Envido Envido (+4)"); setPuntosJugador(p => p + 4); reproducirSonidoPunto(); }
          else { addLog("❌ Rival ganó Envido Envido (+4)"); setPuntosRival(p => p + 4); reproducirSonidoPunto(); }
        } else {
          const ptsEnv = tipo === "realenvido" ? 3 : 2;
          if (jugadorGana) { addLog(`✅ Ganaste envido (+${ptsEnv})`); setPuntosJugador(p => p + ptsEnv); reproducirSonidoPunto(); }
          else { addLog(`❌ Rival ganó envido (+${ptsEnv})`); setPuntosRival(p => p + ptsEnv); reproducirSonidoPunto(); }
        }
        mostrarGlobosEnvido(jugadorGana ? `¡Son ${envJ}!` : "Son buenas", jugadorGana ? "Son buenas" : `¡Son ${envidoRival}!`);
      } else {
        const ptsNoQ = tipo === "envido-envido" ? 2 : tipo === "faltaenvido" ? 2 : 1;
        addLog(`✅ Ganaste ${ptsNoQ} punto${ptsNoQ > 1 ? "s" : ""} por envido`);
        setPuntosJugador(p => p + ptsNoQ); reproducirSonidoPunto();
        mostrarGlobosEnvido(`¡Son ${calcularEnvido(manoJugador)}!`, "Son buenas");
      }
    }, 1000);
  }

  function responderTruco(respuesta) {
    const pending = pendingJugarRivalRef.current || { jugadasJ: jugadasJugador, mesaJ: mesaJugador, jugadasR: jugadasRival };
    pendingJugarRivalRef.current = null;
    if (respuesta === "quiero") {
      reproducirVoz('quiero');
      setEstadoTruco("quiero"); setPtsTrucoApostados(2);
      addLog("Vos: ¡Quiero! (2 pts en juego)");
      setTimeout(() => jugarRival(pending.jugadasJ, pending.mesaJ, pending.jugadasR), 700);
    } else if (respuesta === "noquiero") {
      reproducirVoz('no_quiero');
      setEstadoTruco("noquiero");
      addLog("Vos: No quiero");
      addLog("❌ El rival gana 1 punto"); setPuntosRival(p => p + 1); reproducirSonidoPunto();
      setTimeout(() => jugarRival(pending.jugadasJ, pending.mesaJ, pending.jugadasR), 700);
    } else { // retruco
      reproducirVoz('retruco');
      setEstadoTruco("retruco"); setTrucoCantadoPor("jugador");
      addLog("Vos: ¡RETRUCO!");
      setTimeout(() => {
        if (Math.random() > 0.35) {
          reproducirVoz('quiero');
          setEstadoTruco("quiero"); setPtsTrucoApostados(3);
          addLog("Rival: ¡Quiero! (3 pts en juego)");
          setTimeout(() => jugarRival(pending.jugadasJ, pending.mesaJ, pending.jugadasR), 700);
        } else {
          reproducirVoz('no_quiero');
          mostrarRivalMsg("🙅 El rival se fue al mazo");
          rivalFueAlMazoRef.current = true;
          setEstadoTruco("noquiero");
          addLog("Rival: No quiero"); addLog("✅ Ganaste 2 puntos");
          setPuntosJugador(p => p + 2); reproducirSonidoPunto();
          setTimeout(() => jugarRival(pending.jugadasJ, pending.mesaJ, pending.jugadasR), 700);
        }
      }, 1000);
    }
  }

  function responderEnvido(respuesta) {
    const envidoRival = calcularEnvido(manoRival);
    const envJ = calcularEnvido(manoJugador);
    const monto = envidoMonto;
    const pending = pendingJugarRivalRef.current;
    pendingJugarRivalRef.current = null;
    setEnvidoCantadoPor(null);
    if (respuesta === "quiero") {
      reproducirVoz('quiero');
      addLog(`Vos: ¡Quiero! Vos: ${envJ} — Rival: ${envidoRival}`);
      const jugadorGana = envJ >= envidoRival;
      if (jugadorGana) { addLog(`✅ Ganaste envido (+${monto.quiero})`); setPuntosJugador(p => p + monto.quiero); }
      else { addLog(`❌ Rival ganó envido (+${monto.quiero})`); setPuntosRival(p => p + monto.quiero); }
      reproducirSonidoPunto();
      mostrarGlobosEnvido(jugadorGana ? `¡Son ${envJ}!` : "Son buenas", jugadorGana ? "Son buenas" : `¡Son ${envidoRival}!`);
      setEstadoEnvido("quiero");
    } else {
      reproducirVoz('no_quiero');
      addLog(`Vos: No quiero. Rival suma ${monto.noquiero} punto${monto.noquiero > 1 ? "s" : ""}`);
      setPuntosRival(p => p + monto.noquiero); reproducirSonidoPunto();
      mostrarGlobosEnvido("Son buenas", `¡Son ${envidoRival}!`);
      setEstadoEnvido("noquiero");
    }
    if (pending) setTimeout(() => jugarRival(pending.jugadasJ, pending.mesaJ, pending.jugadasR), 700);
  }

  function escalarEnvidoJugador(subtipo) {
    const envidoRival = calcularEnvido(manoRival);
    const siNo = envidoMonto.quiero;
    const falta = Math.max(1, limitePuntos - Math.max(puntosJugador, puntosRival));
    const siQuiero = subtipo === "faltaenvido" ? falta : envidoMonto.quiero + (subtipo === "realenvido" ? 3 : 2);
    const pending = pendingJugarRivalRef.current;
    pendingJugarRivalRef.current = null;
    const vozMap = { envido: 'envido', realenvido: 'real_envido', faltaenvido: 'falta_envido' };
    const labels = { envido: "ENVIDO", realenvido: "REAL ENVIDO", faltaenvido: "FALTA ENVIDO" };
    reproducirVoz(vozMap[subtipo]);
    addLog(`Vos: ¡${labels[subtipo]}! (${siQuiero} pts si quiero)`);
    setEnvidoCantadoPor(null);
    setTimeout(() => {
      const r = envidoRival >= 25 || Math.random() > 0.5 ? "quiero" : "noquiero";
      reproducirVoz(r === "quiero" ? 'quiero' : 'no_quiero');
      addLog(`Rival: ${r === "quiero" ? "¡Quiero!" : "No quiero"}`);
      if (r === "quiero") {
        const envJ = calcularEnvido(manoJugador);
        addLog(`Vos: ${envJ} — Rival: ${envidoRival}`);
        const jugadorGana = envJ >= envidoRival;
        if (jugadorGana) { addLog(`✅ Ganaste (+${siQuiero})`); setPuntosJugador(p => p + siQuiero); }
        else { addLog(`❌ Rival ganó (+${siQuiero})`); setPuntosRival(p => p + siQuiero); }
        mostrarGlobosEnvido(jugadorGana ? `¡Son ${envJ}!` : "Son buenas", jugadorGana ? "Son buenas" : `¡Son ${envidoRival}!`);
      } else {
        addLog(`Ganás ${siNo} punto${siNo > 1 ? "s" : ""}`);
        setPuntosJugador(p => p + siNo);
        mostrarGlobosEnvido(`¡Son ${calcularEnvido(manoJugador)}!`, "Son buenas");
      }
      reproducirSonidoPunto();
      setEstadoEnvido("quiero");
      if (pending) setTimeout(() => jugarRival(pending.jugadasJ, pending.mesaJ, pending.jugadasR), 700);
    }, 1000);
  }

  function irseAlMazo() {
    reproducirVoz('me_voy_al_mazo');
    addLog("Te fuiste al mazo.");
    setTimeout(()=>resolverMano("rival"),500);
  }

  puntosJugadorRef.current = puntosJugador;
  puntosRivalRef.current = puntosRival;

  const esManoDeLasAceites = puntosJugador >= limitePuntos - 1 || puntosRival >= limitePuntos - 1;
  const envidoDisponible = !estadoEnvido && rondaActual === 1 && jugadasJugador.length === 0;
  const trucoDisponible = !estadoTruco && turno === "jugador" && fasePartida === "jugando" && !esManoDeLasAceites;
  const esperandoRespuestaRetruco = estadoTruco === "retruco" && trucoCantadoPor === "rival";
  const esperandoRespuestaTruco = estadoTruco === "truco" && trucoCantadoPor === "rival";
  const esperandoRespuestaEnvido = envidoCantadoPor === "rival" && !!estadoEnvido && !["quiero","noquiero"].includes(estadoEnvido);
  const puedeJugar = turno === "jugador" && fasePartida === "jugando" && !esperandoRespuestaRetruco && !esperandoRespuestaTruco && !esperandoRespuestaEnvido && !(estadoTruco && !["quiero","noquiero"].includes(estadoTruco) && trucoCantadoPor === "rival");
  const winRate = perfil && perfil.partidas_jugadas > 0 ? Math.round((perfil.partidas_ganadas/perfil.partidas_jugadas)*100) : 0;
  const nombreJugador = perfil?.nombre || user.email?.split("@")[0] || "Vos";

  if (eligiendo) {
    return (
      <div style={{ height:"100dvh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lato',sans-serif",padding:24,boxSizing:"border-box" }}>
        <div style={{ background:"rgba(0,0,0,0.55)",border:"1px solid #2d6a4f",borderRadius:20,padding:"36px 32px",textAlign:"center",maxWidth:320,width:"100%" }}>
          <div style={{ fontSize:28,marginBottom:4 }}>🃏</div>
          <div style={{ fontSize:20,fontWeight:900,color:"#fbbf24",letterSpacing:1,marginBottom:6 }}>Partida vs IA</div>
          <div style={{ fontSize:13,color:"#9ca3af",marginBottom:28 }}>¿A cuántos puntos querés jugar?</div>
          <div style={{ display:"flex",gap:14,justifyContent:"center" }}>
            {[15, 30].map(n => (
              <button
                key={n}
                onClick={() => confirmarLimite(n)}
                style={{
                  flex:1, padding:"18px 0", borderRadius:14, fontSize:22, fontWeight:900,
                  cursor:"pointer", fontFamily:"'Lato',sans-serif", letterSpacing:0.5,
                  transition:"all 0.15s",
                  background: limitePuntos === n ? "rgba(74,222,128,0.18)" : "rgba(0,0,0,0.35)",
                  border: limitePuntos === n ? "2px solid #4ade80" : "2px solid rgba(45,106,79,0.5)",
                  color: limitePuntos === n ? "#4ade80" : "#9ca3af",
                  boxShadow: limitePuntos === n ? "0 0 18px rgba(74,222,128,0.2)" : "none",
                }}
              >
                <div>{n}</div>
                <div style={{ fontSize:11,fontWeight:400,marginTop:2,letterSpacing:1,textTransform:"uppercase" }}>puntos</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MesaJuego
        avatarJugador={perfil?.avatar || "👤"}
        nombreJugador={nombreJugador}
        puntosJugador={puntosJugador}
        avatarRival={rivalAvatar}
        nombreRival={rivalNombre}
        puntosRival={puntosRival}
        limitePuntos={limitePuntos}
        rivalHand={manoRival.map((c,i) => ({ carta:c, oculta:!jugadasRival.includes(i), jugada:jugadasRival.includes(i) }))}
        rondas={[0,1,2].map(ri => ({ jugador: mesaJugador[ri]||null, rival: mesaRival[ri]||null }))}
        manoJugador={manoJugador}
        jugadasJugador={jugadasJugador}
        cartaSeleccionada={cartaSeleccionada}
        onClickCarta={(i) => {
          if (!puedeJugar || jugadasJugador.includes(i)) return;
          if (cartaSeleccionada === i) jugarCarta(i);
          else setCartaSeleccionada(i);
        }}
        timerSegundos={turno === "jugador" && fasePartida === "jugando" ? timerSegundos : null}
        instruccion={puedeJugar ? "👆 Tocá una carta para jugar" : turno === "rival" ? "Esperando rival..." : "Tu mano"}
        onSalir={() => setMostrarConfirmSalir(true)}
        log={log}
        botonesSlot={<>
          {trucoDisponible && <button onClick={cantarTruco} style={btnStyle("#b45309","#fbbf24")}>🗣 Truco</button>}
          {esperandoRespuestaRetruco && <>
            <button onClick={()=>responderRetruco("quiero")} style={btnStyle("#065f46","#4ade80")}>✅ Quiero (3 pts)</button>
            <button onClick={()=>responderRetruco("noquiero")} style={btnStyle("#7f1d1d","#f87171")}>❌ No quiero</button>
            {!esManoDeLasAceites && <button onClick={()=>responderRetruco("valecuatro")} style={btnStyle("#92400e","#fbbf24")}>🗣 Vale Cuatro</button>}
          </>}
          {esperandoRespuestaTruco && <>
            <button onClick={()=>responderTruco("quiero")} style={btnStyle("#065f46","#4ade80")}>✅ Quiero (2 pts)</button>
            <button onClick={()=>responderTruco("noquiero")} style={btnStyle("#7f1d1d","#f87171")}>❌ No quiero</button>
            {!esManoDeLasAceites && <button onClick={()=>responderTruco("retruco")} style={btnStyle("#92400e","#fbbf24")}>🗣 Retruco</button>}
          </>}
          {esperandoRespuestaEnvido && <>
            <button onClick={()=>responderEnvido("quiero")} style={btnStyle("#065f46","#4ade80")}>✅ Quiero ({envidoMonto.quiero} pts)</button>
            <button onClick={()=>responderEnvido("noquiero")} style={btnStyle("#7f1d1d","#f87171")}>❌ No quiero</button>
            {estadoEnvido === "envido" && <>
              <button onClick={()=>escalarEnvidoJugador("envido")} style={btnStyle("#1d4ed8","#60a5fa")}>Envido</button>
              <button onClick={()=>escalarEnvidoJugador("realenvido")} style={btnStyle("#5b21b6","#a78bfa")}>Real Envido</button>
              <button onClick={()=>escalarEnvidoJugador("faltaenvido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button>
            </>}
            {estadoEnvido === "realenvido" && (
              <button onClick={()=>escalarEnvidoJugador("faltaenvido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button>
            )}
          </>}
          {envidoDisponible && <>
            <button onClick={()=>cantarEnvido("envido")} style={btnStyle("#1d4ed8","#60a5fa")}>Envido</button>
            <button onClick={()=>cantarEnvido("realenvido")} style={btnStyle("#5b21b6","#a78bfa")}>Real Envido</button>
            <button onClick={()=>cantarEnvido("faltaenvido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button>
          </>}
          {rivalMsg
            ? <div style={{ padding:"6px 14px",borderRadius:8,background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.5)",color:"#f87171",fontSize:12,fontWeight:700,fontFamily:"'Lato',sans-serif" }}>{rivalMsg}</div>
            : <button onClick={irseAlMazo} style={btnStyle("#7f1d1d","#f87171")}>Ir al mazo</button>
          }
        </>}
      />

      {envidoGlobos && (
        <div style={{ position:"fixed",inset:0,zIndex:15,pointerEvents:"none",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"70px 24px 90px" }}>
          <div style={{ opacity:envidoGlobos.visible?1:0,transition:"opacity 0.5s",alignSelf:"center",position:"relative",background:"#fff",borderRadius:10,padding:"7px 14px",fontWeight:900,fontSize:15,color:"#111",boxShadow:"2px 2px 0 #111",whiteSpace:"nowrap" }}>
            {envidoGlobos.rival}
            <div style={{ position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderBottom:"8px solid #fff" }}/>
          </div>
          <div style={{ opacity:envidoGlobos.visible?1:0,transition:"opacity 0.5s",alignSelf:"center",position:"relative",background:"#fff",borderRadius:10,padding:"7px 14px",fontWeight:900,fontSize:15,color:"#111",boxShadow:"2px 2px 0 #111",whiteSpace:"nowrap" }}>
            {envidoGlobos.jugador}
            <div style={{ position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:"8px solid #fff" }}/>
          </div>
        </div>
      )}

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
              <button onClick={() => setEligiendo(true)} style={{ ...btnStyle("#1a472a","#4ade80"),fontSize:16,padding:"12px 32px",marginTop:8 }}>Jugar de nuevo</button>
            </div>
          ) : (
            <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:24,padding:"36px 28px",maxWidth:300,width:"100%",textAlign:"center",fontFamily:"'Lato',sans-serif",boxShadow:"0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(248,113,113,0.12)" }}>
              <div style={{ fontSize:56,marginBottom:12 }}>😞</div>
              <div style={{ fontSize:28,fontWeight:900,color:"#f87171",marginBottom:6 }}>¡Perdiste!</div>
              <div style={{ fontSize:14,color:"#9ca3af",marginBottom:4 }}>Volvé a intentarlo</div>
              <div style={{ fontSize:13,color:"#4b5563",marginBottom:20 }}>{puntosJugador} – {puntosRival}</div>
              {perfil&&<div style={{ fontSize:12,color:"#6b7280",marginBottom:20 }}>Partidas ganadas: {perfil.partidas_ganadas} / {perfil.partidas_jugadas}</div>}
              <button onClick={() => setEligiendo(true)} style={{ width:"100%",padding:"13px",borderRadius:12,cursor:"pointer",background:"linear-gradient(135deg,#1a472a,#2d6a4f)",border:"1px solid #4ade80",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>
                Nueva partida
              </button>
            </div>
          )}
        </div>
      )}
    </>
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
  const [splashSaliendo, setSplashSaliendo] = useState(false);
  const [splashOculto, setSplashOculto] = useState(false);
  const [codigoRejoin, setCodigoRejoin] = useState(null);

  useEffect(() => {
    if (!cargando && !splashOculto) {
      setSplashSaliendo(true);
      const t = setTimeout(() => setSplashOculto(true), 320);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando]);

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

  if (cargando || !splashOculto) return (
    <>
      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashSalir {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes splashPunto {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
      <div style={{
        position: "fixed", inset: 0,
        background: "#0a2414",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24,
        zIndex: 9999,
        animation: splashSaliendo ? "splashSalir 0.32s ease-out forwards" : "none",
      }}>
        <div style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: "clamp(3rem, 12vw, 5.5rem)",
          fontWeight: 900,
          color: "#f59e0b",
          letterSpacing: "0.04em",
          animation: "splashFadeIn 0.6s ease-out both",
        }}>
          Truco
        </div>
        <div style={{ display: "flex", gap: 10, animation: "splashFadeIn 0.6s ease-out 0.3s both" }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#4ade80",
              display: "inline-block",
              animation: `splashPunto 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </>
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