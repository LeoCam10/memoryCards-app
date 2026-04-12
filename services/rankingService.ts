import { supabase } from "@/lib/supabase/client";

export async function obtenerRanking(limit = 5) {
  const { data, error } = await supabase.rpc("obtener_ranking_general", {
    p_limit: limit,
  });

  if (error) {
    console.error("Error al obtener ranking:", error);
    return [];
  }

  return data ?? [];
}