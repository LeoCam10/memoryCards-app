import { supabase } from "@/lib/supabase/client";

type RegistrarUsuarioParams = {
  email: string;
  password: string;
  nombreUsuario: string;
  pais: string;
  mayor12: boolean;
};

export type Pais = {
  id: string;
  nombre: string;
};

export async function obtenerPaises() {
  const { data, error } = await supabase
    .from("paises")
    .select("id, nombre")
    .order("nombre", { ascending: true });

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
      pais,
      mayor_12: mayor12,
    },
  ]);

  if (perfilError) throw perfilError;

  return data.user;
}

export async function loginUsuario(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data.user;
}

export async function obtenerPerfilUsuario(userId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function cerrarSesionUsuario() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}