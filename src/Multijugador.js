import { useState, useEffect, useRef } from "react";
import { resolverGanadorMano, calcularFalta } from "./trucoReglas";
import { supabase } from "./supabase";
import { avatarSrc } from "./avatares";
import { leerConfig } from "./Configuracion";
import { sumarPuntosRanking } from "./ranking";
import { btnStyle, GLOBO_TEXTOS } from "./GameComponents";
import { MesaJuego } from "./MesaJuego";
import { tienePartidaActiva } from "./partidasApi";
import { derivarEventosPartida, getCantoLabel, LABEL_ENV } from "./derivarEventosPartida";
import { LogJugadas } from "./LogJugadas";

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

const _audioCartaCacheM = { obj: null };
function reproducirSonidoCarta() {
  if (!leerConfig().sonidoCartas) return;
  try {
    if (!_audioCartaCacheM.obj) {
      _audioCartaCacheM.obj = new Audio("/sounds/carta.wav");
      _audioCartaCacheM.obj.volume = 0.45;
    }
    _audioCartaCacheM.obj.currentTime = 0;
    _audioCartaCacheM.obj.play().catch(() => {});
  } catch {}
}

const _audioVictoriaCacheM = { obj: null };
function reproducirSonidoVictoria() {
  if (!leerConfig().sonidoVictoria) return;
  try {
    if (!_audioVictoriaCacheM.obj) {
      _audioVictoriaCacheM.obj = new Audio("/sounds/victoria.wav");
      _audioVictoriaCacheM.obj.volume = 0.55;
    }
    _audioVictoriaCacheM.obj.currentTime = 0;
    _audioVictoriaCacheM.obj.play().catch(() => {});
  } catch {}
}

const _audioDerrotaCacheM = { obj: null };
function reproducirSonidoDerrota() {
  if (!leerConfig().sonidoVictoria) return;
  try {
    if (!_audioDerrotaCacheM.obj) {
      _audioDerrotaCacheM.obj = new Audio("/sounds/derrota.wav");
      _audioDerrotaCacheM.obj.volume = 0.55;
    }
    _audioDerrotaCacheM.obj.currentTime = 0;
    _audioDerrotaCacheM.obj.play().catch(() => {});
  } catch {}
}

const _audioRepartirCacheM = { obj: null };
function reproducirSonidoRepartir() {
  if (!leerConfig().sonidoCartas) return;
  try {
    if (!_audioRepartirCacheM.obj) {
      _audioRepartirCacheM.obj = new Audio("/sounds/repartir.mp3");
      _audioRepartirCacheM.obj.volume = 0.55;
    }
    _audioRepartirCacheM.obj.currentTime = 0;
    _audioRepartirCacheM.obj.play().catch(() => {});
  } catch {}
}

const VOZ_ENV = { envido: 'envido', real_envido: 'real_envido', falta_envido: 'falta_envido' };

function fmtARS(n) {
  const num = parseFloat(n) || 0;
  const [entero, decimal] = num.toFixed(2).split('.');
  return '$' + entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decimal;
}

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

function mezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function valorTruco(c) {
  if (c.num === 1  && c.palo === 'espada') return 13;
  if (c.num === 1  && c.palo === 'basto')  return 12;
  if (c.num === 7  && c.palo === 'espada') return 11;
  if (c.num === 7  && c.palo === 'oro')    return 10;
  if (c.num === 3)  return 9;
  if (c.num === 2)  return 8;
  if (c.num === 1)  return 7;  // copa u oro
  if (c.num === 12) return 6;
  if (c.num === 11) return 5;
  if (c.num === 10) return 4;
  if (c.num === 7)  return 3;  // basto o copa
  if (c.num === 6)  return 2;
  if (c.num === 5)  return 1;
  return 0; // 4
}

function valorEnvido(mano) {
  const g = {};
  for (const c of mano) {
    const v = c.num <= 7 ? c.num : 0;
    (g[c.palo] = g[c.palo] || []).push(v);
  }
  let max = 0;
  for (const nums of Object.values(g)) {
    const s = [...nums].sort((a, b) => b - a);
    const v = s.length >= 2 ? s[0] + s[1] + 20 : s[0];
    if (v > max) max = v;
  }
  return max;
}



