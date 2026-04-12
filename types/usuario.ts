export type JugadorPerfil = {
  id: string;
  email: string;
  nombre_usuario: string;
};

export type EstadoLogin = {
  email: string;
  password: string;
  cargando: boolean;
  error: string;
  jugador: JugadorPerfil | null;
};



export type RegistrarUsuarioParams = {
  email: string;
  password: string;
  nombreUsuario: string;
  paisId: string;
  mayor12: boolean;
};