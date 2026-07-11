/**
 * Resuelve quién ganó la mano de truco argentino a partir de los resultados de las bazas.
 *
 * @param {Array<"A"|"B"|"parda">} bazas
 *   1 a 3 resultados de bazas jugadas en orden. "parda" = empate de baza.
 * @param {"A"|"B"} manoEs
 *   Quién es mano en esta ronda (ventaja en pardas totales).
 * @returns {"A"|"B"|null}
 *   Ganador de la mano, o null si todavía no se puede determinar y falta jugar más bazas.
 */
function resolverGanadorMano(bazas, manoEs) {
  const winsA = bazas.filter(b => b === "A").length;
  const winsB = bazas.filter(b => b === "B").length;
  const n = bazas.length;

  // Regla 1: dos bazas reales ganadas → ese bando gana la mano.
  if (winsA >= 2) return "A";
  if (winsB >= 2) return "B";

  // Con una sola baza nunca se puede cerrar.
  if (n === 1) return null;

  const b1 = bazas[0];
  const b2 = bazas[1];

  // Regla 2: gana 1ª + parda 2ª → gana el de la 1ª (cierre, no se juega la 3ª).
  if (b1 !== "parda" && b2 === "parda") return b1;

  // Regla 3: parda 1ª + gana 2ª → gana el de la 2ª (cierre, no se juega la 3ª).
  if (b1 === "parda" && b2 !== "parda") return b2;

  // Con 2 bazas quedan exactamente dos casos: 1-1 (bazas opuestas) y parda+parda.
  // Ambos necesitan la 3ª baza para decidir.
  if (n === 2) return null;

  // Con 3 bazas: al llegar aquí el marcador tras las 2 primeras es 1-1 o 0-0.
  // Ninguno llegó a 2 ganadas reales.
  // Regla general: gana el primero que tuvo una baza real; si ninguna fue real, gana el mano.
  const primeraReal = bazas.find(b => b !== "parda");
  return primeraReal !== undefined ? primeraReal : manoEs;
}

/**
 * Calcula cuánto vale un Falta Envido según la regla oficial de malas/buenas.
 * Si el puntero (el que va ganando la partida) está en la primera mitad
 * ("malas"), la apuesta es lo que le falta para ENTRAR a la segunda mitad
 * ("buenas"). Si el puntero ya está en buenas, la apuesta es lo que le falta
 * para GANAR la partida.
 *
 * @param {number} puntosObjetivo - puntos para ganar la partida (15 o 30)
 * @param {number} puntosA - puntaje actual de un jugador
 * @param {number} puntosB - puntaje actual del otro jugador
 * @returns {number} puntos en juego si se quiere el Falta Envido
 */
function calcularFalta(puntosObjetivo, puntosA, puntosB) {
  const mitad = Math.ceil(puntosObjetivo / 2);
  const puntero = Math.max(puntosA, puntosB);
  return puntero < mitad
    ? Math.max(1, mitad - puntero)
    : Math.max(1, puntosObjetivo - puntero);
}

module.exports = { resolverGanadorMano, calcularFalta };
