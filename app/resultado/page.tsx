"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResultadoPartida } from "@/types/partida";
import { formatearTiempo } from "@/utils/formatearTiempo";

export default function ResultadoPage() {
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);

  useEffect(() => {
    const resultadoGuardado = localStorage.getItem("resultadoPartida");

    if (!resultadoGuardado) return;

    try {
      const parsed = JSON.parse(resultadoGuardado) as ResultadoPartida;
      setResultado(parsed);
    } catch (error) {
      console.error("Error al leer resultadoPartida:", error);
      setResultado(null);
    }
  }, []);

  if (!resultado) {
    return (
      <main className="page">
        <div className="container">
          <h1 className="page-title">No hay resultado disponible</h1>

          <div className="page-actions">
            <button
              onClick={() => router.push("/configuracion")}
              className="btn btn-primary"
            >
              Ir a configuración
            </button>

            <button
              onClick={() => router.push("/")}
              className="btn btn-secondary"
            >
              Volver a inicio
            </button>
          </div>
        </div>
      </main>
    );
  }

  const ganadorJugador1 =
    resultado.ganador === resultado.jugador1Nombre ? "✅" : "-";

  const ganadorJugador2 =
    resultado.ganador === resultado.jugador2Nombre ? "✅" : "-";

  const motivoTexto =
    resultado.motivo === "completado"
      ? "Se descubrieron todos los pares"
      : resultado.motivo === "max_intentos"
      ? "Se alcanzó el máximo de intentos"
      : resultado.motivo === "abandono"
      ? "Un jugador abandonó la partida"
      : "Se agotó el tiempo máximo";

  return (
    <main className="page">
      <div className="container">
        <div className="panel result-panel-compact">
          <h2 className="match-title">Resultado de la partida</h2>

          <p>
            <strong>Partida:</strong>{" "}
            <span className="highlight">#{resultado.numeroPartida}</span>
          </p>

          <div className="match-table">
            <div>{resultado.jugador1Nombre}</div>
            <div>Jugador</div>
            <div>{resultado.jugador2Nombre}</div>

            <div>{ganadorJugador1}</div>
            <div>Ganador</div>
            <div>{ganadorJugador2}</div>

            <div>{resultado.aciertosJugador1}</div>
            <div>Aciertos</div>
            <div>{resultado.aciertosJugador2}</div>

            <div>{resultado.intentosJugador1}</div>
            <div>Intentos</div>
            <div>{resultado.intentosJugador2}</div>

            <div>{resultado.puntosFinalesJugador1}</div>
            <div>Puntos</div>
            <div>{resultado.puntosFinalesJugador2}</div>
          </div>

          <div className="match-extra">
            <p>
              <strong>Motivo de finalización:</strong> {motivoTexto}
            </p>

            <p>
              <strong>Mensaje:</strong> {resultado.mensaje}
            </p>

            <p>
              <strong>Tiempo jugado:</strong>{" "}
              {formatearTiempo(resultado.tiempoJugado)}
            </p>
          </div>

          <div className="result-actions">
            <button
              onClick={() => router.push("/configuracion")}
              className="btn btn-primary"
            >
              Jugar otra partida
            </button>

            <button
              onClick={() => router.push("/")}
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