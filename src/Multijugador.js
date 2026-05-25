import { useState, useEffect } from "react";
import { supabase } from "./supabase";

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

const SIMBOLO = { espada: "⚔", basto: "🪄", copa: "🏆", oro: "⭕" };
const COLOR_PALO = { espada: "#60a5fa", basto: "#4ade80", copa: "#f472b6", oro: "#fbbf24" };

function CartaMulti({ carta, oculta, onClick, jugada, seleccionada }) {
  if (oculta) return (
    <div style={{ width:65,height:100,borderRadius:10,background:"linear-gradient(135deg,#1a472a,#0d2e1a)",border:"2px solid #2d6a4f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,userSelect:"none" }}>🂠</div>
  );
  return (
    <div onClick={onClick} style={{ width:65,height:100,borderRadius:10,background:jugada?"linear-gradient(135deg,#1c1c1c,#111)":seleccionada?"linear-gradient(135deg,#fef3c7,#fde68a)":"linear-gradient(135deg,#fffef7,#fef9e7)",border:seleccionada?"2px solid #f59e0b":jugada?"2px solid #333":"2px solid #d4a017",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"6px 4px",cursor:onClick&&!jugada?"pointer":"default",transition:"all 0.2s",transform:seleccionada?"translateY(-10px) scale(1.05)":jugada?"scale(0.95)":"none",opacity:jugada?0.5:1,userSelect:"none" }}>
      <span style={{ fontSize:12,fontWeight:900,color:jugada?"#555":"#1a1a1a" }}>{carta.num}</span>
      <span style={{ fontSize:20,filter:jugada?"grayscale(1)":"none" }}>{SIMBOLO[carta.palo]}</span>
      <span style={{ fontSize:7,fontWeight:700,color:jugada?"#555":COLOR_PALO[carta.palo],textTransform:"uppercase" }}>{carta.palo}</span>
    </div>
  );
}

export default function Multijugador({ user, perfil, onVolver }) {
  const [pantalla, setPantalla] = useState("menu"); // menu | esperando | jugando
  const [codigo, setCodigo] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [partida, setPartida] = useState(null);
  const [soyJugador1, setSoyJugador1] = useState(false);
  const [miMano, setMiMano] = useState([]);
  const [manoRival, setManoRival] = useState([]);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");

  const addLog = (msg) => setLog(prev => [...prev.slice(-6), msg]);

  // Suscripción realtime
  useEffect(() => {
    if (!codigo) return;
    const channel = supabase.channel(`partida-${codigo}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "partidas", filter: `codigo=eq.${codigo}` },
        (payload) => { setPartida(payload.new); procesarCambio(payload.new); }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [codigo]);

  function procesarCambio(p) {
    if (!p) return;
    if (p.estado === "jugando") setPantalla("jugando");
    if (p.mano_jugador1) {
      const mano1 = JSON.parse(p.mano_jugador1);
      const mano2 = JSON.parse(p.mano_jugador2);
      if (soyJugador1) { setMiMano(mano1); setManoRival(mano2); }
      else { setMiMano(mano2); setManoRival(mano1); }
    }
  }

  async function crearSala() {
    const cod = generarCodigo();
    const mazo = mezclar(MAZO);
    const mano1 = mazo.slice(0, 3);
    const mano2 = mazo.slice(3, 6);
    const { error: err } = await supabase.from("partidas").insert({
      codigo: cod,
      estado: "esperando",
      jugador1_id: user.id,
      mano_jugador1: JSON.stringify(mano1),
      mano_jugador2: JSON.stringify(mano2),
      turno: user.id,
      mesa: JSON.stringify([]),
      puntos1: 0,
      puntos2: 0,
    });
    if (err) { setError("Error al crear sala"); return; }
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
    await supabase.from("partidas").update({ jugador2_id: user.id, estado: "jugando" }).eq("codigo", cod);
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
    const esMiTurno = partida.turno === user.id;
    if (!esMiTurno) { addLog("No es tu turno"); return; }
    if (cartaSeleccionada !== idx) { setCartaSeleccionada(idx); return; }

    const carta = miMano[idx];
    const mesaActual = JSON.parse(partida.mesa || "[]");
    const nuevaMesa = [...mesaActual, { carta, jugador: user.id }];
    const rivalId = soyJugador1 ? partida.jugador2_id : partida.jugador1_id;

    await supabase.from("partidas").update({
      mesa: JSON.stringify(nuevaMesa),
      turno: rivalId,
    }).eq("codigo", codigo);

    addLog(`Jugaste: ${carta.num} de ${carta.palo}`);
    setCartaSeleccionada(null);
  }

  const miTurno = partida?.turno === user.id;
  const mesaActual = partida?.mesa ? JSON.parse(partida.mesa) : [];

  // ── Render ──
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
        <div style={{ fontSize:36,color:"#4ade80",fontWeight:900,letterSpacing:8 }}>{codigo}</div>
      </div>
      <button onClick={onVolver} style={{ padding:"10px 20px",borderRadius:10,background:"transparent",border:"1px solid #374151",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"Georgia" }}>Cancelar</button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 8px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",width:"100%",maxWidth:500,marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10,color:"#4ade80",letterSpacing:2 }}>TRUCO 2 JUGADORES</div>
          <div style={{ fontSize:12,color:"#fbbf24" }}>Sala: {codigo}</div>
        </div>
        <div style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:10,padding:"8px 16px",textAlign:"center" }}>
          <div style={{ display:"flex",gap:12 }}>
            <div><div style={{ fontSize:10,color:"#9ca" }}>Vos</div><div style={{ fontSize:24,color:"#4ade80",fontWeight:900 }}>{soyJugador1?partida?.puntos1:partida?.puntos2||0}</div></div>
            <div style={{ color:"#2d6a4f" }}>–</div>
            <div><div style={{ fontSize:10,color:"#9ca" }}>Rival</div><div style={{ fontSize:24,color:"#f87171",fontWeight:900 }}>{soyJugador1?partida?.puntos2:partida?.puntos1||0}</div></div>
          </div>
        </div>
        <button onClick={onVolver} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #7f1d1d",borderRadius:8,padding:"6px 12px",color:"#f87171",fontSize:11,cursor:"pointer" }}>Salir</button>
      </div>

      <div style={{ marginBottom:16,textAlign:"center" }}>
        <div style={{ fontSize:10,color:"#f87171",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>Rival</div>
        <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
          {manoRival.map((_,i)=><CartaMulti key={i} carta={manoRival[i]} oculta={true} />)}
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.25)",border:"1px solid rgba(45,106,79,0.4)",borderRadius:16,padding:"12px 24px",marginBottom:16,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",gap:24,width:"100%",maxWidth:400 }}>
        {mesaActual.length===0&&<div style={{ color:"rgba(255,255,255,0.1)" }}>Mesa vacía</div>}
        {mesaActual.map((m,i)=>(
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ fontSize:9,color:m.jugador===user.id?"#4ade80":"#f87171",marginBottom:4 }}>{m.jugador===user.id?"VOS":"RIVAL"}</div>
            <CartaMulti carta={m.carta} />
          </div>
        ))}
      </div>

      <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(45,106,79,0.3)",borderRadius:10,padding:"8px 12px",width:"100%",maxWidth:500,marginBottom:12,maxHeight:70,overflowY:"auto" }}>
        {log.slice(-3).map((msg,i)=><div key={i} style={{ fontSize:11,color:i===log.slice(-3).length-1?"#e2f5e9":"rgba(180,220,190,0.5)",lineHeight:1.6 }}>{msg}</div>)}
      </div>

      <div style={{ marginBottom:14,textAlign:"center" }}>
        <div style={{ fontSize:10,color:"#4ade80",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>
          {miTurno?"👆 Tu turno — tocá una carta":"⏳ Turno del rival..."}
        </div>
        <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
          {miMano.map((c,i)=>(
            <CartaMulti key={i} carta={c} seleccionada={cartaSeleccionada===i}
              onClick={()=>miTurno&&jugarCarta(i)} />
          ))}
        </div>
        {cartaSeleccionada!==null&&<div style={{ marginTop:6,fontSize:11,color:"#fbbf24" }}>Tocá de nuevo para confirmar</div>}
      </div>
    </div>
  );
}