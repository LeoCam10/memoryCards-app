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




export async function obtenerPuntajeEnPartida(
  usuarioId: string,
  partidaId: string | null = null
) {
  const { data, error } = await supabase.rpc("obtener_puntaje_en_partida", {
    p_usuario_id: usuarioId,
    p_partida_id: partidaId,
  });

  if (error) {
    console.error(error);
    return null;
  }

  return data?.[0] ?? null;
}

type GuardarPartidaParams = {
  motivo: "completado" | "max_intentos" | "abandono" | "tiempo_agotado";
  tiempoJugado: number;
  tiempoConfigurado: number | null;
  ganadorUsuarioId: string | null;
  jugador1: {
    id: string;
    aciertos: number;
    intentos: number;
    puntosObtenidos: number;
    abandono: boolean;
  };
  jugador2: {
    id: string;
    aciertos: number;
    intentos: number;
    puntosObtenidos: number;
    abandono: boolean;
  };
};

export async function guardarPartidaCompleta({
  motivo,
  tiempoJugado,
  tiempoConfigurado,
  ganadorUsuarioId,
  jugador1,
  jugador2,
}: GuardarPartidaParams) {

  const { data: partidaData, error: partidaError } = await supabase
    .from("partidas")
    .insert([
      {
        motivo_fin: motivo,
        tiempo_jugado: tiempoJugado,
        tiempo_configurado: tiempoConfigurado,
        ganador_usuario_id: ganadorUsuarioId,
      },
    ])
    .select()
    .single();

  if (partidaError || !partidaData) {
    console.error("partidaError", partidaError);
    throw partidaError ?? new Error("No se pudo guardar la partida");
  }

  const { error: participacionError } = await supabase
    .from("participaciones")
    .insert([
      {
        partida_id: partidaData.id,
        usuario_id: jugador1.id,
        aciertos: jugador1.aciertos,
        intentos: jugador1.intentos,
        puntos_obtenidos: jugador1.puntosObtenidos,
        abandono: jugador1.abandono,
      },
      {
        partida_id: partidaData.id,
        usuario_id: jugador2.id,
        aciertos: jugador2.aciertos,
        intentos: jugador2.intentos,
        puntos_obtenidos: jugador2.puntosObtenidos,
        abandono: jugador2.abandono,
      },
    ]);

  if (participacionError) {
    console.error("participacionError", participacionError);
    throw participacionError;
  }

  return partidaData;
}

export async function obtenerUsuariosDePartida(partidaId: string) {
  const { data, error } = await supabase.rpc("obtener_usuarios_de_partida", {
    p_partida_id: partidaId,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}