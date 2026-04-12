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