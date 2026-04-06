"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ResultadoPartida = {
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

export default function ResultadoPage() {
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);

  useEffect(() => {
    const resultadoGuardado = localStorage.getItem("resultadoPartida");
    if (resultadoGuardado) {
      setResultado(JSON.parse(resultadoGuardado));
    }
  }, []);

  const volverAConfiguracion = () => {
    router.push("/configuracion");
  };

  const volverAInicio = () => {
    router.push("/");
  };

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;

    return `${String(minutos).padStart(2, "0")}:${String(
      segundosRestantes
    ).padStart(2, "0")}`;
  };

  if (!resultado) {
    return (
      <main className="page">
        <div className="container">
          <h1 className="page-title">No hay resultado disponible</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <h1 className="page-title">Resultado final</h1>

        <div className="panel result-panel-compact">
          <p>
            <strong>Partida:</strong>{" "}
            <span className="highlight">#{resultado.numeroPartida}</span>
          </p>

          <p>
            <strong>Ganador:</strong> {resultado.ganador}
          </p>

          <p>
            <strong>Mensaje:</strong> {resultado.mensaje}
          </p>

          <p>
            <strong>Aciertos {resultado.jugador1Nombre}:</strong>{" "}
            {resultado.aciertosJugador1}
          </p>

          <p>
            <strong>Aciertos {resultado.jugador2Nombre}:</strong>{" "}
            {resultado.aciertosJugador2}
          </p>

          <p>
            <strong>Intentos {resultado.jugador1Nombre}:</strong>{" "}
            {resultado.intentosJugador1}
          </p>

          <p>
            <strong>Intentos {resultado.jugador2Nombre}:</strong>{" "}
            {resultado.intentosJugador2}
          </p>

          <p>
            <strong>Puntos {resultado.jugador1Nombre}:</strong>{" "}
            {resultado.puntosFinalesJugador1}
          </p>

          <p>
            <strong>Puntos {resultado.jugador2Nombre}:</strong>{" "}
            {resultado.puntosFinalesJugador2}
          </p>

          <p>
            <strong>Tiempo jugado:</strong>{" "}
            {formatearTiempo(resultado.tiempoJugado)}
          </p>

          <div className="result-actions">
            <button
              onClick={volverAConfiguracion}
              className="btn btn-primary"
            >
              Jugar otra partida
            </button>

            <button
              onClick={volverAInicio}
              className="btn btn-secondary"
            >
                Volver a inicio
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}