// PERMANENTE — NO borrar junto con el panel de debug temporal (ver checklist
// de remoción en el commit 60ab545). Esta lógica migró acá porque también la
// usa LogJugadas.js (panel lateral permanente), así que no es descartable.

export const LABEL_ENV = { envido: 'Envido', real_envido: 'Real Envido', falta_envido: 'Falta Envido' };

export function getCantoLabel(acc) {
  if (!acc) return '';
  if (acc.tipo === 'truco') return ['', 'Truco', 'Retruco', 'Vale cuatro'][acc.nivel] || 'Truco';
  const cadena = acc.cadena || [acc.subtipo];
  return cadena.map(s => LABEL_ENV[s] || s).join(' + ');
}

/**
 * Compara el estado anterior de la partida (`prev`) contra el payload nuevo
 * de Realtime (`p`) y devuelve los eventos de juego relevantes como datos
 * crudos — sin texto armado. Cada consumidor (panel de debug, log de
 * jugadas) arma su propia frase a partir de estos datos.
 */
export function derivarEventosPartida(prev, p, { userId }) {
  if (!prev) return [];
  const eventos = [];

  if (prev.puntos1 !== p.puntos1) {
    eventos.push({
      campo: "puntos1", jugadorClave: "j1",
      delta: (p.puntos1 || 0) - (prev.puntos1 || 0),
      anterior: prev.puntos1, nuevo: p.puntos1,
    });
  }
  if (prev.puntos2 !== p.puntos2) {
    eventos.push({
      campo: "puntos2", jugadorClave: "j2",
      delta: (p.puntos2 || 0) - (prev.puntos2 || 0),
      anterior: prev.puntos2, nuevo: p.puntos2,
    });
  }
  if (prev.puntos_mano !== p.puntos_mano) {
    eventos.push({ campo: "puntos_mano", anterior: prev.puntos_mano, nuevo: p.puntos_mano });
  }

  const esNuevoUltimoCanto = p.ultimo_canto && p.ultimo_canto.ts !== prev.ultimo_canto?.ts;
  if (esNuevoUltimoCanto) {
    const tag = p.ultimo_canto.tag;
    const actorId = p.ultimo_canto.por;
    const disparadoPorMi = actorId === userId;
    if (tag === 'quiero' || tag === 'no_quiero') {
      const cantoResuelto = prev.accion_pendiente || null;
      eventos.push({
        campo: "accion_pendiente", tipoEvento: tag, disparadoPorMi, actorId,
        cantoResuelto, cantoResueltoLabel: cantoResuelto ? getCantoLabel(cantoResuelto) : '',
        anterior: prev.accion_pendiente || null, nuevo: p.accion_pendiente || null,
      });
    } else if (p.accion_pendiente && ['truco', 'retruco', 'vale_cuatro', 'envido', 'real_envido', 'falta_envido'].includes(tag)) {
      eventos.push({
        campo: "accion_pendiente", tipoEvento: "canto", disparadoPorMi, actorId,
        cantoNuevo: p.accion_pendiente, cantoNuevoLabel: getCantoLabel(p.accion_pendiente),
        anterior: prev.accion_pendiente || null, nuevo: p.accion_pendiente,
      });
    }
  }

  if (JSON.stringify(prev.envido_resultado || null) !== JSON.stringify(p.envido_resultado || null) && p.envido_resultado) {
    eventos.push({ campo: "envido_resultado", anterior: prev.envido_resultado || null, nuevo: p.envido_resultado });
  }

  return eventos;
}

export function textosCortosDeEventos(eventosPartida, { soyJugador1, rivalNombreCorto }) {
  const textos = [];
  for (const ev of eventosPartida) {
    if (ev.campo === "puntos1" || ev.campo === "puntos2") {
      const esMio = (ev.campo === "puntos1") === soyJugador1;
      textos.push(`${esMio ? "Vos" : rivalNombreCorto}: ${ev.delta >= 0 ? '+' : ''}${ev.delta}`);
    } else if (ev.campo === "accion_pendiente") {
      const nombre = ev.disparadoPorMi ? "Vos" : rivalNombreCorto;
      if (ev.tipoEvento === 'quiero') textos.push(`${nombre}: QUIERO`);
      else if (ev.tipoEvento === 'no_quiero') textos.push(`${nombre}: NO QUIERO`);
      else if (ev.tipoEvento === 'canto') textos.push(`${nombre}: ${ev.cantoNuevoLabel.toUpperCase()}`);
    } else if (ev.campo === "envido_resultado") {
      const revelado = ev.nuevo.texto_j1.includes("Son buenas") ? ev.nuevo.texto_j2 : ev.nuevo.texto_j1;
      textos.push(`Envido: ${revelado.replace(/[¡!]/g, '')}`);
    }
    // puntos_mano: omitido a propósito, es más técnico que útil de un vistazo
  }
  return textos;
}

