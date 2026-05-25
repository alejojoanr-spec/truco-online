import { useState, useEffect, useCallback } from "react";

const PALO = { espada: "espada", basto: "basto", copa: "copa", oro: "oro" };

const MAZO = [
  { num: 1, palo: PALO.espada, label: "1E" },{ num: 2, palo: PALO.espada, label: "2E" },{ num: 3, palo: PALO.espada, label: "3E" },
  { num: 4, palo: PALO.espada, label: "4E" },{ num: 5, palo: PALO.espada, label: "5E" },{ num: 6, palo: PALO.espada, label: "6E" },
  { num: 7, palo: PALO.espada, label: "7E" },{ num: 10, palo: PALO.espada, label: "10E" },{ num: 11, palo: PALO.espada, label: "11E" },
  { num: 12, palo: PALO.espada, label: "12E" },{ num: 1, palo: PALO.basto, label: "1B" },{ num: 2, palo: PALO.basto, label: "2B" },
  { num: 3, palo: PALO.basto, label: "3B" },{ num: 4, palo: PALO.basto, label: "4B" },{ num: 5, palo: PALO.basto, label: "5B" },
  { num: 6, palo: PALO.basto, label: "6B" },{ num: 7, palo: PALO.basto, label: "7B" },{ num: 10, palo: PALO.basto, label: "10B" },
  { num: 11, palo: PALO.basto, label: "11B" },{ num: 12, palo: PALO.basto, label: "12B" },{ num: 1, palo: PALO.copa, label: "1C" },
  { num: 2, palo: PALO.copa, label: "2C" },{ num: 3, palo: PALO.copa, label: "3C" },{ num: 4, palo: PALO.copa, label: "4C" },
  { num: 5, palo: PALO.copa, label: "5C" },{ num: 6, palo: PALO.copa, label: "6C" },{ num: 7, palo: PALO.copa, label: "7C" },
  { num: 10, palo: PALO.copa, label: "10C" },{ num: 11, palo: PALO.copa, label: "11C" },{ num: 12, palo: PALO.copa, label: "12C" },
  { num: 1, palo: PALO.oro, label: "1O" },{ num: 2, palo: PALO.oro, label: "2O" },{ num: 3, palo: PALO.oro, label: "3O" },
  { num: 4, palo: PALO.oro, label: "4O" },{ num: 5, palo: PALO.oro, label: "5O" },{ num: 6, palo: PALO.oro, label: "6O" },
  { num: 7, palo: PALO.oro, label: "7O" },{ num: 10, palo: PALO.oro, label: "10O" },{ num: 11, palo: PALO.oro, label: "11O" },
  { num: 12, palo: PALO.oro, label: "12O" },
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
  const palos = [PALO.espada, PALO.basto, PALO.copa, PALO.oro];
  for (const palo of palos) {
    const delPalo = mano.filter((c) => c.palo === palo);
    if (delPalo.length >= 2) {
      const vals = delPalo.map(valorEnvido).sort((a, b) => b - a);
      const score = 20 + vals[0] + vals[1];
      if (score > mejor) mejor = score;
    } else if (delPalo.length === 1) {
      const score = valorEnvido(delPalo[0]);
      if (score > mejor) mejor = score;
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
  if (oculta) {
    return (
      <div style={{ width:70,height:110,borderRadius:10,background:"linear-gradient(135deg,#1a472a,#0d2e1a)",border:"2px solid #2d6a4f",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 15px rgba(0,0,0,0.5)",fontSize:28,userSelect:"none" }}>🂠</div>
    );
  }
  return (
    <div onClick={onClick} style={{ width:70,height:110,borderRadius:10,background:jugada?"linear-gradient(135deg,#1c1c1c,#111)":seleccionada?"linear-gradient(135deg,#fef3c7,#fde68a)":"linear-gradient(135deg,#fffef7,#fef9e7)",border:seleccionada?"2px solid #f59e0b":jugada?"2px solid #333":"2px solid #d4a017",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"6px 4px",boxShadow:seleccionada?"0 0 20px rgba(245,158,11,0.6),0 6px 20px rgba(0,0,0,0.4)":"0 4px 15px rgba(0,0,0,0.4)",cursor:onClick&&!jugada?"pointer":"default",transition:"all 0.2s ease",transform:seleccionada?"translateY(-12px) scale(1.05)":jugada?"scale(0.95)":"none",opacity:jugada?0.5:1,userSelect:"none" }}>
      <span style={{ fontSize:13,fontWeight:900,color:jugada?"#555":"#1a1a1a",fontFamily:"Georgia,serif" }}>{carta.num}</span>
      <span style={{ fontSize:22,filter:jugada?"grayscale(1)":"none" }}>{SIMBOLO[carta.palo]}</span>
      <span style={{ fontSize:8,fontWeight:700,letterSpacing:1,color:jugada?"#555":COLOR_PALO[carta.palo],textTransform:"uppercase" }}>{carta.palo}</span>
    </div>
  );
}

function iaJugarCarta(mano, jugadas) {
  let minIdx = -1, minVal = 99;
  mano.forEach((c, i) => {
    if (!jugadas.includes(i) && valorTruco(c) < minVal) { minVal = valorTruco(c); minIdx = i; }
  });
  return minIdx;
}

const QUICK_CHAT = ["¡Buena mano!", "Vamos 💪", "¡Qué suerte!", "Jajaja 😄", "Buena partida 🤝"];

function btnStyle(bg, border) {
  return { background:`${bg}88`,border:`1px solid ${border}`,borderRadius:8,padding:"7px 14px",color:border,fontSize:12,cursor:"pointer",fontFamily:"Georgia",letterSpacing:0.5,transition:"all 0.15s" };
}

export default function TrucoApp() {
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
    const cartaJ = mesaJ[mesaJ.length - 1];
    const cartaR = mesaR[mesaR.length - 1];
    const vJ = valorTruco(cartaJ), vR = valorTruco(cartaR);
    let ganador = vJ > vR ? "jugador" : vR > vJ ? "rival" : "empate";
    addLog(ganador === "jugador" ? `✅ Ganaste la ronda ${rondaActual}` : ganador === "rival" ? `❌ El rival ganó la ronda ${rondaActual}` : `🤝 Empate en ronda ${rondaActual}`);
    const nuevosGanadores = [...ganadoresRondas, ganador];
    setGanadoresRondas(nuevosGanadores);
    setTimeout(() => {
      setMesaJugador([]); setMesaRival([]);
      const sigRonda = rondaActual + 1;
      const ganadorMano = determinarGanadorMano(nuevosGanadores);
      if (ganadorMano || sigRonda > 3 || jugadasJ.length >= 3) {
        resolverMano(ganadorMano || "empate");
      } else {
        setRondaActual(sigRonda);
        setTurno(ganador === "empate" ? "jugador" : ganador);
      }
    }, 1200);
  }

  function determinarGanadorMano(ganadores) {
    const j = ganadores.filter((g) => g === "jugador").length;
    const r = ganadores.filter((g) => g === "rival").length;
    if (j >= 2) return "jugador";
    if (r >= 2) return "rival";
    if (ganadores.length === 3) return ganadores[0] === "jugador" ? "jugador" : ganadores[0] === "rival" ? "rival" : "empate";
    return null;
  }

  function resolverMano(ganador) {
    const ptsTruco = estadoTruco === "quiero" ? 2 : 1;
    if (ganador === "jugador") {
      setPuntosJugador((p) => { const n = p + ptsTruco; if (n >= 15) { setFasePartida("fin"); setGanadorPartida("jugador"); addLog("🏆 ¡GANASTE LA PARTIDA!"); } return n; });
      addLog(`🏆 Ganaste la mano (+${ptsTruco} pts)`);
    } else if (ganador === "rival") {
      setPuntosRival((p) => { const n = p + ptsTruco; if (n >= 15) { setFasePartida("fin"); setGanadorPartida("rival"); addLog("💀 El rival ganó la partida"); } return n; });
      addLog(`💀 El rival ganó la mano (+${ptsTruco} pts)`);
    } else { addLog("🤝 Mano empatada"); }
    setTimeout(() => {
      if (fasePartida !== "fin") {
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
    if (turno !== "jugador" || fasePartida !== "jugando" || estadoTruco) return;
    setEstadoTruco("truco"); setTrucoCantadoPor("jugador"); addLog("Vos: ¡TRUCO!");
    setTimeout(() => {
      const respuesta = Math.random() > 0.35 ? "quiero" : "noquiero";
      setEstadoTruco(respuesta);
      addLog(`Rival: ${respuesta === "quiero" ? "¡Quiero!" : "No quiero"}`);
      if (respuesta === "noquiero") { addLog("✅ Ganaste 1 punto por el truco"); setPuntosJugador((p) => p + 1); }
    }, 1000);
  }

  function cantarEnvido(tipo) {
    if (turno !== "jugador" || fasePartida !== "jugando" || estadoEnvido) return;
    setEstadoEnvido(tipo); addLog(`Vos: ¡${tipo.toUpperCase()}!`);
    setTimeout(() => {
      const envidoRival = calcularEnvido(manoRival);
      const respuesta = envidoRival >= 25 || Math.random() > 0.5 ? "quiero" : "noquiero";
      setEstadoEnvido(respuesta);
      addLog(`Rival: ${respuesta === "quiero" ? "¡Quiero!" : "No quiero"}`);
      if (respuesta === "quiero") {
        const envJ = calcularEnvido(manoJugador);
        addLog(`Vos: ${envJ} - Rival: ${envidoRival}`);
        if (envJ >= envidoRival) { addLog("✅ Ganaste el envido! (+2)"); setPuntosJugador((p) => p + 2); }
        else { addLog("❌ Rival ganó el envido (+2)"); setPuntosRival((p) => p + 2); }
      } else { addLog("✅ Ganaste 1 punto por envido"); setPuntosJugador((p) => p + 1); }
    }, 1000);
  }

  function irseAlMazo() {
    addLog("Te fuiste al mazo."); setPuntosRival((p) => p + 1);
    setTimeout(() => resolverMano("rival"), 500);
  }

  const envidoDisponible = !estadoEnvido && rondaActual === 1 && jugadasJugador.length === 0;
  const trucoDisponible = !estadoTruco && turno === "jugador" && fasePartida === "jugando";
  const puedeJugar = turno === "jugador" && fasePartida === "jugando" && !(estadoTruco && !["quiero","noquiero"].includes(estadoTruco) && trucoCantadoPor === "rival");

  return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 8px",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(45deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 8px)",zIndex:0 }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",maxWidth:600,marginBottom:12,zIndex:1 }}>
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
        <button onClick={iniciarPartida} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:8,padding:"6px 12px",color:"#4ade80",fontSize:11,cursor:"pointer",letterSpacing:1 }}>Nueva<br/>Partida</button>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:10,zIndex:1 }}>
        {[1,2,3].map((r) => (
          <div key={r} style={{ width:28,height:8,borderRadius:4,background:r<rondaActual?(ganadoresRondas[r-1]==="jugador"?"#4ade80":ganadoresRondas[r-1]==="rival"?"#f87171":"#888"):r===rondaActual?"#fbbf24":"rgba(255,255,255,0.1)",border:r===rondaActual?"1px solid #fbbf24":"1px solid transparent" }} />
        ))}
      </div>

      <div style={{ zIndex:1,marginBottom:16,textAlign:"center" }}>
        <div style={{ fontSize:10,color:"#f87171",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{turno==="rival"?"⟳ Rival piensa...":"Rival"}</div>
        <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
          {manoRival.map((c,i) => <Carta key={i} carta={c} oculta={!jugadasRival.includes(i)} jugada={jugadasRival.includes(i)} />)}
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.25)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:16,padding:"12px 24px",marginBottom:16,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",gap:24,zIndex:1,width:"100%",maxWidth:400,minWidth:280 }}>
        <div style={{ textAlign:"center" }}>
          {mesaRival.length>0?(<><div style={{ fontSize:9,color:"#9ca",marginBottom:4,letterSpacing:1 }}>RIVAL</div><Carta carta={mesaRival[mesaRival.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
        <div style={{ color:"#2d6a4f",fontSize:20 }}>VS</div>
        <div style={{ textAlign:"center" }}>
          {mesaJugador.length>0?(<><div style={{ fontSize:9,color:"#4ade80",marginBottom:4,letterSpacing:1 }}>VOS</div><Carta carta={mesaJugador[mesaJugador.length-1]} /></>):<div style={{ color:"rgba(255,255,255,0.1)",fontSize:12 }}>—</div>}
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(45,106,79,0.3)",borderRadius:10,padding:"8px 12px",width:"100%",maxWidth:500,marginBottom:12,zIndex:1,maxHeight:80,overflowY:"auto" }}>
        {log.slice(-4).map((msg,i) => <div key={i} style={{ fontSize:11,color:i===log.slice(-4).length-1?"#e2f5e9":"rgba(180,220,190,0.5)",lineHeight:1.6 }}>{msg}</div>)}
      </div>

      <div style={{ zIndex:1,marginBottom:14,textAlign:"center" }}>
        <div style={{ fontSize:10,color:"#4ade80",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{puedeJugar?"👆 Tocá una carta para jugar":turno==="rival"?"Esperando rival...":"Tu mano"}</div>
        <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
          {manoJugador.map((c,i) => (
            <Carta key={i} carta={c} jugada={jugadasJugador.includes(i)} seleccionada={cartaSeleccionada===i}
              onClick={() => { if(!puedeJugar||jugadasJugador.includes(i))return; if(cartaSeleccionada===i){jugarCarta(i);}else{setCartaSeleccionada(i);} }} />
          ))}
        </div>
        {cartaSeleccionada!==null&&!jugadasJugador.includes(cartaSeleccionada)&&<div style={{ marginTop:6,fontSize:11,color:"#fbbf24" }}>Tocá de nuevo para confirmar</div>}
      </div>

      <div style={{ display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",zIndex:1,maxWidth:500,marginBottom:10 }}>
        {trucoDisponible&&!estadoTruco&&<button onClick={cantarTruco} style={btnStyle("#b45309","#fbbf24")}>🗣 Truco</button>}
        {envidoDisponible&&<><button onClick={()=>cantarEnvido("envido")} style={btnStyle("#1d4ed8","#60a5fa")}>Envido</button><button onClick={()=>cantarEnvido("realenvido")} style={btnStyle("#5b21b6","#a78bfa")}>Real Envido</button><button onClick={()=>cantarEnvido("faltaenvido")} style={btnStyle("#065f46","#34d399")}>Falta Envido</button></>}
        <button onClick={irseAlMazo} style={btnStyle("#7f1d1d","#f87171")}>Ir al mazo</button>
      </div>

      <div style={{ display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",zIndex:1 }}>
        {QUICK_CHAT.map((msg,i) => (
          <button key={i} onClick={()=>{ setChatMsg(msg); addLog(`Vos: "${msg}"`); setTimeout(()=>setChatMsg(null),2000); }} style={{ background:"rgba(0,0,0,0.3)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:20,padding:"4px 10px",color:"#9ca3af",fontSize:10,cursor:"pointer" }}>{msg}</button>
        ))}
      </div>

      {chatMsg&&<div style={{ position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#1a472a",border:"1px solid #4ade80",borderRadius:20,padding:"8px 16px",color:"#4ade80",fontSize:13,zIndex:10,boxShadow:"0 4px 20px rgba(74,222,128,0.3)" }}>💬 {chatMsg}</div>}

      {fasePartida==="fin"&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,flexDirection:"column",gap:16 }}>
          <div style={{ fontSize:64 }}>{ganadorPartida==="jugador"?"🏆":"💀"}</div>
          <div style={{ fontSize:32,fontWeight:900,color:ganadorPartida==="jugador"?"#fbbf24":"#f87171" }}>{ganadorPartida==="jugador"?"¡GANASTE!":"PERDISTE"}</div>
          <div style={{ color:"#9ca3af",fontSize:14 }}>{puntosJugador} – {puntosRival}</div>
          <button onClick={iniciarPartida} style={{ ...btnStyle("#1a472a","#4ade80"),fontSize:16,padding:"12px 32px",marginTop:8 }}>Jugar de nuevo</button>
        </div>
      )}
    </div>
  );
}