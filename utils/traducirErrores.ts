export function traducirErrorSupabase(error: string): string {
  const errores: Record<string, string> = {
    "Invalid login credentials": "Credenciales inválidas",
    "User already registered": "El usuario ya está registrado",
    "Invalid email": "El email no es válido",
    "Password should be at least 6 characters":
      "La contraseña debe tener al menos 6 caracteres",
    "Email not confirmed": "El correo no está confirmado",
  };

  return errores[error] || "Ocurrió un error inesperado";
}