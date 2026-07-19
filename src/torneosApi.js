import { supabase } from "./supabase";

async function tieneOtroTorneoActivo(userId) {
  const { data: inscripciones } = await supabase
    .from("torneo_jugadores")
    .select("torneo_id")
    .eq("jugador_id", userId);
  const torneoIds = [...new Set((inscripciones || []).map(i => i.torneo_id))];
  if (torneoIds.length === 0) return false;
  const { data: torneosActivos } = await supabase
    .from("torneos")
    .select("id")
    .in("id", torneoIds)
    .in("estado", ["abierto", "en_curso"])
    .limit(1);
  return (torneosActivos?.length || 0) > 0;
}

export async function crearTorneo({ user, perfil, nombre, maxJugadores, entrada, puntos }) {
  if (!nombre.trim()) return { error: "Ingresá un nombre para el torneo." };

  if (await tieneOtroTorneoActivo(user.id)) {
    return { error: "Ya estás anotado en otro torneo. Solo podés participar de uno a la vez." };
  }

  const { data, error } = await supabase.from("torneos").insert({
    nombre: nombre.trim(),
    estado: "abierto",
    max_jugadores: maxJugadores,
    jugadores_actuales: 0,
    entrada: entrada,
    puntos: puntos,
    premio: 0,
    creado_por: user.id,
  }).select().single();
  if (error) return { error: "Error al crear torneo" };

  const joinResult = await unirseATorneo({ user, perfil, torneo: data });
  if (joinResult?.error) return { error: joinResult.error };

  return { data };
}

export async function unirseATorneo({ user, perfil, torneo }) {
  const { data: yaInscripto } = await supabase
    .from("torneo_jugadores")
    .select("id")
    .eq("torneo_id", torneo.id)
    .eq("jugador_id", user.id)
    .maybeSingle();
  if (yaInscripto) return { error: "Ya estás inscripto" };
  if (torneo.jugadores_actuales >= torneo.max_jugadores) return { error: "El torneo está lleno" };

  if (await tieneOtroTorneoActivo(user.id)) {
    return { error: "Ya estás anotado en otro torneo. Solo podés participar de uno a la vez." };
  }

  await supabase.from("torneo_jugadores").insert({
    torneo_id: torneo.id,
    jugador_id: user.id,
    nombre_jugador: perfil?.nombre || user.email?.split("@")[0] || "Jugador",
    posicion: 0,
    eliminado: false,
  });

  await supabase.from("torneos").update({
    jugadores_actuales: torneo.jugadores_actuales + 1,
    premio: (torneo.jugadores_actuales + 1) * torneo.entrada,
  }).eq("id", torneo.id);

  return { data: true };
}
