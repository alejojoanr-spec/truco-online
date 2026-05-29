import { useState, useEffect, useRef } from "react";
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
  background: `rgba(${
    color === "#4ade80" ? "74,222,128" :
    color === "#f87171" ? "248,113,113" :
    color === "#fb923c" ? "251,146,60" :
    "96,165,250"
  },0.08)`,
  border: `1px solid ${color}`, color,
});
const INPUT_STYLE = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.5)",
  color: "#ffffff", fontFamily: "'Lato',sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};

function StatCard({ label, valor, color = "#4ade80", onClick, activo }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...CARD, textAlign: "center", padding: "12px 8px",
        ...(onClick ? { cursor: "pointer" } : {}),
        ...(activo ? {
          border: `1px solid ${color}`,
          background: `rgba(${
            color === "#4ade80" ? "74,222,128" :
            color === "#60a5fa" ? "96,165,250" :
            color === "#f87171" ? "248,113,113" :
            color === "#fbbf24" ? "251,191,36" : "74,222,128"
          },0.12)`,
        } : {}),
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{valor}</div>
      <div style={{ fontSize: 11, color: activo ? color : "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function fecha(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function fechaHora(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

const TIPO_LABEL = {
  deposito: "Depósito",
  retiro: "Retiro",
  ajuste: "Ajuste manual",
  premio: "Ganancia de partida",
  apuesta: "Apuesta",
};
const TIPO_SIGNO_POSITIVO = new Set(["deposito", "premio"]);

/* ══════════════════════════════════════════
   TAB 1 — USUARIOS
══════════════════════════════════════════ */
function TabUsuarios({ rol, ejecutadoPor, usuarioId }) {
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
  const [mostrarBtnTicket, setMostrarBtnTicket] = useState(false);
  const [modalMovimientos, setModalMovimientos] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMov, setCargandoMov] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const { data, error, status, statusText } = await supabase
      .from("perfiles")
      .select("*")
      .order("nombre", { ascending: true });
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
    if (rol === 'asesor' && modalSaldo.usuario_id === usuarioId) { setErrorSaldo("No podés ajustar tu propio saldo."); return; }
    if (rol === 'asesor' && Math.abs(monto) > 50000) { setErrorSaldo("Superás el límite máximo por operación."); setMostrarBtnTicket(true); return; }
    const saldoAnterior = modalSaldo.saldo || 0;
    if (saldoAnterior + monto < 0) { setErrorSaldo("El saldo no puede quedar en negativo."); return; }
    setProcesandoSaldo(true); setErrorSaldo("");
    const nuevoSaldo = saldoAnterior + monto;
    const { error } = await supabase.from("perfiles").update({ saldo: nuevoSaldo }).eq("usuario_id", modalSaldo.usuario_id);
    if (error) { console.error("[Admin] ajustarSaldo error:", error); setErrorSaldo(`No se pudo ajustar el saldo. (${error.message})`); setProcesandoSaldo(false); return; }
    await supabase.from("transacciones").insert({
      usuario_id: modalSaldo.usuario_id,
      tipo: "ajuste",
      monto,
      estado: "aprobado",
      nota: saldoNota.trim() || null,
      ejecutado_por: ejecutadoPor || null,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: nuevoSaldo,
    });
    setUsuarios(prev => prev.map(u => u.usuario_id === modalSaldo.usuario_id ? { ...u, saldo: nuevoSaldo } : u));
    setModalSaldo(null); setSaldoValor(""); setSaldoNota(""); setMostrarBtnTicket(false);
    setProcesandoSaldo(false);
  }

  async function solicitarAutorizacion() {
    const monto = parseFloat(saldoValor);
    const { error } = await supabase.from("tickets_internos").insert({
      creado_por: ejecutadoPor,
      usuario_afectado_id: modalSaldo.usuario_id,
      monto: Math.abs(monto),
      descripcion: `Solicitud de autorización: ${ejecutadoPor} solicita ajuste de ${monto >= 0 ? '+' : ''}$${monto.toFixed(2)} en usuario ${modalSaldo.nombre}${saldoNota.trim() ? `. Nota: ${saldoNota.trim()}` : ''}.`,
      estado: 'pendiente',
    });
    if (error) { setErrorSaldo("No se pudo crear el ticket. Intentá de nuevo."); return; }
    setErrorSaldo("✓ Ticket enviado. El administrador revisará tu solicitud.");
    setMostrarBtnTicket(false);
  }

  async function cambiarRol(usuario_id, nuevoRol) {
    const { error } = await supabase.from("perfiles").update({ rol: nuevoRol }).eq("usuario_id", usuario_id);
    if (!error) {
      setUsuarios(prev => prev.map(u => u.usuario_id === usuario_id ? { ...u, rol: nuevoRol } : u));
    }
  }

  async function abrirMovimientos(u) {
    setModalMovimientos(u);
    setMovimientos([]);
    setCargandoMov(true);
    const { data } = await supabase
      .from("transacciones")
      .select("*")
      .eq("usuario_id", u.usuario_id)
      .order("created_at", { ascending: false });
    setMovimientos(data || []);
    setCargandoMov(false);
  }

  const [filtroStats, setFiltroStats] = useState(null); // null | 'verificados' | 'baneados' | 'novedades'

  function toggleFiltroStats(clave) { setFiltroStats(f => f === clave ? null : clave); }

  const filtrados = usuarios.filter(u => {
    if (filtroStats === 'verificados' && !u.is_verified) return false;
    if (filtroStats === 'baneados' && !u.is_banned) return false;
    if (filtroStats === 'novedades' && !u.recibe_novedades) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.trim();
    const esNumero = /^\d+/.test(q);
    if (esNumero) return u.dni?.includes(q);
    const ql = q.toLowerCase();
    return u.nombre?.toLowerCase().includes(ql) || u.email?.toLowerCase().includes(ql) || u.dni?.includes(q);
  });

  const stats = {
    total: usuarios.length,
    verificados: usuarios.filter(u => u.is_verified).length,
    baneados: usuarios.filter(u => u.is_banned).length,
    novedades: usuarios.filter(u => u.recibe_novedades).length,
  };

  function exportarEmailsMarketing() {
    const suscriptores = usuarios.filter(u => u.recibe_novedades && u.email);
    if (!suscriptores.length) { alert("No hay usuarios suscritos a novedades."); return; }
    const filas = suscriptores.map(u => `"${(u.nombre || "").replace(/"/g, '""')}","${u.email.replace(/"/g, '""')}"`);
    const csv = "Nombre,Email\n" + filas.join("\n");
    const blob = new Blob(["﻿" + csv, ""], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suscriptores_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function winrate(u) {
    if (!u.partidas_jugadas) return "—";
    return Math.round((u.partidas_ganadas / u.partidas_jugadas) * 100) + "%";
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 8 }}>
        <StatCard label="Usuarios" valor={stats.total} color="#4ade80" onClick={() => setFiltroStats(null)} activo={filtroStats === null} />
        <StatCard label="Verificados" valor={stats.verificados} color="#60a5fa" onClick={() => toggleFiltroStats('verificados')} activo={filtroStats === 'verificados'} />
        <StatCard label="Baneados" valor={stats.baneados} color="#f87171" onClick={() => toggleFiltroStats('baneados')} activo={filtroStats === 'baneados'} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <StatCard label="Suscritos a novedades" valor={stats.novedades} color="#fbbf24" onClick={() => toggleFiltroStats('novedades')} activo={filtroStats === 'novedades'} />
        </div>
        <button
          onClick={exportarEmailsMarketing}
          style={{
            ...BTN_SM("#fbbf24"),
            padding: "10px 14px", fontSize: 12, whiteSpace: "nowrap", height: "100%",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          type="text" placeholder="Buscar por nombre, email o DNI..."
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
                    <span
                      onClick={() => abrirMovimientos(u)}
                      style={{ fontSize: 14, fontWeight: 900, color: u.is_banned ? "#f87171" : "#fbbf24", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}
                    >{u.nombre}</span>
                    {u.is_verified && <span style={{ fontSize: 10, background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.35)", borderRadius: 4, padding: "1px 6px", color: "#60a5fa", fontWeight: 700 }}>✓ Verificado</span>}
                    {u.is_banned && <span style={{ fontSize: 10, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 4, padding: "1px 6px", color: "#f87171", fontWeight: 700 }}>Baneado</span>}
                    {u.rol === 'asesor' && <span style={{ fontSize: 10, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 4, padding: "1px 6px", color: "#a78bfa", fontWeight: 700 }}>Asesor</span>}
                    {u.recibe_novedades && <span style={{ fontSize: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 4, padding: "1px 6px", color: "#fbbf24", fontWeight: 700 }}>📧 Novedades</span>}
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
                    {u.dni && <><span>·</span><span style={{ color: "#6b7280" }}>DNI: {u.dni}</span></>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => abrirMovimientos(u)} style={BTN_SM("#a78bfa")}>
                    Historial
                  </button>
                  <button onClick={() => { setModalSaldo(u); setSaldoValor(""); setSaldoNota(""); setErrorSaldo(""); }} style={BTN_SM("#60a5fa")}>
                    Saldo
                  </button>
                  {rol !== 'asesor' && (
                    <button onClick={() => { setErrorBan(""); setConfirmBan(u); }} style={BTN_SM(u.is_banned ? "#4ade80" : "#f87171")}>
                      {u.is_banned ? "Desbanear" : "Banear"}
                    </button>
                  )}
                  {rol === 'admin' && u.rol !== 'admin' && (
                    <button onClick={() => cambiarRol(u.usuario_id, u.rol === 'asesor' ? 'usuario' : 'asesor')} style={BTN_SM("#fb923c")}>
                      {u.rol === 'asesor' ? 'Quitar asesor' : 'Asesor'}
                    </button>
                  )}
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

      {/* Modal historial de movimientos */}
      {modalMovimientos && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 60, padding: "16px 16px 32px", overflowY: "auto" }}>
          <div style={{ background: "radial-gradient(ellipse at top,#0f2d1a 0%,#050f08 100%)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 20, padding: "24px", width: "100%", maxWidth: 480, fontFamily: "'Lato',sans-serif", marginTop: 16 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: 3, textTransform: "uppercase" }}>Historial</div>
                <div style={{ fontSize: 17, color: "#fbbf24", fontWeight: 900 }}>
                  {modalMovimientos.avatar || "👤"} {modalMovimientos.nombre}
                </div>
              </div>
              <button onClick={() => setModalMovimientos(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #374151", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#9ca3af", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {cargandoMov ? (
              <div style={{ textAlign: "center", color: "#a78bfa", padding: 40 }}>Cargando movimientos...</div>
            ) : movimientos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Sin movimientos registrados</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {movimientos.map(m => {
                  const esPositivo = m.tipo === 'ajuste' ? parseFloat(m.monto) >= 0 : TIPO_SIGNO_POSITIVO.has(m.tipo);
                  const colorMonto = esPositivo ? "#4ade80" : "#f87171";
                  const signo = esPositivo ? "+" : "−";
                  const montoAbs = Math.abs(parseFloat(m.monto)).toFixed(2);
                  const tipoLabel = TIPO_LABEL[m.tipo] || m.tipo;
                  return (
                    <div key={m.id} style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${esPositivo ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
                        {esPositivo ? "💚" : "🔴"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: colorMonto }}>
                            {signo}${montoAbs}
                          </span>
                          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: "rgba(0,0,0,0.4)", border: `1px solid ${esPositivo ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, color: esPositivo ? "#4ade80" : "#f87171", fontWeight: 700 }}>
                            {tipoLabel}
                          </span>
                          {m.estado && m.estado !== "aprobado" && (
                            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: "rgba(0,0,0,0.4)", border: `1px solid ${m.estado === "pendiente" ? "rgba(251,191,36,0.4)" : "rgba(107,114,128,0.4)"}`, color: m.estado === "pendiente" ? "#fbbf24" : "#6b7280" }}>
                              {m.estado}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{fechaHora(m.created_at)}</div>
                        {m.nota && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3, fontStyle: "italic" }}>"{m.nota}"</div>
                        )}
                        {m.tipo === 'ajuste' && m.ejecutado_por && (
                          <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 3 }}>Por: {m.ejecutado_por}</div>
                        )}
                        {m.tipo === 'ajuste' && m.saldo_anterior != null && m.saldo_nuevo != null && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>${Number(m.saldo_anterior).toFixed(2)} → ${Number(m.saldo_nuevo).toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
                onChange={e => { setSaldoValor(e.target.value); setErrorSaldo(""); setMostrarBtnTicket(false); }}
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
            {errorSaldo && (
              <div style={{ fontSize: 12, color: mostrarBtnTicket ? "#fbbf24" : errorSaldo.startsWith("✓") ? "#4ade80" : "#f87171", background: mostrarBtnTicket ? "rgba(251,191,36,0.06)" : errorSaldo.startsWith("✓") ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.08)", border: `1px solid ${mostrarBtnTicket ? "rgba(251,191,36,0.3)" : errorSaldo.startsWith("✓") ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.2)"}`, borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                {errorSaldo}
                {mostrarBtnTicket && (
                  <button onClick={solicitarAutorizacion} style={{ display: "block", marginTop: 8, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Lato',sans-serif", background: "rgba(251,191,36,0.1)", border: "1px solid #fbbf24", color: "#fbbf24" }}>
                    Solicitar autorización
                  </button>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setModalSaldo(null); setMostrarBtnTicket(false); }} style={{ flex: 1, padding: 11, borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid #374151", color: "#9ca3af", fontFamily: "'Lato',sans-serif", fontSize: 14 }}>Cancelar</button>
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
  const [partidas, setPartidas]     = useState([]);
  const [sospechosos, setSospechosos] = useState([]);
  const [rakeMap, setRakeMap]       = useState({});
  const [cargando, setCargando]     = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [partidaSel, setPartidaSel] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const [{ data: p }, { data: perfiles }, { data: rakeTxs }] = await Promise.all([
      supabase.from("partidas").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("perfiles").select("usuario_id,nombre,avatar,partidas_jugadas,partidas_ganadas,is_banned"),
      supabase.from("transacciones").select("monto,nota").eq("tipo", "rake"),
    ]);
    setPartidas(p || []);

    const rm = {};
    (rakeTxs || []).forEach(t => {
      if (t.nota?.startsWith("Partida ")) {
        const cod = t.nota.replace("Partida ", "").trim();
        if (cod) rm[cod] = (rm[cod] || 0) + parseFloat(t.monto);
      }
    });
    setRakeMap(rm);

    const sosp = (perfiles || []).filter(u =>
      u.partidas_jugadas >= 10 && (u.partidas_ganadas / u.partidas_jugadas) > 0.8
    ).sort((a, b) => (b.partidas_ganadas / b.partidas_jugadas) - (a.partidas_ganadas / a.partidas_jugadas));
    setSospechosos(sosp);
    setCargando(false);
  }

  const esEnJuego   = p => p.estado === "jugando" && !p.ganador_id;
  const esFinalizada = p => !!p.ganador_id;
  const winratePct  = u => Math.round((u.partidas_ganadas / u.partidas_jugadas) * 100);

  const stats = {
    total:     partidas.length,
    enJuego:   partidas.filter(esEnJuego).length,
    rakeTotal: Object.values(rakeMap).reduce((s, v) => s + v, 0),
  };

  const filtradas = partidas.filter(p => {
    if (filtroEstado === "jugando")    return esEnJuego(p);
    if (filtroEstado === "finalizada") return esFinalizada(p);
    return true;
  });

  const BACK_BTN = { display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#4ade80", cursor:"pointer", fontSize:13, fontFamily:"'Lato',sans-serif", marginBottom:16, padding:0 };
  const BACK_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;

  /* ── Detalle de partida ── */
  if (partidaSel) {
    const rake = rakeMap[partidaSel.codigo] || 0;
    const finalizada = esFinalizada(partidaSel);
    const enJuego    = esEnJuego(partidaSel);
    const statusColor = finalizada ? "#4ade80" : enJuego ? "#60a5fa" : "#fbbf24";
    const statusLabel = finalizada ? "Finalizada" : enJuego ? "En juego" : "Esperando";
    return (
      <>
        <button onClick={() => setPartidaSel(null)} style={BACK_BTN}>{BACK_ICON} Volver a partidas</button>
        <div style={{ fontSize:11, color:"#4ade80", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Detalle de partida</div>

        <div style={{ ...CARD, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#6b7280" }}>Código: <strong style={{ color:"#9ca3af" }}>{partidaSel.codigo || "—"}</strong></div>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, border:`1px solid ${statusColor}`, color:statusColor, fontWeight:700 }}>{statusLabel}</span>
          </div>

          {/* Jugadores */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:28 }}>{partidaSel.jugador1_avatar || "👤"}</div>
              <div style={{ fontSize:13, fontWeight:900, marginTop:4, color: partidaSel.ganador_id === partidaSel.jugador1_id ? "#fbbf24" : "#e2f5e9" }}>
                {partidaSel.jugador1_nombre || "—"}
              </div>
              {partidaSel.ganador_id === partidaSel.jugador1_id && (
                <div style={{ fontSize:11, color:"#fbbf24", marginTop:2 }}>🏆 Ganador</div>
              )}
            </div>
            <div style={{ fontSize:13, fontWeight:900, color:"#4b5563" }}>VS</div>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:28 }}>{partidaSel.jugador2_avatar || "👤"}</div>
              <div style={{ fontSize:13, fontWeight:900, marginTop:4, color: partidaSel.ganador_id === partidaSel.jugador2_id ? "#fbbf24" : "#e2f5e9" }}>
                {partidaSel.jugador2_nombre || "—"}
              </div>
              {partidaSel.ganador_id === partidaSel.jugador2_id && (
                <div style={{ fontSize:11, color:"#fbbf24", marginTop:2 }}>🏆 Ganador</div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:"#6b7280" }}>Apuesta</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#4ade80", marginTop:4 }}>
                {(partidaSel.apuesta || 0) > 0 ? `$${parseFloat(partidaSel.apuesta).toFixed(2)}` : "Sin apuesta"}
              </div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:"#6b7280" }}>Pozo total</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#fbbf24", marginTop:4 }}>
                {(partidaSel.apuesta || 0) > 0 ? `$${(parseFloat(partidaSel.apuesta) * 2).toFixed(2)}` : "—"}
              </div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:"#6b7280" }}>Rake cobrado</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#a78bfa", marginTop:4 }}>
                {rake > 0 ? `$${rake.toFixed(2)}` : "—"}
              </div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:"#6b7280" }}>Fecha</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#9ca3af", marginTop:4 }}>{fechaHora(partidaSel.created_at)}</div>
            </div>
          </div>

          {/* Sospechoso warning */}
          {(finalizada && partidaSel.ganador_id &&
            sospechosos.some(s => s.usuario_id === partidaSel.ganador_id)) && (
            <div style={{ marginTop:12, padding:"8px 12px", borderRadius:8, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.3)", fontSize:12, color:"#f87171" }}>
              ⚠️ El ganador tiene winrate sospechoso (&gt;80%)
            </div>
          )}
        </div>
      </>
    );
  }

  if (cargando) return <div style={{ textAlign:"center", color:"#4ade80", padding:40 }}>Cargando partidas...</div>;

  return (
    <>
      {/* Stats clickeables */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
        <StatCard label="Total" valor={stats.total} color="#4ade80"
          onClick={() => setFiltroEstado("todas")} activo={filtroEstado === "todas"} />
        <StatCard label="En juego" valor={stats.enJuego} color="#60a5fa"
          onClick={() => setFiltroEstado(f => f === "jugando" ? "todas" : "jugando")} activo={filtroEstado === "jugando"} />
        <StatCard label="Rake total" valor={`$${stats.rakeTotal.toFixed(0)}`} color="#a78bfa" />
      </div>

      {/* Alerta sospechosos */}
      {sospechosos.length > 0 && (
        <button
          onClick={() => setFiltroEstado(f => f === "sospechosos" ? "todas" : "sospechosos")}
          style={{ width:"100%", marginBottom:14, ...CARD, cursor:"pointer", textAlign:"left",
            border:`1px solid ${filtroEstado === "sospechosos" ? "#f87171" : "rgba(248,113,113,0.4)"}`,
            background: filtroEstado === "sospechosos" ? "rgba(248,113,113,0.08)" : "rgba(248,113,113,0.03)",
            display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"'Lato',sans-serif",
            padding:"10px 14px",
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span>⚠️</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#f87171" }}>
                {sospechosos.length} jugador{sospechosos.length > 1 ? "es" : ""} con winrate sospechoso
              </div>
              <div style={{ fontSize:11, color:"#6b7280", marginTop:1 }}>Winrate &gt; 80% con ≥10 partidas</div>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={filtroEstado === "sospechosos" ? "#f87171" : "#4b5563"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      {/* Lista sospechosos */}
      {filtroEstado === "sospechosos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {sospechosos.map(u => (
            <div key={u.usuario_id} style={{ ...CARD, border:"1px solid rgba(248,113,113,0.35)", background:"rgba(248,113,113,0.04)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontSize:24 }}>{u.avatar || "👤"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:900, color:"#fbbf24" }}>{u.nombre}</div>
                  <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>
                    {u.partidas_jugadas} partidas · {u.partidas_ganadas} ganadas
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:"#f87171" }}>{winratePct(u)}%</div>
                  <div style={{ fontSize:10, color:"#6b7280" }}>winrate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + lista de partidas */}
      {filtroEstado !== "sospechosos" && (
        <>
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {[["todas","Todas"], ["jugando","En juego"], ["finalizada","Finalizadas"]].map(([v, label]) => (
              <button key={v} onClick={() => setFiltroEstado(v)} style={{
                flex:1, padding:"7px 4px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700,
                fontFamily:"'Lato',sans-serif",
                border:`1px solid ${filtroEstado === v ? "#4ade80" : "#2d6a4f"}`,
                background: filtroEstado === v ? "rgba(74,222,128,0.1)" : "rgba(0,0,0,0.3)",
                color: filtroEstado === v ? "#4ade80" : "#6b7280",
              }}>
                {label}
              </button>
            ))}
          </div>

          {filtradas.length === 0 ? (
            <div style={{ textAlign:"center", color:"#6b7280", padding:30, fontSize:13 }}>
              {filtroEstado === "jugando" ? "No hay partidas en curso" :
               filtroEstado === "finalizada" ? "No hay partidas finalizadas" :
               "No hay partidas registradas"}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {filtradas.map(p => {
                const rake = rakeMap[p.codigo] || 0;
                const finalizada = esFinalizada(p);
                const enJuego    = esEnJuego(p);
                const statusColor = finalizada ? "#4ade80" : enJuego ? "#60a5fa" : "#fbbf24";
                const statusLabel = finalizada ? "Finalizada" : enJuego ? "En juego" : "Esperando";
                const ganadorSosp = finalizada && sospechosos.some(s => s.usuario_id === p.ganador_id);
                return (
                  <div key={p.id} onClick={() => setPartidaSel(p)}
                    style={{ ...CARD, padding:"10px 14px", cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#4ade80"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#2d6a4f"}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          <span style={{ fontSize:13, fontWeight:700, color:"#e2f5e9" }}>
                            {p.jugador1_nombre || "—"} vs {p.jugador2_nombre || "—"}
                          </span>
                          <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, border:`1px solid ${statusColor}`, color:statusColor }}>
                            {statusLabel}
                          </span>
                          {ganadorSosp && <span style={{ fontSize:11 }}>⚠️</span>}
                        </div>
                        <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
                          <span style={{ fontSize:11, color:"#6b7280" }}>{fechaHora(p.created_at)}</span>
                          {(p.apuesta || 0) > 0 && (
                            <span style={{ fontSize:11, color:"#fbbf24" }}>Apuesta: ${parseFloat(p.apuesta).toFixed(2)}</span>
                          )}
                          {rake > 0 && (
                            <span style={{ fontSize:11, color:"#a78bfa" }}>Rake: ${rake.toFixed(2)}</span>
                          )}
                        </div>
                        {finalizada && p.ganador_nombre && (
                          <div style={{ fontSize:11, color:"#4ade80", marginTop:3 }}>Ganó: {p.ganador_nombre}</div>
                        )}
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:3 }}><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   TAB 3 — FINANZAS
══════════════════════════════════════════ */
function RakeConfig() {
  const [valor, setValor] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [valorEdit, setValorEdit] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("configuracion").select("valor").eq("clave", "rake_porcentaje").single();
      setValor(data?.valor || "5");
      setCargando(false);
    })();
  }, []);

  async function guardar() {
    const num = parseFloat(valorEdit);
    if (isNaN(num) || num < 0 || num > 100) return;
    setGuardando(true);
    await supabase.from("configuracion").upsert({ clave: "rake_porcentaje", valor: String(num) });
    setValor(String(num));
    setEditando(false);
    setGuardando(false);
  }

  if (cargando) return <div style={{ color: "#4ade80", fontSize: 13 }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Rake por partida</div>
        {editando ? (
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
            <input
              type="number" min="0" max="100" step="0.5"
              value={valorEdit}
              onChange={e => setValorEdit(e.target.value)}
              style={{ ...INPUT_STYLE, width: 80, padding: "8px 10px" }}
            />
            <span style={{ color: "#9ca3af", fontSize: 13 }}>%</span>
            <button onClick={guardar} disabled={guardando} style={BTN_SM("#4ade80")}>
              {guardando ? "..." : "Guardar"}
            </button>
            <button onClick={() => setEditando(false)} style={BTN_SM("#f87171")}>
              Cancelar
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 26, fontWeight: 900, color: "#4ade80", marginTop: 4 }}>{valor}%</div>
        )}
      </div>
      {!editando && (
        <button onClick={() => { setValorEdit(valor); setEditando(true); }} style={BTN_SM("#60a5fa")}>
          Editar
        </button>
      )}
    </div>
  );
}

function TabFinanzas() {
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [filtro, setFiltro] = useState("todas"); // todas | pendiente | aprobado | rechazado
  const [rakeStats, setRakeStats] = useState({ hoy: 0, semana: 0, mes: 0, anio: 0 });
  const [periodoRake, setPeriodoRake] = useState("semana");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const { data: txs, error } = await supabase
      .from("transacciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) { console.error("[TabFinanzas] cargar error:", error); setCargando(false); return; }

    const ids = [...new Set((txs || []).map(t => t.usuario_id).filter(Boolean))];
    let perfilesMap = {};
    if (ids.length > 0) {
      const { data: perfs } = await supabase
        .from("perfiles")
        .select("usuario_id, nombre, avatar")
        .in("usuario_id", ids);
      if (perfs) perfilesMap = Object.fromEntries(perfs.map(p => [p.usuario_id, p]));
    }

    setTransacciones((txs || []).map(t => ({ ...t, perfiles: perfilesMap[t.usuario_id] || null })));

    // Rake stats (fetch from start of year to cover all periods)
    const ahora = new Date();
    const anioInicio = new Date(ahora.getFullYear(), 0, 1).toISOString();
    const { data: rakeTxs } = await supabase
      .from("transacciones")
      .select("monto, created_at")
      .eq("tipo", "rake")
      .gte("created_at", anioInicio);
    if (rakeTxs) {
      const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
      const semanaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
      const sum = (desde) => rakeTxs
        .filter(t => new Date(t.created_at) >= new Date(desde))
        .reduce((s, t) => s + parseFloat(t.monto), 0);
      setRakeStats({
        hoy: sum(hoyInicio),
        semana: sum(semanaInicio),
        mes: sum(mesInicio),
        anio: rakeTxs.reduce((s, t) => s + parseFloat(t.monto), 0),
      });
    }

    setCargando(false);
  }

  async function cambiarEstado(id, nuevoEstado) {
    setProcesando(id);
    const { error } = await supabase.from("transacciones").update({ estado: nuevoEstado }).eq("id", id);
    if (error) { console.error("[TabFinanzas] cambiarEstado error:", error); setProcesando(null); return; }

    if (nuevoEstado === 'aprobado') {
      const tx = transacciones.find(t => t.id === id);
      if (tx && tx.tipo === 'retiro' && tx.usuario_id) {
        const { data: perfil } = await supabase
          .from("perfiles").select("saldo").eq("usuario_id", tx.usuario_id).single();
        if (perfil) {
          const nuevoSaldo = (perfil.saldo || 0) - parseFloat(tx.monto);
          await supabase.from("perfiles").update({ saldo: nuevoSaldo }).eq("usuario_id", tx.usuario_id);
        }
      }
    }

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
      {/* Rake stats widget */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#a78bfa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Rake cobrado</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {[["hoy", "Hoy"], ["semana", "Semana"], ["mes", "Mes"], ["anio", "Año"]].map(([p, label]) => (
            <button key={p} onClick={() => setPeriodoRake(p)} style={{
              flex: 1, padding: "5px 2px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700,
              fontFamily: "'Lato',sans-serif",
              border: `1px solid ${periodoRake === p ? "#a78bfa" : "#2d6a4f"}`,
              background: periodoRake === p ? "rgba(167,139,250,0.12)" : "rgba(0,0,0,0.3)",
              color: periodoRake === p ? "#a78bfa" : "#6b7280",
            }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#a78bfa", textAlign: "center" }}>
          ${rakeStats[periodoRake].toFixed(2)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        <StatCard label="Pendientes" valor={stats.pendientes} color="#fbbf24" onClick={() => setFiltro(f => f === "pendiente" ? "todas" : "pendiente")} activo={filtro === "pendiente"} />
        <StatCard label="Aprobado total" valor={`$${stats.aprobados.toFixed(0)}`} color="#4ade80" onClick={() => setFiltro(f => f === "aprobado" ? "todas" : "aprobado")} activo={filtro === "aprobado"} />
        <StatCard label="Volumen total" valor={`$${stats.volumen.toFixed(0)}`} color="#60a5fa" onClick={() => setFiltro("todas")} activo={filtro === "todas"} />
      </div>

      {/* Filtro rechazado */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button onClick={() => setFiltro(f => f === "rechazado" ? "todas" : "rechazado")} style={{
          padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
          fontFamily: "'Lato',sans-serif", border: "1px solid",
          borderColor: filtro === "rechazado" ? "#f87171" : "#2d6a4f",
          background: filtro === "rechazado" ? "rgba(248,113,113,0.12)" : "rgba(0,0,0,0.3)",
          color: filtro === "rechazado" ? "#f87171" : "#6b7280",
        }}>
          Ver rechazados
        </button>
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
                  <div style={{ fontSize: 12, fontWeight: 900, marginTop: 3, color: t.tipo === 'ajuste' ? (parseFloat(t.monto) >= 0 ? "#4ade80" : "#f87171") : t.tipo === 'rake' ? "#a78bfa" : "#4ade80" }}>
                    {t.tipo === 'ajuste' ? (parseFloat(t.monto) >= 0 ? `+$${parseFloat(t.monto).toFixed(2)}` : `−$${Math.abs(parseFloat(t.monto)).toFixed(2)}`) : `$${parseFloat(t.monto).toFixed(2)}`}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {fechaHora(t.created_at)}{t.nota ? ` · ${t.nota}` : ""}
                  </div>
                  {t.tipo === 'ajuste' && t.ejecutado_por && (
                    <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>Por: {t.ejecutado_por}</div>
                  )}
                  {t.tipo === 'ajuste' && t.saldo_anterior != null && t.saldo_nuevo != null && (
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>${Number(t.saldo_anterior).toFixed(2)} → ${Number(t.saldo_nuevo).toFixed(2)}</div>
                  )}
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

      {/* Rake configuration */}
      <div style={{ ...CARD, marginTop: 20 }}>
        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Configuración de comisiones</div>
        <RakeConfig />
      </div>
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
        <StatCard label="Pendientes" valor={pendientes} color="#fbbf24" onClick={() => setFiltro(f => f === "pendiente" ? "todos" : "pendiente")} activo={filtro === "pendiente"} />
        <StatCard label="Resueltos" valor={resueltos} color="#4ade80" onClick={() => setFiltro(f => f === "resuelto" ? "todos" : "resuelto")} activo={filtro === "resuelto"} />
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

const GENERO_COLORS = {
  "Masculino":    "#60a5fa",
  "Femenino":     "#f472b6",
  "No binario":   "#4ade80",
  "Otro":         "#fbbf24",
  "No especifica":"#fbbf24",
};

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
                      {data.generos.map((entry, i) => (
                        <Cell key={i} fill={GENERO_COLORS[entry.name] ?? "#6b7280"} />
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
   TAB 6 — EQUIPO (tickets + chat)
══════════════════════════════════════════ */

function localHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function rangoLocal(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const inicio = new Date(y, m-1, d, 0, 0, 0, 0);
  const fin    = new Date(y, m-1, d+1, 0, 0, 0, 0);
  return [inicio.toISOString(), fin.toISOString()];
}

function soloHora(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function BurbujaMensaje({ m, esPropio }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth:"85%" }}>
        {!esPropio && (
          <div style={{ fontSize:10, color:"#fbbf24", fontWeight:700, marginBottom:2, paddingLeft:4 }}>
            {m.autor}
          </div>
        )}
        <div style={{
          background: esPropio ? "rgba(74,222,128,0.12)" : "rgba(0,0,0,0.35)",
          border: `1px solid ${esPropio ? "rgba(74,222,128,0.3)" : "rgba(45,106,79,0.4)"}`,
          borderRadius: esPropio ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          padding:"8px 12px",
        }}>
          <div style={{ fontSize:13, color:"#e2f5e9", lineHeight:1.5, wordBreak:"break-word" }}>{m.mensaje}</div>
        </div>
        <div style={{ fontSize:10, color:"#4b5563", marginTop:2, textAlign: esPropio ? "right" : "left", paddingLeft: esPropio ? 0 : 4 }}>
          {soloHora(m.created_at)}{esPropio && <span style={{ marginLeft:4, color:"#6b7280" }}> · Vos</span>}
        </div>
      </div>
    </div>
  );
}

function ChatEquipo({ ejecutadoPor }) {
  const [mensajes, setMensajes]             = useState([]);
  const [texto, setTexto]                   = useState("");
  const [enviando, setEnviando]             = useState(false);
  const [cargando, setCargando]             = useState(true);
  const [vistaChat, setVistaChat]           = useState("hoy"); // "hoy" | "diasList" | "diaDetalle"
  const [diasConMensajes, setDiasConMensajes] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [mensajesHistorial, setMensajesHistorial] = useState([]);
  const [cargandoHist, setCargandoHist]     = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { cargarHoy(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (vistaChat !== "hoy") return;
    const hoy = localHoy();
    const canal = supabase.channel("chat-equipo-live")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"chat_equipo" }, (payload) => {
        const msg = payload.new;
        const d = new Date(msg.created_at);
        const diaMsg = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (diaMsg === hoy) setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [vistaChat]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (vistaChat === "hoy") bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [mensajes, vistaChat]);

  async function cargarHoy() {
    setCargando(true);
    const [inicio, fin] = rangoLocal(localHoy());
    const { data } = await supabase.from("chat_equipo").select("*")
      .gte("created_at", inicio).lt("created_at", fin)
      .order("created_at", { ascending:true });
    setMensajes(data || []);
    setCargando(false);
  }

  async function abrirHistorial() {
    setVistaChat("diasList");
    setCargandoHist(true);
    const [inicioHoy] = rangoLocal(localHoy());
    const { data } = await supabase.from("chat_equipo").select("created_at")
      .lt("created_at", inicioHoy).order("created_at", { ascending:false });
    if (data) {
      const dias = [...new Set(data.map(m => {
        const d = new Date(m.created_at);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }))];
      setDiasConMensajes(dias);
    }
    setCargandoHist(false);
  }

  async function abrirDia(dia) {
    setDiaSeleccionado(dia);
    setVistaChat("diaDetalle");
    setCargandoHist(true);
    const [inicio, fin] = rangoLocal(dia);
    const { data } = await supabase.from("chat_equipo").select("*")
      .gte("created_at", inicio).lt("created_at", fin)
      .order("created_at", { ascending:true });
    setMensajesHistorial(data || []);
    setCargandoHist(false);
  }

  async function enviar() {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const { data } = await supabase
      .from("chat_equipo")
      .insert({ autor: ejecutadoPor, mensaje: texto.trim() })
      .select()
      .single();
    if (data) setMensajes(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
    setTexto("");
    setEnviando(false);
  }

  const BTN_BACK = { display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#4ade80", cursor:"pointer", fontSize:13, fontFamily:"'Lato',sans-serif", marginBottom:16, padding:0 };
  const BACK_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;

  if (vistaChat === "diasList") return (
    <>
      <button onClick={() => setVistaChat("hoy")} style={BTN_BACK}>{BACK_ICON} Chat de hoy</button>
      <div style={{ fontSize:11, color:"#4ade80", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Historial de chats</div>
      {cargandoHist ? (
        <div style={{ textAlign:"center", color:"#4ade80", padding:24 }}>Cargando...</div>
      ) : diasConMensajes.length === 0 ? (
        <div style={{ textAlign:"center", color:"#6b7280", padding:24, fontSize:13 }}>No hay chats anteriores</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {diasConMensajes.map(dia => (
            <button key={dia} onClick={() => abrirDia(dia)} style={{ ...CARD, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", border:"1px solid rgba(45,106,79,0.5)", fontFamily:"'Lato',sans-serif" }}>
              <span style={{ fontSize:14, color:"#e2f5e9" }}>{fecha(dia + "T12:00:00")}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (vistaChat === "diaDetalle") return (
    <>
      <button onClick={() => { setVistaChat("diasList"); setDiaSeleccionado(null); }} style={BTN_BACK}>{BACK_ICON} Historial</button>
      <div style={{ fontSize:11, color:"#4ade80", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>
        {diaSeleccionado ? fecha(diaSeleccionado + "T12:00:00") : ""}
      </div>
      {cargandoHist ? (
        <div style={{ textAlign:"center", color:"#4ade80", padding:24 }}>Cargando...</div>
      ) : mensajesHistorial.length === 0 ? (
        <div style={{ textAlign:"center", color:"#6b7280", padding:24, fontSize:13 }}>Sin mensajes ese día</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {mensajesHistorial.map(m => <BurbujaMensaje key={m.id} m={m} esPropio={m.autor === ejecutadoPor} />)}
        </div>
      )}
    </>
  );

  return (
    <>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:11, color:"#4ade80", letterSpacing:2, textTransform:"uppercase" }}>Chat de hoy</div>
        <button onClick={abrirHistorial} style={{ background:"none", border:"1px solid #2d6a4f", borderRadius:6, color:"#6b7280", fontSize:11, cursor:"pointer", padding:"4px 10px", fontFamily:"'Lato',sans-serif" }}>
          Ver historial
        </button>
      </div>
      <div style={{ background:"rgba(0,0,0,0.3)", border:"1px solid #2d6a4f", borderRadius:12, padding:12, minHeight:180, maxHeight:320, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
        {cargando ? (
          <div style={{ textAlign:"center", color:"#4ade80", padding:20 }}>Cargando...</div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign:"center", color:"#4b5563", padding:20, fontSize:13 }}>No hay mensajes hoy. ¡Empezá la conversación!</div>
        ) : (
          mensajes.map(m => <BurbujaMensaje key={m.id} m={m} esPropio={m.autor === ejecutadoPor} />)
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input
          type="text"
          placeholder="Escribí un mensaje..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) enviar(); }}
          style={{ ...INPUT_STYLE, flex:1, fontSize:13 }}
        />
        <button onClick={enviar} disabled={!texto.trim() || enviando}
          style={{ ...BTN_SM("#4ade80"), flexShrink:0, opacity: !texto.trim() || enviando ? 0.5 : 1 }}>
          {enviando ? "..." : "Enviar"}
        </button>
      </div>
    </>
  );
}

function TabEquipo({ rol, ejecutadoPor }) {
  const [subtab, setSubtab] = useState("tickets"); // "tickets" | "chat"
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [ticketSel, setTicketSel] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [cargandoCom, setCargandoCom] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from("tickets_internos")
      .select("*")
      .order("created_at", { ascending: false });
    setTickets(data || []);
    setCargando(false);
  }

  async function abrirTicket(t) {
    setTicketSel(t);
    setCargandoCom(true);
    const { data } = await supabase
      .from("ticket_comentarios")
      .select("*")
      .eq("ticket_id", t.id)
      .order("created_at", { ascending: true });
    setComentarios(data || []);
    setCargandoCom(false);
  }

  async function enviarComentario() {
    if (!texto.trim() || !ticketSel) return;
    setEnviando(true);
    const { data } = await supabase
      .from("ticket_comentarios")
      .insert({ ticket_id: ticketSel.id, autor: ejecutadoPor, mensaje: texto.trim() })
      .select().single();
    if (data) setComentarios(p => [...p, data]);
    setTexto("");
    setEnviando(false);
  }

  async function cambiarEstado(id, nuevoEstado) {
    await supabase.from("tickets_internos").update({ estado: nuevoEstado }).eq("id", id);
    setTickets(p => p.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    if (ticketSel?.id === id) setTicketSel(p => ({ ...p, estado: nuevoEstado }));
  }

  const ESTADO_COLOR = { pendiente: "#fbbf24", en_revision: "#60a5fa", resuelto: "#4ade80" };
  const ESTADO_LABEL = { pendiente: "Pendiente", en_revision: "En revisión", resuelto: "Resuelto" };
  const filtrados = filtro === "todos" ? tickets : tickets.filter(t => t.estado === filtro);
  const pendientesCount = tickets.filter(t => t.estado === "pendiente").length;

  if (ticketSel) {
    const color = ESTADO_COLOR[ticketSel.estado] || "#9ca3af";
    return (
      <>
        <button
          onClick={() => setTicketSel(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontSize: 13, fontFamily: "'Lato',sans-serif", marginBottom: 16, padding: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Volver a la lista
        </button>

        <div style={{ ...CARD, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#6b7280" }}>#{String(ticketSel.id).slice(0, 8).toUpperCase()}</div>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: `1px solid ${color}`, color, fontWeight: 700, flexShrink: 0 }}>
              {ESTADO_LABEL[ticketSel.estado] || ticketSel.estado}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#e2f5e9", lineHeight: 1.7, marginBottom: 12 }}>{ticketSel.descripcion}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#6b7280" }}>
            <span>Por: <strong style={{ color: "#fbbf24" }}>{ticketSel.creado_por}</strong></span>
            <span>·</span>
            <span>{fechaHora(ticketSel.created_at)}</span>
            {ticketSel.monto != null && <><span>·</span><span style={{ color: "#4ade80" }}>${Number(ticketSel.monto).toFixed(2)}</span></>}
          </div>
        </div>

        {rol === 'admin' && ticketSel.estado !== 'resuelto' && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {ticketSel.estado === 'pendiente' && (
              <button onClick={() => cambiarEstado(ticketSel.id, 'en_revision')} style={BTN_SM("#60a5fa")}>
                Tomar en revisión
              </button>
            )}
            <button onClick={() => cambiarEstado(ticketSel.id, 'resuelto')} style={BTN_SM("#4ade80")}>
              ✓ Resolver
            </button>
          </div>
        )}

        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          Notas internas
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {cargandoCom && <div style={{ textAlign: "center", color: "#4ade80", padding: 16, fontSize: 12 }}>Cargando...</div>}
          {!cargandoCom && comentarios.length === 0 && (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "16px 0", fontSize: 12 }}>Sin notas aún.</div>
          )}
          {comentarios.map(c => (
            <div key={c.id} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(45,106,79,0.3)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>{c.autor}</span>
                <span style={{ fontSize: 10, color: "#6b7280" }}>{fechaHora(c.created_at)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#e2f5e9", lineHeight: 1.6 }}>{c.mensaje}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Agregar nota interna..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !enviando && enviarComentario()}
            style={{ ...INPUT_STYLE, flex: 1, fontSize: 13 }}
          />
          <button
            onClick={enviarComentario}
            disabled={enviando || !texto.trim()}
            style={{ ...BTN_SM("#4ade80"), flexShrink: 0, opacity: !texto.trim() || enviando ? 0.5 : 1 }}
          >
            {enviando ? "..." : "Enviar"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sub-tabs: Tickets | Chat */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["tickets","Tickets"], ["chat","Chat del equipo"]].map(([val, lbl]) => (
          <button key={val} onClick={() => setSubtab(val)} style={{
            padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700,
            fontFamily:"'Lato',sans-serif", border:"1px solid",
            borderColor: subtab === val ? "#a78bfa" : "#2d6a4f",
            background: subtab === val ? "rgba(167,139,250,0.12)" : "rgba(0,0,0,0.3)",
            color: subtab === val ? "#a78bfa" : "#6b7280",
          }}>
            {lbl}{val === "tickets" && pendientesCount > 0 ? ` (${pendientesCount})` : ""}
          </button>
        ))}
      </div>

      {subtab === "chat" ? <ChatEquipo ejecutadoPor={ejecutadoPor} /> : (
      <>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[["todos", "Todos"], ["pendiente", "Pendientes"], ["en_revision", "En revisión"], ["resuelto", "Resueltos"]].map(([val, lbl]) => (
          <button key={val} onClick={() => setFiltro(val)} style={{
            padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
            fontFamily: "'Lato',sans-serif", border: "1px solid",
            borderColor: filtro === val ? "#4ade80" : "#2d6a4f",
            background: filtro === val ? "rgba(74,222,128,0.12)" : "rgba(0,0,0,0.3)",
            color: filtro === val ? "#4ade80" : "#6b7280",
          }}>
            {lbl}{val === "pendiente" && pendientesCount > 0 ? ` (${pendientesCount})` : ""}
          </button>
        ))}
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", color: "#4ade80", padding: 40 }}>Cargando tickets...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Sin tickets en esta categoría</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map(t => {
            const color = ESTADO_COLOR[t.estado] || "#9ca3af";
            return (
              <div
                key={t.id}
                onClick={() => abrirTicket(t)}
                style={{ ...CARD, cursor: "pointer", border: `1px solid ${t.estado === "pendiente" ? "rgba(251,191,36,0.35)" : t.estado === "en_revision" ? "rgba(96,165,250,0.35)" : "rgba(74,222,128,0.25)"}` }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, border: `1px solid ${color}`, color, fontWeight: 700, flexShrink: 0 }}>
                        {ESTADO_LABEL[t.estado] || t.estado}
                      </span>
                      {t.monto != null && <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>${Number(t.monto).toFixed(2)}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#e2f5e9", lineHeight: 1.5, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.descripcion}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {t.creado_por} · {fechaHora(t.created_at)}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>)}
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
  { id: "equipo", label: "Equipo" },
];

export default function Admin({ onVolver, rol = 'admin', ejecutadoPor = '', usuarioId = '' }) {
  const tabsVisibles = rol === 'asesor' ? TABS.filter(t => t.id === 'usuarios' || t.id === 'equipo') : TABS;
  const [tab, setTab] = useState(() => {
    const guardada = localStorage.getItem('truco_admin_tab');
    return guardada && tabsVisibles.some(t => t.id === guardada) ? guardada : tabsVisibles[0].id;
  });
  const [ticketsBadge, setTicketsBadge] = useState(0);

  function cambiarTab(id) { localStorage.setItem('truco_admin_tab', id); setTab(id); }

  useEffect(() => {
    async function cargarBadge() {
      const { count } = await supabase
        .from("tickets_internos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "pendiente");
      setTicketsBadge(count || 0);
    }
    cargarBadge();
    const canal = supabase.channel("tickets-badge-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets_internos" }, cargarBadge)
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)", fontFamily: "'Lato', sans-serif", color: "#e2f5e9" }}>

      {/* Header sticky */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0", position: "sticky", top: 0, background: "rgba(5,15,8,0.96)", backdropFilter: "blur(8px)", zIndex: 10, borderBottom: "1px solid rgba(45,106,79,0.4)" }}>
        <div onClick={onVolver} style={{ paddingBottom: 14, cursor: "pointer" }}>
          <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Online</div>
          <div style={{ fontSize: 19, color: "#fbbf24", fontWeight: 900 }}>{rol === 'asesor' ? 'Panel de asesor' : 'Panel de administrador'}</div>
        </div>
        <button onClick={onVolver} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 8, padding: "8px 14px", color: "#4ade80", fontSize: 13, cursor: "pointer", fontFamily: "'Lato',sans-serif", marginBottom: 14 }}>
          ← Volver
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(45,106,79,0.3)", background: "rgba(5,15,8,0.92)", position: "sticky", top: 57, zIndex: 9 }}>
        {tabsVisibles.map(t => (
          <button key={t.id} onClick={() => cambiarTab(t.id)} style={{
            flex: 1, padding: "11px 2px", border: "none", background: "none",
            cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
            color: tab === t.id ? "#4ade80" : "#4b5563",
            borderBottom: tab === t.id ? "2px solid #4ade80" : "2px solid transparent",
            transition: "color 0.15s, border-color 0.15s",
            position: "relative",
          }}>
            {t.label}
            {t.id === "equipo" && ticketsBadge > 0 && (
              <span style={{ position: "absolute", top: 6, right: "50%", transform: "translateX(calc(50% + 16px))", background: "#f87171", color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: "50%", minWidth: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: "0 3px" }}>
                {ticketsBadge > 9 ? "9+" : ticketsBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px", maxWidth: 640, margin: "0 auto" }}>
        {tab === "usuarios" && <TabUsuarios rol={rol} ejecutadoPor={ejecutadoPor} usuarioId={usuarioId} />}
        {tab === "partidas" && <TabPartidas />}
        {tab === "finanzas" && <TabFinanzas />}
        {tab === "soporte" && <TabSoporte />}
        {tab === "metricas" && <TabMetricas />}
        {tab === "equipo" && <TabEquipo rol={rol} ejecutadoPor={ejecutadoPor} />}
      </div>

    </div>
  );
}
