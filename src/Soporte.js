import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const ESTADO_COLOR = { abierto: "#fbbf24", en_curso: "#60a5fa", resuelto: "#4ade80" };
const ESTADO_LABEL = { abierto: "Abierto", en_curso: "En curso", resuelto: "Resuelto" };

export default function BotonSoporte({ perfil }) {
  const [abierto, setAbierto] = useState(false);
  const [caso, setCaso] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (abierto && perfil) cargarCaso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  const casoId = caso?.id ?? null;
  useEffect(() => {
    if (!casoId) return;
    const canal = supabase.channel(`soporte-user-${casoId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "mensajes_soporte",
      }, (payload) => {
        if (payload.new.caso_id !== casoId) return;
        setMensajes(prev =>
          prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
        );
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [casoId]);

  async function cargarCaso() {
    setCargando(true);
    const { data } = await supabase
      .from("casos_soporte")
      .select("*")
      .eq("usuario_id", perfil.usuario_id)
      .order("created_at", { ascending: false })
      .limit(1);
    const c = data?.[0] || null;
    setCaso(c);
    if (c) {
      const { data: msgs } = await supabase
        .from("mensajes_soporte")
        .select("*")
        .eq("caso_id", c.id)
        .order("created_at", { ascending: true });
      setMensajes(msgs || []);
    } else {
      setMensajes([]);
    }
    setCargando(false);
  }

  async function enviar() {
    const msg = texto.trim();
    if (!msg || enviando) return;
    setEnviando(true);

    let casoId = caso?.id;

    if (!casoId || caso?.estado === "resuelto") {
      const { data: nuevoCaso, error } = await supabase
        .from("casos_soporte")
        .insert({ usuario_id: perfil.usuario_id })
        .select()
        .single();
      if (error || !nuevoCaso) { setEnviando(false); return; }
      casoId = nuevoCaso.id;
      setCaso(nuevoCaso);
      setMensajes([]);
    }

    const { data: nuevoMsg } = await supabase
      .from("mensajes_soporte")
      .insert({
        caso_id: casoId,
        autor_id: perfil.usuario_id,
        autor_nombre: perfil.nombre,
        es_admin: false,
        mensaje: msg,
      })
      .select()
      .single();

    if (nuevoMsg) {
      setMensajes(prev => prev.find(m => m.id === nuevoMsg.id) ? prev : [...prev, nuevoMsg]);
    }
    setTexto("");
    setEnviando(false);
  }

  if (!perfil) return null;

  const colorBtn = ESTADO_COLOR[caso?.estado] || "#4ade80";

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(a => !a)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 200,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #1a472a, #2d6a4f)",
          border: `2px solid ${colorBtn}`,
          color: colorBtn, fontSize: abierto ? 20 : 22, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 20px rgba(74,222,128,0.3)`,
          transition: "transform 0.15s, box-shadow 0.15s, border-color 0.2s",
          fontFamily: "'Lato', sans-serif",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(74,222,128,0.45)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(74,222,128,0.3)";
        }}
      >
        {abierto ? "✕" : "💬"}
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div style={{
          position: "fixed", bottom: 84, right: 20, zIndex: 199,
          width: "min(360px, calc(100vw - 32px))",
          height: "min(500px, calc(100vh - 120px))",
          background: "radial-gradient(ellipse at top, #0f2d1a 0%, #050f08 100%)",
          border: "1px solid #2d6a4f",
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          fontFamily: "'Lato', sans-serif",
          boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "13px 16px",
            borderBottom: "1px solid rgba(45,106,79,0.4)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(0,0,0,0.25)",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 15, color: "#e2f5e9", fontWeight: 700 }}>💬 Soporte</div>
              {caso ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    Caso #{String(caso.numero).padStart(3, "0")}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 10, letterSpacing: 1,
                    background: `${ESTADO_COLOR[caso.estado]}18`,
                    color: ESTADO_COLOR[caso.estado],
                    border: `1px solid ${ESTADO_COLOR[caso.estado]}40`,
                  }}>
                    {ESTADO_LABEL[caso.estado].toUpperCase()}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Nuevo caso</div>
              )}
            </div>
            <button
              onClick={() => setAbierto(false)}
              style={{
                background: "none", border: "none", color: "#6b7280",
                fontSize: 18, cursor: "pointer", padding: "4px 6px",
                borderRadius: 6, lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {cargando ? (
              <div style={{ textAlign: "center", color: "#4ade80", padding: 28, fontSize: 13 }}>
                Cargando...
              </div>
            ) : mensajes.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, marginBottom: 3, paddingLeft: 4 }}>
                  Soporte
                </div>
                <div style={{
                  maxWidth: "82%", padding: "9px 13px",
                  borderRadius: "2px 12px 12px 12px",
                  background: "rgba(96,165,250,0.1)",
                  border: "1px solid rgba(96,165,250,0.25)",
                  fontSize: 13, color: "#e2f5e9", lineHeight: 1.55,
                }}>
                  ¡Hola {perfil.nombre}! ¿En qué puedo ayudarte?
                </div>
              </div>
            ) : (
              mensajes.map(m => (
                <div key={m.id} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: m.es_admin ? "flex-start" : "flex-end",
                }}>
                  {m.es_admin && (
                    <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, marginBottom: 3, paddingLeft: 4 }}>
                      {m.autor_nombre}
                    </div>
                  )}
                  <div style={{
                    maxWidth: "82%", padding: "9px 13px",
                    borderRadius: m.es_admin ? "2px 12px 12px 12px" : "12px 2px 12px 12px",
                    background: m.es_admin ? "rgba(96,165,250,0.1)" : "rgba(74,222,128,0.1)",
                    border: m.es_admin
                      ? "1px solid rgba(96,165,250,0.25)"
                      : "1px solid rgba(74,222,128,0.25)",
                    fontSize: 13, color: "#e2f5e9", lineHeight: 1.55, wordBreak: "break-word",
                  }}>
                    {m.mensaje}
                  </div>
                  <div style={{ fontSize: 10, color: "#4b5563", marginTop: 3 }}>
                    {new Date(m.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {caso?.estado === "resuelto" ? (
            <div style={{
              padding: "12px 14px", borderTop: "1px solid rgba(45,106,79,0.3)",
              display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
              background: "rgba(74,222,128,0.04)", flexShrink: 0,
            }}>
              <div style={{ fontSize: 12, color: "#4ade80" }}>✅ Este caso fue resuelto</div>
              <button
                onClick={() => { setCaso(null); setMensajes([]); }}
                style={{
                  fontSize: 12, color: "#60a5fa", background: "none",
                  border: "1px solid rgba(96,165,250,0.3)", borderRadius: 8,
                  padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato', sans-serif",
                }}
              >
                + Abrir nuevo caso
              </button>
            </div>
          ) : (
            <div style={{
              padding: "10px 12px", borderTop: "1px solid rgba(45,106,79,0.3)",
              display: "flex", gap: 8, alignItems: "center", flexShrink: 0,
            }}>
              <input
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                placeholder="Escribí tu consulta..."
                style={{
                  flex: 1, padding: "9px 13px", borderRadius: 20,
                  border: "1px solid #2d6a4f", background: "rgba(0,0,0,0.4)",
                  color: "#ffffff", fontFamily: "'Lato', sans-serif", fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={enviar}
                disabled={!texto.trim() || enviando}
                style={{
                  width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
                  background: texto.trim() && !enviando
                    ? "linear-gradient(135deg, #1a472a, #2d6a4f)"
                    : "rgba(0,0,0,0.3)",
                  color: texto.trim() && !enviando ? "#4ade80" : "#4b5563",
                  cursor: texto.trim() && !enviando ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, transition: "all 0.15s",
                }}
              >
                ➤
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