export default function Multijugador({ user, perfil, onVolver, codigoInicial, autoCrear, apuesta, puntos, esTorneo, codigoYaCreado, codigoRejoin }) {
  const [pantalla, setPantalla] = useState(
    (codigoInicial || autoCrear || codigoYaCreado || codigoRejoin) ? "redirigiendo" : "menu"
  );
  const [codigo, setCodigo] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [partida, setPartida] = useState(null);
  const [soyJugador1, setSoyJugador1] = useState(false);
  const [miMano, setMiMano] = useState([]);
  const [manoRival, setManoRival] = useState([]);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [elEnvidoPrimero, setElEnvidoPrimero] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [resolviendoMano, setResolviendoMano] = useState(false);
  const [mostrarConfirmSalir, setMostrarConfirmSalir] = useState(false);
  const [globoJugadorTexto, setGloboJugadorTexto] = useState(null);
  const [globoRivalTexto, setGloboRivalTexto] = useState(null);

  function mostrarGlobo(lado, tag, duracion = 2500) {
    const texto = GLOBO_TEXTOS[tag] || tag;
    if (lado === "jugador") { setGloboJugadorTexto(texto); setTimeout(() => setGloboJugadorTexto(null), duracion); }
    else { setGloboRivalTexto(texto); setTimeout(() => setGloboRivalTexto(null), duracion); }
  }

  const addLog = () => {};
  const [resultadoPartida, setResultadoPartida] = useState(null);
  const pagoProcesadoRef = useRef(false);
  const accionLogueadaRef = useRef(null);

  // PERMANENTE — log de jugadas para el panel lateral LogJugadas.js. No es parte del panel de debug temporal.
  const [jugadasLog, setJugadasLog] = useState([]);

  // === PANEL DEBUG TEMPORAL — SACAR DESPUÉS ===
  const [debugLog, setDebugLog] = useState([]);
  const [debugPanelAbierto, setDebugPanelAbierto] = useState(false);
  const debugBloqueoRef = useRef(false);
  // === PANEL DEBUG TEMPORAL — SACAR DESPUÉS (pausa compartida vía DB) ===
  useEffect(() => {
    if (!codigo) return;
    supabase.from("partidas").update(
      debugPanelAbierto
        ? { debug_pausada: true, debug_pausada_desde: new Date().toISOString() }
        : { debug_pausada: false, debug_pausada_desde: null }
    ).eq("codigo", codigo);
  }, [debugPanelAbierto, codigo]);
  const debugBloqueo = debugPanelAbierto || !!partida?.debug_pausada;
  useEffect(() => { debugBloqueoRef.current = debugBloqueo; }, [debugBloqueo]);
  // === FIN pausa compartida DEBUG TEMPORAL ===
  const [debugDetalleAbierto, setDebugDetalleAbierto] = useState(new Set());
  const toggleDebugDetalle = (id) => {
    setDebugDetalleAbierto(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  // === FIN declaración estado DEBUG TEMPORAL ===

  // revancha
  const [revanchaEstado, setRevanchaEstado] = useState(null);
  // null | 'esperando_rival' | 'rival_pide' | 'procesando' | 'rechazada' | 'cancelada'
  const [revanchaTimer, setRevanchaTimer] = useState(30);
  const channelRef = useRef(null);
  const partidaRef = useRef(null);
  const revanchaTimerRef = useRef(null);
  const salaEnEsperaRef = useRef(null); // codigo de sala propia en "esperando"; se limpia al entrar a jugando o al cancelar
  const [displayTimer, setDisplayTimer] = useState(null);
  const displayTimerIntervalRef = useRef(null);
  const timerAutoFiredRef = useRef(null);
  const irseAlMazoRef = useRef(null);
  const noQuieroRef = useRef(null);
  const irseAlMazoEjecutandoRef = useRef(false); // guard síncrono anti doble-ejecución (click + timeout)
  const [irseAlMazoBloqueado, setIrseAlMazoBloqueado] = useState(false); // espejo para disabled del botón
  const ultimoCantoMostradoRef = useRef(null);
  const resolviendoManoRef = useRef(false);
  const refetchPartidaRef = useRef(null);
  const reconectarRef = useRef(null);
  const reconectandoRef = useRef(false);
  const reconexionTimerRef = useRef(null);

  useEffect(() => { partidaRef.current = partida; }, [partida]);

  // Persistir partida activa en localStorage para sobrevivir recargas y cierres de pestaña
  useEffect(() => {
    if (codigo) localStorage.setItem(`truco_partida_${user.id}`, codigo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);
  // Cleanup de sala fantasma: si el componente se desmonta mientras hay sala en espera (cierre de pestaña, back del browser), la borra
  useEffect(() => {
    return () => {
      const cod = salaEnEsperaRef.current;
      if (cod) {
        supabase.from("partidas").delete().eq("codigo", cod).then(({ error }) => {
          if (error) console.error("cleanup sala en espera:", error);
        });
      }
    };
  }, []);

  useEffect(() => {
    return () => { if (revanchaTimerRef.current) clearInterval(revanchaTimerRef.current); };
  }, []);

  async function procesarFinPartida(p) {
    if (pagoProcesadoRef.current) return;
    pagoProcesadoRef.current = true;
    localStorage.removeItem(`truco_partida_${user.id}`);
    const apuestaPartida = p.apuesta || 0;
    const pot = apuestaPartida * 2;

    let rakePct = 5;
    if (apuestaPartida > 0) {
      const { data: cfg } = await supabase
        .from("configuracion").select("valor").eq("clave", "rake_porcentaje").single();
      if (cfg?.valor) rakePct = parseFloat(cfg.valor);
    }

    const rakeAmount = apuestaPartida > 0
      ? Math.round(pot * rakePct / 100 * 100) / 100
      : 0;
    const premio = pot - rakeAmount;

    if (p.ganador_id === user.id && apuestaPartida > 0) {
      const rivalNombre = p.jugador1_id === user.id ? p.jugador2_nombre : p.jugador1_nombre;
      const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
      const saldoAntes = fresh?.saldo || 0;
      const saldoDespues = saldoAntes + premio;
      await supabase.from("perfiles")
        .update({ saldo: saldoDespues })
        .eq("usuario_id", user.id);
      await supabase.from("transacciones").insert({
        usuario_id: user.id,
        tipo: "premio",
        monto: premio,
        estado: "aprobado",
        nota: `Ganancia vs ${rivalNombre || "rival"}`,
        ejecutado_por: "sistema",
        saldo_anterior: saldoAntes,
        saldo_nuevo: saldoDespues,
      });
      if (rakeAmount > 0) {
        await supabase.from("transacciones").insert({
          usuario_id: user.id,
          tipo: "rake",
          monto: rakeAmount,
          estado: "aprobado",
          nota: `Comisión partida ${p.codigo || ""}`,
          ejecutado_por: "sistema",
          saldo_anterior: saldoAntes,
          saldo_nuevo: saldoDespues,
        });
      }
    }

    const ganoPartida = p.ganador_id === user.id;
    if (ganoPartida) {
      reproducirSonidoVictoria();
      const rivalPuntos = soyJugador1 ? (p.puntos2 || 0) : (p.puntos1 || 0);
      sumarPuntosRanking(user, perfil, rivalPuntos, false).catch(() => {});
    } else {
      reproducirSonidoDerrota();
    }
    setResultadoPartida({
      ganaste: ganoPartida,
      premio: ganoPartida ? premio : 0,
      apuesta: apuestaPartida,
      rake: ganoPartida ? rakeAmount : 0,
      rakePct,
    });
  }

  // Auto-unirse si viene del lobby con un código
  useEffect(() => {
    if (codigoInicial) {
      (async () => {
        const cod = codigoInicial.toUpperCase().trim();
        const { data, error: err } = await supabase.from("partidas").select("*").eq("codigo", cod).single();
        if (err || !data) { setError("Sala no encontrada"); setPantalla("menu"); return; }
        if (data.estado !== "esperando") { setError("La sala ya no está disponible"); setPantalla("menu"); return; }
        const montoSalaLobby = data.apuesta || 0;
        let saldoAntesLobby = 0;
        if (montoSalaLobby > 0) {
          const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
          const saldoActual = fresh?.saldo || 0;
          if (saldoActual < montoSalaLobby) { setError("Saldo insuficiente para unirte a esta partida."); setPantalla("menu"); return; }
          const { error: saldoErr } = await supabase.from("perfiles")
            .update({ saldo: saldoActual - montoSalaLobby })
            .eq("usuario_id", user.id);
          if (saldoErr) { setError("Error al procesar el saldo."); setPantalla("menu"); return; }
          saldoAntesLobby = saldoActual;
        }
        await supabase.from("partidas").update({
          jugador2_id: user.id,
          jugador2_nombre: perfil?.nombre || "",
          jugador2_avatar: avatarSrc(perfil?.avatar),
          estado: "jugando",
        }).eq("codigo", cod);
        if (montoSalaLobby > 0) {
          await supabase.from("transacciones").insert({
            usuario_id: user.id,
            tipo: "apuesta",
            monto: montoSalaLobby,
            estado: "aprobado",
            nota: `Apuesta vs ${data.jugador1_nombre || "rival"}`,
            ejecutado_por: "sistema",
            saldo_anterior: saldoAntesLobby,
            saldo_nuevo: saldoAntesLobby - montoSalaLobby,
          });
        }
        setCodigo(cod);
        setSoyJugador1(false);
        setMiMano(JSON.parse(data.mano_jugador2));
        setManoRival(JSON.parse(data.mano_jugador1));
        ultimoCantoMostradoRef.current = data.ultimo_canto?.ts ?? null;
        setPartida({ ...data, jugador2_id: user.id, estado: "jugando" });
        setPantalla("jugando");
        addLog("¡Partida iniciada!");
      })();
    } else if (codigoYaCreado) {
      (async () => {
        const cod = codigoYaCreado.toUpperCase().trim();
        const { data, error: err } = await supabase.from("partidas").select("*").eq("codigo", cod).single();
        if (err || !data) { setError("No se pudo cargar la partida"); setPantalla("menu"); return; }
        setCodigo(cod);
        setSoyJugador1(true);
        setMiMano(JSON.parse(data.mano_jugador1));
        setManoRival(JSON.parse(data.mano_jugador2));
        ultimoCantoMostradoRef.current = data.ultimo_canto?.ts ?? null;
        setPartida(data);
        setPantalla("jugando");
        addLog("¡Partida iniciada!");
      })();
    } else if (codigoRejoin) {
      (async () => {
        const cod = codigoRejoin.toUpperCase().trim();
        const { data, error: err } = await supabase.from("partidas").select("*").eq("codigo", cod).single();
        if (err || !data || data.estado !== "jugando") {
          localStorage.removeItem(`truco_partida_${user.id}`);
          setError("La partida ya no está activa");
          setPantalla("menu");
          return;
        }
        const esJ1 = data.jugador1_id === user.id;
        setCodigo(cod);
        setSoyJugador1(esJ1);
        setMiMano(JSON.parse(esJ1 ? data.mano_jugador1 : data.mano_jugador2));
        setManoRival(JSON.parse(esJ1 ? data.mano_jugador2 : data.mano_jugador1));
        ultimoCantoMostradoRef.current = data.ultimo_canto?.ts ?? null;
        setPartida(data);
        setPantalla("jugando");
        addLog("🔄 Reconectado a la partida");
      })();
    } else if (autoCrear) {
      crearSala();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!codigo) return;

    function procesarCambio(p) {
      if (!p) return;
      const eventosPartida = partidaRef.current
        ? derivarEventosPartida(partidaRef.current, p, { userId: user.id })
        : [];

      // === PANEL DEBUG TEMPORAL — SACAR DESPUÉS (log de transiciones) ===
      if (partidaRef.current) {
        const ts = new Date().toLocaleTimeString('es-AR', { hour12: false });
        const miNombre = perfil?.nombre || user.email?.split("@")[0] || "Vos";
        const rivalNombre = (soyJugador1 ? p.jugador2_nombre : p.jugador1_nombre) || "Rival";
        const disparadoPorMi = p.ultimo_canto?.por === user.id;
        const quien = p.ultimo_canto?.por ? (disparadoPorMi ? miNombre : rivalNombre) : "?";
        const registrar = (campo, anterior, nuevo, frase) => {
          setDebugLog(prevLog => [...prevLog.slice(-39), { id: Date.now() + Math.random(), ts, campo, anterior, nuevo, quien, disparadoPorMi, frase }]);
        };
        for (const ev of eventosPartida) {
          if (ev.campo === "puntos1") {
            const nombreJ1 = soyJugador1 ? miNombre : rivalNombre;
            registrar("puntos1", ev.anterior, ev.nuevo, `${ev.delta >= 0 ? '+' : ''}${ev.delta} pts para ${nombreJ1}`);
          } else if (ev.campo === "puntos2") {
            const nombreJ2 = soyJugador1 ? rivalNombre : miNombre;
            registrar("puntos2", ev.anterior, ev.nuevo, `${ev.delta >= 0 ? '+' : ''}${ev.delta} pts para ${nombreJ2}`);
          } else if (ev.campo === "puntos_mano") {
            registrar("puntos_mano", ev.anterior, ev.nuevo, `La mano ahora vale ${ev.nuevo} pt${ev.nuevo === 1 ? '' : 's'}`);
          } else if (ev.campo === "accion_pendiente") {
            const nombreQuien = ev.disparadoPorMi ? miNombre : rivalNombre;
            if (ev.tipoEvento === 'quiero' || ev.tipoEvento === 'no_quiero') {
              const veredicto = ev.tipoEvento === 'quiero' ? 'QUIERO' : 'NO QUIERO';
              const esEnvidoQuiero = ev.tipoEvento === 'quiero' && ev.cantoResuelto?.tipo === 'envido';
              const valia = esEnvidoQuiero ? ` — valía ${ev.cantoResuelto.si_quiero} pts` : '';
              registrar("accion_pendiente", ev.anterior, ev.nuevo, `${nombreQuien} dijo ${veredicto}${ev.cantoResueltoLabel ? ` (${ev.cantoResueltoLabel})` : ''}${valia}`);
            } else if (ev.tipoEvento === 'canto') {
              registrar("accion_pendiente", ev.anterior, ev.nuevo, `${nombreQuien} cantó ${ev.cantoNuevoLabel}`);
            }
          } else if (ev.campo === "envido_resultado") {
            const nombreJ1 = soyJugador1 ? miNombre : rivalNombre;
            const nombreJ2b = soyJugador1 ? rivalNombre : miNombre;
            registrar("envido_resultado", ev.anterior, ev.nuevo, `${nombreJ1}: ${ev.nuevo.texto_j1} | ${nombreJ2b}: ${ev.nuevo.texto_j2}`);
          }
        }
      }
      // === FIN log de transiciones DEBUG TEMPORAL ===

      // Log de jugadas permanente (panel lateral desktop) — mismos eventos, formato corto
      if (eventosPartida.length) {
        const rivalNombreCorto = (soyJugador1 ? p.jugador2_nombre : p.jugador1_nombre) || "Rival";
        const agregarJugada = (texto) => {
          setJugadasLog(prevLog => [...prevLog.slice(-59), { id: Date.now() + Math.random(), texto }]);
        };
        for (const ev of eventosPartida) {
          if (ev.campo === "puntos1" || ev.campo === "puntos2") {
            const esMio = (ev.campo === "puntos1") === soyJugador1;
            agregarJugada(`${esMio ? "Vos" : rivalNombreCorto}: ${ev.delta >= 0 ? '+' : ''}${ev.delta}`);
          } else if (ev.campo === "accion_pendiente") {
            const nombre = ev.disparadoPorMi ? "Vos" : rivalNombreCorto;
            if (ev.tipoEvento === 'quiero') agregarJugada(`${nombre}: QUIERO`);
            else if (ev.tipoEvento === 'no_quiero') agregarJugada(`${nombre}: NO QUIERO`);
            else if (ev.tipoEvento === 'canto') agregarJugada(`${nombre}: ${ev.cantoNuevoLabel.toUpperCase()}`);
          } else if (ev.campo === "envido_resultado") {
            const revelado = ev.nuevo.texto_j1.includes("Son buenas") ? ev.nuevo.texto_j2 : ev.nuevo.texto_j1;
            agregarJugada(`Envido: ${revelado.replace(/[¡!]/g, '')}`);
          }
          // puntos_mano: omitido a propósito, es más técnico que útil de un vistazo
        }
      }
      if (p.ganador_id) { procesarFinPartida(p); return; }
      if (p.estado === "jugando") { setPantalla("jugando"); salaEnEsperaRef.current = null; }
      // Detect a card added by the rival (only plays sound for cards the rival adds, not our own)
      const prevMesa = JSON.parse(partidaRef.current?.mesa || "[]");
      const newMesa = JSON.parse(p.mesa || "[]");
      if (newMesa.length === prevMesa.length + 1) {
        const lastCard = newMesa[newMesa.length - 1];
        if (lastCard?.jugador !== user.id) reproducirSonidoCarta();
      }
      // Detect new hand dealt (mesa cleared after cards were on table)
      if (newMesa.length === 0 && prevMesa.length > 0) reproducirSonidoRepartir();
      if (p.mano_jugador1) {
        const mano1 = JSON.parse(p.mano_jugador1);
        const mano2 = JSON.parse(p.mano_jugador2);
        setCartaSeleccionada(null);
        if (soyJugador1) { setMiMano(mano1); setManoRival(mano2); }
        else { setMiMano(mano2); setManoRival(mano1); }
      }
      if (p.accion_pendiente && p.accion_pendiente.cantado_por !== user.id) {
        const acc = p.accion_pendiente;
        const key = acc.tipo + (acc.nivel || '') + (acc.subtipo || '') + (acc.si_quiero || '');
        if (accionLogueadaRef.current !== key) {
          accionLogueadaRef.current = key;
          addLog(`¡El rival canta ${getCantoLabel(acc)}!`);
          if (acc.tipo === 'truco') {
            reproducirVoz(['', 'truco', 'retruco', 'vale_cuatro'][acc.nivel] || 'truco');
          } else if (acc.tipo === 'envido') {
            reproducirVoz(VOZ_ENV[acc.subtipo] || 'envido');
          }
        }
      } else if (!p.accion_pendiente) {
        accionLogueadaRef.current = null;
      }
      // Globos de envido: disparar en ambos clientes cuando aparece envido_resultado
      if (p.envido_resultado && !partidaRef.current?.envido_resultado) {
        const textoJugador = soyJugador1 ? p.envido_resultado.texto_j1 : p.envido_resultado.texto_j2;
        const textoRival   = soyJugador1 ? p.envido_resultado.texto_j2 : p.envido_resultado.texto_j1;
        mostrarGlobo("jugador", textoJugador);
        mostrarGlobo("rival", textoRival);
      }
      // Globo de canto/respuesta: un solo punto reactivo, sirve para jugador y rival por igual
      if (p.ultimo_canto && p.ultimo_canto.ts !== ultimoCantoMostradoRef.current) {
        ultimoCantoMostradoRef.current = p.ultimo_canto.ts;
        const ladoCanto = p.ultimo_canto.por === user.id ? "jugador" : "rival";
        mostrarGlobo(ladoCanto, p.ultimo_canto.tag, ladoCanto === "rival" ? 4000 : undefined);
      }
    }

    async function refetchPartida() {
      const { data } = await supabase.from("partidas").select("*").eq("codigo", codigo).single();
      if (data) { setPartida(data); procesarCambio(data); }
    }
    refetchPartidaRef.current = refetchPartida;

    function crearCanal() {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      const ch = supabase.channel(`partida-${codigo}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "partidas", filter: `codigo=eq.${codigo}` },
          (payload) => { setPartida(payload.new); procesarCambio(payload.new); }
        )
        .on("broadcast", { event: "revancha_request" }, () => {
          setRevanchaEstado("rival_pide");
        })
        .on("broadcast", { event: "revancha_reject" }, () => {
          if (revanchaTimerRef.current) clearInterval(revanchaTimerRef.current);
          setRevanchaEstado("rechazada");
          setTimeout(() => setRevanchaEstado(null), 3000);
        })
        .on("broadcast", { event: "revancha_accept" }, async ({ payload }) => {
          if (revanchaTimerRef.current) clearInterval(revanchaTimerRef.current);
          const { nuevoCodigo } = payload;
          setRevanchaEstado("procesando");

          const apuestaR = partidaRef.current?.apuesta || 0;
          if (apuestaR > 0) {
            const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
            const saldoActual = fresh?.saldo || 0;
            if (saldoActual < apuestaR) {
              setRevanchaEstado("cancelada");
              setTimeout(() => setRevanchaEstado(null), 3000);
              return;
            }
            const saldoNuevo = saldoActual - apuestaR;
            await supabase.from("perfiles").update({ saldo: saldoNuevo }).eq("usuario_id", user.id);
            await supabase.from("transacciones").insert({
              usuario_id: user.id, tipo: "apuesta", monto: apuestaR, estado: "aprobado",
              nota: `Apuesta revancha ${nuevoCodigo}`, ejecutado_por: "sistema",
              saldo_anterior: saldoActual, saldo_nuevo: saldoNuevo,
            });
          }

          const { data: nuevaPartida } = await supabase.from("partidas").select("*").eq("codigo", nuevoCodigo).single();
          if (!nuevaPartida) { setRevanchaEstado("cancelada"); setTimeout(() => setRevanchaEstado(null), 3000); return; }

          // Solicitante entra como jugador2 (aceptante creó como jugador1)
          pagoProcesadoRef.current = false;
          accionLogueadaRef.current = null;
          setResultadoPartida(null);
          setRevanchaEstado(null);
          setCartaSeleccionada(null);
          setPartida(nuevaPartida);
          setSoyJugador1(false);
          setMiMano(JSON.parse(nuevaPartida.mano_jugador2));
          setManoRival(JSON.parse(nuevaPartida.mano_jugador1));
          setPantalla("jugando");
          setCodigo(nuevoCodigo);
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED")
            console.warn("[Realtime] Canal caído:", status);
        });
      channelRef.current = ch;
    }
    reconectarRef.current = async () => { crearCanal(); await refetchPartida(); };

    crearCanal();
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, soyJugador1]);

  useEffect(() => { resolviendoManoRef.current = resolviendoMano; }, [resolviendoMano]);

  useEffect(() => {
    setElEnvidoPrimero(false);
  }, [partida?.accion_pendiente?.tipo, partida?.accion_pendiente?.nivel, partida?.accion_pendiente?.cantado_por]);

  // Timer sincronizado: ambos clientes calculan el tiempo restante desde turno_inicio (Supabase)
  useEffect(() => {
    if (displayTimerIntervalRef.current) clearInterval(displayTimerIntervalRef.current);
    const acc = partida?.accion_pendiente;
    const cantoPendienteParaMi = acc && acc.cantado_por !== user.id;
    const activo = (cantoPendienteParaMi || (!acc && partida?.turno_inicio)) && !resolviendoMano && !debugBloqueo; // DEBUG TEMPORAL
    if (!activo) { setDisplayTimer(null); return; }
    function tick() {
      const p = partidaRef.current;
      if (!p?.turno_inicio) { setDisplayTimer(null); return; }
      const elapsed = (Date.now() - new Date(p.turno_inicio).getTime()) / 1000;
      const remaining = Math.max(0, 15 - Math.floor(elapsed));
      setDisplayTimer(remaining);
      if (remaining <= 0) {
        const pAcc = p.accion_pendiente;
        if (pAcc && pAcc.cantado_por !== user.id) {
          if (timerAutoFiredRef.current !== p.turno_inicio) {
            timerAutoFiredRef.current = p.turno_inicio;
            clearInterval(displayTimerIntervalRef.current);
            noQuieroRef.current?.();
          }
        } else if (!pAcc && p.turno === user.id) {
          if (timerAutoFiredRef.current !== p.turno_inicio) {
            timerAutoFiredRef.current = p.turno_inicio;
            clearInterval(displayTimerIntervalRef.current);
            irseAlMazoRef.current?.("timeout");
          }
        }
      }
    }
    tick();
    displayTimerIntervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(displayTimerIntervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida?.turno, partida?.turno_inicio, partida?.accion_pendiente?.cantado_por, resolviendoMano, debugBloqueo]); // DEBUG TEMPORAL

  // Anti-injusticia: al volver a primer plano, re-verificar contra Supabase antes de auto-actuar
  useEffect(() => {
    if (!codigo) return;
    function onVisible() {
      if (document.hidden) return;
      const p = partidaRef.current;
      if (!p || p.turno !== user.id || p.accion_pendiente || !p.turno_inicio || resolviendoManoRef.current || debugBloqueoRef.current) return; // DEBUG TEMPORAL
      const elapsed = (Date.now() - new Date(p.turno_inicio).getTime()) / 1000;
      if (elapsed >= 15 && timerAutoFiredRef.current !== p.turno_inicio) {
        supabase.from("partidas").select("turno, turno_inicio").eq("codigo", codigo).single()
          .then(({ data }) => {
            if (data && data.turno === user.id && data.turno_inicio === p.turno_inicio) {
              if (timerAutoFiredRef.current !== data.turno_inicio) {
                timerAutoFiredRef.current = data.turno_inicio;
                irseAlMazoRef.current?.("timeout");
              }
            }
          });
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, user.id]);

  // Reconexión Realtime: al volver a primer plano o recuperar red, refetch + re-subscribe
  useEffect(() => {
    if (!codigo) return;
    async function ejecutarReconexion() {
      if (reconectandoRef.current) return;
      reconectandoRef.current = true;
      try { await reconectarRef.current?.(); }
      finally { reconectandoRef.current = false; }
    }
    function onVuelveAlFrente() {
      if (reconexionTimerRef.current) clearTimeout(reconexionTimerRef.current);
      reconexionTimerRef.current = setTimeout(ejecutarReconexion, 500);
    }
    function onVisible() { if (!document.hidden) onVuelveAlFrente(); }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVuelveAlFrente);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVuelveAlFrente);
      if (reconexionTimerRef.current) clearTimeout(reconexionTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  // Heartbeat de actividad propia (cada 20s) + detección de abandono del rival por
  // inactividad (>90s sin heartbeat suyo). Efecto separado del timer Anti-injusticia:
  // ese depende de "activo" (se detiene mientras espero respuesta a mi propio canto),
  // acá necesitamos cobertura continua en todo momento de la partida.
  useEffect(() => {
    if (!codigo) return;
    let abandonoDetectado = false;
    const miColumna = soyJugador1 ? "ultima_actividad_j1" : "ultima_actividad_j2";
    const rivalColumna = soyJugador1 ? "ultima_actividad_j2" : "ultima_actividad_j1";
    async function tick() {
      const p = partidaRef.current;
      if (!p || p.estado !== "jugando") return;
      await supabase.from("partidas").update({ [miColumna]: new Date().toISOString() }).eq("codigo", codigo);

      // DEBUG TEMPORAL: auto-reset de pausa huérfana si el que la abrió se desconectó (>5 min)
      if (p.debug_pausada && p.debug_pausada_desde) {
        const segundosPausada = (Date.now() - new Date(p.debug_pausada_desde).getTime()) / 1000;
        if (segundosPausada > 300) {
          supabase.from("partidas").update({ debug_pausada: false, debug_pausada_desde: null }).eq("codigo", codigo);
        }
      }

      if (abandonoDetectado) return;
      const ultimaRival = p[rivalColumna];
      if (!ultimaRival) return;
      const segundosSinActividad = (Date.now() - new Date(ultimaRival).getTime()) / 1000;
      if (segundosSinActividad > 90) {
        abandonoDetectado = true;
        const { error } = await supabase.from("partidas").update({
          ganador_id: user.id,
          estado: "terminada",
          finalizado_en: new Date().toISOString(),
          motivo_fin: "abandono",
          debia_jugada_id: null,
        }).eq("codigo", codigo);
        if (error) console.error("abandono por inactividad:", error);
      }
    }
    tick();
    const intervalo = setInterval(tick, 20000);
    return () => clearInterval(intervalo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, soyJugador1]);

  async function tieneTorneoActivo() {
    const { data: inscripciones } = await supabase
      .from("torneo_jugadores")
      .select("torneo_id")
      .eq("jugador_id", user.id);
    const torneoIds = [...new Set((inscripciones || []).map(i => i.torneo_id))];
    if (torneoIds.length === 0) return false;
    const { data: torneosActivos } = await supabase
      .from("torneos")
      .select("id")
      .in("id", torneoIds)
      .in("estado", ["abierto", "en_curso"])
      .limit(1);
    return (torneosActivos?.length || 0) > 0;
  }

  async function crearSala() {
    if (await tieneTorneoActivo()) { setError("Estás anotado en un torneo en curso. No podés crear partidas 1vs1 hasta que termine."); setPantalla("menu"); return; }
    if (await tienePartidaActiva(user.id)) { setError("Ya tenés una partida activa. Finalizala antes de crear otra."); setPantalla("menu"); return; }

    // Eliminar salas propias previas en espera (evita acumulación y reemplaza la anterior)
    const { data: salasPrevias, error: errPrevias } = await supabase
      .from("partidas")
      .select("codigo, apuesta")
      .eq("jugador1_id", user.id)
      .eq("estado", "esperando");
    if (!errPrevias && salasPrevias?.length) {
      for (const sala of salasPrevias) {
        if ((sala.apuesta || 0) > 0) {
          const { data: freshPrev } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
          const { error: refundErr } = await supabase.from("perfiles")
            .update({ saldo: (freshPrev?.saldo || 0) + sala.apuesta })
            .eq("usuario_id", user.id);
          if (refundErr) console.error("refund sala previa:", refundErr);
        }
        const { error: delErr } = await supabase.from("partidas").delete().eq("codigo", sala.codigo);
        if (delErr) console.error("eliminar sala previa:", delErr);
      }
    }

    let saldoAntesCrea = 0;
    if ((apuesta || 0) > 0) {
      const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
      const saldoActual = fresh?.saldo || 0;
      if (saldoActual < apuesta) { setError("Saldo insuficiente."); setPantalla("menu"); return; }
      const { error: saldoErr } = await supabase.from("perfiles")
        .update({ saldo: saldoActual - apuesta })
        .eq("usuario_id", user.id);
      if (saldoErr) { setError("Error al procesar el saldo."); setPantalla("menu"); return; }
      saldoAntesCrea = saldoActual;
    }
    const cod = generarCodigo();
    const mazo = mezclar(MAZO);
    const mano1 = mazo.slice(0, 3);
    const mano2 = mazo.slice(3, 6);
    const { error: err } = await supabase.from("partidas").insert({
      codigo: cod,
      estado: "esperando",
      jugador1_id: user.id,
      jugador1_nombre: perfil?.nombre || "",
      jugador1_avatar: avatarSrc(perfil?.avatar),
      mano_jugador1: JSON.stringify(mano1),
      mano_jugador2: JSON.stringify(mano2),
      mano_original_j1: JSON.stringify(mano1),
      mano_original_j2: JSON.stringify(mano2),
      truco_nivel: null,
      truco_derecho_de: null,
      truco_en_pausa: null,
      turno: user.id,
      mano_id: user.id,
      mesa: JSON.stringify([]),
      puntos1: 0,
      puntos2: 0,
      apuesta: apuesta || 0,
      puntos: puntos || 30,
      es_torneo: esTorneo || false,
    });
    if (err) { setError("Error al crear sala"); setPantalla("menu"); return; }
    if ((apuesta || 0) > 0) {
      await supabase.from("transacciones").insert({
        usuario_id: user.id,
        tipo: "apuesta",
        monto: apuesta,
        estado: "aprobado",
        nota: `Apuesta partida ${cod}`,
        ejecutado_por: "sistema",
        saldo_anterior: saldoAntesCrea,
        saldo_nuevo: saldoAntesCrea - apuesta,
      });
    }
    setCodigo(cod);
    salaEnEsperaRef.current = cod;
    setSoyJugador1(true);
    setMiMano(mano1);
    setManoRival(mano2);
    setPantalla("esperando");
  }

  async function unirseASala() {
    const cod = codigoInput.toUpperCase().trim();
    const { data, error: err } = await supabase.from("partidas").select("*").eq("codigo", cod).single();
    if (err || !data) { setError("Sala no encontrada"); return; }
    if (data.estado !== "esperando") { setError("La sala ya está en juego"); return; }
    if (await tieneTorneoActivo()) { setError("Estás anotado en un torneo en curso. No podés unirte a partidas 1vs1 hasta que termine."); return; }
    // Verificar que el usuario no tenga ya una partida activa
    if (await tienePartidaActiva(user.id)) { setError("Ya tenés una partida activa. Finalizala antes de unirte a otra."); return; }
    const montoSala = data.apuesta || 0;
    let saldoActual = 0;
    if (montoSala > 0) {
      const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
      saldoActual = fresh?.saldo || 0;
      if (saldoActual < montoSala) { setError("Saldo insuficiente para unirte a esta partida."); return; }
    }
    const turnoInicio = new Date().toISOString();
    const { data: filasGanadas, error: joinErr } = await supabase
      .from("partidas")
      .update({
        jugador2_id: user.id,
        jugador2_nombre: perfil?.nombre || "",
        jugador2_avatar: avatarSrc(perfil?.avatar),
        estado: "jugando",
        turno_inicio: turnoInicio,
      })
      .eq("codigo", cod)
      .is("jugador2_id", null)
      .eq("estado", "esperando")
      .select();

    if (joinErr || !filasGanadas || filasGanadas.length === 0) {
      setError("La sala ya fue ocupada por otro jugador.");
      return;
    }
    const partidaGanada = filasGanadas[0];

    if (montoSala > 0) {
      const { error: saldoErr } = await supabase.from("perfiles")
        .update({ saldo: saldoActual - montoSala })
        .eq("usuario_id", user.id);
      if (saldoErr) {
        await supabase.from("partidas").update({
          jugador2_id: null,
          jugador2_nombre: null,
          jugador2_avatar: null,
          estado: "esperando",
          turno_inicio: null,
        }).eq("codigo", cod).eq("jugador2_id", user.id);
        setError("Error al procesar el saldo, volvé a intentar unirte.");
        return;
      }
      await supabase.from("transacciones").insert({
        usuario_id: user.id,
        tipo: "apuesta",
        monto: montoSala,
        estado: "aprobado",
        nota: `Apuesta vs ${partidaGanada.jugador1_nombre || "rival"}`,
        ejecutado_por: "sistema",
        saldo_anterior: saldoActual,
        saldo_nuevo: saldoActual - montoSala,
      });
    }
    setCodigo(cod);
    setSoyJugador1(false);
    setMiMano(JSON.parse(partidaGanada.mano_jugador2));
    setManoRival(JSON.parse(partidaGanada.mano_jugador1));
    setPartida(partidaGanada);
    setPantalla("jugando");
    addLog("¡Partida iniciada!");
  }

  async function jugarCarta(idx) {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    if (!partida) return;
    if (resolviendoMano) return;
    if (partida.accion_pendiente) { setCartaSeleccionada(null); return; }
    if (partida.turno !== user.id) { addLog("No es tu turno"); return; }
    if (cartaSeleccionada !== idx) { setCartaSeleccionada(idx); return; }

    const carta = miMano[idx];
    const mesaActual = JSON.parse(partida.mesa || "[]");
    const nuevaMesa = [...mesaActual, { carta, jugador: user.id }];
    const rivalId = soyJugador1 ? partida.jugador2_id : partida.jugador1_id;
    const nuevaMiMano = miMano.filter((_, i) => i !== idx);
    const manoField = soyJugador1 ? 'mano_jugador1' : 'mano_jugador2';

    // Optimistic update: remove played card immediately
    setMiMano(nuevaMiMano);
    setCartaSeleccionada(null);
    reproducirSonidoCarta();
    addLog(`Jugaste: ${carta.num} de ${carta.palo}`);

    let updateData = {
      mesa: JSON.stringify(nuevaMesa),
      turno: rivalId,
      [manoField]: JSON.stringify(nuevaMiMano),
      turno_inicio: new Date().toISOString(),
    };

    // When both players have played in this round, resolve it
    if (nuevaMesa.length % 2 === 0) {
      const nRondas = nuevaMesa.length / 2;
      const cardA = nuevaMesa[nuevaMesa.length - 2];
      const cardB = nuevaMesa[nuevaMesa.length - 1];
      const vA = valorTruco(cardA.carta), vB = valorTruco(cardB.carta);
      const ganadorRonda = vA > vB ? cardA.jugador : vB > vA ? cardB.jugador : null;

      addLog(ganadorRonda
        ? `Ronda ${nRondas}: ganó ${ganadorRonda === user.id ? 'vos' : 'el rival'}`
        : `Ronda ${nRondas}: empate`
      );

      // Build bazas array for resolverGanadorMano (A=jugador1, B=jugador2)
      const j1 = partida.jugador1_id, j2 = partida.jugador2_id;
      const bazas = [];
      for (let i = 0; i < nuevaMesa.length; i += 2) {
        const a = nuevaMesa[i], b = nuevaMesa[i + 1];
        const va = valorTruco(a.carta), vb = valorTruco(b.carta);
        if (va > vb) bazas.push(a.jugador === j1 ? "A" : "B");
        else if (vb > va) bazas.push(b.jugador === j1 ? "A" : "B");
        else bazas.push("parda");
      }
      const manoEs = (partida.mano_id || j1) === j1 ? "A" : "B";
      const res = resolverGanadorMano(bazas, manoEs);
      const ganadorMano = res === "A" ? j1 : res === "B" ? j2 : null;

      if (ganadorMano) {
        const { data: freshMano, error: errFreshMano } = await supabase
          .from("partidas")
          .select("puntos_mano, puntos1, puntos2")
          .eq("codigo", codigo)
          .single();
        if (errFreshMano || !freshMano) { console.error("jugarCarta fetch fresco mano:", errFreshMano); return; }
        const puntosMano = freshMano.puntos_mano || 1;
        const nuevoPuntos1 = (freshMano.puntos1 || 0) + (ganadorMano === partida.jugador1_id ? puntosMano : 0);
        const nuevoPuntos2 = (freshMano.puntos2 || 0) + (ganadorMano === partida.jugador2_id ? puntosMano : 0);
        const puntosObjetivo = partida.puntos || 15;
        addLog(`¡${ganadorMano === user.id ? 'Ganaste' : 'Perdiste'} la mano! (+${puntosMano} pt${puntosMano > 1 ? 's' : ''})`);

        if (nuevoPuntos1 >= puntosObjetivo || nuevoPuntos2 >= puntosObjetivo) {
          const ganadorId = nuevoPuntos1 >= puntosObjetivo ? partida.jugador1_id : partida.jugador2_id;
          updateData = { ...updateData, puntos1: nuevoPuntos1, puntos2: nuevoPuntos2, puntos_mano: 1, accion_pendiente: null, ganador_id: ganadorId, estado: "terminada", finalizado_en: new Date().toISOString(), motivo_fin: "puntaje", debia_jugada_id: null };
        } else {
          // New hand: two-step update so both players see the mesa before it clears
          setResolviendoMano(true);
          // Step 1: keep mesa visible, update scores; turno=user.id blocks both players
          await supabase.from("partidas").update({
            mesa: JSON.stringify(nuevaMesa),
            [manoField]: JSON.stringify(nuevaMiMano),
            puntos1: nuevoPuntos1,
            puntos2: nuevoPuntos2,
            puntos_mano: 1,
            envido_jugado: false,
            truco_jugado: false,
            truco_nivel: null,
            truco_derecho_de: null,
            truco_en_pausa: null,
            accion_pendiente: null,
            envido_resultado: null,
            turno: user.id,
          }).eq("codigo", codigo);
          // Step 2: after delay, clear mesa and deal new hand
          await new Promise(resolve => setTimeout(resolve, 1500));
          const nuevoMazo = mezclar(MAZO);
          reproducirSonidoRepartir();
          const manoActual = partida.mano_id || partida.jugador1_id;
          const siguienteMano = manoActual === partida.jugador1_id ? partida.jugador2_id : partida.jugador1_id;
          await supabase.from("partidas").update({
            mesa: JSON.stringify([]),
            mano_jugador1: JSON.stringify(nuevoMazo.slice(0, 3)),
            mano_jugador2: JSON.stringify(nuevoMazo.slice(3, 6)),
            mano_original_j1: JSON.stringify(nuevoMazo.slice(0, 3)),
            mano_original_j2: JSON.stringify(nuevoMazo.slice(3, 6)),
            turno: siguienteMano,
            mano_id: siguienteMano,
            turno_inicio: new Date().toISOString(),
          }).eq("codigo", codigo);
          setResolviendoMano(false);
          return;
        }
      } else {
        updateData.turno = ganadorRonda !== null ? ganadorRonda : cardA.jugador;
      }
    }

    await supabase.from("partidas").update(updateData).eq("codigo", codigo);
  }

  async function salirDePartida() {
    localStorage.removeItem(`truco_partida_${user.id}`);
    if (pantalla === "esperando" && codigo) {
      // Sala sin rival: borrarla y devolver apuesta si la hay
      salaEnEsperaRef.current = null; // evitar doble-delete en unmount
      if ((apuesta || 0) > 0) {
        const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
        const { error: refErr } = await supabase.from("perfiles").update({ saldo: (fresh?.saldo || 0) + apuesta }).eq("usuario_id", user.id);
        if (refErr) console.error("salirDePartida esperando refund:", refErr);
      }
      const { error: delErr } = await supabase.from("partidas").delete().eq("codigo", codigo);
      if (delErr) console.error("salirDePartida esperando delete:", delErr);
    } else if (partida && partida.estado === "jugando") {
      const rivalId = soyJugador1 ? partida.jugador2_id : partida.jugador1_id;
      if (rivalId) {
        pagoProcesadoRef.current = true;
        await supabase.from("partidas")
          .update({ ganador_id: rivalId, estado: "terminada", finalizado_en: new Date().toISOString(), motivo_fin: "abandono", debia_jugada_id: null })
          .eq("codigo", codigo);
      }
    }
    onVolver();
  }

  async function cantarTruco() {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    if (!partida || partida.accion_pendiente || partida.truco_jugado) return;
    if (partida.turno !== user.id) return;
    reproducirVoz('truco');
    await supabase.from("partidas").update({
      accion_pendiente: { tipo: 'truco', nivel: 1, cantado_por: user.id, si_quiero: 2, si_no: 1 },
      truco_jugado: true,
      turno_inicio: new Date().toISOString(),
      ultimo_canto: { tag: "truco", por: user.id, ts: Date.now() },
    }).eq("codigo", codigo);
    addLog("¡Truco!");
  }

  async function subirTruco() {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    const acc = partida?.accion_pendiente;
    if (!acc || acc.tipo !== 'truco' || acc.cantado_por === user.id || acc.nivel >= 3) return;
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("accion_pendiente")
      .eq("codigo", codigo)
      .single();
    if (errFresh || !freshPartida?.accion_pendiente) { console.error("subirTruco fetch fresco:", errFresh); return; }
    const accFresh = freshPartida.accion_pendiente;
    if (accFresh.tipo !== 'truco' || accFresh.cantado_por === user.id || accFresh.nivel >= 3) return;
    const nuevoNivel = accFresh.nivel + 1;
    const labels = { 2: 'Retruco', 3: 'Vale cuatro' };
    reproducirVoz(nuevoNivel === 2 ? 'retruco' : 'vale_cuatro');
    await supabase.from("partidas").update({
      accion_pendiente: { tipo: 'truco', nivel: nuevoNivel, cantado_por: user.id, si_quiero: nuevoNivel + 1, si_no: nuevoNivel },
      turno_inicio: new Date().toISOString(),
      ultimo_canto: { tag: nuevoNivel === 2 ? "retruco" : "vale_cuatro", por: user.id, ts: Date.now() },
    }).eq("codigo", codigo);
    addLog(`¡${labels[nuevoNivel]}!`);
  }

  // Escalada DIFERIDA: el que tiene el derecho (aceptó el último nivel) la ejerce
  // en su propio turno, sin que haya un canto del rival pendiente en este momento.
  async function escalarTrucoDiferido() {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    if (!partida || partida.accion_pendiente) return;
    if (partida.turno !== user.id) return;
    if (partida.truco_derecho_de !== user.id) return;
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("accion_pendiente, turno, truco_derecho_de, truco_nivel")
      .eq("codigo", codigo)
      .single();
    if (errFresh || !freshPartida) { console.error("escalarTrucoDiferido fetch fresco:", errFresh); return; }
    if (freshPartida.accion_pendiente) return;
    if (freshPartida.turno !== user.id) return;
    if (freshPartida.truco_derecho_de !== user.id) return;
    const nivelActual = freshPartida.truco_nivel || 0;
    if (nivelActual >= 3) return;
    const nuevoNivel = nivelActual + 1;
    const labels = { 2: 'Retruco', 3: 'Vale cuatro' };
    reproducirVoz(nuevoNivel === 2 ? 'retruco' : 'vale_cuatro');
    await supabase.from("partidas").update({
      accion_pendiente: { tipo: 'truco', nivel: nuevoNivel, cantado_por: user.id, si_quiero: nuevoNivel + 1, si_no: nuevoNivel },
      turno_inicio: new Date().toISOString(),
      ultimo_canto: { tag: nuevoNivel === 2 ? "retruco" : "vale_cuatro", por: user.id, ts: Date.now() },
    }).eq("codigo", codigo);
    addLog(`¡${labels[nuevoNivel]}!`);
  }

  async function cantarEnvido(subtipo) {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    if (!partida || partida.accion_pendiente || partida.envido_jugado) return;
    if (partida.turno !== user.id) return;
    if (JSON.parse(partida.mesa || "[]").length >= 2) return;
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("accion_pendiente, envido_jugado, turno, mesa, puntos1, puntos2")
      .eq("codigo", codigo)
      .single();
    if (errFresh || !freshPartida) { console.error("cantarEnvido fetch fresco:", errFresh); return; }
    if (freshPartida.accion_pendiente || freshPartida.envido_jugado) return;
    if (freshPartida.turno !== user.id) return;
    if (JSON.parse(freshPartida.mesa || "[]").length >= 2) return;
    const puntosObj = partida.puntos || 15;
    const falta = calcularFalta(puntosObj, freshPartida.puntos1 || 0, freshPartida.puntos2 || 0);
    const VALS = { envido: 2, real_envido: 3, falta_envido: falta };
    reproducirVoz(VOZ_ENV[subtipo] || 'envido');
    await supabase.from("partidas").update({
      accion_pendiente: {
        tipo: 'envido', subtipo, cadena: [subtipo],
        cantado_por: user.id, si_quiero: VALS[subtipo], si_no: 1,
      },
      envido_jugado: true,
      turno_inicio: new Date().toISOString(),
      ultimo_canto: { tag: subtipo, por: user.id, ts: Date.now() },
    }).eq("codigo", codigo);
    addLog(`¡${LABEL_ENV[subtipo]}!`);
  }

  async function cantarEnvidoSobreTruco(subtipo) {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    const acc = partida?.accion_pendiente;
    if (!acc || acc.tipo !== 'truco' || acc.nivel !== 1 || acc.cantado_por === user.id) return;
    if (partida.envido_jugado) return;
    if (JSON.parse(partida.mesa || "[]").length >= 2) return;
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("accion_pendiente, envido_jugado, mesa, puntos1, puntos2")
      .eq("codigo", codigo)
      .single();
    if (errFresh || !freshPartida) { console.error("cantarEnvidoSobreTruco fetch fresco:", errFresh); return; }
    const accFresh = freshPartida.accion_pendiente;
    if (!accFresh || accFresh.tipo !== 'truco' || accFresh.nivel !== 1 || accFresh.cantado_por === user.id) return;
    if (freshPartida.envido_jugado) return;
    if (JSON.parse(freshPartida.mesa || "[]").length >= 2) return;
    const puntosObj = partida.puntos || 15;
    const falta = calcularFalta(puntosObj, freshPartida.puntos1 || 0, freshPartida.puntos2 || 0);
    const VALS = { envido: 2, real_envido: 3, falta_envido: falta };
    reproducirVoz(VOZ_ENV[subtipo] || 'envido');
    await supabase.from("partidas").update({
      truco_en_pausa: accFresh,
      accion_pendiente: {
        tipo: 'envido', subtipo, cadena: [subtipo],
        cantado_por: user.id, si_quiero: VALS[subtipo], si_no: 1,
      },
      envido_jugado: true,
      turno_inicio: new Date().toISOString(),
      ultimo_canto: { tag: subtipo, por: user.id, ts: Date.now() },
    }).eq("codigo", codigo);
    addLog(`¡${LABEL_ENV[subtipo]}! (el Truco queda en pausa)`);
  }

  async function escalarEnvido(subtipo) {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    const acc = partida?.accion_pendiente;
    if (!acc || acc.tipo !== 'envido' || acc.cantado_por === user.id) return;
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("accion_pendiente, puntos1, puntos2")
      .eq("codigo", codigo)
      .single();
    if (errFresh || !freshPartida?.accion_pendiente) { console.error("escalarEnvido fetch fresco:", errFresh); return; }
    const accFresh = freshPartida.accion_pendiente;
    if (accFresh.subtipo === 'falta_envido') return;
    if (accFresh.subtipo === 'real_envido' && subtipo !== 'falta_envido') return;
    const vecesEnvido = (accFresh.cadena || []).filter(s => s === 'envido').length;
    if (subtipo === 'envido' && vecesEnvido >= 2) return;
    const puntosObj = partida.puntos || 15;
    const falta = calcularFalta(puntosObj, freshPartida.puntos1 || 0, freshPartida.puntos2 || 0);
    const VALS = { envido: 2, real_envido: 3, falta_envido: falta };
    const nuevaCadena = [...(accFresh.cadena || [accFresh.subtipo]), subtipo];
    reproducirVoz(VOZ_ENV[subtipo] || 'envido');
    await supabase.from("partidas").update({
      accion_pendiente: {
        tipo: 'envido', subtipo, cadena: nuevaCadena,
        cantado_por: user.id,
        si_quiero: subtipo === 'falta_envido' ? falta : accFresh.si_quiero + VALS[subtipo],
        si_no: accFresh.si_quiero,
      },
      turno_inicio: new Date().toISOString(),
      ultimo_canto: { tag: subtipo, por: user.id, ts: Date.now() },
    }).eq("codigo", codigo);
    addLog(`¡${nuevaCadena.map(s => LABEL_ENV[s]).join(' + ')}!`);
  }

  async function quiero() {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    const acc = partida?.accion_pendiente;
    if (!acc || acc.cantado_por === user.id) return;
    reproducirVoz('quiero');
    const puntosObj = partida.puntos || 15;

    if (acc.tipo === 'truco') {
      const { data: freshPartida, error: errFresh } = await supabase
        .from("partidas")
        .select("accion_pendiente")
        .eq("codigo", codigo)
        .single();
      if (errFresh || !freshPartida?.accion_pendiente) { console.error("quiero truco fetch fresco:", errFresh); return; }
      const accFresh = freshPartida.accion_pendiente;
      if (accFresh.cantado_por === user.id) return;
      const { error: errQuieroTruco } = await supabase.from("partidas").update({
        accion_pendiente: null,
        puntos_mano: accFresh.si_quiero,
        truco_nivel: accFresh.nivel,
        truco_derecho_de: user.id,
        turno_inicio: new Date().toISOString(),
        ultimo_canto: { tag: "quiero", por: user.id, ts: Date.now() },
      }).eq("codigo", codigo);
      if (errQuieroTruco) {
        console.error("[quiero truco] UPDATE falló:", errQuieroTruco);
      } else {
        addLog(`Quiero. Mano vale ${accFresh.si_quiero} pt${accFresh.si_quiero > 1 ? 's' : ''}.`);
      }
      return;
    }

    // Envido: fetch fresco antes de comparar y sumar
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("accion_pendiente, puntos1, puntos2")
      .eq("codigo", codigo)
      .single();
    if (errFresh || !freshPartida?.accion_pendiente) { console.error("quiero envido fetch fresco:", errFresh); return; }
    const accFresh = freshPartida.accion_pendiente;
    if (accFresh.cantado_por === user.id) return;

    // Envido: comparar valores
    const mano1 = JSON.parse(partida.mano_original_j1 || partida.mano_jugador1);
    const mano2 = JSON.parse(partida.mano_original_j2 || partida.mano_jugador2);
    const v1 = valorEnvido(mano1), v2 = valorEnvido(mano2);
    const ganadorEnv = v1 > v2 ? partida.jugador1_id : v2 > v1 ? partida.jugador2_id : partida.jugador1_id;
    const miVal = soyJugador1 ? v1 : v2, rivalVal = soyJugador1 ? v2 : v1;

    const ptosEnvido = accFresh.si_quiero;

    addLog(`Quiero. Vos: ${miVal} | Rival: ${rivalVal}. +${ptosEnvido} para ${ganadorEnv === user.id ? 'vos' : 'rival'}`);

    // Textos para los globos: el ganador muestra sus puntos, el perdedor "Son buenas"
    const j1GanaEnv = ganadorEnv === partida.jugador1_id;
    const envidoRes = {
      texto_j1: j1GanaEnv ? `¡Son ${v1}!` : "Son buenas",
      texto_j2: j1GanaEnv ? "Son buenas" : `¡Son ${v2}!`,
    };

    const np1 = (freshPartida.puntos1 || 0) + (ganadorEnv === partida.jugador1_id ? ptosEnvido : 0);
    const np2 = (freshPartida.puntos2 || 0) + (ganadorEnv === partida.jugador2_id ? ptosEnvido : 0);
    if (np1 >= puntosObj || np2 >= puntosObj) {
      const ganadorId = np1 >= puntosObj ? partida.jugador1_id : partida.jugador2_id;
      const { error } = await supabase.from("partidas").update({ accion_pendiente: null, truco_en_pausa: null, puntos1: np1, puntos2: np2, ganador_id: ganadorId, estado: "terminada", envido_resultado: envidoRes, finalizado_en: new Date().toISOString(), motivo_fin: "puntaje", debia_jugada_id: null, ultimo_canto: { tag: "quiero", por: user.id, ts: Date.now() } }).eq("codigo", codigo);
      if (error) console.error("quiero envido gameOver:", error);
    } else {
      const { error } = await supabase.from("partidas").update({ accion_pendiente: partida.truco_en_pausa || null, truco_en_pausa: null, puntos1: np1, puntos2: np2, turno_inicio: new Date().toISOString(), envido_resultado: envidoRes, ultimo_canto: { tag: "quiero", por: user.id, ts: Date.now() } }).eq("codigo", codigo);
      if (error) console.error("quiero envido:", error);
      // Limpiar envido_resultado después de que ambos clientes alcancen a mostrarlo (2.5s display + margen de red)
      setTimeout(async () => {
        const { error: errClean } = await supabase.from("partidas").update({ envido_resultado: null }).eq("codigo", codigo);
        if (errClean) console.error("quiero envido cleanup:", errClean);
      }, 4000);
    }
  }

  async function noQuiero() {
    if (debugBloqueo) return; // DEBUG TEMPORAL
    const acc = partida?.accion_pendiente;
    if (!acc || acc.cantado_por === user.id) return;
    reproducirVoz('no_quiero');
    const puntosObj = partida.puntos || 15;

    if (acc.tipo === 'envido') {
      const { data: freshPartida, error: errFresh } = await supabase
        .from("partidas")
        .select("accion_pendiente, puntos1, puntos2")
        .eq("codigo", codigo)
        .single();
      if (errFresh || !freshPartida?.accion_pendiente) { console.error("noQuiero envido fetch fresco:", errFresh); return; }
      const accFresh = freshPartida.accion_pendiente;
      if (accFresh.cantado_por === user.id) return;
      const callerEsJ1 = accFresh.cantado_por === partida.jugador1_id;
      const np1 = (freshPartida.puntos1 || 0) + (callerEsJ1 ? accFresh.si_no : 0);
      const np2 = (freshPartida.puntos2 || 0) + (!callerEsJ1 ? accFresh.si_no : 0);
      addLog(`No quiero. El rival suma ${accFresh.si_no} pt${accFresh.si_no > 1 ? 's' : ''}.`);
      const gameOver = np1 >= puntosObj || np2 >= puntosObj;
      const ganadorId = np1 >= puntosObj ? partida.jugador1_id : partida.jugador2_id;
      if (gameOver) {
        const { error } = await supabase.from("partidas").update({ accion_pendiente: null, truco_en_pausa: null, puntos1: np1, puntos2: np2, ganador_id: ganadorId, estado: "terminada", finalizado_en: new Date().toISOString(), motivo_fin: "puntaje", debia_jugada_id: null, ultimo_canto: { tag: "no_quiero", por: user.id, ts: Date.now() } }).eq("codigo", codigo);
        if (error) console.error("noQuiero envido gameOver:", error);
      } else {
        const { error } = await supabase.from("partidas").update({ accion_pendiente: partida.truco_en_pausa || null, truco_en_pausa: null, puntos1: np1, puntos2: np2, turno_inicio: new Date().toISOString(), ultimo_canto: { tag: "no_quiero", por: user.id, ts: Date.now() } }).eq("codigo", codigo);
        if (error) console.error("noQuiero envido:", error);
      }
      return;
    }

    // Truco rechazado: termina la mano
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("accion_pendiente, puntos1, puntos2")
      .eq("codigo", codigo)
      .single();
    if (errFresh || !freshPartida?.accion_pendiente) { console.error("noQuiero truco fetch fresco:", errFresh); return; }
    const accFresh = freshPartida.accion_pendiente;
    if (accFresh.cantado_por === user.id) return;
    const callerEsJ1 = accFresh.cantado_por === partida.jugador1_id;
    const np1 = (freshPartida.puntos1 || 0) + (callerEsJ1 ? accFresh.si_no : 0);
    const np2 = (freshPartida.puntos2 || 0) + (!callerEsJ1 ? accFresh.si_no : 0);
    addLog(`No quiero. El rival suma ${accFresh.si_no} pt${accFresh.si_no > 1 ? 's' : ''}.`);
    const gameOver = np1 >= puntosObj || np2 >= puntosObj;
    const ganadorId = np1 >= puntosObj ? partida.jugador1_id : partida.jugador2_id;
    if (gameOver) {
      const { error } = await supabase.from("partidas").update({ accion_pendiente: null, puntos1: np1, puntos2: np2, puntos_mano: 1, ganador_id: ganadorId, estado: "terminada", finalizado_en: new Date().toISOString(), motivo_fin: "puntaje", debia_jugada_id: null, ultimo_canto: { tag: "no_quiero", por: user.id, ts: Date.now() } }).eq("codigo", codigo);
      if (error) console.error("noQuiero truco gameOver:", error);
    } else {
      const nuevoMazo = mezclar(MAZO);
      const manoActualNQ = partida.mano_id || partida.jugador1_id;
      const siguienteManoNQ = manoActualNQ === partida.jugador1_id ? partida.jugador2_id : partida.jugador1_id;
      const { error } = await supabase.from("partidas").update({
        accion_pendiente: null, puntos1: np1, puntos2: np2, puntos_mano: 1,
        envido_jugado: false, truco_jugado: false,
        truco_nivel: null, truco_derecho_de: null, truco_en_pausa: null,
        envido_resultado: null,
        mesa: JSON.stringify([]),
        mano_jugador1: JSON.stringify(nuevoMazo.slice(0, 3)),
        mano_jugador2: JSON.stringify(nuevoMazo.slice(3, 6)),
        mano_original_j1: JSON.stringify(nuevoMazo.slice(0, 3)),
        mano_original_j2: JSON.stringify(nuevoMazo.slice(3, 6)),
        turno: siguienteManoNQ,
        mano_id: siguienteManoNQ,
        turno_inicio: new Date().toISOString(),
        ultimo_canto: { tag: "no_quiero", por: user.id, ts: Date.now() },
      }).eq("codigo", codigo);
      if (error) console.error("noQuiero truco:", error);
    }
  }

  async function irseAlMazo(origen = "manual") {
    if (irseAlMazoEjecutandoRef.current) return;
    if (debugBloqueo) return; // DEBUG TEMPORAL
    if (!partida || resolviendoMano || partida.accion_pendiente) return;
    irseAlMazoEjecutandoRef.current = true;
    setIrseAlMazoBloqueado(true);
    const { data: freshPartida, error: errFresh } = await supabase
      .from("partidas")
      .select("puntos_mano, envido_jugado, mesa, truco_nivel, puntos1, puntos2")
      .eq("codigo", codigo)
      .single();
    if (errFresh) { console.error("irseAlMazo fetch fresco:", errFresh); irseAlMazoEjecutandoRef.current = false; setIrseAlMazoBloqueado(false); return; }
    const motivoFin = origen === "timeout" ? "timeout" : "abandono";
    const debiaJugadaId = origen === "timeout" ? partida.turno : null;
    const puntosObj = partida.puntos || 15;
    const rivalId = user.id === partida.jugador1_id ? partida.jugador2_id : partida.jugador1_id;
    const rivalEsJ1 = rivalId === partida.jugador1_id;
    const mesaLen = JSON.parse(freshPartida.mesa || "[]").length;
    const envidoVivo = !freshPartida.envido_jugado && mesaLen < 2;
    const puntoEnvido = envidoVivo ? 1 : 0;
    const ptsParaRival = (freshPartida.puntos_mano || 1) + puntoEnvido;
    // ⚠️ TEMPORAL — DEBUG: sacar antes de la siguiente limpieza de logs
    console.log("[DEBUG irseAlMazo]", {
      codigo, origen,
      mesa: freshPartida.mesa,
      mesaLen,
      envido_jugado: freshPartida.envido_jugado,
      puntos_mano: freshPartida.puntos_mano,
      truco_nivel: freshPartida.truco_nivel,
      envidoVivo, puntoEnvido, ptsParaRival,
    });
    const np1 = (freshPartida.puntos1 || 0) + (rivalEsJ1 ? ptsParaRival : 0);
    const np2 = (freshPartida.puntos2 || 0) + (!rivalEsJ1 ? ptsParaRival : 0);
    addLog(`Te fuiste al mazo. Rival suma ${ptsParaRival} pt${ptsParaRival > 1 ? 's' : ''}${puntoEnvido ? ' (incl. envido)' : ''}.`);
    reproducirVoz('me_voy_al_mazo');
    const gameOver = np1 >= puntosObj || np2 >= puntosObj;
    const ganadorId = np1 >= puntosObj ? partida.jugador1_id : partida.jugador2_id;
    if (gameOver) {
      const { error } = await supabase.from("partidas").update({
        accion_pendiente: null, puntos1: np1, puntos2: np2,
        puntos_mano: 1, ganador_id: ganadorId, estado: "terminada",
        finalizado_en: new Date().toISOString(), motivo_fin: motivoFin, debia_jugada_id: debiaJugadaId,
        ultimo_canto: { tag: "me_voy_al_mazo", por: user.id, ts: Date.now() },
      }).eq("codigo", codigo);
      if (error) console.error("irseAlMazo gameOver:", error);
      irseAlMazoEjecutandoRef.current = false;
      setIrseAlMazoBloqueado(false);
    } else {
      // Paso 1: publicar puntaje — la suscripción lo muestra en ambos clientes
      setResolviendoMano(true);
      const { error: err1 } = await supabase.from("partidas").update({
        accion_pendiente: null, puntos1: np1, puntos2: np2, puntos_mano: 1,
        envido_jugado: false, truco_jugado: false,
        truco_nivel: null, truco_derecho_de: null, truco_en_pausa: null,
        envido_resultado: null,
        turno: user.id,
        ultimo_canto: { tag: "me_voy_al_mazo", por: user.id, ts: Date.now() },
      }).eq("codigo", codigo);
      if (err1) { console.error("irseAlMazo paso1:", err1); setResolviendoMano(false); irseAlMazoEjecutandoRef.current = false; setIrseAlMazoBloqueado(false); return; }
      // Paso 2: tras la misma pausa que jugarCarta, repartir nueva mano
      await new Promise(resolve => setTimeout(resolve, 1500));
      const nuevoMazo = mezclar(MAZO);
      const manoActual = partida.mano_id || partida.jugador1_id;
      const siguienteMano = manoActual === partida.jugador1_id ? partida.jugador2_id : partida.jugador1_id;
      const { error: err2 } = await supabase.from("partidas").update({
        mesa: JSON.stringify([]),
        mano_jugador1: JSON.stringify(nuevoMazo.slice(0, 3)),
        mano_jugador2: JSON.stringify(nuevoMazo.slice(3, 6)),
        mano_original_j1: JSON.stringify(nuevoMazo.slice(0, 3)),
        mano_original_j2: JSON.stringify(nuevoMazo.slice(3, 6)),
        turno: siguienteMano,
        mano_id: siguienteMano,
        turno_inicio: new Date().toISOString(),
      }).eq("codigo", codigo);
      if (err2) console.error("irseAlMazo paso2:", err2);
      setResolviendoMano(false);
      irseAlMazoEjecutandoRef.current = false;
      setIrseAlMazoBloqueado(false);
    }
  }

  irseAlMazoRef.current = irseAlMazo;
  noQuieroRef.current = noQuiero;

  /* ─── revancha ─── */
  function solicitarRevancha() {
    if (!channelRef.current) return;
    if (revanchaTimerRef.current) clearInterval(revanchaTimerRef.current);
    setRevanchaEstado("esperando_rival");
    setRevanchaTimer(30);
    channelRef.current.send({ type: "broadcast", event: "revancha_request" });
    revanchaTimerRef.current = setInterval(() => {
      setRevanchaTimer(t => {
        if (t <= 1) {
          clearInterval(revanchaTimerRef.current);
          setRevanchaEstado(prev => prev === "esperando_rival" ? null : prev);
          return 30;
        }
        return t - 1;
      });
    }, 1000);
  }

  function cancelarRevancha() {
    if (revanchaTimerRef.current) clearInterval(revanchaTimerRef.current);
    setRevanchaEstado(null);
    setRevanchaTimer(30);
  }

  async function aceptarRevancha() {
    setRevanchaEstado("procesando");
    const p = partidaRef.current;
    const apuestaR = p?.apuesta || 0;

    if (apuestaR > 0) {
      const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
      const saldoActual = fresh?.saldo || 0;
      if (saldoActual < apuestaR) {
        setRevanchaEstado(null);
        if (channelRef.current) channelRef.current.send({ type: "broadcast", event: "revancha_reject" });
        return;
      }
      const saldoNuevo = saldoActual - apuestaR;
      await supabase.from("perfiles").update({ saldo: saldoNuevo }).eq("usuario_id", user.id);
      await supabase.from("transacciones").insert({
        usuario_id: user.id, tipo: "apuesta", monto: apuestaR, estado: "aprobado",
        nota: `Apuesta revancha`, ejecutado_por: "sistema",
        saldo_anterior: saldoActual, saldo_nuevo: saldoNuevo,
      });
    }

    const rivalId     = soyJugador1 ? p?.jugador2_id    : p?.jugador1_id;
    const rivalNombre = soyJugador1 ? p?.jugador2_nombre : p?.jugador1_nombre;
    const rivalAvatar = soyJugador1 ? p?.jugador2_avatar : p?.jugador1_avatar;
    const nuevoCod = generarCodigo();
    const mazo = mezclar(MAZO);
    const mano1 = mazo.slice(0, 3);
    const mano2 = mazo.slice(3, 6);

    const { error: errInsert } = await supabase.from("partidas").insert({
      codigo: nuevoCod, estado: "jugando",
      jugador1_id: user.id,
      jugador1_nombre: perfil?.nombre || "",
      jugador1_avatar: avatarSrc(perfil?.avatar),
      jugador2_id: rivalId,
      jugador2_nombre: rivalNombre || "",
      jugador2_avatar: avatarSrc(rivalAvatar),
      mano_jugador1: JSON.stringify(mano1),
      mano_jugador2: JSON.stringify(mano2),
      mano_original_j1: JSON.stringify(mano1),
      mano_original_j2: JSON.stringify(mano2),
      truco_nivel: null,
      truco_derecho_de: null,
      truco_en_pausa: null,
      turno: user.id, mano_id: user.id, mesa: JSON.stringify([]),
      puntos1: 0, puntos2: 0,
      apuesta: apuestaR,
      puntos: p?.puntos || 15,
      es_torneo: p?.es_torneo || false,
      turno_inicio: new Date().toISOString(),
    });

    if (errInsert) { setRevanchaEstado(null); return; }

    if (channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "revancha_accept", payload: { nuevoCodigo: nuevoCod } });
    }

    // Cargar la partida nueva en estado local (evita ver el marcador de la partida anterior)
    const { data: nuevaPartida } = await supabase.from("partidas").select("*").eq("codigo", nuevoCod).single();

    // Aceptante entra como jugador1
    pagoProcesadoRef.current = false;
    accionLogueadaRef.current = null;
    setResultadoPartida(null);
    setRevanchaEstado(null);
    setCartaSeleccionada(null);
    if (nuevaPartida) setPartida(nuevaPartida);
    setSoyJugador1(true);
    setMiMano(mano1);
    setManoRival(mano2);
    setPantalla("jugando");
    setCodigo(nuevoCod);
  }

  function rechazarRevancha() {
    setRevanchaEstado(null);
    if (channelRef.current) channelRef.current.send({ type: "broadcast", event: "revancha_reject" });
  }
  /* ─────────────── */

  const miTurno = partida?.turno === user.id;
  const mesaActual = partida?.mesa ? JSON.parse(partida.mesa) : [];
  const puedoActuar = miTurno && !partida?.accion_pendiente && !resolviendoMano;
  const estaEsperandoRival = !miTurno && !partida?.accion_pendiente && !resolviendoMano;

  if (resultadoPartida) return (
    <div style={{ minHeight:"100vh",background:"#101010",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lato',sans-serif",padding:24 }}>
      {resultadoPartida.ganaste ? (
        /* ── Pantalla de victoria ── */
        <div style={{ textAlign:"center",maxWidth:320,width:"100%" }}>
          <div style={{ fontSize:64,marginBottom:16 }}>🏆</div>
          <div style={{ fontSize:28,fontWeight:900,color:"#fbbf24",marginBottom:8 }}>¡Ganaste!</div>
          {resultadoPartida.premio > 0 && (
            <>
              <div style={{ fontSize:18,color:"#4ade80",fontWeight:700,marginBottom:4 }}>
                +{fmtARS(resultadoPartida.premio)} acreditados
              </div>
              {resultadoPartida.rake > 0 && (
                <div style={{ fontSize:12,color:"#6b7280",marginBottom:8 }}>
                  Comisión de la casa: {resultadoPartida.rakePct}%
                </div>
              )}
            </>
          )}
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:20 }}>
            {revanchaEstado === null && (
              <button onClick={solicitarRevancha} style={{ padding:"12px 28px",borderRadius:12,cursor:"pointer",background:"rgba(251,191,36,0.1)",border:"1px solid #fbbf24",color:"#fbbf24",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>🔄 Revancha</button>
            )}
            {revanchaEstado === "esperando_rival" && (
              <div style={{ background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:12,padding:"14px 16px" }}>
                <div style={{ fontSize:13,color:"#fbbf24",fontWeight:700,marginBottom:4 }}>Esperando respuesta del rival...</div>
                <div style={{ fontSize:28,color:"#fbbf24",fontWeight:900,marginBottom:10 }}>{revanchaTimer}s</div>
                <button onClick={cancelarRevancha} style={{ padding:"6px 16px",borderRadius:8,cursor:"pointer",background:"none",border:"1px solid #374151",color:"#6b7280",fontFamily:"'Lato',sans-serif",fontSize:12 }}>Cancelar</button>
              </div>
            )}
            {revanchaEstado === "procesando" && <div style={{ fontSize:13,color:"#4ade80",padding:"10px" }}>⏳ Preparando la revancha...</div>}
            {(revanchaEstado === "rechazada" || revanchaEstado === "cancelada") && (
              <div style={{ fontSize:13,color:"#f87171",background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:10,padding:"12px" }}>
                {revanchaEstado === "rechazada" ? "El rival no aceptó la revancha" : "La revancha fue cancelada"}
              </div>
            )}
            <button onClick={onVolver} style={{ padding:"12px 28px",borderRadius:12,cursor:"pointer",background:"linear-gradient(135deg,#1a472a,#2d6a4f)",border:"1px solid #4ade80",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>Volver al inicio</button>
          </div>
        </div>
      ) : (
        /* ── Modal de derrota ── */
        <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:24,padding:"36px 28px",maxWidth:300,width:"100%",textAlign:"center",fontFamily:"'Lato',sans-serif",boxShadow:"0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(248,113,113,0.12)" }}>
          <div style={{ fontSize:56,marginBottom:12 }}>😞</div>
          <div style={{ fontSize:28,fontWeight:900,color:"#f87171",marginBottom:6 }}>¡Perdiste!</div>
          <div style={{ fontSize:14,color:"#9ca3af",marginBottom:4 }}>Volvé a intentarlo</div>
          {resultadoPartida.apuesta > 0 && (
            <div style={{ fontSize:13,color:"#4b5563",marginBottom:16 }}>Perdiste {fmtARS(resultadoPartida.apuesta)}</div>
          )}
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:20 }}>
            {revanchaEstado === null && (
              <button onClick={solicitarRevancha} style={{ padding:"12px 28px",borderRadius:12,cursor:"pointer",background:"rgba(251,191,36,0.1)",border:"1px solid #fbbf24",color:"#fbbf24",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>🔄 Revancha</button>
            )}
            {revanchaEstado === "esperando_rival" && (
              <div style={{ background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:12,padding:"14px 16px" }}>
                <div style={{ fontSize:13,color:"#fbbf24",fontWeight:700,marginBottom:4 }}>Esperando respuesta del rival...</div>
                <div style={{ fontSize:28,color:"#fbbf24",fontWeight:900,marginBottom:10 }}>{revanchaTimer}s</div>
                <button onClick={cancelarRevancha} style={{ padding:"6px 16px",borderRadius:8,cursor:"pointer",background:"none",border:"1px solid #374151",color:"#6b7280",fontFamily:"'Lato',sans-serif",fontSize:12 }}>Cancelar</button>
              </div>
            )}
            {revanchaEstado === "procesando" && <div style={{ fontSize:13,color:"#4ade80",padding:"10px" }}>⏳ Preparando la revancha...</div>}
            {(revanchaEstado === "rechazada" || revanchaEstado === "cancelada") && (
              <div style={{ fontSize:13,color:"#f87171",background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:10,padding:"12px" }}>
                {revanchaEstado === "rechazada" ? "El rival no aceptó la revancha" : "La revancha fue cancelada"}
              </div>
            )}
            <button onClick={onVolver} style={{ width:"100%",padding:"13px",borderRadius:12,cursor:"pointer",background:"linear-gradient(135deg,#1a472a,#2d6a4f)",border:"1px solid #4ade80",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>Volver al inicio</button>
          </div>
        </div>
      )}

      {/* Popup: rival quiere revancha */}
      {revanchaEstado === "rival_pide" && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:70,padding:16 }}>
          <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid rgba(251,191,36,0.45)",borderRadius:20,padding:"28px 24px",maxWidth:300,width:"100%",textAlign:"center",fontFamily:"'Lato',sans-serif" }}>
            <div style={{ fontSize:48,marginBottom:10 }}>🔄</div>
            <div style={{ fontSize:18,color:"#fbbf24",fontWeight:900,marginBottom:6 }}>¡Tu rival quiere una revancha!</div>
            <div style={{ fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom: (partidaRef.current?.apuesta || 0) > 0 ? 6 : 20 }}>¿Aceptás?</div>
            {(partidaRef.current?.apuesta || 0) > 0 && (
              <div style={{ fontSize:13,color:"#9ca3af",marginBottom:20 }}>
                Se descontarán {fmtARS(partidaRef.current.apuesta)} de tu saldo
              </div>
            )}
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <button onClick={aceptarRevancha} style={{ padding:"13px",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#1a472a,#2d6a4f)",border:"1px solid #4ade80",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>
                ✅ Aceptar
              </button>
              <button onClick={rechazarRevancha} style={{ padding:"13px",borderRadius:10,cursor:"pointer",background:"rgba(248,113,113,0.08)",border:"1px solid #f87171",color:"#f87171",fontFamily:"'Lato',sans-serif",fontSize:15,fontWeight:700 }}>
                ❌ Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (pantalla === "redirigiendo") return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",gap:20 }}>
      <div style={{ fontSize:48 }}>⏳</div>
      <div style={{ fontSize:20,color:"#fbbf24",fontWeight:900 }}>Te estamos llevando a la mesa...</div>
    </div>
  );

  if (pantalla === "menu") return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",gap:20,padding:20 }}>
      <div style={{ fontSize:10,color:"#4ade80",letterSpacing:3,textTransform:"uppercase" }}>Truco</div>
      <div style={{ fontSize:32,color:"#fbbf24",fontWeight:900 }}>2 Jugadores</div>
      <div style={{ display:"flex",flexDirection:"column",gap:12,width:"100%",maxWidth:320 }}>
        <button onClick={crearSala} style={{ padding:"14px",borderRadius:10,background:"#1a472a",border:"1px solid #4ade80",color:"#4ade80",fontSize:16,cursor:"pointer",fontFamily:"Georgia" }}>
          ➕ Crear sala
        </button>
        <div style={{ display:"flex",gap:8 }}>
          <input value={codigoInput} onChange={e=>setCodigoInput(e.target.value)} placeholder="Código de sala" style={{ flex:1,padding:"12px",borderRadius:10,border:"1px solid #2d6a4f",background:"rgba(0,0,0,0.4)",color:"#e2f5e9",fontFamily:"Georgia",fontSize:14,outline:"none" }} />
          <button onClick={unirseASala} style={{ padding:"12px 16px",borderRadius:10,background:"#1a472a",border:"1px solid #4ade80",color:"#4ade80",fontSize:14,cursor:"pointer",fontFamily:"Georgia" }}>Unirse</button>
        </div>
        {error && <div style={{ color:"#f87171",fontSize:13,textAlign:"center" }}>{error}</div>}
        <button onClick={onVolver} style={{ padding:"10px",borderRadius:10,background:"transparent",border:"1px solid #374151",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"Georgia" }}>← Volver</button>
      </div>
    </div>
  );

  if (pantalla === "esperando") return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",gap:20 }}>
      <div style={{ fontSize:48 }}>⏳</div>
      <div style={{ fontSize:22,color:"#fbbf24",fontWeight:900 }}>Esperando rival...</div>
      <div style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:12,padding:"16px 32px",textAlign:"center" }}>
        <div style={{ fontSize:12,color:"#6b9",marginBottom:8 }}>Compartí este código</div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12 }}>
          <div style={{ fontSize:36,color:"#4ade80",fontWeight:900,letterSpacing:8 }}>{codigo}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(codigo).then(() => {
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              });
            }}
            title="Copiar código"
            style={{ background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.4)",borderRadius:8,padding:"6px 8px",cursor:"pointer",color:"#4ade80",display:"flex",alignItems:"center",flexShrink:0 }}
          >
            {copiado
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            }
          </button>
        </div>
        {copiado && (
          <div style={{ fontSize:12,color:"#4ade80",marginTop:6,fontFamily:"'Lato',sans-serif" }}>¡Copiado!</div>
        )}
      </div>
      <button
        onClick={() => setMostrarConfirmSalir(true)}
        style={{ padding:"10px 20px",borderRadius:10,background:"transparent",border:"1px solid #374151",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}
      >
        Cancelar
      </button>

      {mostrarConfirmSalir && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:30 }}>
          <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid #2d6a4f",borderRadius:20,padding:"32px 28px",textAlign:"center",maxWidth:320,width:"100%",fontFamily:"'Lato',sans-serif" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🚪</div>
            <div style={{ fontSize:18,color:"#fbbf24",fontWeight:900,marginBottom:24,lineHeight:1.4 }}>¿Querés abandonar la partida?</div>
            <div style={{ display:"flex",gap:10 }}>
              <button
                onClick={() => setMostrarConfirmSalir(false)}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.05)",border:"1px solid #374151",color:"#ffffff",fontFamily:"'Lato',sans-serif",fontSize:14 }}
              >Cancelar</button>
              <button
                onClick={salirDePartida}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#7f1d1d,#991b1b)",border:"1px solid #f87171",color:"#ffffff",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700 }}
              >Salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <LogJugadas entries={jugadasLog} />
      <MesaJuego
        avatarJugador={avatarSrc(perfil?.avatar)}
        nombreJugador={perfil?.nombre || user.email?.split("@")[0] || "Vos"}
        puntosJugador={soyJugador1 ? (partida?.puntos1||0) : (partida?.puntos2||0)}
        avatarRival={avatarSrc(soyJugador1 ? partida?.jugador2_avatar : partida?.jugador1_avatar)}
        nombreRival={(soyJugador1 ? partida?.jugador2_nombre : partida?.jugador1_nombre)||"Rival"}
        puntosRival={soyJugador1 ? (partida?.puntos2||0) : (partida?.puntos1||0)}
        limitePuntos={partida?.puntos || 15}
        rivalHand={manoRival.length}
        rondas={[0,1,2].map(ri => {
          const par = mesaActual.slice(ri*2, ri*2+2);
          return {
            jugador: par.find(c => c.jugador === user.id)?.carta || null,
            rival: par.find(c => c.jugador !== user.id)?.carta || null,
          };
        })}
        manoJugador={miMano}
        jugadasJugador={[]}
        cartaSeleccionada={cartaSeleccionada}
        esMiTurno={puedoActuar && !debugBloqueo}
        onClickCarta={(i) => jugarCarta(i)}
        timerSegundos={miTurno && !partida?.accion_pendiente && !resolviendoMano ? displayTimer : null}
        rivalTimerSegundos={!miTurno && !partida?.accion_pendiente && !resolviendoMano ? displayTimer : null}
        instruccion={
          partida?.accion_pendiente
            ? (partida.accion_pendiente.cantado_por !== user.id
                ? (elEnvidoPrimero && partida.accion_pendiente.tipo === 'truco' && partida.accion_pendiente.nivel === 1
                    ? "🃏 Elegí qué envido cantar"
                    : "")
                : "⏳ Canto pendiente...")
            : miTurno ? "👆 Tu turno — tocá una carta" : estaEsperandoRival ? "" : "⏳ Turno del rival..."
        }
        onSalir={() => setMostrarConfirmSalir(true)}
        log={null}
        globoJugador={globoJugadorTexto}
        globoRival={globoRivalTexto}
        // DEBUG TEMPORAL: botón que abre el panel de debug
        debugSlot={
          <div style={{ position:"absolute", left:"100%", bottom:0, marginLeft:12, zIndex:300 }}>
            <button
              onClick={() => setDebugPanelAbierto(v => !v)}
              title="Panel de debug (temporal)"
              style={{ width:36, height:36, borderRadius:"50%", cursor:"pointer", background: debugPanelAbierto ? "#f59e0b" : "rgba(0,0,0,0.6)", border:"1px solid #f59e0b", fontSize:18, lineHeight:1 }}
            >🐛</button>
          </div>
        }
        botonesSlot={debugPanelAbierto ? (
          <div style={{ padding:"9px 18px", borderRadius:10, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.4)", color:"#fbbf24", fontSize:14, fontFamily:"'Lato',sans-serif", textAlign:"center" }}>
            🐛 Panel de debug abierto — cerralo para poder jugar
          </div>
        ) : partida?.debug_pausada ? (
          <div style={{ padding:"9px 18px", borderRadius:10, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.4)", color:"#fbbf24", fontSize:14, fontFamily:"'Lato',sans-serif", textAlign:"center" }}>
            🐛 Partida en pausa — el otro jugador está revisando algo
          </div>
        ) : <>
          {!partida?.accion_pendiente && (
            <>
              {miTurno && mesaActual.length < 2 && !partida?.envido_jugado && (
                <>
                  <button onClick={()=>cantarEnvido("envido")} style={{ ...btnStyle("#1d4ed8","#60a5fa"), flex:"0 1 30%", minWidth:100 }}>Envido</button>
                  <button onClick={()=>cantarEnvido("real_envido")} style={{ ...btnStyle("#5b21b6","#a78bfa"), flex:"0 1 30%", minWidth:100 }}>Real Envido</button>
                  <button onClick={()=>cantarEnvido("falta_envido")} style={{ ...btnStyle("#065f46","#34d399"), flex:"0 1 30%", minWidth:100 }}>Falta Envido!</button>
                </>
              )}
              {miTurno && !partida?.truco_jugado && (
                <button onClick={cantarTruco} style={{ ...btnStyle("#b45309","#fbbf24"), flex:"0 1 30%", minWidth:100 }}>Truco!</button>
              )}
              {miTurno && partida?.truco_derecho_de === user.id && (partida?.truco_nivel || 0) < 3 && (
                <button onClick={escalarTrucoDiferido} style={{ ...btnStyle("#92400e","#fbbf24"), flex:"0 1 30%", minWidth:100 }}>
                  {partida.truco_nivel === 1 ? "Retruco" : "Vale Cuatro"}
                </button>
              )}
            </>
          )}
          {partida?.accion_pendiente && partida.accion_pendiente.cantado_por !== user.id && (() => {
            const acc = partida.accion_pendiente;
            const esTruco = acc.tipo === 'truco';
            const envidoVivo = !partida.envido_jugado && JSON.parse(partida.mesa || "[]").length < 2;
            const mostrarPasoEnvido = elEnvidoPrimero && esTruco && acc.nivel === 1;
            return mostrarPasoEnvido ? (
              <>
                <button onClick={()=>cantarEnvidoSobreTruco('envido')} style={{ ...btnStyle("#1d4ed8","#60a5fa"), flex:"0 1 30%", minWidth:100 }}>Envido</button>
                <button onClick={()=>cantarEnvidoSobreTruco('real_envido')} style={{ ...btnStyle("#5b21b6","#a78bfa"), flex:"0 1 30%", minWidth:100 }}>Real Envido</button>
                <button onClick={()=>cantarEnvidoSobreTruco('falta_envido')} style={{ ...btnStyle("#065f46","#34d399"), flex:"0 1 30%", minWidth:100 }}>Falta Envido!</button>
                <button onClick={()=>setElEnvidoPrimero(false)} style={{ ...btnStyle("#374151","#9ca3af"), flex:"0 1 30%", minWidth:100 }}>‹ Volver</button>
              </>
            ) : (
              <>
                <button onClick={quiero} style={{ ...btnStyle("#065f46","#4ade80"), flex:"0 1 30%", minWidth:100 }}>Quiero</button>
                {esTruco && acc.nivel === 1 && (
                  <button onClick={subirTruco} style={{ ...btnStyle("#92400e","#fbbf24"), flex:"0 1 30%", minWidth:100 }}>Quiero Retruco</button>
                )}
                {esTruco && acc.nivel === 1 && envidoVivo && (
                  <button onClick={()=>setElEnvidoPrimero(true)} style={{ ...btnStyle("#1d4ed8","#60a5fa"), flex:"0 1 30%", minWidth:100 }}>El envido está primero</button>
                )}
                {esTruco && acc.nivel === 2 && (
                  <button onClick={subirTruco} style={{ ...btnStyle("#92400e","#fbbf24"), flex:"0 1 30%", minWidth:100 }}>Quiero Vale Cuatro!</button>
                )}
                {!esTruco && acc.subtipo === 'envido' && (
                  <>
                    {(acc.cadena || []).filter(s => s === 'envido').length < 2 && (
                      <button onClick={()=>escalarEnvido('envido')} style={{ ...btnStyle("#1d4ed8","#60a5fa"), flex:"0 1 30%", minWidth:100 }}>Envido</button>
                    )}
                    <button onClick={()=>escalarEnvido('real_envido')} style={{ ...btnStyle("#5b21b6","#a78bfa"), flex:"0 1 30%", minWidth:100 }}>Real Envido</button>
                    <button onClick={()=>escalarEnvido('falta_envido')} style={{ ...btnStyle("#065f46","#34d399"), flex:"0 1 30%", minWidth:100 }}>Falta Envido!</button>
                  </>
                )}
                {!esTruco && acc.subtipo === 'real_envido' && (
                  <button onClick={()=>escalarEnvido('falta_envido')} style={{ ...btnStyle("#065f46","#34d399"), flex:"0 1 30%", minWidth:100 }}>Falta Envido</button>
                )}
                <button onClick={noQuiero} style={{ ...btnStyle("#7f1d1d","#f87171"), flex:"0 1 30%", minWidth:100 }}>No quiero</button>
              </>
            );
          })()}
          {!resolviendoMano && (miTurno || partida?.accion_pendiente?.cantado_por === user.id) && (
            <button disabled={irseAlMazoBloqueado} onClick={() => irseAlMazo()} style={{ ...btnStyle("#7f1d1d","#f87171"), flex:"0 1 30%", minWidth:100, opacity: irseAlMazoBloqueado ? 0.5 : 1, cursor: irseAlMazoBloqueado ? "not-allowed" : "pointer" }}>Ir al mazo</button>
          )}
          {estaEsperandoRival && (
            <div style={{ padding:"9px 18px", borderRadius:10, background:"rgba(0,0,0,0.35)", border:"1px solid rgba(45,106,79,0.4)", color:"#9ca3af", fontSize:16, fontFamily:"'Lato',sans-serif", letterSpacing:0.65, pointerEvents:"none" }}>
              ⏳ Esperando a tu rival…
            </div>
          )}
        </>}
      />

      {mostrarConfirmSalir && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:30 }}>
          <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)",border:"1px solid #2d6a4f",borderRadius:20,padding:"32px 28px",textAlign:"center",maxWidth:320,width:"100%",fontFamily:"'Lato',sans-serif" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🚪</div>
            <div style={{ fontSize:18,color:"#fbbf24",fontWeight:900,marginBottom:24,lineHeight:1.4 }}>¿Querés abandonar la partida?</div>
            <div style={{ display:"flex",gap:10 }}>
              <button
                onClick={() => setMostrarConfirmSalir(false)}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.05)",border:"1px solid #374151",color:"#ffffff",fontFamily:"'Lato',sans-serif",fontSize:14 }}
              >Cancelar</button>
              <button
                onClick={salirDePartida}
                style={{ flex:1,padding:"11px",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#7f1d1d,#991b1b)",border:"1px solid #f87171",color:"#ffffff",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700 }}
              >Salir</button>
            </div>
          </div>
        </div>
      )}

      {/* === PANEL DEBUG TEMPORAL — SACAR DESPUÉS === */}
      {/* === PANEL DEBUG TEMPORAL — SACAR DESPUÉS (overlay de pausa para el rival) === */}
      {!debugPanelAbierto && partida?.debug_pausada && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:20 }}>
          <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border:"1px solid #f59e0b", borderRadius:20, padding:"32px 28px", maxWidth:320, textAlign:"center", fontFamily:"'Lato',sans-serif" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🐛</div>
            <div style={{ fontSize:16, color:"#fbbf24", fontWeight:900, lineHeight:1.4 }}>Partida en pausa temporal</div>
            <div style={{ fontSize:13, color:"#9ca3af", marginTop:8, lineHeight:1.4 }}>El otro jugador está revisando algo, ya vuelve.</div>
          </div>
        </div>
      )}
      {/* === FIN overlay de pausa DEBUG TEMPORAL === */}
      {debugPanelAbierto && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:40 }}>
          <div style={{ background:"radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border:"1px solid #f59e0b", borderRadius:20, padding:"20px 18px", maxWidth:420, width:"92%", maxHeight:"78vh", display:"flex", flexDirection:"column", fontFamily:"'Lato',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:16, color:"#fbbf24", fontWeight:900 }}>🐛 Debug — transiciones de puntaje</div>
              <button onClick={() => setDebugPanelAbierto(false)} style={{ background:"transparent", border:"none", color:"#9ca3af", fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>
            <div style={{ fontSize:11, color:"#6b9", marginBottom:10 }}>Tus acciones están bloqueadas mientras este panel esté abierto.</div>
            <div style={{ overflowY:"auto", display:"flex", flexDirection:"column-reverse", gap:6 }}>
              {debugLog.length === 0 && (
                <div style={{ color:"#6b7280", fontSize:13, textAlign:"center", padding:"20px 0" }}>Todavía no hay transiciones registradas.</div>
              )}
              {debugLog.map((entry) => (
                <div key={entry.id} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid #374151", borderRadius:8, padding:"6px 9px", fontSize:11, color:"#e5e7eb" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", color:"#9ca3af", marginBottom:2 }}>
                    <span>{entry.ts}</span>
                    <span>{entry.quien === "?" ? "❔ ?" : (entry.disparadoPorMi ? "🟢 " : "🔴 ") + entry.quien}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#fbbf24" }}>{entry.frase}</div>
                  <button
                    onClick={() => toggleDebugDetalle(entry.id)}
                    style={{ background:"transparent", border:"none", color:"#6b7280", fontSize:10, cursor:"pointer", padding:0, marginTop:3 }}
                  >
                    {debugDetalleAbierto.has(entry.id) ? "▲ ocultar detalle técnico" : "▼ ver detalle técnico"}
                  </button>
                  {debugDetalleAbierto.has(entry.id) && (
                    <div style={{ marginTop:4, fontSize:10, color:"#9ca3af", wordBreak:"break-all" }}>
                      <div>campo: {entry.campo}</div>
                      <div>
                        {typeof entry.anterior === "object" ? JSON.stringify(entry.anterior) : String(entry.anterior)}
                        {" → "}
                        {typeof entry.nuevo === "object" ? JSON.stringify(entry.nuevo) : String(entry.nuevo)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* === FIN PANEL DEBUG TEMPORAL === */}
    </>
  );
}