// === DEBUG TEMPORAL — PERSISTENCIA jugadas_log (sacar junto con el panel de debug — ver checklist DROP COLUMN) ===
// A diferencia de textosCortosDeEventos, estas entradas no llevan "Vos"/nombre
// del rival: quedan etiquetadas con el jugador absoluto (j1/j2) para que
// jugadas_log sirva para auditar la partida sin importar quién la escribió.
// La traducción a "Vos" vs nombre del rival se hace recién al mostrarlas
// (ver formatearEntradaJugadaLog), no al persistirlas.
function entradasNeutralesDeEventos(eventosPartida, { jugador1Id }) {
  const entradas = [];
  for (const ev of eventosPartida) {
    if (ev.campo === "puntos1" || ev.campo === "puntos2") {
      entradas.push({ jugador: ev.jugadorClave, tipo: "delta", delta: ev.delta });
    } else if (ev.campo === "accion_pendiente") {
      const jugador = ev.actorId === jugador1Id ? "j1" : "j2";
      if (ev.tipoEvento === 'quiero') entradas.push({ jugador, tipo: "quiero" });
      else if (ev.tipoEvento === 'no_quiero') entradas.push({ jugador, tipo: "no_quiero" });
      else if (ev.tipoEvento === 'canto') entradas.push({ jugador, tipo: "canto", cantoLabel: ev.cantoNuevoLabel });
    } else if (ev.campo === "envido_resultado") {
      const revelado = ev.nuevo.texto_j1.includes("Son buenas") ? ev.nuevo.texto_j2 : ev.nuevo.texto_j1;
      entradas.push({ jugador: null, tipo: "envido", texto: revelado.replace(/[¡!]/g, '') });
    }
  }
  return entradas;
}

// Traduce una entrada neutral de jugadas_log a texto legible desde la
// perspectiva de quien la está mirando. Para usar cuando se consulte el
// historial persistido (por SQL o en alguna pantalla), no al guardarlo.
export function formatearEntradaJugadaLog(entrada, { soyJugador1, rivalNombreCorto }) {
  if (entrada.tipo === "envido") return `Envido: ${entrada.texto}`;
  const nombre = entrada.jugador === (soyJugador1 ? "j1" : "j2") ? "Vos" : rivalNombreCorto;
  if (entrada.tipo === "delta") return `${nombre}: ${entrada.delta >= 0 ? '+' : ''}${entrada.delta}`;
  if (entrada.tipo === "quiero") return `${nombre}: QUIERO`;
  if (entrada.tipo === "no_quiero") return `${nombre}: NO QUIERO`;
  if (entrada.tipo === "canto") return `${nombre}: ${entrada.cantoLabel.toUpperCase()}`;
  return '';
}

// Deriva los eventos entre estadoAntes y estadoAntes+updates, y si hay
// alguno relevante, agrega las entradas neutrales resultantes a
// updates.jugadas_log (mutando `updates` in place, como hacen los call
// sites de Multijugador.js con el resto de los campos a actualizar).
export function appendJugadasLog(estadoAntes, updates, { userId }) {
  const eventos = derivarEventosPartida(estadoAntes, { ...estadoAntes, ...updates }, { userId });
  const entradas = entradasNeutralesDeEventos(eventos, { jugador1Id: estadoAntes.jugador1_id });
  if (!entradas.length) return;
  updates.jugadas_log = [...(estadoAntes.jugadas_log || []), ...entradas.map(entrada => ({ id: Date.now() + Math.random(), ...entrada }))];
}
// === FIN DEBUG TEMPORAL — PERSISTENCIA ===
