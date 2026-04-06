"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Carta = {
  id: number;
  valor: string;
  descubierta: boolean;
  acertada: boolean;
};

type ConfiguracionPartida = {
  dificultad: "baja" | "media" | "alta";
  tiempo: number | null;
  tipoCartas: string;
};

type MotivoFin = "completado" | "max_intentos" | "abandono" | "tiempo_agotado";

type Usuario = {
  id: string;
  nombre_usuario: string;
  contrasena: string;
  pais: string;
  mayor_12: boolean;
};

export default function JuegoPage() {
  const router = useRouter();
  const redireccionandoRef = useRef(false);

  const [configuracion, setConfiguracion] =
    useState<ConfiguracionPartida | null>(null);
  const [numeroPartidaActual, setNumeroPartidaActual] = useState(1);

  const [jugador1, setJugador1] = useState<Usuario | null>(null);
  const [jugador2, setJugador2] = useState<Usuario | null>(null);

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
    let valores: string[] = [];

    if (tipo === "animales") {
      valores = [
        "🐶", "🐱", "🐸", "🐵", "🦊", "🐼", "🐰", "🦁",
        "🐻", "🐯", "🦉", "🦋", "🐢", "🐙", "🦄", "🐷",
      ];
    } else if (tipo === "numeros") {
      valores = [
        "1", "2", "3", "4", "5", "6", "7", "8",
        "9", "10", "11", "12", "13", "14", "15", "16",
      ];
    } else {
      valores = [
        "🔴", "🔵", "🟢", "🟡", "🟣", "🟠", "⚫", "⚪",
        "🟤", "🔺", "🔷", "🔶", "💚", "💙", "💜", "🩷",
      ];
    }

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
    const configuracionGuardada = localStorage.getItem("configuracionPartida");
    const jugadoresGuardados = localStorage.getItem("jugadoresLogueados");
    const numeroPartidaGuardado = localStorage.getItem("numeroPartidaActual");
    const turnoInicialGuardado = localStorage.getItem("turnoInicial");

    if (configuracionGuardada) {
      const config: ConfiguracionPartida = JSON.parse(configuracionGuardada);
      setConfiguracion(config);

      if (config.tiempo === null) setTiempoRestante(null);
      else setTiempoRestante(config.tiempo * 60);

      setCartas(generarCartas(config.tipoCartas, config.dificultad));
    } else {
      router.push("/configuracion");
      return;
    }

    if (jugadoresGuardados) {
      const parsed = JSON.parse(jugadoresGuardados);
      setJugador1(parsed.jugador1);
      setJugador2(parsed.jugador2);
    } else {
      router.push("/");
      return;
    }

    if (numeroPartidaGuardado) {
      setNumeroPartidaActual(Number(numeroPartidaGuardado));
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

  const guardarEnBase = async (
    motivo: MotivoFin,
    ganadorUsuarioId: string | null,
    puntosFinalesJugador1: number,
    puntosFinalesJugador2: number,
    tiempoJugado: number
  ) => {
    if (!jugador1 || !jugador2) return;

    const { data: partidaData, error: partidaError } = await supabase
      .from("partidas")
      .insert([
        {
          motivo_fin: motivo,
          tiempo_jugado: tiempoJugado,
          tiempo_configurado: configuracion?.tiempo,
          ganador_usuario_id: ganadorUsuarioId,
        },
      ])
      .select()
      .single();

    if (partidaError || !partidaData) {
      console.error("Error guardando partida:", partidaError);
      return;
    }

    const { error: participacionError } = await supabase
      .from("participaciones")
      .insert([
        {
          partida_id: partidaData.id,
          usuario_id: jugador1.id,
          aciertos: aciertosJugador1,
          intentos: intentosJugador1,
          puntos_obtenidos: puntosFinalesJugador1,
          abandono: motivo === "abandono" && turnoActual === "Jugador 1",
        },
        {
          partida_id: partidaData.id,
          usuario_id: jugador2.id,
          aciertos: aciertosJugador2,
          intentos: intentosJugador2,
          puntos_obtenidos: puntosFinalesJugador2,
          abandono: motivo === "abandono" && turnoActual === "Jugador 2",
        },
      ]);

    if (participacionError) {
      console.error("Error guardando participaciones:", participacionError);
    }
  };

  const finalizarPartida = async (motivo: MotivoFin) => {
    if (redireccionandoRef.current) return;
    redireccionandoRef.current = true;

    const totalPares = cartas.length / 2;

    let ganador = "";
    let mensaje = "";
    let ganadorUsuarioId: string | null = null;
    let puntosFinalesJugador1 = 0;
    let puntosFinalesJugador2 = 0;

    if (motivo === "completado") {
      if (aciertosJugador1 > aciertosJugador2) {
        ganador = jugador1?.nombre_usuario ?? "Jugador 1";
        ganadorUsuarioId = jugador1?.id ?? null;
        puntosFinalesJugador1 = 12;
        const porcentaje = Math.round((aciertosJugador1 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else if (aciertosJugador2 > aciertosJugador1) {
        ganador = jugador2?.nombre_usuario ?? "Jugador 2";
        ganadorUsuarioId = jugador2?.id ?? null;
        puntosFinalesJugador2 = 12;
        const porcentaje = Math.round((aciertosJugador2 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else {
        if (intentosJugador1 < intentosJugador2) {
          ganador = jugador1?.nombre_usuario ?? "Jugador 1";
          ganadorUsuarioId = jugador1?.id ?? null;
          puntosFinalesJugador1 = 8;
          puntosFinalesJugador2 = 4;
          const porcentaje = Math.round((aciertosJugador1 / totalPares) * 100);
          mensaje = obtenerMensajePorRendimiento(true, porcentaje);
        } else if (intentosJugador2 < intentosJugador1) {
          ganador = jugador2?.nombre_usuario ?? "Jugador 2";
          ganadorUsuarioId = jugador2?.id ?? null;
          puntosFinalesJugador2 = 8;
          puntosFinalesJugador1 = 4;
          const porcentaje = Math.round((aciertosJugador2 / totalPares) * 100);
          mensaje = obtenerMensajePorRendimiento(true, porcentaje);
        } else {
          ganador = "Empate";
          puntosFinalesJugador1 = 6;
          puntosFinalesJugador2 = 6;
          mensaje = "La partida terminó en empate.";
        }
      }
    }

    if (motivo === "max_intentos") {
      if (aciertosJugador1 > aciertosJugador2) {
        ganador = jugador1?.nombre_usuario ?? "Jugador 1";
        ganadorUsuarioId = jugador1?.id ?? null;
        puntosFinalesJugador1 = 7;
        const porcentaje = Math.round((aciertosJugador1 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else if (aciertosJugador2 > aciertosJugador1) {
        ganador = jugador2?.nombre_usuario ?? "Jugador 2";
        ganadorUsuarioId = jugador2?.id ?? null;
        puntosFinalesJugador2 = 7;
        const porcentaje = Math.round((aciertosJugador2 / totalPares) * 100);
        mensaje = obtenerMensajePorRendimiento(true, porcentaje);
      } else {
        if (intentosJugador1 < intentosJugador2) {
          ganador = jugador1?.nombre_usuario ?? "Jugador 1";
          ganadorUsuarioId = jugador1?.id ?? null;
          puntosFinalesJugador1 = 5;
          puntosFinalesJugador2 = 2;
          const porcentaje = Math.round((aciertosJugador1 / totalPares) * 100);
          mensaje = obtenerMensajePorRendimiento(true, porcentaje);
        } else if (intentosJugador2 < intentosJugador1) {
          ganador = jugador2?.nombre_usuario ?? "Jugador 2";
          ganadorUsuarioId = jugador2?.id ?? null;
          puntosFinalesJugador2 = 5;
          puntosFinalesJugador1 = 2;
          const porcentaje = Math.round((aciertosJugador2 / totalPares) * 100);
          mensaje = obtenerMensajePorRendimiento(true, porcentaje);
        } else {
          ganador = "Empate";
          puntosFinalesJugador1 = 3;
          puntosFinalesJugador2 = 3;
          mensaje =
            "Se alcanzó el máximo de intentos. La partida terminó en empate.";
        }
      }
    }

   if (motivo === "abandono") {
  let nombreAbandono = "";

  if (turnoActual === "Jugador 1") {
    nombreAbandono = jugador1?.nombre_usuario ?? "Jugador 1";

    ganador = jugador2?.nombre_usuario ?? "Jugador 2";
    ganadorUsuarioId = jugador2?.id ?? null;
    puntosFinalesJugador2 = 3;
  } else {
    nombreAbandono = jugador2?.nombre_usuario ?? "Jugador 2";

    ganador = jugador1?.nombre_usuario ?? "Jugador 1";
    ganadorUsuarioId = jugador1?.id ?? null;
    puntosFinalesJugador1 = 3;
  }

  mensaje = `${nombreAbandono} abandonó la partida. ${ganador} gana automáticamente.`;
}

    if (motivo === "tiempo_agotado") {
      ganador = "Sin ganador";

      if (aciertosJugador1 < aciertosJugador2) puntosFinalesJugador1 = -5;
      else if (aciertosJugador2 < aciertosJugador1) puntosFinalesJugador2 = -5;

      mensaje =
        "Se agotó el tiempo máximo. Ambos jugadores pierden la partida.";
    }

    const tiempoConfiguradoEnSegundos =
      configuracion?.tiempo === null ? null : (configuracion?.tiempo ?? 0) * 60;

    const tiempoJugado =
      tiempoConfiguradoEnSegundos === null || tiempoRestante === null
        ? 0
        : tiempoConfiguradoEnSegundos - tiempoRestante;

    await guardarEnBase(
      motivo,
      ganadorUsuarioId,
      puntosFinalesJugador1,
      puntosFinalesJugador2,
      tiempoJugado
    );

    const dado1 = localStorage.getItem("dadoJugador1");
    const dado2 = localStorage.getItem("dadoJugador2");

    const resultado = {
      motivo,
      ganador,
      mensaje,
      jugador1Nombre: jugador1?.nombre_usuario ?? "Jugador 1",
      jugador2Nombre: jugador2?.nombre_usuario ?? "Jugador 2",
      aciertosJugador1,
      aciertosJugador2,
      intentosJugador1,
      intentosJugador2,
      puntosFinalesJugador1,
      puntosFinalesJugador2,
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

  const seleccionarCarta = (id: number) => {
    if (redireccionandoRef.current || !turnoActual) return;

    const cartaSeleccionada = cartas.find((carta) => carta.id === id);

    if (!cartaSeleccionada) return;
    if (cartaSeleccionada.descubierta || cartaSeleccionada.acertada) return;
    if (cartasSeleccionadas.length === 2) return;

    const nuevasCartas = cartas.map((carta) =>
      carta.id === id ? { ...carta, descubierta: true } : carta
    );

    const nuevasSeleccionadas = [...cartasSeleccionadas, id];

    setCartas(nuevasCartas);
    setCartasSeleccionadas(nuevasSeleccionadas);

    if (nuevasSeleccionadas.length === 2) {
      if (turnoActual === "Jugador 1") setIntentosJugador1((prev) => prev + 1);
      else setIntentosJugador2((prev) => prev + 1);

      const [id1, id2] = nuevasSeleccionadas;
      const carta1 = nuevasCartas.find((carta) => carta.id === id1);
      const carta2 = nuevasCartas.find((carta) => carta.id === id2);

      if (!carta1 || !carta2) return;

      if (carta1.valor === carta2.valor) {
        if (turnoActual === "Jugador 1") setAciertosJugador1((prev) => prev + 1);
        else setAciertosJugador2((prev) => prev + 1);

        setTimeout(() => {
          setCartas((prev) => {
            const nuevas = prev.map((carta) =>
              carta.id === id1 || carta.id === id2
                ? { ...carta, acertada: true }
                : carta
            );

            const todasAcertadas = nuevas.every((carta) => carta.acertada);

            if (todasAcertadas) {
              setTimeout(() => {
                finalizarPartida("completado");
              }, 1000);
            }

            return nuevas;
          });

          setCartasSeleccionadas([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCartas((prev) =>
            prev.map((carta) =>
              carta.id === id1 || carta.id === id2
                ? { ...carta, descubierta: false }
                : carta
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

  const maximoIntentos = configuracion
    ? obtenerMaximoIntentos(configuracion.dificultad)
    : 0;

  const intentosTotales = intentosJugador1 + intentosJugador2;

  const columnasTablero = configuracion
    ? configuracion.dificultad === "alta"
      ? 8
      : 4
    : 4;

  useEffect(() => {
    if (!configuracion || redireccionandoRef.current) return;

    if (intentosTotales >= maximoIntentos && maximoIntentos > 0) {
      finalizarPartida("max_intentos");
    }
  }, [intentosTotales, maximoIntentos, configuracion]);

  return (
    <main className="page">
      <div className="container">
        <div className="game-top-unificado">
          <div className="top-item info-box-small">
            <p>
              <strong>Partida:</strong>{" "}
              <span className="highlight">#{numeroPartidaActual}</span>
            </p>
            <p><strong>Intentos máx:</strong> {maximoIntentos}</p>
            <p><strong>Intentos:</strong> {intentosTotales}</p>
          </div>

          <div className="top-item versus-box">
            <div className="versus-row versus-names">
              <span>{jugador1?.nombre_usuario ?? "Jugador 1"}</span>
              <span></span>
              <span>{jugador2?.nombre_usuario ?? "Jugador 2"}</span>
            </div>

            <div className="versus-row">
              <span>{aciertosJugador1}</span>
              <span>Aciertos</span>
              <span>{aciertosJugador2}</span>
            </div>

            <div className="versus-row">
              <span>{intentosJugador1}</span>
              <span>Intentos</span>
              <span>{intentosJugador2}</span>
            </div>
          </div>

          <div className="top-item turno-box-small">
            <span>Turno</span>

            <strong className="turno-nombre">
              {turnoActual === "Jugador 1"
                ? jugador1?.nombre_usuario
                : turnoActual === "Jugador 2"
                ? jugador2?.nombre_usuario
                : "—"}
            </strong>

            <div className="mini-timer">
              {formatearTiempo(tiempoRestante)}
            </div>

            <button
              className="btn btn-danger btn-small"
              onClick={() => finalizarPartida("abandono")}
            >
              Abandonar partida
            </button>
          </div>
        </div>

        <div
          className="game-board"
          style={{ gridTemplateColumns: `repeat(${columnasTablero}, minmax(0, 1fr))` }}
        >
          {cartas.map((carta) => (
            <button
              key={carta.id}
              onClick={() => seleccionarCarta(carta.id)}
              className={`memory-card ${carta.acertada ? "success" : ""}`}
            >
              {carta.descubierta || carta.acertada ? carta.valor : "?"}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}