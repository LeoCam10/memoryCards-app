"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPartidaCompleta } from "@/services/partidaService";
import { animales, numeros, colores } from "@/data/cartas";
import { Carta, ConfiguracionPartida, MotivoFin } from "@/types/partida";
import { JugadorPerfil } from "@/types/usuario";

type ResultadoPartida = {
  motivo: MotivoFin;
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

export default function JuegoPage() {
  const router = useRouter();
  const redireccionandoRef = useRef(false);

  const [configuracion, setConfiguracion] =
    useState<ConfiguracionPartida | null>(null);
  const [numeroPartidaActual, setNumeroPartidaActual] = useState(1);

  const [jugador1, setJugador1] = useState<JugadorPerfil | null>(null);
  const [jugador2, setJugador2] = useState<JugadorPerfil | null>(null);

  const [turnoActual, setTurnoActual] = useState<
    "Jugador 1" | "Jugador 2" | null
  >(null);
  const [turnoInicial, setTurnoInicial] = useState<
    "Jugador 1" | "Jugador 2" | null
  >(null);

  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

  const [intentosJugador1, setIntentosJugador1] = useState(0);
  const [intentosJugador2, setIntentosJugador2] = useState(0);

  const [aciertosJugador1, setAciertosJugador1] = useState(0);
  const [aciertosJugador2, setAciertosJugador2] = useState(0);

  const [cartasSeleccionadas, setCartasSeleccionadas] = useState<number[]>([]);
  const [cartas, setCartas] = useState<Carta[]>([]);

  const obtenerMaximoIntentos = (dificultad: string) => {
    if (dificultad === "baja") return 20;
    if (dificultad === "media") return 40;
    return 64;
  };

  const obtenerCantidadPares = (dificultad: string) => {
    if (dificultad === "baja") return 4;
    if (dificultad === "media") return 8;
    return 16;
  };

  const generarCartas = (tipo: string, dificultad: string): Carta[] => {
    const mapa = { animales, numeros, colores };
    const valores = mapa[tipo as keyof typeof mapa] || [];

    const cantidadPares = obtenerCantidadPares(dificultad);
    const seleccionados = valores.slice(0, cantidadPares);
    const duplicadas = [...seleccionados, ...seleccionados];
    const mezcladas = [...duplicadas].sort(() => Math.random() - 0.5);

    return mezcladas.map((valor, index) => ({
      id: index + 1,
      valor,
      descubierta: false,
      acertada: false,
    }));
  };

  useEffect(() => {
    const configGuardada = localStorage.getItem("configuracionPartida");
    const jugadoresGuardados = localStorage.getItem("jugadoresLogueados");
    const numeroPartida = localStorage.getItem("numeroPartidaActual");
    const turnoInicialGuardado = localStorage.getItem("turnoInicial");

    if (!configGuardada || !jugadoresGuardados) {
      router.push("/");
      return;
    }

    const config: ConfiguracionPartida = JSON.parse(configGuardada);
    const jugadores = JSON.parse(jugadoresGuardados);

    setConfiguracion(config);
    setJugador1(jugadores.jugador1);
    setJugador2(jugadores.jugador2);

    setCartas(generarCartas(config.tipoCartas, config.dificultad));

    if (config.tiempo === null) setTiempoRestante(null);
    else setTiempoRestante(config.tiempo * 60);

    if (numeroPartida) {
      setNumeroPartidaActual(Number(numeroPartida));
    }

    if (
      turnoInicialGuardado === "Jugador 1" ||
      turnoInicialGuardado === "Jugador 2"
    ) {
      setTurnoInicial(turnoInicialGuardado);
      setTurnoActual(turnoInicialGuardado);
    } else {
      router.push("/configuracion");
    }
  }, [router]);

  useEffect(() => {
    if (!configuracion || tiempoRestante === null) return;

    if (tiempoRestante <= 0) {
      finalizarPartida("tiempo_agotado");
      return;
    }

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [tiempoRestante, configuracion]);

  const formatearTiempo = (segundos: number | null) => {
    if (segundos === null) return "Sin límite";
    if (typeof segundos !== "number" || Number.isNaN(segundos) || segundos < 0) {
      return "00:00";
    }

    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;

    return `${String(minutos).padStart(2, "0")}:${String(
      segundosRestantes
    ).padStart(2, "0")}`;
  };

  const obtenerMensajePorRendimiento = (gano: boolean, porcentaje: number) => {
    if (gano) {
      if (porcentaje === 100) return "¡¡¡EXCELENTE MEMORIA!!!";
      if (porcentaje >= 80) return "¡¡¡MUY BUENA MEMORIA!!!";
      if (porcentaje >= 60) return "¡¡¡BUENA MEMORIA!!! ¡¡¡Puedes mejorar!!!";
      return "¡¡¡Ganaste, pero necesitas entrenar más tu memoria!!!";
    }

    if (porcentaje >= 80) return "¡¡¡MUY BUENA MEMORIA!!!";
    if (porcentaje >= 60) return "¡¡¡BUENA MEMORIA!!! ¡¡¡Puedes mejorar!!!";
    return "¡¡¡Mala memoria, debes practicar más!!!";
  };

  const seleccionarCarta = (id: number) => {
    if (redireccionandoRef.current || !turnoActual) return;

    const carta = cartas.find((c) => c.id === id);
    if (!carta || carta.descubierta || carta.acertada) return;
    if (cartasSeleccionadas.length === 2) return;

    const nuevasCartas = cartas.map((c) =>
      c.id === id ? { ...c, descubierta: true } : c
    );

    const nuevasSeleccionadas = [...cartasSeleccionadas, id];

    setCartas(nuevasCartas);
    setCartasSeleccionadas(nuevasSeleccionadas);

    if (nuevasSeleccionadas.length === 2) {
      if (turnoActual === "Jugador 1") setIntentosJugador1((p) => p + 1);
      else setIntentosJugador2((p) => p + 1);

      const [id1, id2] = nuevasSeleccionadas;
      const c1 = nuevasCartas.find((c) => c.id === id1);
      const c2 = nuevasCartas.find((c) => c.id === id2);

      if (!c1 || !c2) return;

      if (c1.valor === c2.valor) {
        if (turnoActual === "Jugador 1") setAciertosJugador1((p) => p + 1);
        else setAciertosJugador2((p) => p + 1);

        setTimeout(() => {
          setCartas((prev) => {
            const actualizadas = prev.map((c) =>
              c.id === id1 || c.id === id2 ? { ...c, acertada: true } : c
            );

            const todasAcertadas = actualizadas.every((c) => c.acertada);
            if (todasAcertadas) {
              setTimeout(() => {
                finalizarPartida("completado");
              }, 300);
            }

            return actualizadas;
          });

          setCartasSeleccionadas([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCartas((prev) =>
            prev.map((c) =>
              c.id === id1 || c.id === id2
                ? { ...c, descubierta: false }
                : c
            )
          );

          setCartasSeleccionadas([]);
          setTurnoActual((prev) =>
            prev === "Jugador 1" ? "Jugador 2" : "Jugador 1"
          );
        }, 1000);
      }
    }
  };

  const finalizarPartida = async (motivo: MotivoFin) => {
    if (redireccionandoRef.current) return;
    redireccionandoRef.current = true;

    const totalPares = cartas.length / 2;
    const tiempoConfiguradoEnSegundos =
      configuracion?.tiempo === null ? null : (configuracion?.tiempo ?? 0) * 60;

    const tiempoJugado =
      tiempoConfiguradoEnSegundos === null || tiempoRestante === null
        ? 0
        : tiempoConfiguradoEnSegundos - tiempoRestante;

    let ganador = "";
    let mensaje = "";
    let ganadorUsuarioId: string | null = null;
    let puntos1 = 0;
    let puntos2 = 0;

    if (motivo === "completado") {
      if (aciertosJugador1 > aciertosJugador2) {
        ganador = jugador1?.nombre_usuario ?? "Jugador 1";
        ganadorUsuarioId = jugador1?.id ?? null;
        puntos1 = 12;
        const porcentaje = Math.round((aciertosJugador1 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else if (aciertosJugador2 > aciertosJugador1) {
        ganador = jugador2?.nombre_usuario ?? "Jugador 2";
        ganadorUsuarioId = jugador2?.id ?? null;
        puntos2 = 12;
        const porcentaje = Math.round((aciertosJugador2 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else {
        if (intentosJugador1 < intentosJugador2) {
          ganador = jugador1?.nombre_usuario ?? "Jugador 1";
          ganadorUsuarioId = jugador1?.id ?? null;
          puntos1 = 8;
          puntos2 = 4;
          const porcentaje = Math.round((aciertosJugador1 / totalPares) * 100);
          mensaje = obtenerMensajePorRendimiento(true, porcentaje);
        } else if (intentosJugador2 < intentosJugador1) {
          ganador = jugador2?.nombre_usuario ?? "Jugador 2";
          ganadorUsuarioId = jugador2?.id ?? null;
          puntos2 = 8;
          puntos1 = 4;
          const porcentaje = Math.round((aciertosJugador2 / totalPares) * 100);
          mensaje = obtenerMensajePorRendimiento(true, porcentaje);
        } else {
          ganador = "Empate";
          puntos1 = 6;
          puntos2 = 6;
          mensaje = "La partida terminó en empate.";
        }
      }
    }

    if (motivo === "max_intentos") {
      if (aciertosJugador1 > aciertosJugador2) {
        ganador = jugador1?.nombre_usuario ?? "Jugador 1";
        ganadorUsuarioId = jugador1?.id ?? null;
        puntos1 = 7;
        const porcentaje = Math.round((aciertosJugador1 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else if (aciertosJugador2 > aciertosJugador1) {
        ganador = jugador2?.nombre_usuario ?? "Jugador 2";
        ganadorUsuarioId = jugador2?.id ?? null;
        puntos2 = 7;
        const porcentaje = Math.round((aciertosJugador2 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else {
        ganador = "Empate";
        puntos1 = 5;
        puntos2 = 5;
        mensaje =
          "Se alcanzó el máximo de intentos. La partida terminó en empate.";
      }
    }

    if (motivo === "abandono") {
      let nombreAbandono = "";

      if (turnoActual === "Jugador 1") {
        nombreAbandono = jugador1?.nombre_usuario ?? "Jugador 1";
        ganador = jugador2?.nombre_usuario ?? "Jugador 2";
        ganadorUsuarioId = jugador2?.id ?? null;
        puntos2 = 3;
      } else {
        nombreAbandono = jugador2?.nombre_usuario ?? "Jugador 2";
        ganador = jugador1?.nombre_usuario ?? "Jugador 1";
        ganadorUsuarioId = jugador1?.id ?? null;
        puntos1 = 3;
      }

      mensaje = `${nombreAbandono} abandonó la partida. ${ganador} gana automáticamente.`;
    }

    if (motivo === "tiempo_agotado") {
      ganador = "Sin ganador";

      if (aciertosJugador1 < aciertosJugador2) {
        puntos1 = -5;
      } else if (aciertosJugador2 < aciertosJugador1) {
        puntos2 = -5;
      }

      mensaje =
        "Se agotó el tiempo máximo. Ambos jugadores pierden la partida.";
    }

    if (jugador1 && jugador2) {
      await guardarPartidaCompleta({
        motivo,
        tiempoJugado,
        tiempoConfigurado: configuracion?.tiempo ?? null,
        ganadorUsuarioId,
        jugador1: {
          id: jugador1.id,
          aciertos: aciertosJugador1,
          intentos: intentosJugador1,
          puntosObtenidos: puntos1,
          abandono: motivo === "abandono" && turnoActual === "Jugador 1",
        },
        jugador2: {
          id: jugador2.id,
          aciertos: aciertosJugador2,
          intentos: intentosJugador2,
          puntosObtenidos: puntos2,
          abandono: motivo === "abandono" && turnoActual === "Jugador 2",
        },
      });
    }

    const dado1 = localStorage.getItem("dadoJugador1");
    const dado2 = localStorage.getItem("dadoJugador2");

    const resultado: ResultadoPartida = {
      motivo,
      ganador,
      mensaje,
      jugador1Nombre: jugador1?.nombre_usuario ?? "Jugador 1",
      jugador2Nombre: jugador2?.nombre_usuario ?? "Jugador 2",
      aciertosJugador1,
      aciertosJugador2,
      intentosJugador1,
      intentosJugador2,
      puntosFinalesJugador1: puntos1,
      puntosFinalesJugador2: puntos2,
      tiempoJugado,
      tiempoConfigurado: configuracion?.tiempo ?? null,
      dadoJugador1: dado1 ? Number(dado1) : null,
      dadoJugador2: dado2 ? Number(dado2) : null,
      ganadorSorteo: turnoInicial,
      numeroPartida: numeroPartidaActual,
    };

    localStorage.setItem("resultadoPartida", JSON.stringify(resultado));
    router.push("/resultado");
  };

  const maximoIntentos = configuracion
    ? obtenerMaximoIntentos(configuracion.dificultad)
    : 0;

  const intentosTotales = intentosJugador1 + intentosJugador2;

  useEffect(() => {
    if (!configuracion || redireccionandoRef.current) return;

    if (intentosTotales >= maximoIntentos && maximoIntentos > 0) {
      finalizarPartida("max_intentos");
    }
  }, [intentosTotales, maximoIntentos, configuracion]);

  const columnas = configuracion?.dificultad === "alta" ? 8 : 4;

  return (
    <main className="page">
      <div className="container">
        <div className="juego-panel-unico">
          <div className="juego-panel-columna juego-panel-info">
            <span className="juego-panel-label">Partida</span>
            <strong className="juego-panel-partida-numero highlight">
              #{numeroPartidaActual}
            </strong>

            <p>
              <strong>Intentos máx:</strong> {maximoIntentos}
            </p>
            <p>
              <strong>Intentos totales:</strong> {intentosTotales}
            </p>
          </div>

          <div className="juego-panel-columna juego-panel-jugadores">
            <div className="juego-panel-jugador-bloque">
              <h3>{jugador1?.nombre_usuario ?? "Jugador 1"}</h3>
              <p>Aciertos: {aciertosJugador1}</p>
              <p>Intentos: {intentosJugador1}</p>
            </div>

            <div className="juego-panel-jugador-bloque">
              <h3>{jugador2?.nombre_usuario ?? "Jugador 2"}</h3>
              <p>Aciertos: {aciertosJugador2}</p>
              <p>Intentos: {intentosJugador2}</p>
            </div>
          </div>

          <div className="juego-panel-columna juego-panel-turno">
            <span className="juego-panel-label">Turno actual</span>
            <strong className="juego-panel-turno-nombre">
              {turnoActual === "Jugador 1"
                ? jugador1?.nombre_usuario ?? "Jugador 1"
                : turnoActual === "Jugador 2"
                ? jugador2?.nombre_usuario ?? "Jugador 2"
                : "No definido"}
            </strong>

            <div className="mini-timer juego-panel-timer">
              {formatearTiempo(tiempoRestante)}
            </div>

            <button
              className="btn btn-danger"
              onClick={() => finalizarPartida("abandono")}
            >
              Abandonar
            </button>
          </div>
        </div>

        <div
          className="game-board"
          style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}
        >
          {cartas.map((carta) => (
            <button
              key={carta.id}
              onClick={() => seleccionarCarta(carta.id)}
              className={`memory-card ${carta.acertada ? "success" : ""}`}
            >
              {carta.descubierta || carta.acertada ? (
                <img src={carta.valor} alt="Carta" className="carta-imagen" />
              ) : (
                "?"
              )}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}