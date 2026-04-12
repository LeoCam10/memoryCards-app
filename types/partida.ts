export type ResultadoPartida = {
  motivo: "completado" | "max_intentos" | "abandono" | "tiempo_agotado";
  ganador: string;
  mensaje: string;
  jugador1Nombre: string;
  jugador2Nombre: string;
  aciertosJugador1: number;
  aciertosJugador2: number;
  intentosJugador1: number;
  intentosJugador2: number;
  puntosFinalesJugador1: number;
  puntosFinalesJugador2: number;
  tiempoJugado: number;
  tiempoConfigurado: number | null;
  dadoJugador1: number | null;
  dadoJugador2: number | null;
  ganadorSorteo: "Jugador 1" | "Jugador 2" | null;
  numeroPartida: number;
};

export type GuardarPartidaParams = {
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


export type PartidaUsuario = {
  partida_id: string;
  fecha: string;
  rival_id: string;
  rival_nombre: string;
  puntos_obtenidos?: number;
  puntos_jugador?: number;
  puntos_rival?: number;
};

export type PartidaEnComun = {
  partida_id: string;
  fecha: string;
  jugador1_nombre: string;
  jugador2_nombre: string;
  puntos_jugador1: number;
  puntos_jugador2: number;
  total_partidas: number;
};

export type RankingItem = {
  usuario_id: string;
  puntos_totales: number;
  posicion: number;
  nombre_usuario?: string;
};

export type Carta = {
  id: number;
  valor: string;
  descubierta: boolean;
  acertada: boolean;
};

export type ConfiguracionPartida = {
  dificultad: "baja" | "media" | "alta";
  tiempo: number | null;
  tipoCartas: string;
};

export type MotivoFin = "completado" | "max_intentos" | "abandono" | "tiempo_agotado";