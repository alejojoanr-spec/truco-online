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
    const disparadoPorMi = p.ultimo_canto.por === userId;
    if (tag === 'quiero' || tag === 'no_quiero') {
      const cantoResuelto = prev.accion_pendiente || null;
      eventos.push({
        campo: "accion_pendiente", tipoEvento: tag, disparadoPorMi,
        cantoResuelto, cantoResueltoLabel: cantoResuelto ? getCantoLabel(cantoResuelto) : '',
        anterior: prev.accion_pendiente || null, nuevo: p.accion_pendiente || null,
      });
    } else if (p.accion_pendiente && ['truco', 'retruco', 'vale_cuatro', 'envido', 'real_envido', 'falta_envido'].includes(tag)) {
      eventos.push({
        campo: "accion_pendiente", tipoEvento: "canto", disparadoPorMi,
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
