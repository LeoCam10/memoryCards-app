import { supabase } from "@/lib/supabase/client";
import { Pais } from "@/types/pais";
import { RegistrarUsuarioParams, JugadorPerfil } from "@/types/usuario";

export async function obtenerPaises() {
  const { data, error } = await supabase.rpc("obtener_paises");

  if (error) throw error;

  return data as Pais[];
}

export async function registrarUsuario({
  email,
  password,
  nombreUsuario,
  pais,
  mayor12,
}: RegistrarUsuarioParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("No se pudo obtener el id del usuario autenticado.");
  }

  const { error: perfilError } = await supabase.from("usuarios").insert([
    {
      id: userId,
      email,
      nombre_usuario: nombreUsuario,
      pais_id: pais,
      mayor_12: mayor12,
    },
  ]);

  if (perfilError) throw perfilError;

  return data.user;
}

export async function obtenerPerfilUsuario(
  userId: string
): Promise<JugadorPerfil | null> {
  const { data, error } = await supabase.rpc("obtener_perfil_usuario", {
    p_user_id: userId,
  });

  if (error) throw error;

  return (data?.[0] as JugadorPerfil) ?? null;
}

export async function loginCompleto(
  email: string,
  password: string
): Promise<JugadorPerfil> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("No se pudo obtener el usuario autenticado.");
  }

  const perfil = await obtenerPerfilUsuario(userId);

  if (!perfil) {
    throw new Error("No se encontró el perfil del usuario.");
  }

  return perfil;
}

export async function cerrarSesionUsuario() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}