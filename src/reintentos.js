// Espera (en ms) antes de reintentar una conexión: crece de forma exponencial con el número de intento
// (0 = el primero), con un tope, y se multiplica por un factor al azar entre 0,7 y 1,3 para que muchos
// clientes caídos a la vez no reintenten todos en el mismo instante.
export function esperaReintento(intento, base = 1500, max = 30000) {
  const espera = Math.min(max, base * Math.pow(2, Math.max(0, intento)));
  return Math.round(espera * (0.7 + Math.random() * 0.6));
}
