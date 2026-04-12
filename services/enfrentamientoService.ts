import { supabase } from "@/lib/supabase/client";

export async function obtenerPartidasEnComun(
  usuario1Id: string,
  usuario2Id: string
) {
  const { data, error } = await supabase.rpc("obtener_partidas_en_comun", {
    p_usuario_1: usuario1Id,
    p_usuario_2: usuario2Id,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function obtenerVictorias(
  usuarioId: string,
  partidasIds?: string[]
) {
  const { data, error } = await supabase.rpc("obtener_victorias", {
    p_usuario_id: usuarioId,
    p_partidas_ids: partidasIds ?? null,
  });

  if (error) {
    console.error(error);
    return 0;
  }

  return data?.[0]?.total_victorias ?? 0;
}