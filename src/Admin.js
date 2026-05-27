import { useState, useEffect } from "react";
import { supabase } from "./supabase";

function StatCard({ label, valor, color }) {
  return (
    <div style={{ background:"rgba(0,0,0,0.4)", border:"1px solid #2d6a4f", borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
      <div style={{ fontSize:22, fontWeight:900, color }}>{valor}</div>
      <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{label}</div>
    </div>
  );
}

export default function Admin({ onVolver }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [confirmBan, setConfirmBan] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorBan, setErrorBan] = useState("");

  useEffect(() => { cargarUsuarios(); }, []);

  async function cargarUsuarios() {
    setCargando(true);
    const { data } = await supabase
      .from("perfiles")
      .select("usuario_id, nombre, email, avatar, created_at, is_verified, is_banned, partidas_jugadas, partidas_ganadas")
      .order("created_at", { ascending: false });
    setUsuarios(data || []);
    setCargando(false);
  }

  async function ejecutarBan(usuario_id, banear) {
    setProcesando(true);
    setErrorBan("");
    const { error } = await supabase
      .from("perfiles")
      .update({ is_banned: banear })
      .eq("usuario_id", usuario_id);
    if (error) {
      setErrorBan("No se pudo completar la acción. Verificá los permisos en Supabase.");
    } else {
      setUsuarios(prev => prev.map(u =>
        u.usuario_id === usuario_id ? { ...u, is_banned: banear } : u
      ));
      setConfirmBan(null);
    }
    setProcesando(false);
  }

  const filtrados = usuarios.filter(u => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const stats = {
    total: usuarios.length,
    verificados: usuarios.filter(u => u.is_verified).length,
    baneados: usuarios.filter(u => u.is_banned).length,
  };

  function winrate(u) {
    if (!u.partidas_jugadas) return "—";
    return Math.round((u.partidas_ganadas / u.partidas_jugadas) * 100) + "%";
  }

  function fecha(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  }

  return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)", fontFamily:"'Lato', sans-serif", color:"#e2f5e9" }}>

      {/* Header sticky */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 16px", borderBottom:"1px solid rgba(45,106,79,0.4)", position:"sticky", top:0, background:"rgba(5,15,8,0.96)", backdropFilter:"blur(8px)", zIndex:10 }}>
        <div>
          <div style={{ fontSize:9, color:"#4ade80", letterSpacing:3, textTransform:"uppercase" }}>Truco Online</div>
          <div style={{ fontSize:19, color:"#fbbf24", fontWeight:900 }}>Panel de administrador</div>
        </div>
        <button
          onClick={onVolver}
          style={{ background:"rgba(0,0,0,0.4)", border:"1px solid #2d6a4f", borderRadius:8, padding:"8px 14px", color:"#4ade80", fontSize:13, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}
        >
          ← Volver
        </button>
      </div>

      <div style={{ padding:"16px", maxWidth:620, margin:"0 auto" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
          <StatCard label="Usuarios" valor={stats.total} color="#4ade80" />
          <StatCard label="Verificados" valor={stats.verificados} color="#60a5fa" />
          <StatCard label="Baneados" valor={stats.baneados} color="#f87171" />
        </div>

        {/* Buscador */}
        <div style={{ position:"relative", marginBottom:16 }}>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width:"100%", padding:"11px 14px 11px 40px", borderRadius:10, border:"1px solid #2d6a4f", background:"rgba(0,0,0,0.5)", color:"#ffffff", fontFamily:"'Lato',sans-serif", fontSize:14, outline:"none", boxSizing:"border-box" }}
          />
          <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {busqueda && (
            <button onClick={() => setBusqueda("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontSize:16, lineHeight:1 }}>✕</button>
          )}
        </div>

        {/* Lista */}
        {cargando ? (
          <div style={{ textAlign:"center", color:"#4ade80", padding:40, fontSize:14 }}>Cargando usuarios...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign:"center", color:"#6b7280", padding:40, fontSize:14 }}>Sin resultados para "{busqueda}"</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtrados.map(u => (
              <div key={u.usuario_id} style={{
                background: u.is_banned ? "rgba(248,113,113,0.04)" : "rgba(0,0,0,0.4)",
                border: `1px solid ${u.is_banned ? "rgba(248,113,113,0.3)" : "#2d6a4f"}`,
                borderRadius:12, padding:"14px 16px",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>

                  {/* Avatar */}
                  <div style={{ fontSize:28, flexShrink:0 }}>{u.avatar || "👤"}</div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:900, color: u.is_banned ? "#f87171" : "#fbbf24" }}>
                        {u.nombre}
                      </span>
                      {u.is_verified && (
                        <span style={{ fontSize:10, background:"rgba(96,165,250,0.12)", border:"1px solid rgba(96,165,250,0.35)", borderRadius:4, padding:"1px 6px", color:"#60a5fa", fontWeight:700 }}>
                          ✓ Verificado
                        </span>
                      )}
                      {u.is_banned && (
                        <span style={{ fontSize:10, background:"rgba(248,113,113,0.12)", border:"1px solid rgba(248,113,113,0.35)", borderRadius:4, padding:"1px 6px", color:"#f87171", fontWeight:700 }}>
                          Baneado
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:"#6b7280", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {u.email || <span style={{ fontStyle:"italic" }}>email no disponible</span>}
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:5, fontSize:11, color:"#4b5563", flexWrap:"wrap" }}>
                      <span>{fecha(u.created_at)}</span>
                      <span>·</span>
                      <span>Winrate: {winrate(u)}</span>
                      <span>·</span>
                      <span>{u.partidas_jugadas || 0} partidas</span>
                    </div>
                  </div>

                  {/* Botón ban */}
                  <button
                    onClick={() => { setErrorBan(""); setConfirmBan(u); }}
                    style={{
                      flexShrink:0, padding:"7px 12px", borderRadius:8, cursor:"pointer",
                      fontSize:12, fontWeight:700, fontFamily:"'Lato',sans-serif",
                      background: u.is_banned ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
                      border: u.is_banned ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(248,113,113,0.4)",
                      color: u.is_banned ? "#4ade80" : "#f87171",
                    }}
                  >
                    {u.is_banned ? "Desbanear" : "Banear"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmación ban/unban */}
      {confirmBan && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:60, padding:16 }}>
          <div style={{ background:"#0a2414", border:`1px solid ${confirmBan.is_banned ? "#2d6a4f" : "rgba(248,113,113,0.4)"}`, borderRadius:20, padding:"28px 24px", maxWidth:320, width:"100%", textAlign:"center", fontFamily:"'Lato',sans-serif" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>{confirmBan.is_banned ? "🔓" : "🚫"}</div>
            <div style={{ fontSize:17, color:"#fbbf24", fontWeight:900, marginBottom:8 }}>
              {confirmBan.is_banned ? "Restaurar acceso" : "Banear cuenta"}
            </div>
            <div style={{ fontSize:13, color:"#9ca3af", marginBottom:20, lineHeight:1.7 }}>
              {confirmBan.is_banned
                ? <>¿Restaurar el acceso a <strong style={{ color:"#e2f5e9" }}>{confirmBan.nombre}</strong>?</>
                : <>¿Suspender la cuenta de <strong style={{ color:"#e2f5e9" }}>{confirmBan.nombre}</strong>? No podrá iniciar sesión ni jugar.</>
              }
            </div>
            {errorBan && (
              <div style={{ fontSize:12, color:"#f87171", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"8px 12px", marginBottom:16 }}>
                {errorBan}
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => { setConfirmBan(null); setErrorBan(""); }}
                disabled={procesando}
                style={{ flex:1, padding:"11px", borderRadius:10, cursor:"pointer", background:"rgba(255,255,255,0.05)", border:"1px solid #374151", color:"#9ca3af", fontFamily:"'Lato',sans-serif", fontSize:14 }}
              >
                Cancelar
              </button>
              <button
                onClick={() => ejecutarBan(confirmBan.usuario_id, !confirmBan.is_banned)}
                disabled={procesando}
                style={{ flex:1, padding:"11px", borderRadius:10, cursor: procesando ? "not-allowed" : "pointer", background: confirmBan.is_banned ? "linear-gradient(135deg,#1a472a,#2d6a4f)" : "linear-gradient(135deg,#7f1d1d,#991b1b)", border: confirmBan.is_banned ? "1px solid #4ade80" : "1px solid #f87171", color: confirmBan.is_banned ? "#4ade80" : "#f87171", fontFamily:"'Lato',sans-serif", fontSize:14, fontWeight:700, opacity: procesando ? 0.7 : 1 }}
              >
                {procesando ? "..." : confirmBan.is_banned ? "Restaurar" : "Banear"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
