import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import Multijugador from "./Multijugador";
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

const SIMBOLO = { espada: "⚔", basto: "🪄", copa: "🏆", oro: "⭕" };
const COLOR_PALO = { espada: "#60a5fa", basto: "#4ade80", copa: "#f472b6", oro: "#fbbf24" };

function Carta({ carta, oculta, onClick, jugada, seleccionada }) {
  if (oculta) return (
    <div style={{ width:70,height:110,borderRadius:10,background:"linear-gradient(135deg,#1a472a,#0d2e1a)",border:"2px solid #2d6a4f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,userSelect:"none" }}>🂠</div>
  );
  return (
    <div onClick={onClick} style={{ width:70,height:110,borderRadius:10,background:jugada?"linear-gradient(135deg,#1c1c1c,#111)":seleccionada?"linear-gradient(135deg,#fef3c7,#fde68a)":"linear-gradient(135deg,#fffef7,#fef9e7)",border:seleccionada?"2px solid #f59e0b":jugada?"2px solid #333":"2px solid #d4a017",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"6px 4px",boxShadow:seleccionada?"0 0 20px rgba(245,158,11,0.6)":"0 4px 15px rgba(0,0,0,0.4)",cursor:onClick&&!jugada?"pointer":"default",transition:"all 0.2s",transform:seleccionada?"translateY(-12px) scale(1.05)":jugada?"scale(0.95)":"none",opacity:jugada?0.5:1,userSelect:"none" }}>
      <span style={{ fontSize:13,fontWeight:900,color:jugada?"#555":"#1a1a1a",fontFamily:"Georgia,serif" }}>{carta.num}</span>
      <span style={{ fontSize:22,filter:jugada?"grayscale(1)":"none" }}>{SIMBOLO[carta.palo]}</span>
      <span style={{ fontSize:8,fontWeight:700,color:jugada?"#555":COLOR_PALO[carta.palo],textTransform:"uppercase" }}>{carta.palo}</span>
    </div>
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

function TrucoApp({ user, perfil, setPerfil, onLogout, onMultijugador }) {  const [manoJugador, setManoJugador] = useState([]);
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
  const [modoMulti, setModoMulti] = useState(false);
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
    setTimeout(() => jugarRival(nuevasJugadas, nuevaMesa), 900);
  }

  function jugarRival(jugadasJ, mesaJ) {
    const idxRival = iaJugarCarta(manoRival, jugadasRival);
    if (idxRival === -1) return;
    const carta = manoRival[idxRival];
    const nuevasJugadasR = [...jugadasRival, idxRival];
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
        setTurno(ganador==="empate"?"jugador":ganador);
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
    if (ganador==="jugador") {
      setPuntosJugador(p => {
        const n = p+ptsTruco;
        if (n>=15) { setFasePartida("fin"); setGanadorPartida("jugador"); actualizarEstadisticas(true); addLog("🏆 ¡GANASTE LA PARTIDA!"); }
        return n;
      });
      addLog(`🏆 Ganaste la mano (+${ptsTruco} pts)`);
    } else if (ganador==="rival") {
      setPuntosRival(p => {
        const n = p+ptsTruco;
        if (n>=15) { setFasePartida("fin"); setGanadorPartida("rival"); actualizarEstadisticas(false); addLog("💀 El rival ganó la partida"); }
        return n;
      });
      addLog(`💀 El rival ganó la mano (+${ptsTruco} pts)`);
    } else addLog("🤝 Mano empatada");
    setTimeout(() => {
      if (fasePartida!=="fin") {
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

      {/* Header */}
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
          <div style={{ fontSize:10,color:"#4ade80",textAlign:"right" }}>👤 {perfil?.nombre || user.email?.split("@")[0]}</div>
          <button onClick={()=>setMostrarPerfil(true)} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:8,padding:"4px 10px",color:"#4ade80",fontSize:10,cursor:"pointer" }}>Mi perfil</button>
          <button onClick={cargarRanking} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #fbbf24",borderRadius:8,padding:"4px 10px",color:"#fbbf24",fontSize:10,cursor:"pointer" }}>🏆 Ranking</button>
          <button onClick={onMultijugador} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #a78bfa",borderRadius:8,padding:"4px 10px",color:"#a78bfa",fontSize:10,cursor:"pointer" }}>👥 2 Jugadores</button>
          <button onClick={iniciarPartida} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:8,padding:"4px 10px",color:"#4ade80",fontSize:10,cursor:"pointer" }}>Nueva</button>
          <button onClick={onLogout} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #7f1d1d",borderRadius:8,padding:"4px 10px",color:"#f87171",fontSize:10,cursor:"pointer" }}>Salir</button>
        </div>
      </div>

      {/* Rondas */}
      <div style={{ display:"flex",gap:6,marginBottom:10 }}>
        {[1,2,3].map(r=>(
          <div key={r} style={{ width:28,height:8,borderRadius:4,background:r<rondaActual?(ganadoresRondas[r-1]==="jugador"?"#4ade80":ganadoresRondas[r-1]==="rival"?"#f87171":"#888"):r===rondaActual?"#fbbf24":"rgba(255,255,255,0.1)",border:r===rondaActual?"1px solid #fbbf24":"1px solid transparent" }} />
        ))}
      </div>

      {/* Rival */}
      <div style={{ marginBottom:16,textAlign:"center" }}>
        <div style={{ fontSize:10,color:"#f87171",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{turno==="rival"?"⟳ Rival piensa...":"Rival"}</div>
        <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
          {manoRival.map((c,i)=><Carta key={i} carta={c} oculta={!jugadasRival.includes(i)} jugada={jugadasRival.includes(i)} />)}
        </div>
      </div>

      {/* Mesa */}
      <div style={{ background:"rgba(0,0,0,0.25)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:16,padding:"12px 24px",marginBottom:16,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",gap:24,width:"100%",maxWidth:400,minWidth:280 }}>
        <div style={{ textAlign:"center" }}>
          {mesaRival.length>0?(<><div style={{ fontSize:9,color:"#9ca",marginBottom:4 }}>RIVAL</div><Carta carta={mesaRival[mesaRival.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
        <div style={{ color:"#2d6a4f",fontSize:20 }}>VS</div>
        <div style={{ textAlign:"center" }}>
          {mesaJugador.length>0?(<><div style={{ fontSize:9,color:"#4ade80",marginBottom:4 }}>VOS</div><Carta carta={mesaJugador[mesaJugador.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
      </div>

      {/* Log */}
      <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(45,106,79,0.3)",borderRadius:10,padding:"8px 12px",width:"100%",maxWidth:500,marginBottom:12,maxHeight:80,overflowY:"auto" }}>
        {log.slice(-4).map((msg,i)=><div key={i} style={{ fontSize:11,color:i===log.slice(-4).length-1?"#e2f5e9":"rgba(180,220,190,0.5)",lineHeight:1.6 }}>{msg}</div>)}
      </div>

      {/* Cartas jugador */}
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

      {/* Botones */}
      <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",maxWidth:500,marginBottom:10 }}>
        {trucoDisponible&&<button onClick={cantarTruco} style={btnStyle("#b45309","#fbbf24")}>🗣 Truco</button>}
        {envidoDisponible&&<><button onClick={()=>cantarEnvido("envido")} style={btnStyle("#1d4ed8","#60a5fa")}>Envido</button><button onClick={()=>cantarEnvido("realenvido")} style={btnStyle("#5b21b6","#a78bfa")}>Real Envido</button><button onClick={()=>cantarEnvido("faltaenvido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button></>}
        <button onClick={irseAlMazo} style={btnStyle("#7f1d1d","#f87171")}>Ir al mazo</button>
      </div>

      {/* Chat */}
      <div style={{ display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center" }}>
        {QUICK_CHAT.map((msg,i)=>(
          <button key={i} onClick={()=>{ setChatMsg(msg); addLog(`Vos: "${msg}"`); setTimeout(()=>setChatMsg(null),2000); }} style={{ background:"rgba(0,0,0,0.3)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:20,padding:"4px 10px",color:"#9ca3af",fontSize:10,cursor:"pointer" }}>{msg}</button>
        ))}
      </div>

      {chatMsg&&<div style={{ position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#1a472a",border:"1px solid #4ade80",borderRadius:20,padding:"8px 16px",color:"#4ade80",fontSize:13,zIndex:10 }}>💬 {chatMsg}</div>}

      {/* Modal perfil */}
      {mostrarPerfil&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20 }}>
          <div style={{ background:"#0a2414",border:"1px solid #2d6a4f",borderRadius:16,padding:"32px",textAlign:"center",minWidth:280 }}>
            <div style={{ fontSize:48,marginBottom:8 }}>👤</div>
            <div style={{ fontSize:22,color:"#fbbf24",fontWeight:900,marginBottom:16 }}>{perfil?.nombre || user.email?.split("@")[0]}</div>
            <div style={{ display:"flex",gap:16,justifyContent:"center",marginBottom:16 }}>
              <div style={{ background:"rgba(0,0,0,0.4)",borderRadius:10,padding:"12px 20px" }}>
                <div style={{ fontSize:28,color:"#4ade80",fontWeight:900 }}>{perfil?.partidas_jugadas||0}</div>
                <div style={{ fontSize:10,color:"#6b9",textTransform:"uppercase",letterSpacing:1 }}>Jugadas</div>
              </div>
              <div style={{ background:"rgba(0,0,0,0.4)",borderRadius:10,padding:"12px 20px" }}>
                <div style={{ fontSize:28,color:"#fbbf24",fontWeight:900 }}>{perfil?.partidas_ganadas||0}</div>
                <div style={{ fontSize:10,color:"#6b9",textTransform:"uppercase",letterSpacing:1 }}>Ganadas</div>
              </div>
              <div style={{ background:"rgba(0,0,0,0.4)",borderRadius:10,padding:"12px 20px" }}>
                <div style={{ fontSize:28,color:"#60a5fa",fontWeight:900 }}>{winRate}%</div>
                <div style={{ fontSize:10,color:"#6b9",textTransform:"uppercase",letterSpacing:1 }}>Win rate</div>
              </div>
            </div>
            <button onClick={()=>setMostrarPerfil(false)} style={{ ...btnStyle("#1a472a","#4ade80"),fontSize:14,padding:"10px 24px" }}>Cerrar</button>
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
                  <div style={{ flex:1,textAlign:"left" }}>
                    <div style={{ color:"#e2f5e9",fontSize:13,fontWeight:700 }}>{p.nombre}</div>
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

 {/* Fin partida */}
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
  const [modoMulti, setModoMulti] = useState(false);
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
    let { data } = await supabase.from("perfiles").select("*").eq("usuario_id", u.id).single();
    if (!data) {
      const { data: nuevo } = await supabase.from("perfiles").insert({
        usuario_id: u.id,
        nombre: u.user_metadata?.full_name || u.email?.split("@")[0] || "Jugador",
        partidas_jugadas: 0,
        partidas_ganadas: 0,
      }).select().single();
      data = nuevo;
    }
    setPerfil(data);
    setCargando(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

 if (cargando) return (
    <div style={{ minHeight:"100vh",background:"#050f08",display:"flex",alignItems:"center",justifyContent:"center",color:"#4ade80",fontFamily:"Georgia",fontSize:18 }}>Cargando...</div>
  );
  if (!user) return <Auth />;
  if (modoMulti) return <Multijugador user={user} perfil={perfil} onVolver={()=>setModoMulti(false)} />;
return <TrucoApp user={user} perfil={perfil} setPerfil={setPerfil} onLogout={handleLogout} onMultijugador={()=>setModoMulti(true)} />;}