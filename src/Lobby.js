import { useState, useEffect } from "react";
import { supabase } from "./supabase";

function formatPesos(n) {
  if (n === 0) return "Gratis";
  return `$${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

const OPCIONES_APUESTA = [
  { label: "Gratis", value: 0 },
  ...Array.from({ length: 10 }, (_, i) => {
    const v = (i + 1) * 100;
    return { label: formatPesos(v), value: v };
  }),
  ...Array.from({ length: 798 }, (_, i) => {
    const v = 1500 + i * 500;
    return { label: formatPesos(v), value: v };
  }),
];

function CardIA({ onJugar }) {
  return (
    <div style={{
      background: "linear-gradient(135deg,#1a472a,#0f2d1a)",
      border: "1px solid #4ade80", borderRadius: 16,
      padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ fontSize: 38, flexShrink: 0, lineHeight: 1 }}>🤖</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>Jugar contra la IA</div>
        <div style={{ fontSize: 12, color: "#6b9", marginTop: 3 }}>Sin espera · Instantáneo</div>
      </div>
      <button
        onClick={onJugar}
        style={{
          padding: "9px 18px", borderRadius: 10, cursor: "pointer",
          background: "linear-gradient(135deg,#1a472a,#2d6a4f)",
          border: "1px solid #4ade80", color: "#4ade80",
          fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}
      >
        Jugar
      </button>
    </div>
  );
}

function TagsPts({ sala }) {
  if (!sala.puntos && !sala.es_torneo) return null;
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
      {sala.puntos && (
        <span style={{ fontSize: 10, color: "#60a5fa", background: "rgba(96,165,250,0.1)", borderRadius: 4, padding: "2px 5px", border: "1px solid rgba(96,165,250,0.2)" }}>
          {sala.puntos} pts
        </span>
      )}
      {sala.es_torneo && (
        <span style={{ fontSize: 10, color: "#fbbf24", background: "rgba(251,191,36,0.08)", borderRadius: 4, padding: "2px 5px", border: "1px solid rgba(251,191,36,0.25)" }}>
          🏆 Torneo
        </span>
      )}
    </div>
  );
}

function CardEsperando({ sala, onUnirse, uniendose, perfil }) {
  const cargando = uniendose === sala.codigo;
  const saldoInsuficiente = (sala.apuesta || 0) > 0 && (perfil?.saldo || 0) < (sala.apuesta || 0);
  const bloqueado = cargando || saldoInsuficiente;
  return (
    <div style={{
      background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f",
      borderRadius: 14, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ fontSize: 32, flexShrink: 0, lineHeight: 1 }}>{sala.jugador1_avatar || "👤"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 900, color: "#fbbf24",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {sala.jugador1_nombre || "Jugador"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          {sala.apuesta > 0 ? (
            <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>
              {formatPesos(sala.apuesta)} apostados
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "#4b5563" }}>Sin apuesta</span>
          )}
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#4ade80" }}>Disponible</span>
        </div>
        <TagsPts sala={sala} />
      </div>
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <button
          onClick={() => !bloqueado && onUnirse(sala.codigo)}
          disabled={bloqueado}
          style={{
            padding: "9px 18px", borderRadius: 10,
            cursor: bloqueado ? "not-allowed" : "pointer",
            background: bloqueado ? "rgba(0,0,0,0.3)" : "linear-gradient(135deg,#1a472a,#2d6a4f)",
            border: "1px solid #4ade80", color: "#4ade80",
            fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700,
            opacity: bloqueado ? 0.5 : 1, transition: "opacity 0.15s",
          }}
        >
          {cargando ? "..." : "Jugar"}
        </button>
        {saldoInsuficiente && (
          <span style={{ fontSize: 10, color: "#f87171" }}>Saldo insuficiente</span>
        )}
      </div>
    </div>
  );
}

function CardJugando({ sala }) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.25)", border: "1px solid rgba(45,106,79,0.25)",
      borderRadius: 14, padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 10,
      opacity: 0.75,
    }}>
      <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{sala.jugador1_avatar || "👤"}</div>
      <div style={{ fontSize: 11, color: "#374151", fontWeight: 900, flexShrink: 0 }}>VS</div>
      <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{sala.jugador2_avatar || "👤"}</div>
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
        <div style={{
          fontSize: 12, color: "#9ca3af",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {sala.jugador1_nombre || "Jugador 1"} vs {sala.jugador2_nombre || "Jugador 2"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 2, alignItems: "center", flexWrap: "wrap" }}>
          {sala.apuesta > 0 && (
            <span style={{ fontSize: 11, color: "#6b7280" }}>{formatPesos(sala.apuesta)} en juego</span>
          )}
          {sala.puntos && (
            <span style={{ fontSize: 10, color: "#60a5fa" }}>· {sala.puntos} pts</span>
          )}
          {sala.es_torneo && (
            <span style={{ fontSize: 10, color: "#fbbf24" }}>· 🏆</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
        <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}>Jugando</span>
      </div>
    </div>
  );
}

function CardMiSala({ sala }) {
  return (
    <div style={{
      background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.35)",
      borderRadius: 14, padding: "13px 18px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{sala.jugador1_avatar || "👤"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24" }}>Tu sala abierta</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
          Código: <span style={{ color: "#fbbf24", letterSpacing: 1 }}>{sala.codigo}</span> · Esperando contrincante
        </div>
        <TagsPts sala={sala} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" }} />
        <span style={{ fontSize: 11, color: "#fbbf24" }}>Esperando</span>
      </div>
    </div>
  );
}

const headerStyle = {
  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
  borderBottom: "1px solid rgba(45,106,79,0.4)",
  position: "sticky", top: 0,
  background: "rgba(5,15,8,0.96)", backdropFilter: "blur(8px)", zIndex: 10,
};

const btnVolverStyle = {
  background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 8,
  padding: "7px 13px", color: "#4ade80", fontSize: 13, cursor: "pointer",
  fontFamily: "'Lato',sans-serif", display: "flex", alignItems: "center", gap: 6,
};

const wrapperStyle = {
  minHeight: "100dvh",
  background: "radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)",
  fontFamily: "'Lato', sans-serif", color: "#e2f5e9",
};

const IconVolver = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

export default function Lobby({ user, perfil, onJugarIA, onUnirse, onCrearSala, onVolver }) {
  const [salas, setSalas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [uniendose, setUniendose] = useState(null);
  const [pantalla, setPantalla] = useState("lobby");
  const [apuestaCrear, setApuestaCrear] = useState(0);
  const [puntosCrear, setPuntosCrear] = useState(15);
  const [esTorneoCrear, setEsTorneoCrear] = useState(false);
  const [rakePct, setRakePct] = useState(5);

  useEffect(() => {
    cargar();
    const canal = supabase.channel("truco-lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "partidas" }, () => cargar())
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, []);

  useEffect(() => {
    if (pantalla !== "crear") return;
    supabase.from("configuracion").select("valor").eq("clave", "rake_porcentaje").single()
      .then(({ data }) => { if (data?.valor) setRakePct(parseFloat(data.valor)); });
  }, [pantalla]);

  async function cargar() {
    const desde = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("partidas")
      .select("id, codigo, estado, jugador1_id, jugador1_nombre, jugador1_avatar, jugador2_id, jugador2_nombre, jugador2_avatar, apuesta, puntos, es_torneo, created_at")
      .in("estado", ["esperando", "jugando"])
      .gte("created_at", desde)
      .order("created_at", { ascending: false });
    setSalas(data || []);
    setCargando(false);
  }

  function unirse(codigo) {
    setUniendose(codigo);
    onUnirse(codigo);
  }

  const mySala = salas.find(s => s.estado === "esperando" && s.jugador1_id === user.id);
  const disponibles = salas.filter(s => s.estado === "esperando" && s.jugador1_id !== user.id);
  const jugando = salas.filter(s => s.estado === "jugando");
  const lista = [...disponibles, ...jugando];
  const hayJugadores = lista.length > 0;

  if (pantalla === "crear") {
    const pot = apuestaCrear * 2;
    const rakeAmount = apuestaCrear > 0 ? Math.round(pot * rakePct / 100 * 100) / 100 : 0;
    const premio = pot - rakeAmount;

    return (
      <div style={wrapperStyle}>
        <div style={headerStyle}>
          <button onClick={() => setPantalla("lobby")} style={btnVolverStyle}>
            <IconVolver />
            Volver
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Online</div>
            <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900 }}>Crear sala pública</div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 48px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Monto */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Monto de apuesta</div>
            <select
              value={apuestaCrear}
              onChange={e => setApuestaCrear(Number(e.target.value))}
              style={{
                width: "100%", background: "#0a2414", border: "1px solid #2d6a4f", borderRadius: 8,
                color: "#e2f5e9", padding: "10px 12px", fontSize: 15, fontFamily: "'Lato',sans-serif",
                cursor: "pointer", outline: "none",
              }}
            >
              {OPCIONES_APUESTA.map(o => (
                <option key={o.value} value={o.value} style={{ background: "#0a2414" }}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Puntos */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Puntos para ganar</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[15, 30].map(pts => (
                <button
                  key={pts}
                  onClick={() => setPuntosCrear(pts)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer",
                    background: puntosCrear === pts ? "rgba(74,222,128,0.12)" : "rgba(0,0,0,0.3)",
                    border: puntosCrear === pts ? "1.5px solid #4ade80" : "1px solid rgba(45,106,79,0.4)",
                    color: puntosCrear === pts ? "#4ade80" : "#6b7280",
                    fontFamily: "'Lato',sans-serif", fontSize: 15, fontWeight: puntosCrear === pts ? 900 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {pts} puntos
                </button>
              ))}
            </div>
          </div>

          {/* Torneo */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #2d6a4f", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Modo torneo</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Marca la partida como partida de torneo</div>
              </div>
              <button
                onClick={() => setEsTorneoCrear(v => !v)}
                style={{
                  width: 52, height: 28, borderRadius: 14, cursor: "pointer",
                  background: esTorneoCrear ? "rgba(251,191,36,0.15)" : "rgba(0,0,0,0.5)",
                  border: esTorneoCrear ? "1.5px solid #fbbf24" : "1px solid rgba(45,106,79,0.4)",
                  position: "relative", transition: "all 0.2s", flexShrink: 0,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: esTorneoCrear ? "#fbbf24" : "#374151",
                  position: "absolute", top: 3,
                  left: esTorneoCrear ? 27 : 3,
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>

          {/* Info comisión */}
          {apuestaCrear > 0 ? (
            <div style={{
              background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#4ade80", lineHeight: 1.7,
            }}>
              <span style={{ fontWeight: 700 }}>Apostando {formatPesos(apuestaCrear)}</span>
              {" · "}Comisión {rakePct}%: −{formatPesos(rakeAmount)}
              {" · "}Si ganás recibís{" "}
              <span style={{ fontWeight: 700, color: "#fbbf24" }}>{formatPesos(premio)}</span>
            </div>
          ) : (
            <div style={{
              background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.12)",
              borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#6b9", lineHeight: 1.7,
            }}>
              Partida gratuita · Sin apuesta ni comisión
            </div>
          )}

          {/* Botón crear */}
          <button
            onClick={() => onCrearSala(apuestaCrear, puntosCrear, esTorneoCrear)}
            style={{
              width: "100%", padding: "15px", borderRadius: 12, cursor: "pointer",
              background: "rgba(167,139,250,0.07)", border: "1.5px solid rgba(167,139,250,0.5)",
              color: "#a78bfa", fontFamily: "'Lato',sans-serif", fontSize: 15, fontWeight: 900,
            }}
          >
            + Crear sala
          </button>

        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>

      {/* Header sticky */}
      <div style={headerStyle}>
        <button onClick={onVolver} style={btnVolverStyle}>
          <IconVolver />
          Volver
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>Truco Online</div>
          <div style={{ fontSize: 18, color: "#fbbf24", fontWeight: 900 }}>Buscando partida</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
            boxShadow: "0 0 8px #4ade80",
          }} />
          <span style={{ fontSize: 11, color: "#4ade80" }}>En vivo</span>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 16px 48px", display: "flex", flexDirection: "column", gap: 8 }}>

        <CardIA onJugar={onJugarIA} />

        {mySala && <CardMiSala sala={mySala} />}

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", marginTop: 2 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(45,106,79,0.3)" }} />
          <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
            {cargando
              ? "Cargando..."
              : `${disponibles.length} disponible${disponibles.length !== 1 ? "s" : ""} · ${jugando.length} jugando`}
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(45,106,79,0.3)" }} />
        </div>

        {cargando && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#4ade80", fontSize: 13 }}>
            Buscando jugadores...
          </div>
        )}

        {!cargando && lista.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🃏</div>
            <div style={{ fontSize: 14, color: "#e2f5e9" }}>No hay jugadores disponibles</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>¡Sé el primero en abrir una sala!</div>
          </div>
        )}

        {lista.map(s =>
          s.estado === "esperando"
            ? <CardEsperando key={s.id} sala={s} onUnirse={unirse} uniendose={uniendose} perfil={perfil} />
            : <CardJugando key={s.id} sala={s} />
        )}

        {!cargando && !mySala && (
          <button
            onClick={() => setPantalla("crear")}
            style={{
              marginTop: hayJugadores ? 6 : 0,
              width: "100%", padding: "14px", borderRadius: 12, cursor: "pointer",
              background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.4)",
              color: "#a78bfa", fontFamily: "'Lato',sans-serif", fontSize: 14, fontWeight: 700,
            }}
          >
            + Crear sala pública
          </button>
        )}

      </div>
    </div>
  );
}
