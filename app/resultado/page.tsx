"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResultadoPartida } from "@/types/juego";
import { formatearTiempo } from "@/utils/formatters";

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

  const valorGanadorJugador1 =
    resultado?.ganador === resultado?.jugador1Nombre ? "✅" : "-";

  const valorGanadorJugador2 =
    resultado?.ganador === resultado?.jugador2Nombre ? "✅" : "-";

  const valorComenzoJugador1 =
    resultado?.ganadorSorteo === "Jugador 1" ? "Sí" : "-";

  const valorComenzoJugador2 =
    resultado?.ganadorSorteo === "Jugador 2" ? "Sí" : "-";

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

            <div>{valorGanadorJugador1}</div>
            <div>Ganador</div>
            <div>{valorGanadorJugador2}</div>

            <div>{resultado.aciertosJugador1}</div>
            <div>Aciertos</div>
            <div>{resultado.aciertosJugador2}</div>

            <div>{resultado.intentosJugador1}</div>
            <div>Intentos</div>
            <div>{resultado.intentosJugador2}</div>

            <div>{resultado.puntosFinalesJugador1}</div>
            <div>Puntos</div>
            <div>{resultado.puntosFinalesJugador2}</div>

            <div>{resultado.dadoJugador1 ?? "-"}</div>
            <div>Dado del sorteo</div>
            <div>{resultado.dadoJugador2 ?? "-"}</div>

            <div>{valorComenzoJugador1}</div>
            <div>Comenzó</div>
            <div>{valorComenzoJugador2}</div>
          </div>

          <div className="match-extra">
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