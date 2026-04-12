import { Pais } from "@/types/pais";

export function filtrarPaises(paises: Pais[], valor: string): Pais[] {
  if (!valor.trim()) return [];

  return paises.filter((p) =>
    p.nombre.toLowerCase().includes(valor.toLowerCase())
  );
}