import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Ajustes, Cliente, Pago, Prestamo, PrestamoConCliente } from "@/lib/types";

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

/** Las plantillas de WhatsApp. Devuelve null si nunca se guardaron. */
export async function traerAjustes(): Promise<Ajustes | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("ajustes").select("*").maybeSingle();
  return data;
}

export type { Ajustes, Cliente, Pago, Prestamo, PrestamoConCliente };
