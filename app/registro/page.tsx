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
    <main style={{ padding: "40px", color: "white" }}>
      <h1>Registro de Usuario</h1>

      <div
        style={{
          border: "1px solid white",
          padding: "20px",
          width: "380px",
          marginTop: "20px",
        }}
      >
        <label>Nombre de usuario</label>
        <input
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          style={inputStyle}
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          style={inputStyle}
        />

        <div style={{ position: "relative", marginBottom: "12px" }}>
          <label>País</label>
          <input
            value={paisTexto}
            onChange={(e) => manejarCambioPais(e.target.value)}
            style={inputStyle}
          />

          {sugerencias.length > 0 && (
            <div style={dropdownStyle}>
              {sugerencias.map((p) => (
                <div
                  key={p.id}
                  onClick={() => seleccionarPais(p)}
                  style={itemStyle}
                >
                  {p.nombre}
                </div>
              ))}
            </div>
          )}
        </div>

        <label
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "12px",
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            checked={mayor12}
            onChange={(e) => setMayor12(e.target.checked)}
          />
          Soy mayor de 12 años
        </label>

        {error && <p style={{ color: "tomato" }}>{error}</p>}
        {mensaje && <p style={{ color: "lightgreen" }}>{mensaje}</p>}

        <div style={{ marginTop: "20px" }}>
          <button onClick={registrarUsuario} style={{ marginRight: "10px" }}>
            Registrarse
          </button>

          <button onClick={() => router.push("/")}>Volver al login</button>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: "12px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid gray",
  padding: "6px",
};

const dropdownStyle = {
  position: "absolute" as const,
  top: "100%",
  left: 0,
  width: "100%",
  backgroundColor: "white",
  color: "black",
  border: "1px solid gray",
  zIndex: 10,
  maxHeight: "150px",
  overflowY: "auto" as const,
};

const itemStyle = {
  padding: "8px",
  cursor: "pointer",
  borderBottom: "1px solid #ddd",
};