import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { crearTorneo as crearTorneoApi, unirseATorneo as unirseATorneoApi } from "./torneosApi";

export default function Torneos({ user, perfil, onVolver, onIrAPartidaTorneo, torneoInicialId }) {
  const [torneos, setTorneos] = useState([]);
  const [pantalla, setPantalla] = useState("lista"); // lista | crear | detalle
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [jugadoresTorneo, setJugadoresTorneo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [maxJugadores, setMaxJugadores] = useState(8);
  const [entrada, setEntrada] = useState(0);
  const channelRef = useRef(null);
  const navegadoRef = useRef(false);

  useEffect(() => { cargarTorneos(); }, []);

  useEffect(() => {
    if (!torneoInicialId) return;
    (async () => {
      const { data: torneo } = await supabase.from("torneos").select("*").eq("id", torneoInicialId).single();
      if (!torneo) return;
      setTorneoSeleccionado(torneo);
      const { data: jugadores } = await supabase.from("torneo_jugadores").select("*").eq("torneo_id", torneoInicialId).order("posicion");
      if (jugadores) setJugadoresTorneo(jugadores);
      setPantalla("detalle");
    })();
  }, [torneoInicialId]);

  useEffect(() => {
    if (!torneoSeleccionado?.id) return;
    navegadoRef.current = false;

    const ch = supabase.channel(`torneo-${torneoSeleccionado.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "torneos", filter: `id=eq.${torneoSeleccionado.id}` },
        (payload) => {
          if (navegadoRef.current) return;
          if (payload.new.estado === "en_curso" && payload.new.bracket) {
            const parRonda1 = (payload.new.bracket.ronda1 || []).find(
              p => p.jugador1 === user.id || p.jugador2 === user.id
            );
            if (parRonda1) { navegadoRef.current = true; onIrAPartidaTorneo(parRonda1.codigo_partida); return; }

            const final = payload.new.bracket.final;
            if (final && (final.jugador1 === user.id || final.jugador2 === user.id) && final.codigo_partida) {
              navegadoRef.current = true;
              onIrAPartidaTorneo(final.codigo_partida);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED")
          console.warn("[Realtime] Canal caído:", status);
      });
    channelRef.current = ch;

    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torneoSeleccionado?.id]);

  async function cargarTorneos() {
    setCargando(true);
    const { data } = await supabase.from("torneos").select("*").eq("estado", "abierto").order("id", { ascending: false });
    if (data) setTorneos(data);
    setCargando(false);
  }

  async function crearTorneo() {
    const { error } = await crearTorneoApi({ user, perfil, nombre, maxJugadores, entrada });
    if (error) { alert(error); return; }
    setNombre(""); setMaxJugadores(8); setEntrada(0);
    cargarTorneos();
    setPantalla("lista");
  }

  async function unirseATorneo(torneo) {
    const { error } = await unirseATorneoApi({ user, perfil, torneo });
    if (error) { alert(error); return; }
    cargarTorneos();
  }

  async function verDetalle(torneo) {
    setTorneoSeleccionado(torneo);
    const { data } = await supabase.from("torneo_jugadores").select("*").eq("torneo_id", torneo.id).order("posicion");
    if (data) setJugadoresTorneo(data);
    setPantalla("detalle");
  }


  if (pantalla === "crear") return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:20 }}>
      <div style={{ background:"rgba(0,0,0,0.5)",border:"1px solid #2d6a4f",borderRadius:16,padding:32,width:"100%",maxWidth:380 }}>
        <div style={{ fontSize:24,color:"#fbbf24",fontWeight:900,textAlign:"center",marginBottom:24 }}>🏆 Crear Torneo</div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11,color:"#4ade80",letterSpacing:2,marginBottom:6 }}>NOMBRE DEL TORNEO</div>
          <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Gran Torneo de Truco" style={{ width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #2d6a4f",background:"rgba(0,0,0,0.4)",color:"#e2f5e9",fontFamily:"Georgia",fontSize:14,outline:"none",boxSizing:"border-box" }} />
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11,color:"#4ade80",letterSpacing:2,marginBottom:6 }}>MÁXIMO DE JUGADORES</div>
          <select value={maxJugadores} onChange={e=>setMaxJugadores(Number(e.target.value))} style={{ width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #2d6a4f",background:"rgba(0,0,0,0.7)",color:"#e2f5e9",fontFamily:"Georgia",fontSize:14,outline:"none" }}>
            <option value={4}>4 jugadores</option>
            <option value={8}>8 jugadores</option>
            <option value={16}>16 jugadores</option>
            <option value={32}>32 jugadores</option>
          </select>
        </div>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11,color:"#4ade80",letterSpacing:2,marginBottom:6 }}>ENTRADA (fichas virtuales)</div>
          <select value={entrada} onChange={e=>setEntrada(Number(e.target.value))} style={{ width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #2d6a4f",background:"rgba(0,0,0,0.7)",color:"#e2f5e9",fontFamily:"Georgia",fontSize:14,outline:"none" }}>
            <option value={0}>Gratis</option>
            <option value={100}>100 fichas</option>
            <option value={500}>500 fichas</option>
            <option value={1000}>1000 fichas</option>
            <option value={5000}>5000 fichas</option>
          </select>
        </div>

        {entrada > 0 && (
          <div style={{ background:"rgba(251,191,36,0.1)",border:"1px solid #fbbf24",borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:"#fbbf24",textAlign:"center" }}>
            💰 Premio estimado: {entrada * maxJugadores} fichas
          </div>
        )}

        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>setPantalla("lista")} style={{ flex:1,padding:12,borderRadius:8,background:"transparent",border:"1px solid #374151",color:"#6b7280",fontSize:14,cursor:"pointer",fontFamily:"Georgia" }}>Cancelar</button>
          <button onClick={crearTorneo} style={{ flex:2,padding:12,borderRadius:8,background:"#1a472a",border:"1px solid #4ade80",color:"#4ade80",fontSize:14,cursor:"pointer",fontFamily:"Georgia",fontWeight:700 }}>Crear Torneo</button>
        </div>
      </div>
    </div>
  );

  if (pantalla === "detalle" && torneoSeleccionado) return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",padding:"24px 16px",fontFamily:"Georgia,serif" }}>
      <div style={{ maxWidth:500,margin:"0 auto" }}>
        <button onClick={()=>setPantalla("lista")} style={{ background:"transparent",border:"none",color:"#4ade80",fontSize:14,cursor:"pointer",marginBottom:16 }}>← Volver</button>

        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:22,color:"#fbbf24",fontWeight:900 }}>{torneoSeleccionado.nombre}</div>
          <div style={{ fontSize:12,color:"#6b9",marginTop:4 }}>
            {torneoSeleccionado.jugadores_actuales}/{torneoSeleccionado.max_jugadores} jugadores
          </div>
          {torneoSeleccionado.entrada > 0 && (
            <div style={{ fontSize:14,color:"#fbbf24",marginTop:8 }}>💰 Premio: {torneoSeleccionado.premio} fichas</div>
          )}
          {torneoSeleccionado.entrada === 0 && (
            <div style={{ fontSize:14,color:"#4ade80",marginTop:8 }}>🎮 Torneo gratuito</div>
          )}
        </div>

        <div style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:12,padding:16,marginBottom:16 }}>
          <div style={{ fontSize:11,color:"#4ade80",letterSpacing:2,marginBottom:12 }}>JUGADORES INSCRIPTOS</div>
          {jugadoresTorneo.length === 0 && <div style={{ color:"#6b7280",fontSize:13,textAlign:"center" }}>Sin jugadores aún</div>}
          {jugadoresTorneo.map((j,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid rgba(45,106,79,0.3)" }}>
              <div style={{ fontSize:16 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}</div>
              <div style={{ flex:1,color:j.jugador_id===user.id?"#4ade80":"#e2f5e9",fontSize:13 }}>{j.nombre_jugador}{j.jugador_id===user.id?" (vos)":""}</div>
              {j.eliminado && <div style={{ fontSize:11,color:"#f87171" }}>Eliminado</div>}
            </div>
          ))}
        </div>

        {torneoSeleccionado.estado === "abierto" && (
          <button onClick={()=>unirseATorneo(torneoSeleccionado)} style={{ width:"100%",padding:14,borderRadius:10,background:"#1a472a",border:"1px solid #4ade80",color:"#4ade80",fontSize:16,cursor:"pointer",fontFamily:"Georgia",fontWeight:700 }}>
            ✅ Inscribirme al torneo
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",padding:"24px 16px",fontFamily:"Georgia,serif" }}>
      <div style={{ maxWidth:500,margin:"0 auto" }}>

        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
          <div>
            <div style={{ fontSize:10,color:"#4ade80",letterSpacing:3,textTransform:"uppercase" }}>Truco Online</div>
            <div style={{ fontSize:24,color:"#fbbf24",fontWeight:900 }}>🏆 Torneos</div>
          </div>
          <button onClick={onVolver} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #374151",borderRadius:8,padding:"6px 12px",color:"#6b7280",fontSize:12,cursor:"pointer" }}>← Volver</button>
        </div>

        <button onClick={()=>setPantalla("crear")} style={{ width:"100%",padding:14,borderRadius:10,background:"#1a472a",border:"1px solid #4ade80",color:"#4ade80",fontSize:16,cursor:"pointer",fontFamily:"Georgia",fontWeight:700,marginBottom:20 }}>
          ➕ Crear nuevo torneo
        </button>

        <div style={{ fontSize:11,color:"#4ade80",letterSpacing:2,marginBottom:12 }}>TORNEOS DISPONIBLES</div>

        {cargando && <div style={{ color:"#6b7280",textAlign:"center",padding:20 }}>Cargando...</div>}

        {!cargando && torneos.length === 0 && (
          <div style={{ background:"rgba(0,0,0,0.3)",border:"1px solid #2d6a4f",borderRadius:12,padding:24,textAlign:"center",color:"#6b7280" }}>
            No hay torneos abiertos. ¡Creá uno!
          </div>
        )}

        {torneos.map((t,i)=>(
          <div key={i} onClick={()=>verDetalle(t)} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:12,padding:16,marginBottom:12,cursor:"pointer" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:15,color:"#e2f5e9",fontWeight:700 }}>{t.nombre}</div>
                <div style={{ fontSize:11,color:"#6b9",marginTop:4 }}>{t.jugadores_actuales}/{t.max_jugadores} jugadores</div>
              </div>
              <div style={{ textAlign:"right" }}>
                {t.entrada > 0 ? (
                  <div style={{ fontSize:13,color:"#fbbf24" }}>💰 {t.entrada} fichas</div>
                ) : (
                  <div style={{ fontSize:13,color:"#4ade80" }}>Gratis</div>
                )}
                <div style={{ fontSize:11,color:"#6b7280",marginTop:4 }}>Premio: {t.premio} fichas</div>
              </div>
            </div>
            <div style={{ marginTop:8,background:"rgba(45,106,79,0.2)",borderRadius:4,height:4,overflow:"hidden" }}>
              <div style={{ height:"100%",background:"#4ade80",width:`${(t.jugadores_actuales/t.max_jugadores)*100}%`,transition:"width 0.3s" }} />
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}