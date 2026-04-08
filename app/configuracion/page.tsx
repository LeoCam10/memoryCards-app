"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Jugador = {
  id: string;
  nombre_usuario: string;
};

type ConfiguracionPartida = {
  dificultad: string;
  tiempo: number | null;
  tipoCartas: string;
};

type RankingItem = {
  usuarioId: string;
  nombre: string;
  puntosTotales: number;
  posicion: number;
};

type EstadisticasJugador = {
  ranking: number | string;
  mejorPuntaje: number;
  partidasJugadas: number;
  victorias: number;
  puntosTotales: number;
};

type UltimoEnfrentamiento = {
  fecha: string;
  ganador: string;
  puntosJugador1: number;
  puntosJugador2: number;
};

type HistorialEnfrentamiento = {
  victoriasJugador1: number;
  victoriasJugador2: number;
  vecesJugadas: number;
  ultimoEnfrentamiento: UltimoEnfrentamiento | null;
};

export default function ConfiguracionPage() {
  const router = useRouter();

  const [jugador1, setJugador1] = useState<Jugador | null>(null);
  const [jugador2, setJugador2] = useState<Jugador | null>(null);

  const [dificultad, setDificultad] = useState("media");
  const [tiempo, setTiempo] = useState<number | null>(4);
  const [tipoCartas, setTipoCartas] = useState("animales");

  const [dadoJugador1, setDadoJugador1] = useState<number | null>(null);
  const [dadoJugador2, setDadoJugador2] = useState<number | null>(null);
  const [turnoInicial, setTurnoInicial] = useState<string | null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [sorteoRealizado, setSorteoRealizado] = useState(false);
  const [mensajeSorteo, setMensajeSorteo] = useState("");

  const [rankingTop5, setRankingTop5] = useState<RankingItem[]>([]);
  const [cargandoRankingTop5, setCargandoRankingTop5] = useState(true);

  const [estadisticasJugador1, setEstadisticasJugador1] =
    useState<EstadisticasJugador | null>(null);
  const [estadisticasJugador2, setEstadisticasJugador2] =
    useState<EstadisticasJugador | null>(null);
  const [historial, setHistorial] = useState<HistorialEnfrentamiento | null>(null);
  const [cargandoStats, setCargandoStats] = useState(true);

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
    cargarEstadisticasEHistorial(jugador1, jugador2);
  }, [jugador1, jugador2]);

  const cargarRankingTop5 = async () => {
    try {
      setCargandoRankingTop5(true);

      const { data, error } = await supabase
        .from("participaciones")
        .select(`
          usuario_id,
          puntos_obtenidos,
          usuario:usuarios!participaciones_usuario_id_fkey (
            id,
            nombre_usuario
          )
        `);

      if (error) throw error;

      const acumulado = new Map<string, { nombre: string; puntosTotales: number }>();

      (data || []).forEach((item: any) => {
        const usuarioId = item.usuario_id;
        const nombre = item.usuario?.nombre_usuario ?? "Sin nombre";
        const puntos = Number(item.puntos_obtenidos ?? 0);

        if (!acumulado.has(usuarioId)) {
          acumulado.set(usuarioId, {
            nombre,
            puntosTotales: puntos,
          });
        } else {
          const actual = acumulado.get(usuarioId)!;
          actual.puntosTotales += puntos;
        }
      });

      const ranking = Array.from(acumulado.entries())
        .map(([usuarioId, valor]) => ({
          usuarioId,
          nombre: valor.nombre,
          puntosTotales: valor.puntosTotales,
          posicion: 0,
        }))
        .sort((a, b) => b.puntosTotales - a.puntosTotales)
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          posicion: index + 1,
        }));

      setRankingTop5(ranking);
    } catch (error) {
      console.error("Error al cargar ranking top 5:", error);
      setRankingTop5([]);
    } finally {
      setCargandoRankingTop5(false);
    }
  };

  const obtenerEstadisticasJugador = async (
    jugador: Jugador
  ): Promise<EstadisticasJugador> => {
    const { data: participaciones, error: participacionesError } = await supabase
      .from("participaciones")
      .select("puntos_obtenidos, usuario_id")
      .eq("usuario_id", jugador.id);

    if (participacionesError) throw participacionesError;

    const listaParticipaciones = participaciones || [];

    const partidasJugadas = listaParticipaciones.length;
    const mejorPuntaje = listaParticipaciones.reduce(
      (max, item: any) => Math.max(max, Number(item.puntos_obtenidos ?? 0)),
      0
    );
    const puntosTotales = listaParticipaciones.reduce(
      (sum, item: any) => sum + Number(item.puntos_obtenidos ?? 0),
      0
    );

    const { count: victorias, error: victoriasError } = await supabase
      .from("partidas")
      .select("*", { count: "exact", head: true })
      .eq("ganador_usuario_id", jugador.id);

    if (victoriasError) throw victoriasError;

    const { data: rankingData, error: rankingError } = await supabase
      .from("participaciones")
      .select("usuario_id, puntos_obtenidos");

    if (rankingError) throw rankingError;

    const mapaRanking = new Map<string, number>();

    (rankingData || []).forEach((item: any) => {
      const id = item.usuario_id;
      const puntos = Number(item.puntos_obtenidos ?? 0);
      mapaRanking.set(id, (mapaRanking.get(id) ?? 0) + puntos);
    });

    const rankingOrdenado = Array.from(mapaRanking.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const indiceRanking = rankingOrdenado.findIndex(([id]) => id === jugador.id);

    return {
      ranking: indiceRanking >= 0 ? indiceRanking + 1 : "-",
      mejorPuntaje,
      partidasJugadas,
      victorias: victorias ?? 0,
      puntosTotales,
    };
  };

  const cargarEstadisticasEHistorial = async (
    j1: Jugador,
    j2: Jugador
  ) => {
    try {
      setCargandoStats(true);

      const [stats1, stats2] = await Promise.all([
        obtenerEstadisticasJugador(j1),
        obtenerEstadisticasJugador(j2),
      ]);

      setEstadisticasJugador1(stats1);
      setEstadisticasJugador2(stats2);

      const { data: partidas, error } = await supabase
        .from("partidas")
        .select(`
          id,
          fecha,
          ganador_usuario_id,
          participaciones (
            usuario_id,
            puntos_obtenidos
          )
        `)
        .order("fecha", { ascending: false });

      if (error) throw error;

      const partidasEntreAmbos = (partidas || []).filter((partida: any) => {
        const ids = (partida.participaciones || []).map((p: any) => p.usuario_id);
        return ids.includes(j1.id) && ids.includes(j2.id);
      });

      const victoriasJugador1 = partidasEntreAmbos.filter(
        (partida: any) => partida.ganador_usuario_id === j1.id
      ).length;

      const victoriasJugador2 = partidasEntreAmbos.filter(
        (partida: any) => partida.ganador_usuario_id === j2.id
      ).length;

      let ultimoEnfrentamiento: UltimoEnfrentamiento | null = null;

      if (partidasEntreAmbos.length > 0) {
        const ultima = partidasEntreAmbos[0];

        const participacionJ1 = (ultima.participaciones || []).find(
          (p: any) => p.usuario_id === j1.id
        );
        const participacionJ2 = (ultima.participaciones || []).find(
          (p: any) => p.usuario_id === j2.id
        );

        ultimoEnfrentamiento = {
          fecha: ultima.fecha,
          ganador:
            ultima.ganador_usuario_id === j1.id
              ? j1.nombre_usuario
              : ultima.ganador_usuario_id === j2.id
              ? j2.nombre_usuario
              : "-",
          puntosJugador1: Number(participacionJ1?.puntos_obtenidos ?? 0),
          puntosJugador2: Number(participacionJ2?.puntos_obtenidos ?? 0),
        };
      }

      setHistorial({
        victoriasJugador1,
        victoriasJugador2,
        vecesJugadas: partidasEntreAmbos.length,
        ultimoEnfrentamiento,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas e historial:", error);

      setEstadisticasJugador1({
        ranking: "-",
        mejorPuntaje: 0,
        partidasJugadas: 0,
        victorias: 0,
        puntosTotales: 0,
      });

      setEstadisticasJugador2({
        ranking: "-",
        mejorPuntaje: 0,
        partidasJugadas: 0,
        victorias: 0,
        puntosTotales: 0,
      });

      setHistorial({
        victoriasJugador1: 0,
        victoriasJugador2: 0,
        vecesJugadas: 0,
        ultimoEnfrentamiento: null,
      });
    } finally {
      setCargandoStats(false);
    }
  };

  const lanzarDados = () => {
    if (sorteando) return;

    setSorteando(true);
    setMensajeSorteo("Lanzando dados...");

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
        setMensajeSorteo(
          `${jugador1?.nombre_usuario ?? "Jugador 1"} ganó el sorteo.`
        );
      } else if (valor2 > valor1) {
        setTurnoInicial("Jugador 2");
        setSorteoRealizado(true);
        setMensajeSorteo(
          `${jugador2?.nombre_usuario ?? "Jugador 2"} ganó el sorteo.`
        );
      } else {
        setTurnoInicial(null);
        setSorteoRealizado(false);
        setMensajeSorteo("Empate en el sorteo. Volvé a lanzar los dados.");
      }
    }, 1200);
  };

  const iniciarPartida = () => {
    if (!sorteoRealizado || !turnoInicial) {
      alert("Primero debés realizar el sorteo para definir quién empieza.");
      return;
    }

    const ultimoNumeroGuardado = localStorage.getItem("ultimoNumeroPartida");
    const nuevoNumero = ultimoNumeroGuardado
      ? Number(ultimoNumeroGuardado) + 1
      : 1;

    const configuracion: ConfiguracionPartida = {
      dificultad,
      tiempo,
      tipoCartas,
    };

    localStorage.setItem("ultimoNumeroPartida", String(nuevoNumero));
    localStorage.setItem("numeroPartidaActual", String(nuevoNumero));
    localStorage.setItem("configuracionPartida", JSON.stringify(configuracion));
    localStorage.setItem("turnoInicial", turnoInicial);
    localStorage.setItem("dadoJugador1", String(dadoJugador1 ?? ""));
    localStorage.setItem("dadoJugador2", String(dadoJugador2 ?? ""));

    router.push("/juego");
  };

  const formatearFecha = (fechaIso: string) => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleString("es-AR");
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
                <h3 className="top5-title">Top 5 Ranking</h3>

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
                          key={item.usuarioId}
                          className={`top5-item ${index === 0 ? "top1" : ""}`}
                        >
                          <strong>
                            {medalla} - {item.nombre}
                          </strong>
                          <br />
                          Puntos: {item.puntosTotales}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="match-facts-panel">
              <h2 className="match-title">Estadísticas</h2>

              {cargandoStats ? (
                <p className="summary-text center-box">Cargando estadísticas...</p>
              ) : (
                <>
                  <div className="match-table">
                    <div>{estadisticasJugador1?.ranking ?? "-"}</div>
                    <div>Ranking</div>
                    <div>{estadisticasJugador2?.ranking ?? "-"}</div>

                    <div>{jugador1.nombre_usuario}</div>
                    <div>Jugador</div>
                    <div>{jugador2.nombre_usuario}</div>

                    <div>{estadisticasJugador1?.mejorPuntaje ?? 0}</div>
                    <div>Mejor puntaje</div>
                    <div>{estadisticasJugador2?.mejorPuntaje ?? 0}</div>

                    <div>{estadisticasJugador1?.partidasJugadas ?? 0}</div>
                    <div>Partidas jugadas</div>
                    <div>{estadisticasJugador2?.partidasJugadas ?? 0}</div>

                    <div>{estadisticasJugador1?.victorias ?? 0}</div>
                    <div>Victorias</div>
                    <div>{estadisticasJugador2?.victorias ?? 0}</div>

                    <div>{estadisticasJugador1?.puntosTotales ?? 0}</div>
                    <div>Puntos totales</div>
                    <div>{estadisticasJugador2?.puntosTotales ?? 0}</div>

                    <div>{historial?.victoriasJugador1 ?? 0}</div>
                    <div>Victorias entre ambos</div>
                    <div>{historial?.victoriasJugador2 ?? 0}</div>

                    <div>
                      {historial?.ultimoEnfrentamiento
                        ? historial.ultimoEnfrentamiento.puntosJugador1
                        : 0}
                    </div>
                    <div>Último puntaje</div>
                    <div>
                      {historial?.ultimoEnfrentamiento
                        ? historial.ultimoEnfrentamiento.puntosJugador2
                        : 0}
                    </div>
                  </div>

                  <div className="match-extra">
                    <p>
                      Último ganador:{" "}
                      {historial?.ultimoEnfrentamiento?.ganador ?? "-"}
                    </p>

                    <p>Veces que jugaron: {historial?.vecesJugadas ?? 0}</p>

                    <p>
                      Última partida:{" "}
                      {historial?.ultimoEnfrentamiento
                        ? formatearFecha(historial.ultimoEnfrentamiento.fecha)
                        : "Sin enfrentamientos"}
                    </p>
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