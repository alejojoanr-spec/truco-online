import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ─── shared styles ─── */
const CARD = {
  background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f",
  borderRadius: 12, padding: "14px 16px",
};
const BTN_SM = (color = "#4ade80") => ({
  padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12,
  fontWeight: 700, fontFamily: "'Lato',sans-serif",
  background: `rgba(${color === "#4ade80" ? "74,222,128" : color === "#f87171" ? "248,113,113" : "96,165,250"},0.08)`,
  border: `1px solid ${color}`, color,
});
const INPUT_STYLE = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.5)",
  color: "#ffffff", fontFamily: "'Lato',sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};

function StatCard({ label, valor, color = "#4ade80" }) {
  return (
    <div style={{ ...CARD, textAlign: "center", padding: "12px 8px" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{valor}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function fecha(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

/* ══════════════════════════════════════════
   TAB 1 — USUARIOS
══════════════════════════════════════════ */
function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [confirmBan, setConfirmBan] = useState(null);
  const [procesandoBan, setProcesandoBan] = useState(false);
  const [errorBan, setErrorBan] = useState("");
  const [modalSaldo, setModalSaldo] = useState(null); // usuario seleccionado
  const [saldoValor, setSaldoValor] = useState("");
  const [saldoNota, setSaldoNota] = useState("");
  const [procesandoSaldo, setProcesandoSaldo] = useState(false);
  const [errorSaldo, setErrorSaldo] = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const { data, error, status, statusText } = await supabase
      .from("perfiles")
      .select("*")
      .order("created_at", { ascending: false });
    console.log("[Admin] cargarUsuarios →", { status, statusText, rows: data?.length, data, error });
    if (error) console.error("[Admin] error:", error.message, error.code, error.details);
    setUsuarios(data || []);
    setCargando(false);
  }

  async function ejecutarBan(usuario_id, banear) {
    setProcesandoBan(true); setErrorBan("");
    const { error } = await supabase.from("perfiles").update({ is_banned: banear }).eq("usuario_id", usuario_id);
    if (error) { setErrorBan("No se pudo completar la acción."); }
    else {
      setUsuarios(prev => prev.map(u => u.usuario_id === usuario_id ? { ...u, is_banned: banear } : u));
      setConfirmBan(null);
    }
    setProcesandoBan(false);
  }

  async function ajustarSaldo() {
    const monto = parseFloat(saldoValor);
    if (isNaN(monto) || monto === 0) { setErrorSaldo("Ingresá un monto válido (puede ser negativo)."); return; }
    setProcesandoSaldo(true); setErrorSaldo("");
    const nuevoSaldo = Math.max(0, (modalSaldo.saldo || 0) + monto);
    const { error } = await supabase.from("perfiles").update({ saldo: nuevoSaldo }).eq("usuario_id", modalSaldo.usuario_id);
    if (error) { setErrorSaldo("No se pudo ajustar el saldo."); setProcesandoSaldo(false); return; }
    setUsuarios(prev => prev.map(u => u.usuario_id === modalSaldo.usuario_id ? { ...u, saldo: nuevoSaldo } : u));
    setModalSaldo(null); setSaldoValor(""); setSaldoNota("");
    setProcesandoSaldo(false);
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

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        <StatCard label="Usuarios" valor={stats.total} color="#4ade80" />
        <StatCard label="Verificados" valor={stats.verificados} color="#60a5fa" />
        <StatCard label="Baneados" valor={stats.baneados} color="#f87171" />
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          type="text" placeholder="Buscar por nombre o email..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ ...INPUT_STYLE, paddingLeft: 40 }}
        />
        <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        {busqueda && (
          <button onClick={() => setBusqueda("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 16 }}>✕</button>
        )}
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", color: "#4ade80", padding: 40 }}>Cargando usuarios...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>Sin resultados para "{busqueda}"</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map(u => (
            <div key={u.usuario_id} style={{
              ...CARD,
              background: u.is_banned ? "rgba(248,113,113,0.04)" : "rgba(0,0,0,0.4)",
              border: `1px solid ${u.is_banned ? "rgba(248,113,113,0.3)" : "#2d6a4f"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 26, flexShrink: 0 }}>{u.avatar || "👤"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: u.is_banned ? "#f87171" : "#fbbf24" }}>{u.nombre}</span>
                    {u.is_verified && <span style={{ fontSize: 10, background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.35)", borderRadius: 4, padding: "1px 6px", color: "#60a5fa", fontWeight: 700 }}>✓ Verificado</span>}
                    {u.is_banned && <span style={{ fontSize: 10, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 4, padding: "1px 6px", color: "#f87171", fontWeight: 700 }}>Baneado</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email || <span style={{ fontStyle: "italic" }}>email no disponible</span>}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 5, fontSize: 11, color: "#4b5563", flexWrap: "wrap" }}>
                    <span>{fecha(u.created_at)}</span>
                    <span>·</span>
                    <span>Winrate: {winrate(u)}</span>
                    <span>·</span>
                    <span>{u.partidas_jugadas || 0} partidas</span>
                    <span>·</span>
                    <span>Saldo: ${(u.saldo || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setModalSaldo(u); setSaldoValor(""); setSaldoNota(""); setErrorSaldo(""); }} style={BTN_SM("#60a5fa")}>
                    Saldo
                  </button>
                  <button onClick={() => { setErrorBan(""); setConfirmBan(u); }} style={BTN_SM(u.is_banned ? "#4ade80" : "#f87171")}>
                    {u.is_banned ? "Desbanear" : "Banear"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ban */}
      {confirmBan && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "#0a2414", border: `1px solid ${confirmBan.is_banned ? "#2d6a4f" : "rgba(248,113,113,0.4)"}`, borderRadius: 20, padding: "28px 24px", maxWidth: 320, width: "100%", textAlign: "center", fontFamily: "'Lato',sans-serif" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{confirmBan.is_banned ? "🔓" : "🚫"}</div>
            <div style={{ fontSize: 17, color: "#fbbf24", fontWeight: 900, marginBottom: 8 }}>{confirmBan.is_banned ? "Restaurar acceso" : "Banear cuenta"}</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20, lineHeight: 1.7 }}>
              {confirmBan.is_banned
                ? <>¿Restaurar el acceso a <strong style={{ color: "#e2f5e9" }}>{confirmBan.nombre}</strong>?</>
                : <>¿Suspender la cuenta de <strong style={{ color: "#e2f5e9" }}>{confirmBan.nombre}</strong>? No podrá iniciar sesión ni jugar.</>}
            </div>
            {errorBan && <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>{errorBan}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setConfirmBan(null); setErrorBan(""); }} disabled={procesandoBan} style={{ flex: 1, padding: 11, borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#9ca3af", fontFamily: "'Lato',sans-serif", fontSize: 14 }}>Cancelar</button>
              <button onClick={() => ejecutarBan(confirmBan.usuario_id, !confirmBan.is_banned)} disabled={procesandoBan} style={{ flex: 1, padding: 11, borderRadius: 10, cursor: procesandoBan ? "not-allowed" : "pointer", background: confirmBan.is_banned ? "linear-gradient(135deg,#1a472a,#2d6a4f)" : "linear-gradient(135deg,#7f1d1d,#991b1b)", border: confirmBan.is_banned ? "1px solid #4ade80" : "1px solid #f87171", color: confirmBan.is_banned ? "#4ade80" : "#f87171", fontFamily: "'Lato',sans-serif", fontSize: 14, fontWeight: 700, opacity: procesandoBan ? 0.7 : 1 }}>
                {procesandoBan ? "..." : confirmBan.is_banned ? "Restaurar" : "Banear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajuste saldo */}
      {modalSaldo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div style={{ background: "#0a2414", border: "1px solid rgba(96,165,250,0.4)", borderRadius: 20, padding: "28px 24px", maxWidth: 320, width: "100%", fontFamily: "'Lato',sans-serif" }}>
            <div style={{ fontSize: 17, color: "#fbbf24", fontWeight: 900, marginBottom: 4 }}>Ajustar saldo</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
              Usuario: <strong style={{ color: "#e2f5e9" }}>{modalSaldo.nombre}</strong><br />
              Saldo actual: <strong style={{ color: "#4ade80" }}>${(modalSaldo.saldo || 0).toFixed(2)}</strong>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#60a5fa", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Monto a sumar/restar</label>
              <input
                type="number"
                placeholder="ej: 100 o -50"
                value={saldoValor}
                onChange={e => { setSaldoValor(e.target.value); setErrorSaldo(""); }}
                style={INPUT_STYLE}
              />
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Usá valores negativos para descontar</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#60a5fa", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Nota interna (opcional)</label>
              <input
                type="text"
                placeholder="ej: corrección manual"
                value={saldoNota}
                onChange={e => setSaldoNota(e.target.value)}
                style={INPUT_STYLE}
              />
            </div>
            {errorSaldo && <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>{errorSaldo}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModalSaldo(null)} style={{ flex: 1, padding: 11, borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#9ca3af", fontFamily: "'Lato',sans-serif", fontSize: 14 }}>Cancelar</button>
              <button onClick={ajustarSaldo} disabled={procesandoSaldo} style={{ flex: 1, padding: 11, borderRadius: 10, cursor: procesandoSaldo ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#1a3a6a,#1e4d8c)", border: "1px solid #60a5fa", color: "#60a5fa", fontFamily: "'Lato',sans-serif", fontSize: 14, fontWeight: 700, opacity: procesandoSaldo ? 0.7 : 1 }}>
                {procesandoSaldo ? "..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   TAB 2 — PARTIDAS
══════════════════════════════════════════ */
function TabPartidas() {
  const [partidas, setPartidas] = useState([]);
  const [sospechosos, setSospechosos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const [{ data: p }, { data: perfiles }] = await Promise.all([
      supabase.from("partidas").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("perfiles").select("usuario_id,nombre,avatar,partidas_jugadas,partidas_ganadas,is_banned"),
    ]);
    setPartidas(p || []);
    const sosp = (perfiles || []).filter(u =>
      u.partidas_jugadas >= 10 &&
      (u.partidas_ganadas / u.partidas_jugadas) > 0.8
    ).sort((a, b) => (b.partidas_ganadas / b.partidas_jugadas) - (a.partidas_ganadas / a.partidas_jugadas));
    setSospechosos(sosp);
    setCargando(false);
  }

  function winratePct(u) {
    return Math.round((u.partidas_ganadas / u.partidas_jugadas) * 100);
  }

  if (cargando) return <div style={{ textAlign: "center", color: "#4ade80", padding: 40 }}>Cargando partidas...</div>;

  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 20 }}>
        <StatCard label="Partidas (últimas 50)" valor={partidas.length} color="#4ade80" />
        <StatCard label="Jugadores sospechosos" valor={sospechosos.length} color="#f87171" />
      </div>

      {/* Sospechosos */}
      {sospechosos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#f87171", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            ⚠ Winrate {">"} 80% con ≥10 partidas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sospechosos.map(u => (
              <div key={u.usuario_id} style={{ ...CARD, border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 24 }}>{u.avatar || "👤"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#fbbf24" }}>{u.nombre}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      {u.partidas_jugadas} partidas · {u.partidas_ganadas} ganadas
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#f87171" }}>{winratePct(u)}%</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>winrate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas partidas */}
      <div>
        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          Últimas 50 partidas
        </div>
        {partidas.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280", padding: 30, fontSize: 13 }}>No hay partidas registradas</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {partidas.map(p => (
              <div key={p.id} style={{ ...CARD, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#e2f5e9", fontWeight: 700 }}>
                      {p.jugador1_nombre || "Jugador 1"} vs {p.jugador2_nombre || "Jugador 2"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{fecha(p.created_at)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {p.ganador_nombre && (
                      <div style={{ fontSize: 11, color: "#4ade80" }}>Ganó: {p.ganador_nombre}</div>
                    )}
                    <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>
                      {p.estado || "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   TAB 3 — FINANZAS
══════════════════════════════════════════ */
function TabFinanzas() {
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [filtro, setFiltro] = useState("todas"); // todas | pendiente | aprobado | rechazado

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from("transacciones")
      .select("*, perfiles(nombre, avatar)")
      .order("created_at", { ascending: false })
      .limit(100);
    setTransacciones(data || []);
    setCargando(false);
  }

  async function cambiarEstado(id, nuevoEstado) {
    setProcesando(id);
    await supabase.from("transacciones").update({ estado: nuevoEstado }).eq("id", id);
    setTransacciones(prev => prev.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    setProcesando(null);
  }

  const filtradas = transacciones.filter(t => filtro === "todas" || t.estado === filtro);

  const stats = {
    pendientes: transacciones.filter(t => t.estado === "pendiente").length,
    aprobados: transacciones.filter(t => t.estado === "aprobado").reduce((s, t) => s + parseFloat(t.monto), 0),
    volumen: transacciones.reduce((s, t) => s + parseFloat(t.monto), 0),
  };

  function colorEstado(estado) {
    if (estado === "aprobado") return "#4ade80";
    if (estado === "rechazado") return "#f87171";
    return "#fbbf24";
  }

  if (cargando) return <div style={{ textAlign: "center", color: "#4ade80", padding: 40 }}>Cargando transacciones...</div>;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        <StatCard label="Pendientes" valor={stats.pendientes} color="#fbbf24" />
        <StatCard label="Aprobado total" valor={`$${stats.aprobados.toFixed(0)}`} color="#4ade80" />
        <StatCard label="Volumen total" valor={`$${stats.volumen.toFixed(0)}`} color="#60a5fa" />
      </div>

      {/* Filtro */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["todas", "pendiente", "aprobado", "rechazado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
            fontFamily: "'Lato',sans-serif", border: "1px solid",
            borderColor: filtro === f ? "#4ade80" : "#2d6a4f",
            background: filtro === f ? "rgba(74,222,128,0.12)" : "rgba(0,0,0,0.3)",
            color: filtro === f ? "#4ade80" : "#6b7280",
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", padding: 30, fontSize: 13 }}>Sin transacciones</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtradas.map(t => (
            <div key={t.id} style={{ ...CARD }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 22 }}>{t.perfiles?.avatar || "👤"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24" }}>{t.perfiles?.nombre || "—"}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, border: `1px solid ${colorEstado(t.estado)}`, color: colorEstado(t.estado), background: `rgba(0,0,0,0.3)` }}>{t.estado}</span>
                    <span style={{ fontSize: 10, color: "#6b7280", background: "rgba(0,0,0,0.3)", border: "1px solid #374151", borderRadius: 4, padding: "1px 6px" }}>{t.tipo}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 900, marginTop: 3 }}>${parseFloat(t.monto).toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {fecha(t.created_at)}{t.nota ? ` · ${t.nota}` : ""}
                  </div>
                </div>
                {t.estado === "pendiente" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => cambiarEstado(t.id, "aprobado")} disabled={procesando === t.id} style={BTN_SM("#4ade80")}>
                      {procesando === t.id ? "..." : "Aprobar"}
                    </button>
                    <button onClick={() => cambiarEstado(t.id, "rechazado")} disabled={procesando === t.id} style={BTN_SM("#f87171")}>
                      {procesando === t.id ? "..." : "Rechazar"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   TAB 4 — SOPORTE
══════════════════════════════════════════ */
function TabSoporte() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [filtro, setFiltro] = useState("pendiente");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from("reportes")
      .select("*")
      .order("created_at", { ascending: false });
    setReportes(data || []);
    setCargando(false);
  }

  async function resolver(id) {
    setProcesando(id);
    await supabase.from("reportes").update({ estado: "resuelto" }).eq("id", id);
    setReportes(prev => prev.map(r => r.id === id ? { ...r, estado: "resuelto" } : r));
    setProcesando(null);
  }

  const filtrados = filtro === "todos" ? reportes : reportes.filter(r => r.estado === filtro);

  const pendientes = reportes.filter(r => r.estado === "pendiente").length;
  const resueltos = reportes.filter(r => r.estado === "resuelto").length;

  if (cargando) return <div style={{ textAlign: "center", color: "#4ade80", padding: 40 }}>Cargando reportes...</div>;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 16 }}>
        <StatCard label="Pendientes" valor={pendientes} color="#fbbf24" />
        <StatCard label="Resueltos" valor={resueltos} color="#4ade80" />
      </div>

      {/* Filtro */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["pendiente", "Pendientes"], ["resuelto", "Resueltos"], ["todos", "Todos"]].map(([val, lbl]) => (
          <button key={val} onClick={() => setFiltro(val)} style={{
            padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
            fontFamily: "'Lato',sans-serif", border: "1px solid",
            borderColor: filtro === val ? "#4ade80" : "#2d6a4f",
            background: filtro === val ? "rgba(74,222,128,0.12)" : "rgba(0,0,0,0.3)",
            color: filtro === val ? "#4ade80" : "#6b7280",
          }}>
            {lbl}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", padding: 30, fontSize: 13 }}>
          {filtro === "pendiente" ? "No hay reportes pendientes" : "Sin reportes"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map(r => (
            <div key={r.id} style={{
              ...CARD,
              background: r.estado === "resuelto" ? "rgba(74,222,128,0.02)" : "rgba(0,0,0,0.4)",
              border: `1px solid ${r.estado === "resuelto" ? "rgba(74,222,128,0.2)" : "#2d6a4f"}`,
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24" }}>{r.nombre_usuario || "Anónimo"}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, border: `1px solid ${r.estado === "resuelto" ? "#4ade80" : "#fbbf24"}`, color: r.estado === "resuelto" ? "#4ade80" : "#fbbf24" }}>{r.estado}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#e2f5e9", lineHeight: 1.6 }}>{r.mensaje}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>{fecha(r.created_at)}</div>
                </div>
                {r.estado === "pendiente" && (
                  <button onClick={() => resolver(r.id)} disabled={procesando === r.id} style={{ ...BTN_SM("#4ade80"), flexShrink: 0 }}>
                    {procesando === r.id ? "..." : "Resolver"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   TAB 5 — MÉTRICAS
══════════════════════════════════════════ */
const PROVINCIAS_ORDEN = [
  "Buenos Aires","CABA","Córdoba","Santa Fe","Mendoza","Tucumán","Entre Ríos",
  "Salta","Chaco","Corrientes","Misiones","Santiago del Estero","San Juan",
  "Jujuy","Río Negro","Neuquén","Formosa","San Luis","Catamarca","La Pampa",
  "La Rioja","Chubut","Santa Cruz","Tierra del Fuego",
];

const GENERO_LABELS = {
  masculino: "Masculino",
  femenino: "Femenino",
  no_binario: "No binario",
  otro: "Otro",
};

const PIE_COLORS = ["#60a5fa","#f472b6","#a78bfa","#fbbf24","#6b7280"];

const TOOLTIP_STYLE = {
  contentStyle: { background: "#0a2414", border: "1px solid #2d6a4f", borderRadius: 8, fontFamily: "'Lato',sans-serif", fontSize: 12, color: "#e2f5e9" },
  itemStyle: { color: "#e2f5e9" },
  cursor: { fill: "rgba(74,222,128,0.06)" },
};

function calcularEdad(fecha_nacimiento) {
  if (!fecha_nacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fecha_nacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function rangoEdad(edad) {
  if (edad === null || edad < 18) return null;
  if (edad <= 25) return "18-25";
  if (edad <= 35) return "26-35";
  if (edad <= 45) return "36-45";
  return "46+";
}

function TabMetricas() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);

    const { data: todos } = await supabase
      .from("perfiles")
      .select("provincia, fecha_nacimiento, genero, partidas_jugadas, ultimo_acceso, is_verified");

    if (!todos) { setCargando(false); return; }

    const verificados = todos.filter(p => p.is_verified);
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activos = todos.filter(p => p.ultimo_acceso && new Date(p.ultimo_acceso) >= hace7dias).length;
    const totalPartidas = todos.reduce((s, p) => s + (p.partidas_jugadas || 0), 0);

    // Province distribution
    const provCount = {};
    verificados.forEach(p => {
      if (p.provincia) provCount[p.provincia] = (provCount[p.provincia] || 0) + 1;
    });
    const provincias = PROVINCIAS_ORDEN
      .filter(pr => provCount[pr])
      .map(pr => ({ name: pr, value: provCount[pr] }))
      .sort((a, b) => b.value - a.value);

    // Age distribution
    const ageCount = { "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 };
    verificados.forEach(p => {
      const rango = rangoEdad(calcularEdad(p.fecha_nacimiento));
      if (rango) ageCount[rango]++;
    });
    const edades = Object.entries(ageCount).map(([name, value]) => ({ name, value }));

    // Gender distribution
    const genCount = {};
    verificados.forEach(p => {
      const g = p.genero && GENERO_LABELS[p.genero] ? GENERO_LABELS[p.genero] : "No especifica";
      genCount[g] = (genCount[g] || 0) + 1;
    });
    const generos = Object.entries(genCount).map(([name, value]) => ({ name, value }));

    setData({
      totalRegistrados: todos.length,
      totalVerificados: verificados.length,
      activos7dias: activos,
      totalPartidas,
      provincias,
      edades,
      generos,
    });
    setCargando(false);
  }

  if (cargando) return <div style={{ textAlign: "center", color: "#4ade80", padding: 40 }}>Cargando métricas...</div>;
  if (!data) return <div style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>Sin datos</div>;

  const sinDemograficos = data.totalVerificados === 0;

  return (
    <>
      {/* Stats generales */}
      <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Estadísticas generales</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 24 }}>
        <StatCard label="Registrados" valor={data.totalRegistrados} color="#4ade80" />
        <StatCard label="Verificados" valor={data.totalVerificados} color="#60a5fa" />
        <StatCard label="Activos (7 días)" valor={data.activos7dias} color="#fbbf24" />
        <StatCard label="Partidas jugadas" valor={data.totalPartidas} color="#a78bfa" />
      </div>

      {sinDemograficos ? (
        <div style={{ textAlign: "center", color: "#6b7280", padding: 32, fontSize: 13, background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid #2d6a4f" }}>
          Aún no hay usuarios verificados con datos demográficos
        </div>
      ) : (
        <>
          {/* Distribución por provincia */}
          {data.provincias.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Distribución por provincia
              </div>
              <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid #2d6a4f", borderRadius: 12, padding: "16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={Math.max(180, data.provincias.length * 28)}>
                  <BarChart data={data.provincias} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, "Usuarios"]} />
                    <Bar dataKey="value" fill="#4ade80" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Distribución por edad */}
          {data.edades.some(e => e.value > 0) && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Distribución por edad
              </div>
              <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid #2d6a4f", borderRadius: 12, padding: "16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.edades} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, "Usuarios"]} />
                    <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Distribución por género */}
          {data.generos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Distribución por género
              </div>
              <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid #2d6a4f", borderRadius: 12, padding: "16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.generos}
                      cx="50%"
                      cy="45%"
                      outerRadius={75}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: "#4b5563" }}
                    >
                      {data.generos.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE.contentStyle}
                      itemStyle={TOOLTIP_STYLE.itemStyle}
                      formatter={(v, name) => [v + " usuarios", name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   ADMIN ROOT
══════════════════════════════════════════ */
const TABS = [
  { id: "usuarios", label: "Usuarios" },
  { id: "partidas", label: "Partidas" },
  { id: "finanzas", label: "Finanzas" },
  { id: "soporte", label: "Soporte" },
  { id: "metricas", label: "Métricas" },
];

export default function Admin({ onVolver }) {
  const [tab, setTab] = useState("usuarios");

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)", fontFamily: "'Lato', sans-serif", color: "#e2f5e9" }}>

      {/* Header sticky */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0", position: "sticky", top: 0, background: "rgba(5,15,8,0.96)", backdropFilter: "blur(8px)", zIndex: 10, borderBottom: "1px solid rgba(45,106,79,0.4)" }}>
        <div style={{ paddingBottom: 14 }}>
          <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Online</div>
          <div style={{ fontSize: 19, color: "#fbbf24", fontWeight: 900 }}>Panel de administrador</div>
        </div>
        <button onClick={onVolver} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 8, padding: "8px 14px", color: "#4ade80", fontSize: 13, cursor: "pointer", fontFamily: "'Lato',sans-serif", marginBottom: 14 }}>
          ← Volver
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(45,106,79,0.3)", background: "rgba(5,15,8,0.92)", position: "sticky", top: 57, zIndex: 9 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "11px 2px", border: "none", background: "none",
            cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
            color: tab === t.id ? "#4ade80" : "#4b5563",
            borderBottom: tab === t.id ? "2px solid #4ade80" : "2px solid transparent",
            transition: "color 0.15s, border-color 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px", maxWidth: 640, margin: "0 auto" }}>
        {tab === "usuarios" && <TabUsuarios />}
        {tab === "partidas" && <TabPartidas />}
        {tab === "finanzas" && <TabFinanzas />}
        {tab === "soporte" && <TabSoporte />}
        {tab === "metricas" && <TabMetricas />}
      </div>

    </div>
  );
}
