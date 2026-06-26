import { supabase } from "./supabase";
import { avatarSrc } from "./avatares";

export function getLunesActual() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diff);
  const y = lunes.getFullYear();
  const m = String(lunes.getMonth() + 1).padStart(2, "0");
  const dia = String(lunes.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export async function sumarPuntosRanking(user, perfil, puntosRival, rivalFueAlMazo) {
  if (!user || !perfil) return;

  const semana = getLunesActual();
  let incremento = 100;
  if (puntosRival < 5) incremento += 75;
  else if (puntosRival >= 10) incremento += 50;
  if (rivalFueAlMazo) incremento += 25;

  const { data: existing } = await supabase
    .from("ranking_semanal")
    .select("puntos")
    .eq("user_id", user.id)
    .eq("semana", semana)
    .maybeSingle();

  const nuevosPuntos = (existing?.puntos || 0) + incremento;

  await supabase.from("ranking_semanal").upsert(
    {
      user_id: user.id,
      username: perfil.nombre || "",
      avatar: avatarSrc(perfil.avatar),
      puntos: nuevosPuntos,
      semana,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,semana" }
  );
}
