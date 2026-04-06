"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Usuario = {
  id: string;
  nombre_usuario: string;
  contrasena: string;
  pais: string;
  mayor_12: boolean;
  pais_id?: string | null;
};

type EstadisticasUsuario = {
  mejorPuntaje: number;
  partidasJugadas: number;
  victorias: number;
  ranking: number | null;
  puntosTotales: number;
};

type HistorialEntreAmbos = {
  vecesJugadas: number;
  victoriasJugador1: number;
  victoriasJugador2: number;
  ultimoEnfrentamiento: {
    fecha: string;
    puntosJugador1: number;
    puntosJugador2: number;
    ganador: string;
  } | null;
};

type RankingItem = {
  posicion: number;
  usuarioId: string;
  nombre: string;
  puntosTotales: number;
  mejorPuntaje: number;
  victorias: number;
};

type ConfiguracionPartida = {
  dificultad: "baja" | "media" | "alta";
  tiempo: number | null;
  tipoCartas: string;
};

export default function ConfiguracionPage() {
  const router = useRouter();

  const [jugador1, setJugador1] = useState<Usuario | null>(null);
  const [jugador2, setJugador2] = useState<Usuario | null>(null);

  const [estadisticasJugador1, setEstadisticasJugador1] =
    useState<EstadisticasUsuario | null>(null);
  const [estadisticasJugador2, setEstadisticasJugador2] =
    useState<EstadisticasUsuario | null>(null);
  const [historial, setHistorial] = useState<HistorialEntreAmbos | null>(null);

  const [rankingTop5, setRankingTop5] = useState<RankingItem[]>([]);
  const [cargandoStats, setCargandoStats] = useState(true);

  const [dificultad, setDificultad] = useState<"baja" | "media" | "alta">(
    "media"
  );
  const [tiempo, setTiempo] = useState<number | null>(4);
  const [tipoCartas, setTipoCartas] = useState("animales");

  const [sorteoRealizado, setSorteoRealizado] = useState(false);
  const [turnoInicial, setTurnoInicial] = useState<
    "Jugador 1" | "Jugador 2" | null
  >(null);
  const [dadoJugador1, setDadoJugador1] = useState<number | null>(null);
  const [dadoJugador2, setDadoJugador2] = useState<number | null>(null);
  const [mensajeSorteo, setMensajeSorteo] = useState(
    "Lanzá los dados para decidir quién comienza."
  );
  const [sorteando, setSorteando] = useState(false);

  useEffect(() => {
    const jugadoresGuardados = localStorage.getItem("jugadoresLogueados");

    if (jugadoresGuardados) {
      const parsed = JSON.parse(jugadoresGuardados);
      setJugador1(parsed.jugador1);
      setJugador2(parsed.jugador2);
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const cargarTodo = async () => {
      if (!jugador1 || !jugador2) return;

      setCargandoStats(true);

      const statsJ1 = await obtenerEstadisticasUsuario(jugador1.id);
      const statsJ2 = await obtenerEstadisticasUsuario(jugador2.id);
      const historialAmbos = await obtenerHistorialEntreAmbos(
        jugador1.id,
        jugador2.id,
        jugador1.nombre_usuario,
        jugador2.nombre_usuario
      );
      const ranking = await obtenerRankingTop5();

      setEstadisticasJugador1(statsJ1);
      setEstadisticasJugador2(statsJ2);
      setHistorial(historialAmbos);
      setRankingTop5(ranking);

      setCargandoStats(false);
    };

    cargarTodo();
  }, [jugador1, jugador2]);

  const obtenerEstadisticasUsuario = async (
    usuarioId: string
  ): Promise<EstadisticasUsuario> => {
    const { data: participacionesData } = await supabase
      .from("participaciones")
      .select("puntos_obtenidos")
      .eq("usuario_id", usuarioId);

    const { count: partidasJugadas } = await supabase
      .from("participaciones")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuarioId);

    const { count: victorias } = await supabase
      .from("partidas")
      .select("*", { count: "exact", head: true })
      .eq("ganador_usuario_id", usuarioId);

    const puntos = participacionesData ?? [];
    const mejorPuntaje =
      puntos.length > 0
        ? Math.max(...puntos.map((p: any) => p.puntos_obtenidos ?? 0))
        : 0;

    const puntosTotales = puntos.reduce(
      (acc: number, p: any) => acc + (p.puntos_obtenidos ?? 0),
      0
    );

    const ranking = await obtenerRankingUsuario(usuarioId);

    return {
      mejorPuntaje,
      partidasJugadas: partidasJugadas ?? 0,
      victorias: victorias ?? 0,
      ranking,
      puntosTotales,
    };
  };

  const obtenerRankingUsuario = async (
    usuarioId: string
  ): Promise<number | null> => {
    const ranking = await obtenerRankingTop5(false);
    const encontrado = ranking.find((r) => r.usuarioId === usuarioId);
    return encontrado ? encontrado.posicion : null;
  };

  const obtenerRankingTop5 = async (
    soloTop5: boolean = true
  ): Promise<RankingItem[]> => {
    const { data: participacionesData, error: participacionesError } =
      await supabase
        .from("participaciones")
        .select(
          `
          usuario_id,
          puntos_obtenidos,
          usuarios (
            id,
            nombre_usuario
          )
        `
        );

    const { data: partidasData, error: partidasError } = await supabase
      .from("partidas")
      .select("ganador_usuario_id");

    if (participacionesError || partidasError || !participacionesData) {
      return [];
    }

    const acumuladoPorUsuario: Record<
      string,
      {
        nombre: string;
        puntosTotales: number;
        mejorPuntaje: number;
        victorias: number;
      }
    > = {};

    for (const fila of participacionesData as any[]) {
      const usuarioId = fila.usuario_id;
      const nombre = fila.usuarios?.nombre_usuario ?? "Usuario";
      const puntos = fila.puntos_obtenidos ?? 0;

      if (!acumuladoPorUsuario[usuarioId]) {
        acumuladoPorUsuario[usuarioId] = {
          nombre,
          puntosTotales: 0,
          mejorPuntaje: 0,
          victorias: 0,
        };
      }

      acumuladoPorUsuario[usuarioId].puntosTotales += puntos;

      if (puntos > acumuladoPorUsuario[usuarioId].mejorPuntaje) {
        acumuladoPorUsuario[usuarioId].mejorPuntaje = puntos;
      }
    }

    for (const partida of partidasData ?? []) {
      const ganadorId = (partida as any).ganador_usuario_id;
      if (ganadorId && acumuladoPorUsuario[ganadorId]) {
        acumuladoPorUsuario[ganadorId].victorias += 1;
      }
    }

    const rankingOrdenado = Object.entries(acumuladoPorUsuario)
      .map(([usuarioId, datos]) => ({
        usuarioId,
        nombre: datos.nombre,
        puntosTotales: datos.puntosTotales,
        mejorPuntaje: datos.mejorPuntaje,
        victorias: datos.victorias,
      }))
      .sort((a, b) => {
        if (b.puntosTotales !== a.puntosTotales) {
          return b.puntosTotales - a.puntosTotales;
        }
        if (b.victorias !== a.victorias) {
          return b.victorias - a.victorias;
        }
        return b.mejorPuntaje - a.mejorPuntaje;
      })
      .map((item, index) => ({
        posicion: index + 1,
        ...item,
      }));

    return soloTop5 ? rankingOrdenado.slice(0, 5) : rankingOrdenado;
  };

  const obtenerHistorialEntreAmbos = async (
    usuarioId1: string,
    usuarioId2: string,
    nombre1: string,
    nombre2: string
  ): Promise<HistorialEntreAmbos> => {
    const { data, error } = await supabase
      .from("participaciones")
      .select(
        `
        partida_id,
        usuario_id,
        puntos_obtenidos,
        partidas (
          id,
          fecha,
          ganador_usuario_id
        )
      `
      )
      .in("usuario_id", [usuarioId1, usuarioId2])
      .order("created_at", { ascending: false });

    if (error || !data) {
      return {
        vecesJugadas: 0,
        victoriasJugador1: 0,
        victoriasJugador2: 0,
        ultimoEnfrentamiento: null,
      };
    }

    const agrupadas: Record<string, any[]> = {};

    for (const fila of data as any[]) {
      if (!agrupadas[fila.partida_id]) {
        agrupadas[fila.partida_id] = [];
      }
      agrupadas[fila.partida_id].push(fila);
    }

    let vecesJugadas = 0;
    let victoriasJugador1 = 0;
    let victoriasJugador2 = 0;
    let ultimoEnfrentamiento: HistorialEntreAmbos["ultimoEnfrentamiento"] =
      null;

    for (const partidaId of Object.keys(agrupadas)) {
      const grupo = agrupadas[partidaId];

      const filaJ1 = grupo.find((g) => g.usuario_id === usuarioId1);
      const filaJ2 = grupo.find((g) => g.usuario_id === usuarioId2);

      if (filaJ1 && filaJ2) {
        vecesJugadas++;

        const ganadorUsuarioId = filaJ1.partidas?.ganador_usuario_id;

        if (ganadorUsuarioId === usuarioId1) victoriasJugador1++;
        if (ganadorUsuarioId === usuarioId2) victoriasJugador2++;

        if (!ultimoEnfrentamiento) {
          let ganador = "Empate";

          if (ganadorUsuarioId === usuarioId1) ganador = nombre1;
          if (ganadorUsuarioId === usuarioId2) ganador = nombre2;

          ultimoEnfrentamiento = {
            fecha: filaJ1.partidas?.fecha,
            puntosJugador1: filaJ1.puntos_obtenidos ?? 0,
            puntosJugador2: filaJ2.puntos_obtenidos ?? 0,
            ganador,
          };
        }
      }
    }

    return {
      vecesJugadas,
      victoriasJugador1,
      victoriasJugador2,
      ultimoEnfrentamiento,
    };
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
        setMensajeSorteo("Sorteo realizado.");
      } else if (valor2 > valor1) {
        setTurnoInicial("Jugador 2");
        setSorteoRealizado(true);
        setMensajeSorteo("Sorteo realizado.");
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
                  {rankingTop5.length === 0 ? (
                    <p>No hay datos</p>
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

                    <p>
                      Veces que jugaron: {historial?.vecesJugadas ?? 0}
                    </p>

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
          <h2 className="panel-title">🎲 Sorteo de inicio </h2>

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
              <strong>Empieza:</strong>{" "}
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