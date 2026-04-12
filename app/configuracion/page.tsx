"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ConfiguracionPartida,
  PartidaUsuario,
  RankingItem,
} from "@/types/partida";
import { obtenerRanking } from "@/services/rankingService";
import {
  obtenerPartidasUsuario,
  obtenerPartidasEnComun,
} from "@/services/partidaService";
import { JugadorPerfil } from "@/types/usuario";


export default function ConfiguracionPage() {
  const router = useRouter();

  const [jugador1, setJugador1] = useState<JugadorPerfil | null>(null);
  const [jugador2, setJugador2] = useState<JugadorPerfil | null>(null);

  const [dificultad, setDificultad] = useState("media");
  const [tiempo, setTiempo] = useState<number | null>(4);
  const [tipoCartas, setTipoCartas] = useState("animales");

  const [dadoJugador1, setDadoJugador1] = useState<number | null>(null);
  const [dadoJugador2, setDadoJugador2] = useState<number | null>(null);
  const [turnoInicial, setTurnoInicial] = useState<string | null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [sorteoRealizado, setSorteoRealizado] = useState(false);

  const [rankingTop5, setRankingTop5] = useState<RankingItem[]>([]);
  const [cargandoRankingTop5, setCargandoRankingTop5] = useState(true);

  const [ultimasPartidasJugador1, setUltimasPartidasJugador1] = useState<
    PartidaUsuario[]
  >([]);
  const [ultimasPartidasJugador2, setUltimasPartidasJugador2] = useState<
    PartidaUsuario[]
  >([]);
  const [cargandoUltimasPartidas, setCargandoUltimasPartidas] = useState(true);

  useEffect(() => {
    const jugadoresGuardados = localStorage.getItem("jugadoresLogueados");

    if (!jugadoresGuardados) {
      router.push("/");
      return;
    }

    try {
      const jugadores = JSON.parse(jugadoresGuardados);

      if (!jugadores.jugador1 || !jugadores.jugador2) {
        router.push("/");
        return;
      }

      setJugador1(jugadores.jugador1);
      setJugador2(jugadores.jugador2);
    } catch (error) {
      console.error("Error al leer jugadores del localStorage:", error);
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!jugador1 || !jugador2) return;

    cargarRankingTop5();
    cargarUltimasPartidas(jugador1, jugador2);
  }, [jugador1, jugador2]);

  const cargarRankingTop5 = async () => {
    try {
      setCargandoRankingTop5(true);

      const data = await obtenerRanking();

      if (Array.isArray(data)) {
        setRankingTop5(data);
      } else {
        setRankingTop5([]);
      }
    } catch (error) {
      console.error("Error al cargar ranking top 5:", error);
      setRankingTop5([]);
    } finally {
      setCargandoRankingTop5(false);
    }
  };

  const cargarUltimasPartidas = async (j1: JugadorPerfil, j2: JugadorPerfil) => {
    try {
      setCargandoUltimasPartidas(true);

      const [partidasJ1, partidasJ2] = await Promise.all([
        obtenerPartidasUsuario(j1.id, 5),
        obtenerPartidasUsuario(j2.id, 5),
      ]);

      setUltimasPartidasJugador1(Array.isArray(partidasJ1) ? partidasJ1 : []);
      setUltimasPartidasJugador2(Array.isArray(partidasJ2) ? partidasJ2 : []);
    } catch (error) {
      console.error("Error al cargar últimas partidas:", error);
      setUltimasPartidasJugador1([]);
      setUltimasPartidasJugador2([]);
    } finally {
      setCargandoUltimasPartidas(false);
    }
  };

  const lanzarDados = () => {
    if (sorteando) return;

    setSorteando(true);

    const intervalo = setInterval(() => {
      setDadoJugador1(Math.floor(Math.random() * 6) + 1);
      setDadoJugador2(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(intervalo);

      const valor1 = Math.floor(Math.random() * 6) + 1;
      const valor2 = Math.floor(Math.random() * 6) + 1;

      setDadoJugador1(valor1);
      setDadoJugador2(valor2);
      setSorteando(false);

      if (valor1 > valor2) {
        setTurnoInicial("Jugador 1");
        setSorteoRealizado(true);
      } else if (valor2 > valor1) {
        setTurnoInicial("Jugador 2");
        setSorteoRealizado(true);
      } else {
        setTurnoInicial(null);
        setSorteoRealizado(false);
      }
    }, 1200);
  };

 const iniciarPartida = async () => {
  if (!sorteoRealizado || !turnoInicial) {
    alert("Primero debés realizar el sorteo para definir quién empieza.");
    return;
  }

  if (!jugador1 || !jugador2) {
    alert("No se encontraron los jugadores logueados.");
    return;
  }

  try {
    const partidasEnComun = await obtenerPartidasEnComun(
      jugador1.id,
      jugador2.id,
      1
    );

    const totalPartidas = partidasEnComun[0]?.total_partidas ?? 0;
    const nuevoNumero = totalPartidas + 1;

    const configuracion: ConfiguracionPartida = {
      dificultad,
      tiempo,
      tipoCartas,
    };

    localStorage.setItem("numeroPartidaActual", String(nuevoNumero));
    localStorage.setItem("configuracionPartida", JSON.stringify(configuracion));
    localStorage.setItem("turnoInicial", turnoInicial);
    localStorage.setItem("dadoJugador1", String(dadoJugador1 ?? ""));
    localStorage.setItem("dadoJugador2", String(dadoJugador2 ?? ""));

    router.push("/juego");
  } catch (error) {
    console.error("Error al calcular el número de partida:", error);
    alert("No se pudo iniciar la partida.");
  }
};

  const formatearPartidaCorta = (partida: PartidaUsuario) => {
    const fecha = new Date(partida.fecha).toLocaleDateString("es-AR");
    return `${fecha} vs ${partida.rival_nombre} ${partida.puntos_jugador ?? 0}-${partida.puntos_rival ?? 0} pts`;
  };

  return (
    <main className="page">
      <div className="container">
        <h1 className="page-title">Configuración de Partida</h1>

        {jugador1 && jugador2 && (
          <div className="summary-layout">
            <div className="top-section">
              <div className="hero-image-card">
                <img
                  src="/imagenes/memory-banner.jpg"
                  alt="Memory banner"
                  className="hero-image"
                />
              </div>

              <div className="top5-ranking-box">
                <h3 className="top5-title">TOP 5</h3>

                <div className="top5-list">
                  {cargandoRankingTop5 ? (
                    <p className="summary-text center-box">Cargando ranking...</p>
                  ) : rankingTop5.length === 0 ? (
                    <p className="summary-text center-box">No hay datos</p>
                  ) : (
                    rankingTop5.slice(0, 5).map((item, index) => {
                      const medalla =
                        index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `#${item.posicion}`;

                      return (
                        <div
                          key={item.usuario_id}
                          className={`top5-item ${index === 0 ? "top1" : ""}`}
                        >
                          <strong>
                            {medalla} - {item.nombre_usuario ?? item.usuario_id}
                          </strong>
                          <br />
                          Puntos: {item.puntos_totales}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="match-facts-panel">
              <h2 className="match-title">Las últimas 5 🔥🔥</h2>

              {cargandoUltimasPartidas ? (
                <p className="summary-text center-box">Cargando partidas...</p>
              ) : (
                <>
                  <div className="match-table">
                    <div>
                      <strong>{jugador1.nombre_usuario}</strong>
                    </div>
                    <div>Partida</div>
                    <div>
                      <strong>{jugador2.nombre_usuario}</strong>
                    </div>

                    {Array.from({ length: 5 }).map((_, index) => {
                      const partidaJ1 = ultimasPartidasJugador1[index];
                      const partidaJ2 = ultimasPartidasJugador2[index];

                      return (
                        <Fragment key={index}>
                          <div>
                            {partidaJ1 ? formatearPartidaCorta(partidaJ1) : "-"}
                          </div>

                          <div>#{index + 1}</div>

                          <div>
                            {partidaJ2 ? formatearPartidaCorta(partidaJ2) : "-"}
                          </div>
                        </Fragment>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="panel center-box">
          <h2 className="panel-title">🎲 Sorteo de inicio</h2>

          <div className="dice-cards-row">
            <div className="dice-player-card">
              <h3>{jugador1?.nombre_usuario ?? "Jugador 1"}</h3>
              <div className="dice-number">{dadoJugador1 ?? "-"}</div>
            </div>

            <div className="dice-player-card">
              <h3>{jugador2?.nombre_usuario ?? "Jugador 2"}</h3>
              <div className="dice-number">{dadoJugador2 ?? "-"}</div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={lanzarDados}
            disabled={sorteando}
          >
            {sorteando ? "Sorteando..." : "Lanzar dados"}
          </button>

          {sorteoRealizado && turnoInicial && (
            <p className="start-text">
              <strong>Jugador que configura e inicia la partida :</strong>{" "}
              {turnoInicial === "Jugador 1"
                ? jugador1?.nombre_usuario ?? "Jugador 1"
                : jugador2?.nombre_usuario ?? "Jugador 2"}
            </p>
          )}
        </div>

        <div
          style={{
            opacity: sorteoRealizado ? 1 : 0.5,
            pointerEvents: sorteoRealizado ? "auto" : "none",
          }}
        >
          <div className="panel">
            <div className="selection-group">
              <h3>Dificultad</h3>
              <div className="button-row">
                <button
                  className={`btn ${
                    dificultad === "baja" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setDificultad("baja")}
                >
                  Baja (8 cartas)
                </button>

                <button
                  className={`btn ${
                    dificultad === "media" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setDificultad("media")}
                >
                  Media (16 cartas)
                </button>

                <button
                  className={`btn ${
                    dificultad === "alta" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setDificultad("alta")}
                >
                  Alta (32 cartas)
                </button>
              </div>
            </div>

            <div className="selection-group">
              <h3>Tiempo máximo</h3>
              <div className="button-row">
                <button
                  className={`btn ${
                    tiempo === 4 ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setTiempo(4)}
                >
                  4 min
                </button>

                <button
                  className={`btn ${
                    tiempo === 15 ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setTiempo(15)}
                >
                  15 min
                </button>

                <button
                  className={`btn ${
                    tiempo === 20 ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setTiempo(20)}
                >
                  20 min
                </button>

                <button
                  className={`btn ${
                    tiempo === null ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setTiempo(null)}
                >
                  Sin tiempo máximo
                </button>
              </div>
            </div>

            <div className="selection-group">
              <h3>Tipo de cartas</h3>
              <div className="button-row">
                <button
                  className={`btn ${
                    tipoCartas === "animales" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setTipoCartas("animales")}
                >
                  Animales
                </button>

                <button
                  className={`btn ${
                    tipoCartas === "numeros" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setTipoCartas("numeros")}
                >
                  Números
                </button>

                <button
                  className={`btn ${
                    tipoCartas === "colores" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setTipoCartas("colores")}
                >
                  Colores
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={iniciarPartida}
            disabled={!sorteoRealizado}
          >
            Iniciar Partida
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => router.push("/")}
          >
            Volver
          </button>
        </div>
      </div>
    </main>
  );
}