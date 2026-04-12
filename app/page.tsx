"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pais } from "@/types/pais";
import {
  JugadorPerfil,
  EstadoLogin,

} from "@/types/usuario";

import {
  PartidaUsuario,
  PartidaEnComun,
} from "@/types/partida";
import {
  obtenerPartidasUsuario,
  obtenerPartidasEnComun,
} from "@/services/partidaService";
import {
  registrarUsuario,
  loginCompleto,
  cerrarSesionUsuario,
  obtenerPaises,
} from "@/services/usuarioService";

export default function HomePage() {
  const router = useRouter();

  const [jugador1, setJugador1] = useState<EstadoLogin>({
    email: "",
    password: "",
    cargando: false,
    error: "",
    jugador: null,
  });

  const [jugador2, setJugador2] = useState<EstadoLogin>({
    email: "",
    password: "",
    cargando: false,
    error: "",
    jugador: null,
  });

  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const [registroEmail, setRegistroEmail] = useState("");
  const [registroPassword, setRegistroPassword] = useState("");
  const [registroNombreUsuario, setRegistroNombreUsuario] = useState("");
  const [registroPaisId, setRegistroPaisId] = useState("");
  const [registroPaisTexto, setRegistroPaisTexto] = useState("");
  const [registroMayor12, setRegistroMayor12] = useState(false);
  const [registroError, setRegistroError] = useState("");
  const [registroMensaje, setRegistroMensaje] = useState("");

  const [mensajeGeneral, setMensajeGeneral] = useState("");
  const [mensajeJugador1, setMensajeJugador1] = useState("");
  const [mensajeJugador2, setMensajeJugador2] = useState("");

  const [paises, setPaises] = useState<Pais[]>([]);
  const [mostrarDropdownPaises, setMostrarDropdownPaises] = useState(false);

  useEffect(() => {
    const jugadoresGuardados = localStorage.getItem("jugadoresLogueados");

    if (jugadoresGuardados) {
      try {
        const parsed = JSON.parse(jugadoresGuardados);

        setJugador1((prev) => ({
          ...prev,
          jugador: parsed.jugador1 ?? null,
        }));

        setJugador2((prev) => ({
          ...prev,
          jugador: parsed.jugador2 ?? null,
        }));
      } catch (error) {
        console.error("Error al leer jugadores del localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!mostrarRegistro) return;

    const cargarPaises = async () => {
      try {
        const data = await obtenerPaises();
        setPaises(data);
      } catch (error) {
        console.error("Error al cargar países:", error);
      }
    };

    cargarPaises();
  }, [mostrarRegistro]);

  useEffect(() => {
    const cargarMensajeBienvenida = async () => {
      if (!jugador1.jugador || !jugador2.jugador) {
        setMensajeGeneral("");
        setMensajeJugador1("");
        setMensajeJugador2("");
        return;
      }

      const j1 = jugador1.jugador;
      const j2 = jugador2.jugador;

      try {
        const [partidasEnComun, historialJ1, historialJ2] = await Promise.all([
          obtenerPartidasEnComun(j1.id, j2.id, 1),
          obtenerPartidasUsuario(j1.id, 1),
          obtenerPartidasUsuario(j2.id, 1),
        ]);

        const ultimaEnComun = partidasEnComun[0] as PartidaEnComun | undefined;
        const ultimaJ1 = historialJ1[0] as PartidaUsuario | undefined;
        const ultimaJ2 = historialJ2[0] as PartidaUsuario | undefined;

        if (ultimaEnComun) {
          const fecha = new Date(ultimaEnComun.fecha).toLocaleString("es-AR");

          setMensajeGeneral(
            `Última vez que jugaron juntos: ${fecha}. ${j1.nombre_usuario} obtuvo ${ultimaEnComun.puntos_jugador1} puntos y ${j2.nombre_usuario} obtuvo ${ultimaEnComun.puntos_jugador2} puntos.`
          );
          setMensajeJugador1("");
          setMensajeJugador2("");
          return;
        }

        if (!ultimaJ1 && !ultimaJ2) {
          setMensajeGeneral("Hola!! Divertite y jugá!!");
          setMensajeJugador1("");
          setMensajeJugador2("");
          return;
        }

        setMensajeGeneral("");

        if (!ultimaJ1) {
          setMensajeJugador1("Hola!! Divertite y jugá!!");
        } else {
          const fechaJ1 = new Date(ultimaJ1.fecha).toLocaleString("es-AR");
          setMensajeJugador1(
            `Última vez que jugó: ${fechaJ1} contra ${ultimaJ1.rival_nombre}.`
          );
        }

        if (!ultimaJ2) {
          setMensajeJugador2("Hola!! Divertite y jugá!!");
        } else {
          const fechaJ2 = new Date(ultimaJ2.fecha).toLocaleString("es-AR");
          setMensajeJugador2(
            `Última vez que jugó: ${fechaJ2} contra ${ultimaJ2.rival_nombre}.`
          );
        }
      } catch (error) {
        console.error("Error al cargar mensajes:", error);
        setMensajeGeneral("Hola!! Divertite y jugá!!");
        setMensajeJugador1("");
        setMensajeJugador2("");
      }
    };

    cargarMensajeBienvenida();
  }, [jugador1.jugador, jugador2.jugador]);

  const paisesFiltrados = useMemo(() => {
    const texto = registroPaisTexto.trim().toLowerCase();

    if (!texto) return paises.slice(0, 8);

    return paises
      .filter((pais) => pais.nombre.toLowerCase().includes(texto))
      .slice(0, 8);
  }, [registroPaisTexto, paises]);

  const iniciarSesion = async (numero: 1 | 2) => {
    const estado = numero === 1 ? jugador1 : jugador2;
    const setEstado = numero === 1 ? setJugador1 : setJugador2;

    try {
      setEstado((prev) => ({
        ...prev,
        cargando: true,
        error: "",
      }));

      if (!estado.email || !estado.password) {
        setEstado((prev) => ({
          ...prev,
          cargando: false,
          error: "Ingresá email y contraseña.",
        }));
        return;
      }

      const perfil = await loginCompleto(estado.email, estado.password);

      const otroJugador = numero === 1 ? jugador2.jugador : jugador1.jugador;

      if (otroJugador && otroJugador.id === perfil.id) {
        setEstado((prev) => ({
          ...prev,
          cargando: false,
          error: "Ese usuario ya inició sesión como el otro jugador.",
        }));
        return;
      }

      setEstado((prev) => ({
        ...prev,
        cargando: false,
        jugador: perfil as JugadorPerfil,
        password: "",
        error: "",
      }));
    } catch (error: any) {
      setEstado((prev) => ({
        ...prev,
        cargando: false,
        error: error.message ?? "Error al iniciar sesión.",
      }));
    }
  };

  const cerrarSesionLocal = async (numero: 1 | 2) => {
    try {
      await cerrarSesionUsuario();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }

    if (numero === 1) {
      setJugador1({
        email: "",
        password: "",
        cargando: false,
        error: "",
        jugador: null,
      });
    } else {
      setJugador2({
        email: "",
        password: "",
        cargando: false,
        error: "",
        jugador: null,
      });
    }

    localStorage.removeItem("jugadoresLogueados");
  };

 const handleRegistrar = async () => {
  try {
    setRegistroError("");
    setRegistroMensaje("");

    // Campos obligatorios
    if (
      !registroEmail ||
      !registroPassword ||
      !registroNombreUsuario ||
      !registroPaisId
    ) {
      setRegistroError("Completá todos los campos.");
      return;
    }

    // Mayor de edad
    if (!registroMayor12) {
      setRegistroError("Debés confirmar que sos mayor de 12 años.");
      return;
    }

    // Email válido
    if (!registroEmail.includes("@")) {
      setRegistroError("Ingresá un email válido.");
      return;
    }

    // Contraseña mínima
    if (registroPassword.length < 6) {
      setRegistroError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    // Usuario mínimo
    if (registroNombreUsuario.trim().length < 3) {
      setRegistroError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    await registrarUsuario({
      email: registroEmail,
      password: registroPassword,
      nombreUsuario: registroNombreUsuario,
      pais: registroPaisId,
      mayor12: registroMayor12,
    });

    setRegistroMensaje("Usuario registrado correctamente.");

    setRegistroEmail("");
    setRegistroPassword("");
    setRegistroNombreUsuario("");
    setRegistroPaisId("");
    setRegistroPaisTexto("");
    setRegistroMayor12(false);
    setMostrarDropdownPaises(false);

    setTimeout(() => {
      setMostrarRegistro(false);
      setRegistroMensaje("");
    }, 1200);

  } catch (error: any) {
    const mensaje = error.message?.toLowerCase() || "";

    if (mensaje.includes("usuario") || mensaje.includes("username")) {
      setRegistroError("El nombre de usuario ya está en uso.");
    } else if (mensaje.includes("email")) {
      setRegistroError("El email ya está registrado.");
    } else if (mensaje.includes("duplicate")) {
      setRegistroError("El usuario o email ya existen.");
    } else {
      setRegistroError("Error al registrar. Intentá nuevamente.");
    }
  }
};

  const continuar = () => {
    if (!jugador1.jugador || !jugador2.jugador) return;

    if (jugador1.jugador.id === jugador2.jugador.id) {
      alert("No puede jugar la misma cuenta en ambos jugadores.");
      return;
    }

    localStorage.setItem(
      "jugadoresLogueados",
      JSON.stringify({
        jugador1: jugador1.jugador,
        jugador2: jugador2.jugador,
      })
    );

    router.push("/configuracion");
  };

  return (
    <main className="page">
      <div className="container">
        <div className="login-split-layout">
          <section className="login-left-panel">
            <div className="login-left-content">
              <h1 className="login-big-title">MEMORIA PRO</h1>

              <div className="login-info-card">
                <h3>Información de la sesión</h3>

                {mensajeGeneral && <p>{mensajeGeneral}</p>}

                {!mensajeGeneral && (
                  <>
                    <p>
                      <strong>{jugador1.jugador?.nombre_usuario}:</strong>{" "}
                      {mensajeJugador1}
                    </p>
                    <p>
                      <strong>{jugador2.jugador?.nombre_usuario}:</strong>{" "}
                      {mensajeJugador2}
                    </p>
                  </>
                )}
              </div>

              <div className="login-info-card">
                <h3>Estado actual</h3>
                <p>
                  <strong>Jugador 1:</strong>{" "}
                  {jugador1.jugador
                    ? jugador1.jugador.nombre_usuario
                    : "sin iniciar sesión"}
                </p>
                <p>
                  <strong>Jugador 2:</strong>{" "}
                  {jugador2.jugador
                    ? jugador2.jugador.nombre_usuario
                    : "sin iniciar sesión"}
                </p>
              </div>
            </div>
          </section>

          <section className="login-right-panel">
            <div className="login-right-header">
              <h2 className="login-right-title">Inicio de jugadores</h2>
              <p className="login-right-text">
                Cada jugador debe autenticarse con su email y contraseña.
              </p>
            </div>

            <div className="login-players-stack">
              <div className="login-player-card-compact">
                <div className="login-player-top">
                  <h3 className="login-player-title">Jugador 1</h3>
                  {jugador1.jugador && (
                    <span className="login-status-badge">Activo</span>
                  )}
                </div>

                {!jugador1.jugador ? (
                  <>
                    <p></p>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={jugador1.email}
                      onChange={(e) =>
                        setJugador1((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="form-input"
                    />

                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      value={jugador1.password}
                      onChange={(e) =>
                        setJugador1((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="form-input"
                    />

                    {jugador1.error && (
                      <p className="alert-error">{jugador1.error}</p>
                    )}

                    <p></p>

                    <button
                      className="btn btn-primary full-width"
                      onClick={() => iniciarSesion(1)}
                      disabled={jugador1.cargando}
                    >
                      {jugador1.cargando ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="auth-ok">✔ Autenticado</p>
                    <p>Bienvenido, {jugador1.jugador.nombre_usuario}</p>
                    <p className="alert-info">Sesión iniciada correctamente.</p>

                    <button
                      className="btn btn-danger full-width"
                      onClick={() => cerrarSesionLocal(1)}
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>

              <div className="login-player-card-compact">
                <div className="login-player-top">
                  <h3 className="login-player-title">Jugador 2</h3>
                  {jugador2.jugador && (
                    <span className="login-status-badge">Activo</span>
                  )}
                </div>

                {!jugador2.jugador ? (
                  <>
                    <p></p>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={jugador2.email}
                      onChange={(e) =>
                        setJugador2((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="form-input"
                    />

                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      value={jugador2.password}
                      onChange={(e) =>
                        setJugador2((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="form-input"
                    />

                    {jugador2.error && (
                      <p className="alert-error">{jugador2.error}</p>
                    )}

                    <p></p>

                    <button
                      className="btn btn-primary full-width"
                      onClick={() => iniciarSesion(2)}
                      disabled={jugador2.cargando}
                    >
                      {jugador2.cargando ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="auth-ok">✔ Autenticado</p>
                    <p>Bienvenido, {jugador2.jugador.nombre_usuario}</p>
                    <p className="alert-info">Sesión iniciada correctamente.</p>

                    <button
                      className="btn btn-danger full-width"
                      onClick={() => cerrarSesionLocal(2)}
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="login-bottom-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarRegistro(true)}
              >
                Registrarse
              </button>

              <button
                className="btn btn-primary"
                onClick={continuar}
                disabled={!jugador1.jugador || !jugador2.jugador}
              >
                Continuar al juego
              </button>
            </div>
          </section>
        </div>

        {mostrarRegistro && (
          <div
            className="modal-overlay"
            onClick={() => setMostrarRegistro(false)}
          >
            <div
              className="modal-content registro-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="registro-header">
                <h2 className="login-right-title">Registro de Usuario</h2>
                <p className="login-right-text">
                  Completá los datos para crear un nuevo usuario.
                </p>
              </div>

              <label className="form-label">Email</label>
              <input
                type="email"
                value={registroEmail}
                onChange={(e) => setRegistroEmail(e.target.value)}
                className="form-input"
                spellCheck={false}
              />

              <label className="form-label">Contraseña</label>
              <input
                type="password"
                value={registroPassword}
                onChange={(e) => setRegistroPassword(e.target.value)}
                className="form-input"
                spellCheck={false}
              />

              <label className="form-label">Nombre de usuario</label>
              <input
                value={registroNombreUsuario}
                onChange={(e) => setRegistroNombreUsuario(e.target.value)}
                className="form-input"
                spellCheck={false}
              />

              <label className="form-label">País</label>
              <div className="registro-pais-wrap">
                <input
                  value={registroPaisTexto}
                  onChange={(e) => {
                    setRegistroPaisTexto(e.target.value);
                    setRegistroPaisId("");
                    setMostrarDropdownPaises(true);
                  }}
                  onFocus={() => setMostrarDropdownPaises(true)}
                  className="form-input"
                  spellCheck={false}
                  autoComplete="off"
                />

                {mostrarDropdownPaises && paisesFiltrados.length > 0 && (
                  <div className="dropdown">
                    {paisesFiltrados.map((pais) => (
                      <div
                        key={pais.id}
                        className="dropdown-item"
                        onClick={() => {
                          setRegistroPaisId(pais.id);
                          setRegistroPaisTexto(pais.nombre);
                          setMostrarDropdownPaises(false);
                        }}
                      >
                        {pais.nombre}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="checkbox-row registro-checkbox">
                <input
                  type="checkbox"
                  checked={registroMayor12}
                  onChange={(e) => setRegistroMayor12(e.target.checked)}
                />
                <span>Soy mayor de 12 años</span>
              </label>

              {registroError && <p className="alert-error">{registroError}</p>}
              {registroMensaje && (
                <p className="alert-success">{registroMensaje}</p>
              )}

              <div className="login-bottom-actions registro-actions">
                <button onClick={handleRegistrar} className="btn btn-primary">
                  Crear cuenta
                </button>

                <button
                  onClick={() => setMostrarRegistro(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}