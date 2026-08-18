import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Ajustes, Cliente, Pago, Prestamo, PrestamoConCliente } from "@/lib/types";
import type { PlantillasGuardadas, TipoMensaje } from "@/lib/plantillas";

/** El usuario de la sesión. El proxy ya garantiza que hay uno. */
export async function usuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function traerClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre");

  if (error) throw new Error(`No se pudieron traer los clientes: ${error.message}`);
  return data ?? [];
}

export async function traerCliente(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  return data;
}

/**
 * Todos los préstamos con su cliente y sus pagos ya resueltos, para poder
 * calcular saldos sin volver a consultar por cada fila.
 */
export async function traerPrestamos(): Promise<PrestamoConCliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestamos")
    .select("*, cliente:clientes (id, nombre, telefono), pagos (*)")
    .order("fecha_vencimiento");

  if (error) throw new Error(`No se pudieron traer los préstamos: ${error.message}`);
  return (data ?? []) as PrestamoConCliente[];
}

export async function traerPrestamo(id: string): Promise<PrestamoConCliente | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prestamos")
    .select("*, cliente:clientes (id, nombre, telefono), pagos (*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const prestamo = data as PrestamoConCliente;
  prestamo.pagos = [...prestamo.pagos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return prestamo;
}

export async function traerPrestamosDeCliente(
  clienteId: string
): Promise<PrestamoConCliente[]> {
  const todos = await traerPrestamos();
  return todos.filter((prestamo) => prestamo.cliente_id === clienteId);
}

/**
 * Las plantillas de WhatsApp, ya ordenadas por tipo y modalidad.
 *
 * Si quedó algo guardado en las columnas viejas —de cuando había un solo texto
 * por mensaje— se usa como respaldo para las tres modalidades, así nadie pierde
 * lo que había escrito.
 */
export async function traerPlantillas(): Promise<PlantillasGuardadas> {
  const supabase = await createClient();
  const { data } = await supabase.from("ajustes").select("*").maybeSingle();
  if (!data) return {};

  const fila = data as Ajustes;
  const guardadas: PlantillasGuardadas = {};

  const legado: [TipoMensaje, string | null][] = [
    ["estado_cuenta", fila.plantilla_estado_cuenta],
    ["prestamo_nuevo", fila.plantilla_prestamo_nuevo],
    ["comprobante", fila.plantilla_comprobante],
  ];
  for (const [tipo, texto] of legado) {
    if (texto?.trim()) {
      guardadas[tipo] = { mensual: texto, semanal: texto, cuotas: texto };
    }
  }

  for (const [tipo, porModalidad] of Object.entries(fila.plantillas ?? {})) {
    guardadas[tipo as TipoMensaje] = {
      ...guardadas[tipo as TipoMensaje],
      ...porModalidad,
    };
  }

  return guardadas;
}

export type { Ajustes, Cliente, Pago, Prestamo, PrestamoConCliente };
