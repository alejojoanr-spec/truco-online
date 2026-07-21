import { supabase } from "./supabase";

export async function tienePartidaActiva(userId) {
  const { data } = await supabase
    .from("partidas")
    .select("id")
    .in("estado", ["esperando", "jugando"])
    .or(`jugador1_id.eq.${userId},jugador2_id.eq.${userId}`)
    .limit(1);
  return (data?.length || 0) > 0;
}
