"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Pais = {
  id: string;
  nombre: string;
};

export default function RegistroPage() {
  const router = useRouter();

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [paisTexto, setPaisTexto] = useState("");
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [mayor12, setMayor12] = useState(false);

  const [paises, setPaises] = useState<Pais[]>([]);
  const [sugerencias, setSugerencias] = useState<Pais[]>([]);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const cargarPaises = async () => {
      const { data, error } = await supabase
        .from("paises")
        .select("*")
        .order("nombre", { ascending: true });

      if (!error && data) {
        setPaises(data);
      }
    };

    cargarPaises();
  }, []);

  const manejarCambioPais = (valor: string) => {
    setPaisTexto(valor);
    setPaisSeleccionado(null);

    if (!valor.trim()) {
      setSugerencias([]);
      return;
    }

    const filtrados = paises.filter((p) =>
      p.nombre.toLowerCase().includes(valor.toLowerCase())
    );

    setSugerencias(filtrados);
  };

  const seleccionarPais = (pais: Pais) => {
    setPaisTexto(pais.nombre);
    setPaisSeleccionado(pais);
    setSugerencias([]);
  };

  const registrarUsuario = async () => {
    setError("");
    setMensaje("");

    if (!nombreUsuario || !contrasena || !paisTexto) {
      setError("Completá todos los campos.");
      return;
    }

    if (!paisSeleccionado) {
      setError("Seleccioná un país válido de la lista.");
      return;
    }

    const { data: existente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("nombre_usuario", nombreUsuario)
      .maybeSingle();

    if (existente) {
      setError("El usuario ya existe.");
      return;
    }

    const { error } = await supabase.from("usuarios").insert([
      {
        nombre_usuario: nombreUsuario,
        contrasena,
        mayor_12: mayor12,
        pais_id: paisSeleccionado.id,
        pais: paisSeleccionado.nombre,
      },
    ]);

    if (error) {
      setError("Error al registrar.");
      return;
    }

    setMensaje("Usuario registrado correctamente.");

    setTimeout(() => {
      router.push("/");
    }, 1200);
  };

  return (
    <main className="page">
      <div className="container">
        <div className="registro-wrapper">
          <div className="form-card-wide registro-card">
            <div className="registro-header">
              <h1 className="login-right-title">Registro de Usuario</h1>
              <p className="login-right-text">
                Completá los datos para crear un nuevo usuario.
              </p>
            </div>

            <label className="form-label">Nombre de usuario</label>
            <input
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              className="form-input"
            />

            <label className="form-label">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="form-input"
            />

            <div className="registro-pais-wrap">
              <label className="form-label">País</label>
              <input
                value={paisTexto}
                onChange={(e) => manejarCambioPais(e.target.value)}
                className="form-input"
              />

              {sugerencias.length > 0 && (
                <div className="dropdown">
                  {sugerencias.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => seleccionarPais(p)}
                      className="dropdown-item"
                    >
                      {p.nombre}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="checkbox-row registro-checkbox">
              <input
                type="checkbox"
                checked={mayor12}
                onChange={(e) => setMayor12(e.target.checked)}
              />
              <span>Soy mayor de 12 años</span>
            </label>

            {error && <p className="alert-error">{error}</p>}
            {mensaje && <p className="alert-success">{mensaje}</p>}

            <div className="login-bottom-actions registro-actions">
              <button onClick={registrarUsuario} className="btn btn-primary">
                Registrarse
              </button>

              <button
                onClick={() => router.push("/")}
                className="btn btn-secondary"
              >
                Volver al login
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}