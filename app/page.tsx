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
};

type MensajeBienvenida =
  | {
      tipo: "conjunto";
      mensajeGeneral: string;
    }
  | {
      tipo: "individual";
      jugador1: string;
      jugador2: string;
    }
  | {
      tipo: "nuevo";
      mensajeGeneral: string;
    };

export default function HomePage() {
  const router = useRouter();

  const [usuario1, setUsuario1] = useState("");
  const [password1, setPassword1] = useState("");
  const [usuario2, setUsuario2] = useState("");
  const [password2, setPassword2] = useState("");

  const [jugador1, setJugador1] = useState<Usuario | null>(null);
  const [jugador2, setJugador2] = useState<Usuario | null>(null);

  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");

  const [mensajeBienvenida, setMensajeBienvenida] =
    useState<MensajeBienvenida | null>(null);

  useEffect(() => {
    const jugador1Guardado = localStorage.getItem("jugador1Logueado");
    const jugador2Guardado = localStorage.getItem("jugador2Logueado");

    if (jugador1Guardado) {
      setJugador1(JSON.parse(jugador1Guardado));
    }

    if (jugador2Guardado) {
      setJugador2(JSON.parse(jugador2Guardado));
    }
  }, []);

  useEffect(() => {
    if (jugador1) {
      localStorage.setItem("jugador1Logueado", JSON.stringify(jugador1));
    } else {
      localStorage.removeItem("jugador1Logueado");
    }

    if (jugador2) {
      localStorage.setItem("jugador2Logueado", JSON.stringify(jugador2));
    } else {
      localStorage.removeItem("jugador2Logueado");
    }

    if (jugador1 && jugador2) {
      localStorage.setItem(
        "jugadoresLogueados",
        JSON.stringify({
          jugador1,
          jugador2,
        })
      );
    } else {
      localStorage.removeItem("jugadoresLogueados");
    }
  }, [jugador1, jugador2]);

  const formatearFecha = (fechaIso: string) => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleString("es-AR");
  };

  const iniciarSesion = async (
    usuario: string,
    contrasena: string,
    numeroJugador: 1 | 2
  ) => {
    if (!usuario || !contrasena) {
      if (numeroJugador === 1) {
        setError1("Completá usuario y contraseña.");
      } else {
        setError2("Completá usuario y contraseña.");
      }
      return;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("nombre_usuario", usuario)
      .eq("contrasena", contrasena)
      .single();

    if (error || !data) {
      if (numeroJugador === 1) {
        setError1("Usuario o contraseña incorrectos.");
      } else {
        setError2("Usuario o contraseña incorrectos.");
      }
      return;
    }

    if (numeroJugador === 1) {
      if (jugador2 && jugador2.id === data.id) {
        setError1("No puede iniciar sesión el mismo usuario en ambos jugadores.");
        return;
      }

      setJugador1(data);
      setError1("");
      setMensajeBienvenida(null);
      setUsuario1("");
      setPassword1("");
    } else {
      if (jugador1 && jugador1.id === data.id) {
        setError2("No puede iniciar sesión el mismo usuario en ambos jugadores.");
        return;
      }

      setJugador2(data);
      setError2("");
      setMensajeBienvenida(null);
      setUsuario2("");
      setPassword2("");
    }
  };

  const cerrarSesionJugador = (numeroJugador: 1 | 2) => {
    if (numeroJugador === 1) {
      setJugador1(null);
      setUsuario1("");
      setPassword1("");
      setError1("");
      localStorage.removeItem("jugador1Logueado");
    } else {
      setJugador2(null);
      setUsuario2("");
      setPassword2("");
      setError2("");
      localStorage.removeItem("jugador2Logueado");
    }

    setMensajeBienvenida(null);
  };

  const buscarUltimaPartidaDeUsuario = async (usuarioId: string) => {
    const { data, error } = await supabase
      .from("participaciones")
      .select(
        `
        partida_id,
        puntos_obtenidos,
        created_at,
        partidas (
          id,
          fecha
        )
      `
      )
      .eq("usuario_id", usuarioId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  };

  const buscarRivalDePartida = async (
    partidaId: string,
    usuarioId: string
  ) => {
    const { data, error } = await supabase
      .from("participaciones")
      .select(
        `
        usuario_id,
        usuarios (
          id,
          nombre_usuario
        )
      `
      )
      .eq("partida_id", partidaId);

    if (error || !data) {
      return null;
    }

    const rival = (data as any[]).find((p) => p.usuario_id !== usuarioId);
    return rival?.usuarios ?? null;
  };

  const buscarUltimoEnfrentamiento = async (
    usuarioId1: string,
    usuarioId2: string
  ) => {
    const { data, error } = await supabase
      .from("participaciones")
      .select(
        `
        partida_id,
        usuario_id,
        puntos_obtenidos,
        created_at,
        partidas (
          id,
          fecha
        )
      `
      )
      .in("usuario_id", [usuarioId1, usuarioId2])
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const agrupadas: Record<string, any[]> = {};

    for (const fila of data as any[]) {
      if (!agrupadas[fila.partida_id]) {
        agrupadas[fila.partida_id] = [];
      }
      agrupadas[fila.partida_id].push(fila);
    }

    for (const partidaId of Object.keys(agrupadas)) {
      const grupo = agrupadas[partidaId];

      const tieneUsuario1 = grupo.some((g) => g.usuario_id === usuarioId1);
      const tieneUsuario2 = grupo.some((g) => g.usuario_id === usuarioId2);

      if (tieneUsuario1 && tieneUsuario2) {
        const fila1 = grupo.find((g) => g.usuario_id === usuarioId1);
        const fila2 = grupo.find((g) => g.usuario_id === usuarioId2);

        return {
          fecha: fila1?.partidas?.fecha,
          puntosJugador1: fila1?.puntos_obtenidos ?? 0,
          puntosJugador2: fila2?.puntos_obtenidos ?? 0,
        };
      }
    }

    return null;
  };

  const construirMensajesBienvenida = async (
    j1: Usuario,
    j2: Usuario
  ): Promise<MensajeBienvenida> => {
    const ultimoEnfrentamiento = await buscarUltimoEnfrentamiento(j1.id, j2.id);

    if (ultimoEnfrentamiento) {
      return {
        tipo: "conjunto",
        mensajeGeneral: `Última vez que jugaron juntos: ${formatearFecha(
          ultimoEnfrentamiento.fecha
        )}. ${j1.nombre_usuario} obtuvo ${
          ultimoEnfrentamiento.puntosJugador1
        } puntos y ${j2.nombre_usuario} obtuvo ${
          ultimoEnfrentamiento.puntosJugador2
        } puntos.`,
      };
    }

    const ultimaJugadaJ1 = await buscarUltimaPartidaDeUsuario(j1.id);
    const ultimaJugadaJ2 = await buscarUltimaPartidaDeUsuario(j2.id);

    if (!ultimaJugadaJ1 && !ultimaJugadaJ2) {
      return {
        tipo: "nuevo",
        mensajeGeneral: "Hola!! Divertite y jugá!!",
      };
    }

    let mensajeJ1 = "Hola!! Divertite y jugá!!";
    let mensajeJ2 = "Hola!! Divertite y jugá!!";

    if (ultimaJugadaJ1) {
      const partidaInfo: any = ultimaJugadaJ1.partidas;
      const rival = await buscarRivalDePartida(ultimaJugadaJ1.partida_id, j1.id);

      mensajeJ1 = `Es la primera vez que jugás con ${j2.nombre_usuario}. Tu última partida fue el ${formatearFecha(
        partidaInfo.fecha
      )} contra ${rival?.nombre_usuario ?? "otro usuario"}.`;
    }

    if (ultimaJugadaJ2) {
      const partidaInfo: any = ultimaJugadaJ2.partidas;
      const rival = await buscarRivalDePartida(ultimaJugadaJ2.partida_id, j2.id);

      mensajeJ2 = `Es la primera vez que jugás con ${j1.nombre_usuario}. Tu última partida fue el ${formatearFecha(
        partidaInfo.fecha
      )} contra ${rival?.nombre_usuario ?? "otro usuario"}.`;
    }

    return {
      tipo: "individual",
      jugador1: mensajeJ1,
      jugador2: mensajeJ2,
    };
  };

  useEffect(() => {
    const consultarBienvenida = async () => {
      if (!jugador1 || !jugador2) return;

      const mensajes = await construirMensajesBienvenida(jugador1, jugador2);
      setMensajeBienvenida(mensajes);
    };

    if (jugador1 && jugador2) {
      consultarBienvenida();
    }
  }, [jugador1, jugador2]);

  const continuar = () => {
    if (!jugador1 || !jugador2) return;

    localStorage.setItem(
      "jugadoresLogueados",
      JSON.stringify({
        jugador1,
        jugador2,
      })
    );

    router.push("/configuracion");
  };

  const mostrarMensajeGeneral =
    mensajeBienvenida?.tipo === "conjunto" ||
    mensajeBienvenida?.tipo === "nuevo";

  return (
    <main className="page">
      <div className="container">
        <div className="login-split-layout">
          <section className="login-left-panel">
            <div className="login-left-content">

              <h1 className="login-big-title">MEMORY CARDS</h1>

              <div className="login-muted-box">

              </div>

              <div className="login-info-card">
                <h3>Información de la sesión</h3>

                {mostrarMensajeGeneral ? (
                  <p>{mensajeBienvenida.mensajeGeneral}</p>
                ) : (
                  <p>
                    Cuando ambos jugadores inicien sesión, acá vas a ver el
                    historial compartido o un mensaje de bienvenida.
                  </p>
                )}
              </div>

              <div className="login-info-card">
                <h3>Estado actual</h3>
                <p>
                  <strong>Jugador 1:</strong>{" "}
                  {jugador1 ? jugador1.nombre_usuario : "sin iniciar sesión"}
                </p>
                <p>
                  <strong>Jugador 2:</strong>{" "}
                  {jugador2 ? jugador2.nombre_usuario : "sin iniciar sesión"}
                </p>
              </div>
            </div>
          </section>

          <section className="login-right-panel">
            <div>
              <div className="login-right-header">
                <h2 className="login-right-title">Login de jugadores</h2>
                <p className="login-right-text">
                  Cada jugador debe autenticarse con su usuario y contraseña.
                </p>
              </div>

              <div className="login-players-stack">
                <div className="login-player-card-compact">
                  <div>
                    <div className="login-player-top">
                      <h3 className="login-player-title">Jugador 1</h3>
                      {jugador1 && <span className="login-status-badge">Activo</span>}
                    </div>

                    {jugador1 ? (
                      <>
                        <p className="auth-ok">✔ Autenticado</p>
                        <p>Bienvenido, {jugador1.nombre_usuario}</p>

                        <div className="login-fixed-message">
                          {mensajeBienvenida?.tipo === "individual" ? (
                            <p className="alert-info">{mensajeBienvenida.jugador1}</p>
                          ) : (
                            <p className="summary-text">
                              Sesión iniciada correctamente.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="form-label">Usuario</label>
                        <input
                          className="form-input"
                          value={usuario1}
                          onChange={(e) => setUsuario1(e.target.value)}
                        />

                        <label className="form-label">Contraseña</label>
                        <input
                          className="form-input"
                          type="password"
                          value={password1}
                          onChange={(e) => setPassword1(e.target.value)}
                        />

                        <div className="login-fixed-message">
                          {error1 ? (
                            <p className="alert-error">{error1}</p>
                          ) : (
                            <p className="summary-text">
                              Ingresá usuario y contraseña.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="login-actions">
                    {jugador1 ? (
                      <button
                        className="btn btn-danger full-width"
                        onClick={() => cerrarSesionJugador(1)}
                      >
                        Cerrar sesión
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary full-width"
                        onClick={() => iniciarSesion(usuario1, password1, 1)}
                      >
                        Iniciar sesión
                      </button>
                    )}
                  </div>
                </div>

                <div className="login-player-card-compact">
                  <div>
                    <div className="login-player-top">
                      <h3 className="login-player-title">Jugador 2</h3>
                      {jugador2 && <span className="login-status-badge">Activo</span>}
                    </div>

                    {jugador2 ? (
                      <>
                        <p className="auth-ok">✔ Autenticado</p>
                        <p>Bienvenido, {jugador2.nombre_usuario}</p>

                        <div className="login-fixed-message">
                          {mensajeBienvenida?.tipo === "individual" ? (
                            <p className="alert-info">{mensajeBienvenida.jugador2}</p>
                          ) : (
                            <p className="summary-text">
                              Sesión iniciada correctamente.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="form-label">Usuario</label>
                        <input
                          className="form-input"
                          value={usuario2}
                          onChange={(e) => setUsuario2(e.target.value)}
                        />

                        <label className="form-label">Contraseña</label>
                        <input
                          className="form-input"
                          type="password"
                          value={password2}
                          onChange={(e) => setPassword2(e.target.value)}
                        />

                        <div className="login-fixed-message">
                          {error2 ? (
                            <p className="alert-error">{error2}</p>
                          ) : (
                            <p className="summary-text">
                              Ingresá usuario y contraseña.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="login-actions">
                    {jugador2 ? (
                      <button
                        className="btn btn-danger full-width"
                        onClick={() => cerrarSesionJugador(2)}
                      >
                        Cerrar sesión
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary full-width"
                        onClick={() => iniciarSesion(usuario2, password2, 2)}
                      >
                        Iniciar sesión
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="login-bottom-actions">
              <button
                className="btn btn-secondary"
                onClick={() => router.push("/registro")}
              >
                Registrarse
              </button>

              <button
                className="btn btn-primary"
                onClick={continuar}
                disabled={!jugador1 || !jugador2}
              >
                Continuar al juego
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}