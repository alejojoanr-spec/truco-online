import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { leerConfig } from "./Configuracion";
import { sumarPuntosRanking } from "./ranking";
import { btnStyle } from "./GameComponents";
import { MesaJuego } from "./MesaJuego";

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

const LABEL_ENV = { envido: 'Envido', real_envido: 'Real Envido', falta_envido: 'Falta Envido' };

function getCantoLabel(acc) {
  if (!acc) return '';
  if (acc.tipo === 'truco') return ['', 'Truco', 'Retruco', 'Vale cuatro'][acc.nivel] || 'Truco';
  const cadena = acc.cadena || [acc.subtipo];
  return cadena.map(s => LABEL_ENV[s] || s).join(' + ');
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
  const [pantalla, setPantalla] = useState("menu");
  const [codigo, setCodigo] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [partida, setPartida] = useState(null);
  const [soyJugador1, setSoyJugador1] = useState(false);
  const [miMano, setMiMano] = useState([]);
  const [manoRival, setManoRival] = useState([]);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [resolviendoMano, setResolviendoMano] = useState(false);

  const addLog = () => {};
  const [resultadoPartida, setResultadoPartida] = useState(null);
  const pagoProcesadoRef = useRef(false);
  const accionLogueadaRef = useRef(null);

  // revancha
  const [revanchaEstado, setRevanchaEstado] = useState(null);
  // null | 'esperando_rival' | 'rival_pide' | 'procesando' | 'rechazada' | 'cancelada'
  const [revanchaTimer, setRevanchaTimer] = useState(30);
  const channelRef = useRef(null);
  const partidaRef = useRef(null);
  const revanchaTimerRef = useRef(null);
  const [turnoTimer, setTurnoTimer] = useState(15);
  const turnoTimerRef = useRef(null);

  useEffect(() => { partidaRef.current = partida; }, [partida]);

  // Persistir partida activa en sessionStorage para sobrevivir recargas
  useEffect(() => {
    if (codigo) sessionStorage.setItem(`truco_partida_${user.id}`, codigo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);
  useEffect(() => {
    return () => { if (revanchaTimerRef.current) clearInterval(revanchaTimerRef.current); };
  }, []);

  async function procesarFinPartida(p) {
    if (pagoProcesadoRef.current) return;
    pagoProcesadoRef.current = true;
    sessionStorage.removeItem(`truco_partida_${user.id}`);
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
        if (err || !data) { setError("Sala no encontrada"); return; }
        if (data.estado !== "esperando") { setError("La sala ya no está disponible"); return; }
        const montoSalaLobby = data.apuesta || 0;
        let saldoAntesLobby = 0;
        if (montoSalaLobby > 0) {
          const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
          const saldoActual = fresh?.saldo || 0;
          if (saldoActual < montoSalaLobby) { setError("Saldo insuficiente para unirte a esta partida."); return; }
          const { error: saldoErr } = await supabase.from("perfiles")
            .update({ saldo: saldoActual - montoSalaLobby })
            .eq("usuario_id", user.id);
          if (saldoErr) { setError("Error al procesar el saldo."); return; }
          saldoAntesLobby = saldoActual;
        }
        await supabase.from("partidas").update({
          jugador2_id: user.id,
          jugador2_nombre: perfil?.nombre || "",
          jugador2_avatar: perfil?.avatar || "👤",
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
        setPartida({ ...data, jugador2_id: user.id, estado: "jugando" });
        setPantalla("jugando");
        addLog("¡Partida iniciada!");
      })();
    } else if (codigoYaCreado) {
      (async () => {
        const cod = codigoYaCreado.toUpperCase().trim();
        const { data, error: err } = await supabase.from("partidas").select("*").eq("codigo", cod).single();
        if (err || !data) { setError("No se pudo cargar la partida"); return; }
        setCodigo(cod);
        setSoyJugador1(true);
        setMiMano(JSON.parse(data.mano_jugador1));
        setManoRival(JSON.parse(data.mano_jugador2));
        setPartida(data);
        setPantalla("jugando");
        addLog("¡Partida iniciada!");
      })();
    } else if (codigoRejoin) {
      (async () => {
        const cod = codigoRejoin.toUpperCase().trim();
        const { data, error: err } = await supabase.from("partidas").select("*").eq("codigo", cod).single();
        if (err || !data || data.estado !== "jugando") {
          sessionStorage.removeItem(`truco_partida_${user.id}`);
          setError("La partida ya no está activa");
          return;
        }
        const esJ1 = data.jugador1_id === user.id;
        setCodigo(cod);
        setSoyJugador1(esJ1);
        setMiMano(JSON.parse(esJ1 ? data.mano_jugador1 : data.mano_jugador2));
        setManoRival(JSON.parse(esJ1 ? data.mano_jugador2 : data.mano_jugador1));
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
      if (p.ganador_id) { procesarFinPartida(p); return; }
      if (p.estado === "jugando") setPantalla("jugando");
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
    }

    const channel = supabase.channel(`partida-${codigo}`)
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
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, soyJugador1]);

  useEffect(() => {
    if (turnoTimerRef.current) clearInterval(turnoTimerRef.current);
    const activo = partida?.turno === user.id && !partida?.accion_pendiente && !resolviendoMano;
    if (activo) {
      setTurnoTimer(15);
      turnoTimerRef.current = setInterval(() => {
        setTurnoTimer(s => {
          if (s <= 1) { clearInterval(turnoTimerRef.current); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (turnoTimerRef.current) clearInterval(turnoTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida?.turno, !!partida?.accion_pendiente, resolviendoMano]);

  async function crearSala() {
    let saldoAntesCrea = 0;
    if ((apuesta || 0) > 0) {
      const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
      const saldoActual = fresh?.saldo || 0;
      if (saldoActual < apuesta) { setError("Saldo insuficiente."); return; }
      const { error: saldoErr } = await supabase.from("perfiles")
        .update({ saldo: saldoActual - apuesta })
        .eq("usuario_id", user.id);
      if (saldoErr) { setError("Error al procesar el saldo."); return; }
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
      jugador1_avatar: perfil?.avatar || "👤",
      mano_jugador1: JSON.stringify(mano1),
      mano_jugador2: JSON.stringify(mano2),
      turno: user.id,
      mano_id: user.id,
      mesa: JSON.stringify([]),
      puntos1: 0,
      puntos2: 0,
      apuesta: apuesta || 0,
      puntos: puntos || 15,
      es_torneo: esTorneo || false,
    });
    if (err) { setError("Error al crear sala"); return; }
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
    // Verificar que el usuario no tenga ya una partida activa
    const { data: activas } = await supabase
      .from("partidas")
      .select("id")
      .in("estado", ["esperando", "jugando"])
      .or(`jugador1_id.eq.${user.id},jugador2_id.eq.${user.id}`)
      .limit(1);
    if (activas?.length > 0) { setError("Ya tenés una partida activa. Finalizala antes de unirte a otra."); return; }
    const montoSala = data.apuesta || 0;
    let saldoAntesUne = 0;
    if (montoSala > 0) {
      const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
      const saldoActual = fresh?.saldo || 0;
      if (saldoActual < montoSala) { setError("Saldo insuficiente para unirte a esta partida."); return; }
      const { error: saldoErr } = await supabase.from("perfiles")
        .update({ saldo: saldoActual - montoSala })
        .eq("usuario_id", user.id);
      if (saldoErr) { setError("Error al procesar el saldo."); return; }
      saldoAntesUne = saldoActual;
    }
    await supabase.from("partidas").update({
      jugador2_id: user.id,
      jugador2_nombre: perfil?.nombre || "",
      jugador2_avatar: perfil?.avatar || "👤",
      estado: "jugando",
    }).eq("codigo", cod);
    if (montoSala > 0) {
      await supabase.from("transacciones").insert({
        usuario_id: user.id,
        tipo: "apuesta",
        monto: montoSala,
        estado: "aprobado",
        nota: `Apuesta vs ${data.jugador1_nombre || "rival"}`,
        ejecutado_por: "sistema",
        saldo_anterior: saldoAntesUne,
        saldo_nuevo: saldoAntesUne - montoSala,
      });
    }
    setCodigo(cod);
    setSoyJugador1(false);
    setMiMano(JSON.parse(data.mano_jugador2));
    setManoRival(JSON.parse(data.mano_jugador1));
    setPartida({ ...data, jugador2_id: user.id, estado: "jugando" });
    setPantalla("jugando");
    addLog("¡Partida iniciada!");
  }

  async function jugarCarta(idx) {
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

      // Tally all rounds in this hand
      const g = { [partida.jugador1_id]: 0, [partida.jugador2_id]: 0 };
      for (let i = 0; i < nuevaMesa.length; i += 2) {
        const a = nuevaMesa[i], b = nuevaMesa[i + 1];
        const va = valorTruco(a.carta), vb = valorTruco(b.carta);
        if (va > vb) g[a.jugador] = (g[a.jugador] || 0) + 1;
        else if (vb > va) g[b.jugador] = (g[b.jugador] || 0) + 1;
      }
      const g1 = g[partida.jugador1_id] || 0;
      const g2 = g[partida.jugador2_id] || 0;

      let ganadorMano = null;
      if (g1 >= 2) ganadorMano = partida.jugador1_id;
      else if (g2 >= 2) ganadorMano = partida.jugador2_id;
      else if (nRondas === 3) {
        // After 3 rounds: most wins; tie goes to current mano player
        const manoId = partida.mano_id || partida.jugador1_id;
        const rivalManoId = manoId === partida.jugador1_id ? partida.jugador2_id : partida.jugador1_id;
        ganadorMano = g[rivalManoId] > g[manoId] ? rivalManoId : manoId;
      }

      if (ganadorMano) {
        const puntosMano = partida.puntos_mano || 1;
        const nuevoPuntos1 = (partida.puntos1 || 0) + (ganadorMano === partida.jugador1_id ? puntosMano : 0);
        const nuevoPuntos2 = (partida.puntos2 || 0) + (ganadorMano === partida.jugador2_id ? puntosMano : 0);
        const puntosObjetivo = partida.puntos || 15;
        addLog(`¡${ganadorMano === user.id ? 'Ganaste' : 'Perdiste'} la mano! (+${puntosMano} pt${puntosMano > 1 ? 's' : ''})`);

        if (nuevoPuntos1 >= puntosObjetivo || nuevoPuntos2 >= puntosObjetivo) {
          const ganadorId = nuevoPuntos1 >= puntosObjetivo ? partida.jugador1_id : partida.jugador2_id;
          updateData = { ...updateData, puntos1: nuevoPuntos1, puntos2: nuevoPuntos2, puntos_mano: 1, accion_pendiente: null, ganador_id: ganadorId, estado: "terminada" };
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
            accion_pendiente: null,
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
            turno: siguienteMano,
            mano_id: siguienteMano,
          }).eq("codigo", codigo);
          setResolviendoMano(false);
          return;
        }
      }
    }

    await supabase.from("partidas").update(updateData).eq("codigo", codigo);
  }

  async function salirDePartida() {
    sessionStorage.removeItem(`truco_partida_${user.id}`);
    if (partida && partida.estado === "jugando") {
      const rivalId = soyJugador1 ? partida.jugador2_id : partida.jugador1_id;
      if (rivalId) {
        pagoProcesadoRef.current = true;
        await supabase.from("partidas")
          .update({ ganador_id: rivalId, estado: "terminada" })
          .eq("codigo", codigo);
      }
    }
    onVolver();
  }

  async function cantarTruco() {
    if (!partida || partida.accion_pendiente || partida.truco_jugado) return;
    reproducirVoz('truco');
    await supabase.from("partidas").update({
      accion_pendiente: { tipo: 'truco', nivel: 1, cantado_por: user.id, si_quiero: 2, si_no: 1 },
      truco_jugado: true,
    }).eq("codigo", codigo);
    addLog("¡Truco!");
  }

  async function subirTruco() {
    const acc = partida?.accion_pendiente;
    if (!acc || acc.tipo !== 'truco' || acc.cantado_por === user.id || acc.nivel >= 3) return;
    const nuevoNivel = acc.nivel + 1;
    const labels = { 2: 'Retruco', 3: 'Vale cuatro' };
    reproducirVoz(nuevoNivel === 2 ? 'retruco' : 'vale_cuatro');
    await supabase.from("partidas").update({
      accion_pendiente: { tipo: 'truco', nivel: nuevoNivel, cantado_por: user.id, si_quiero: nuevoNivel + 1, si_no: nuevoNivel },
    }).eq("codigo", codigo);
    addLog(`¡${labels[nuevoNivel]}!`);
  }

  async function cantarEnvido(subtipo) {
    if (!partida || partida.accion_pendiente || partida.envido_jugado) return;
    if (JSON.parse(partida.mesa || "[]").length > 0) return;
    const puntosObj = partida.puntos || 15;
    const falta = Math.max(1, puntosObj - Math.max(partida.puntos1 || 0, partida.puntos2 || 0));
    const VALS = { envido: 2, real_envido: 3, falta_envido: falta };
    reproducirVoz(VOZ_ENV[subtipo] || 'envido');
    await supabase.from("partidas").update({
      accion_pendiente: {
        tipo: 'envido', subtipo, cadena: [subtipo],
        cantado_por: user.id, si_quiero: VALS[subtipo], si_no: subtipo === 'falta_envido' ? 2 : 1,
      },
      envido_jugado: true,
    }).eq("codigo", codigo);
    addLog(`¡${LABEL_ENV[subtipo]}!`);
  }

  async function escalarEnvido(subtipo) {
    const acc = partida?.accion_pendiente;
    if (!acc || acc.tipo !== 'envido' || acc.cantado_por === user.id) return;
    if (acc.subtipo === 'falta_envido') return;
    if (acc.subtipo === 'real_envido' && subtipo !== 'falta_envido') return;
    const puntosObj = partida.puntos || 15;
    const falta = Math.max(1, puntosObj - Math.max(partida.puntos1 || 0, partida.puntos2 || 0));
    const VALS = { envido: 2, real_envido: 3, falta_envido: falta };
    const nuevaCadena = [...(acc.cadena || [acc.subtipo]), subtipo];
    reproducirVoz(VOZ_ENV[subtipo] || 'envido');
    await supabase.from("partidas").update({
      accion_pendiente: {
        tipo: 'envido', subtipo, cadena: nuevaCadena,
        cantado_por: user.id,
        si_quiero: subtipo === 'falta_envido' ? falta : acc.si_quiero + VALS[subtipo],
        si_no: acc.si_quiero,
      },
    }).eq("codigo", codigo);
    addLog(`¡${nuevaCadena.map(s => LABEL_ENV[s]).join(' + ')}!`);
  }

  async function quiero() {
    const acc = partida?.accion_pendiente;
    if (!acc || acc.cantado_por === user.id) return;
    reproducirVoz('quiero');
    const puntosObj = partida.puntos || 15;

    if (acc.tipo === 'truco') {
      await supabase.from("partidas").update({ accion_pendiente: null, puntos_mano: acc.si_quiero }).eq("codigo", codigo);
      addLog(`Quiero. Mano vale ${acc.si_quiero} pt${acc.si_quiero > 1 ? 's' : ''}.`);
      return;
    }

    // Envido: comparar valores
    const mano1 = JSON.parse(partida.mano_jugador1);
    const mano2 = JSON.parse(partida.mano_jugador2);
    const v1 = valorEnvido(mano1), v2 = valorEnvido(mano2);
    const ganadorEnv = v1 > v2 ? partida.jugador1_id : v2 > v1 ? partida.jugador2_id : partida.jugador1_id;
    const miVal = soyJugador1 ? v1 : v2, rivalVal = soyJugador1 ? v2 : v1;

    // Falta envido: el ganador recibe exactamente los puntos que le faltan para llegar al límite
    const ptosEnvido = acc.subtipo === 'falta_envido'
      ? Math.max(1, puntosObj - (ganadorEnv === partida.jugador1_id ? (partida.puntos1 || 0) : (partida.puntos2 || 0)))
      : acc.si_quiero;

    addLog(`Quiero. Vos: ${miVal} | Rival: ${rivalVal}. +${ptosEnvido} para ${ganadorEnv === user.id ? 'vos' : 'rival'}`);

    const np1 = (partida.puntos1 || 0) + (ganadorEnv === partida.jugador1_id ? ptosEnvido : 0);
    const np2 = (partida.puntos2 || 0) + (ganadorEnv === partida.jugador2_id ? ptosEnvido : 0);
    if (np1 >= puntosObj || np2 >= puntosObj) {
      const ganadorId = np1 >= puntosObj ? partida.jugador1_id : partida.jugador2_id;
      await supabase.from("partidas").update({ accion_pendiente: null, puntos1: np1, puntos2: np2, ganador_id: ganadorId, estado: "terminada" }).eq("codigo", codigo);
    } else {
      await supabase.from("partidas").update({ accion_pendiente: null, puntos1: np1, puntos2: np2 }).eq("codigo", codigo);
    }
  }

  async function noQuiero() {
    const acc = partida?.accion_pendiente;
    if (!acc || acc.cantado_por === user.id) return;
    reproducirVoz('no_quiero');
    const puntosObj = partida.puntos || 15;
    const callerEsJ1 = acc.cantado_por === partida.jugador1_id;
    const np1 = (partida.puntos1 || 0) + (callerEsJ1 ? acc.si_no : 0);
    const np2 = (partida.puntos2 || 0) + (!callerEsJ1 ? acc.si_no : 0);
    addLog(`No quiero. El rival suma ${acc.si_no} pt${acc.si_no > 1 ? 's' : ''}.`);

    const gameOver = np1 >= puntosObj || np2 >= puntosObj;
    const ganadorId = np1 >= puntosObj ? partida.jugador1_id : partida.jugador2_id;

    if (acc.tipo === 'envido') {
      if (gameOver) {
        await supabase.from("partidas").update({ accion_pendiente: null, puntos1: np1, puntos2: np2, ganador_id: ganadorId, estado: "terminada" }).eq("codigo", codigo);
      } else {
        await supabase.from("partidas").update({ accion_pendiente: null, puntos1: np1, puntos2: np2 }).eq("codigo", codigo);
      }
      return;
    }

    // Truco rechazado: termina la mano
    if (gameOver) {
      await supabase.from("partidas").update({ accion_pendiente: null, puntos1: np1, puntos2: np2, puntos_mano: 1, ganador_id: ganadorId, estado: "terminada" }).eq("codigo", codigo);
    } else {
      const nuevoMazo = mezclar(MAZO);
      const manoActualNQ = partida.mano_id || partida.jugador1_id;
      const siguienteManoNQ = manoActualNQ === partida.jugador1_id ? partida.jugador2_id : partida.jugador1_id;
      await supabase.from("partidas").update({
        accion_pendiente: null, puntos1: np1, puntos2: np2, puntos_mano: 1,
        envido_jugado: false, truco_jugado: false,
        mesa: JSON.stringify([]),
        mano_jugador1: JSON.stringify(nuevoMazo.slice(0, 3)),
        mano_jugador2: JSON.stringify(nuevoMazo.slice(3, 6)),
        turno: siguienteManoNQ,
        mano_id: siguienteManoNQ,
      }).eq("codigo", codigo);
    }
  }

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
      jugador1_avatar: perfil?.avatar || "👤",
      jugador2_id: rivalId,
      jugador2_nombre: rivalNombre || "",
      jugador2_avatar: rivalAvatar || "👤",
      mano_jugador1: JSON.stringify(mano1),
      mano_jugador2: JSON.stringify(mano2),
      turno: user.id, mano_id: user.id, mesa: JSON.stringify([]),
      puntos1: 0, puntos2: 0,
      apuesta: apuestaR,
      puntos: p?.puntos || 15,
      es_torneo: p?.es_torneo || false,
    });

    if (errInsert) { setRevanchaEstado(null); return; }

    if (channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "revancha_accept", payload: { nuevoCodigo: nuevoCod } });
    }

    // Aceptante entra como jugador1
    pagoProcesadoRef.current = false;
    accionLogueadaRef.current = null;
    setResultadoPartida(null);
    setRevanchaEstado(null);
    setCartaSeleccionada(null);
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

  if (resultadoPartida) return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lato',sans-serif",padding:24 }}>
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
        onClick={async () => {
          if (codigo) {
            if ((apuesta || 0) > 0) {
              const { data: fresh } = await supabase.from("perfiles").select("saldo").eq("usuario_id", user.id).single();
              await supabase.from("perfiles").update({ saldo: (fresh?.saldo || 0) + apuesta }).eq("usuario_id", user.id);
            }
            await supabase.from("partidas").delete().eq("codigo", codigo);
          }
          onVolver();
        }}
        style={{ padding:"10px 20px",borderRadius:10,background:"transparent",border:"1px solid #374151",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}
      >
        Cancelar
      </button>
    </div>
  );

  return (
    <>
      <MesaJuego
        avatarJugador={perfil?.avatar || "👤"}
        nombreJugador={perfil?.nombre || user.email?.split("@")[0] || "Vos"}
        puntosJugador={soyJugador1 ? (partida?.puntos1||0) : (partida?.puntos2||0)}
        avatarRival={(soyJugador1 ? partida?.jugador2_avatar : partida?.jugador1_avatar)||"👤"}
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
        onClickCarta={(i) => jugarCarta(i)}
        timerSegundos={miTurno && !partida?.accion_pendiente ? turnoTimer : null}
        instruccion={partida?.accion_pendiente ? "⏳ Canto pendiente..." : miTurno ? "👆 Tu turno — tocá una carta" : "⏳ Turno del rival..."}
        onSalir={salirDePartida}
        log={null}
        botonesSlot={<>
          {!partida?.accion_pendiente && (
            <>
              {mesaActual.length === 0 && !partida?.envido_jugado && (
                <>
                  <button onClick={()=>cantarEnvido("envido")} style={btnStyle("#1d4ed8","#60a5fa")}>Envido</button>
                  <button onClick={()=>cantarEnvido("real_envido")} style={btnStyle("#5b21b6","#a78bfa")}>Real Envido</button>
                  <button onClick={()=>cantarEnvido("falta_envido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button>
                </>
              )}
              {!partida?.truco_jugado && (
                <button onClick={cantarTruco} style={btnStyle("#b45309","#fbbf24")}>Truco</button>
              )}
            </>
          )}
          {partida?.accion_pendiente?.cantado_por === user.id && (
            <div style={{ padding:"6px 14px",borderRadius:8,background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.5)",color:"#fbbf24",fontSize:12,fontWeight:700,fontFamily:"'Lato',sans-serif" }}>
              {getCantoLabel(partida.accion_pendiente)} — Esperando respuesta...
            </div>
          )}
        </>}
      />

      {partida?.accion_pendiente && partida.accion_pendiente.cantado_por !== user.id && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16 }}>
          {(() => {
            const acc = partida.accion_pendiente;
            const esTruco = acc.tipo === 'truco';
            const puntosObj = partida.puntos || 15;
            const faltaVal = Math.max(1, puntosObj - Math.max(partida.puntos1||0, partida.puntos2||0));
            const accentColor = esTruco ? "#fbbf24" : "#a78bfa";
            const borderColor = esTruco ? "rgba(251,191,36,0.5)" : "rgba(167,139,250,0.5)";
            const BTN_ESCALAR = { padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(167,139,250,0.08)",border:"1px solid #a78bfa",color:"#a78bfa",fontFamily:"'Lato',sans-serif",fontSize:13,fontWeight:700 };
            return (
              <div style={{ background:"radial-gradient(ellipse at top,#1a2a0f 0%,#050f08 100%)",border:`1px solid ${borderColor}`,borderRadius:20,padding:"24px 20px",maxWidth:300,width:"100%",textAlign:"center",fontFamily:"'Lato',sans-serif" }}>
                <div style={{ fontSize:36,marginBottom:6 }}>{esTruco?"🤺":"🃏"}</div>
                <div style={{ fontSize:9,color:"#6b7280",letterSpacing:3,textTransform:"uppercase",marginBottom:4 }}>
                  El rival {esTruco?"canta":"toca"}
                </div>
                <div style={{ fontSize:22,fontWeight:900,color:accentColor,marginBottom:6 }}>
                  ¡{getCantoLabel(acc)}!
                </div>
                <div style={{ fontSize:11,color:"#6b7280",marginBottom:16,lineHeight:1.6 }}>
                  {esTruco
                    ? `Quiero → mano vale ${acc.si_quiero} pt${acc.si_quiero>1?'s':''} · No quiero → rival suma ${acc.si_no}`
                    : `Quiero → se comparan · No quiero → rival suma ${acc.si_no} pt${acc.si_no>1?'s':''}`}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  <button onClick={quiero} style={{ padding:"11px",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,#1a472a,#2d6a4f)",border:"1px solid #4ade80",color:"#4ade80",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700 }}>
                    ✅ Quiero
                  </button>
                  {esTruco && acc.nivel === 1 && (
                    <button onClick={subirTruco} style={{ padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(251,191,36,0.08)",border:"1px solid #fbbf24",color:"#fbbf24",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700 }}>
                      🔥 Quiero Retruco
                    </button>
                  )}
                  {esTruco && acc.nivel === 2 && (
                    <button onClick={subirTruco} style={{ padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(251,191,36,0.08)",border:"1px solid #fbbf24",color:"#fbbf24",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700 }}>
                      🔥 Quiero Vale Cuatro
                    </button>
                  )}
                  {!esTruco && acc.subtipo === 'envido' && (
                    <>
                      <button onClick={()=>escalarEnvido('envido')} style={BTN_ESCALAR}>
                        ↗ Envido ({acc.si_quiero + 2} pts)
                      </button>
                      <button onClick={()=>escalarEnvido('real_envido')} style={BTN_ESCALAR}>
                        ↗ Real Envido ({acc.si_quiero + 3} pts)
                      </button>
                      <button onClick={()=>escalarEnvido('falta_envido')} style={BTN_ESCALAR}>
                        ↗ Falta Envido ({faltaVal} pts)
                      </button>
                    </>
                  )}
                  {!esTruco && acc.subtipo === 'real_envido' && (
                    <button onClick={()=>escalarEnvido('falta_envido')} style={BTN_ESCALAR}>
                      ↗ Falta Envido ({faltaVal} pts)
                    </button>
                  )}
                  <button onClick={noQuiero} style={{ padding:"11px",borderRadius:10,cursor:"pointer",background:"rgba(248,113,113,0.08)",border:"1px solid #f87171",color:"#f87171",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700 }}>
                    ❌ No quiero
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}