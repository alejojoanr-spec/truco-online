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
  if (joinResult?.error) {
    const { error: cancelError } = await supabase.rpc("cancelar_torneo", { p_torneo_id: data.id });
    if (cancelError) console.error("crearTorneo: no se pudo cancelar el torneo huérfano:", cancelError);
    return { error: joinResult.error };
  }

  return { data };
}

export async function unirseATorneo({ user, torneo }) {
  if (torneo.jugadores_actuales >= torneo.max_jugadores) return { error: "El torneo está lleno" };

  const { data: yaInscripto } = await supabase
    .from("torneo_jugadores")
    .select("id")
    .eq("torneo_id", torneo.id)
    .eq("jugador_id", user.id)
    .maybeSingle();
  if (yaInscripto) return { error: "Ya estás inscripto" };

  const { error } = await supabase.rpc("inscribir_torneo", { p_torneo_id: torneo.id });
  if (error) return { error: error.message };

  return { data: true };
}
