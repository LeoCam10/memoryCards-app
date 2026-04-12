import { GuardarPartidaParams } from "@/types/partida";
import { supabase } from "@/lib/supabase/client";


export async function obtenerPartidasUsuario(usuarioId: string, limit = 1) {
  const { data, error } = await supabase.rpc("obtener_partidas_usuario", {
    p_usuario_id: usuarioId,
    p_limit: limit,
  });

  if (error) {
    console.error("Error al obtener partidas del usuario:", error);
    return [];
  }

  return data ?? [];
}

export async function obtenerPartidasEnComun(
  usuario1Id: string,
  usuario2Id: string,
  limit: number = 1
) {
  const { data, error } = await supabase.rpc("obtener_partidas_en_comun", {
    p_usuario_1: usuario1Id,
    p_usuario_2: usuario2Id,
    p_limit: limit,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function guardarPartidaCompleta({
  motivo,
  tiempoJugado,
  tiempoConfigurado,
  ganadorUsuarioId,
  jugador1,
  jugador2,
}: GuardarPartidaParams) {
  const { data, error } = await supabase.rpc("guardar_partida_completa", {
    p_motivo_fin: motivo,
    p_tiempo_jugado: tiempoJugado,
    p_tiempo_configurado: tiempoConfigurado,
    p_ganador_usuario_id: ganadorUsuarioId,

    p_jugador1_id: jugador1.id,
    p_jugador1_aciertos: jugador1.aciertos,
    p_jugador1_intentos: jugador1.intentos,
    p_jugador1_puntos_obtenidos: jugador1.puntosObtenidos,
    p_jugador1_abandono: jugador1.abandono,

    p_jugador2_id: jugador2.id,
    p_jugador2_aciertos: jugador2.aciertos,
    p_jugador2_intentos: jugador2.intentos,
    p_jugador2_puntos_obtenidos: jugador2.puntosObtenidos,
    p_jugador2_abandono: jugador2.abandono,
  });

  if (error) {
    console.error("Error al guardar partida completa:", error);
    throw error;
  }

  return data;
}
