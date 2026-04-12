import { supabase } from "@/lib/supabase/client";

export async function obtenerResumenJugador(usuarioId: string) {
  const { data, error } = await supabase.rpc("obtener_resumen_jugador", {
    p_usuario_id: usuarioId,
  });

  if (error) {
    console.error(error);
    return null;
  }

  return data?.[0] ?? null;
}

