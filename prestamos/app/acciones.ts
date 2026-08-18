"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularPlan, capitalizar, pesos, resumen } from "@/lib/calc";
import { hoyISO, sumarMeses } from "@/lib/fechas";
import { parsearPesos, parsearTasa } from "@/lib/parseo";
import type { Modalidad, TipoPago } from "@/lib/types";

export type Resultado = { error: string } | undefined;

async function sesion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, ownerId: user.id };
}

function refrescar() {
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------------ clientes

export async function crearCliente(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Poné el nombre del cliente." };

  const { supabase, ownerId } = await sesion();
  const { error } = await supabase.from("clientes").insert({
    owner_id: ownerId,
    nombre,
    telefono: String(datos.get("telefono") ?? "").trim() || null,
    notas: String(datos.get("notas") ?? "").trim() || null,
  });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  refrescar();
  redirect("/clientes");
}

export async function editarCliente(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const id = String(datos.get("id") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Poné el nombre del cliente." };

  const { supabase } = await sesion();
  const { error } = await supabase
    .from("clientes")
    .update({
      nombre,
      telefono: String(datos.get("telefono") ?? "").trim() || null,
      notas: String(datos.get("notas") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  refrescar();
  redirect(`/clientes/${id}`);
}

export async function borrarCliente(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  const { supabase } = await sesion();
  await supabase.from("clientes").delete().eq("id", id);
  refrescar();
  redirect("/clientes");
}

// ----------------------------------------------------------------- préstamos

export async function crearPrestamo(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const clienteId = String(datos.get("cliente_id") ?? "");
  if (!clienteId) return { error: "Elegí a qué cliente le prestás." };

  const capital = parsearPesos(String(datos.get("capital")));
  if (capital == null || capital <= 0) return { error: "Poné el monto prestado." };

  const modalidad = String(datos.get("modalidad") ?? "mensual") as Modalidad;
  const tasa = parsearTasa(String(datos.get("tasa"))) ?? 0;
  const fechaInicio = String(datos.get("fecha_inicio") || hoyISO());
  const plazoMeses = Number(datos.get("plazo_meses") ?? 1) || 1;
  const cuotas = Number(datos.get("cuotas") ?? 1) || 1;
  const totalManual = parsearPesos(String(datos.get("total_manual")));

  const plan = calcularPlan({ modalidad, capital, tasa, cuotas, totalManual });

  // En cuotas, el primer vencimiento es al mes; en mensual, según el plazo.
  const fechaVencimiento = sumarMeses(
    fechaInicio,
    modalidad === "cuotas" ? 1 : Math.max(1, plazoMeses)
  );

  const { supabase, ownerId } = await sesion();
  const { data, error } = await supabase
    .from("prestamos")
    .insert({
      owner_id: ownerId,
      cliente_id: clienteId,
      modalidad,
      capital_inicial: pesos(capital),
      capital_actual: pesos(capital),
      tasa_mensual: tasa,
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVencimiento,
      cuotas_total: modalidad === "cuotas" ? cuotas : null,
      cuota_monto: plan.cuotaMonto,
      total_a_devolver: modalidad === "cuotas" ? plan.total : null,
      observacion: String(datos.get("observacion") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  refrescar();
  redirect(`/prestamos/${data.id}?nuevo=1`);
}

export async function borrarPrestamo(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  const { supabase } = await sesion();
  await supabase.from("prestamos").delete().eq("id", id);
  refrescar();
  redirect("/prestamos");
}

/**
 * No pagó el interés del mes: ese interés pasa a formar parte del capital y
 * arranca otro período. Desde acá en más el interés se calcula sobre el
 * capital nuevo, más grande.
 */
export async function capitalizarPrestamo(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  const { supabase } = await sesion();

  const { data: prestamo } = await supabase
    .from("prestamos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!prestamo) return;

  await supabase.from("prestamos").update(capitalizar(prestamo)).eq("id", id);
  refrescar();
}

// --------------------------------------------------------------------- pagos

export async function registrarPago(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const prestamoId = String(datos.get("prestamo_id") ?? "");
  const tipo = String(datos.get("tipo") ?? "") as TipoPago;
  const fecha = String(datos.get("fecha") || hoyISO());
  const nota = String(datos.get("nota") ?? "").trim() || null;

  const { supabase, ownerId } = await sesion();

  const { data: prestamo } = await supabase
    .from("prestamos")
    .select("*, pagos (*)")
    .eq("id", prestamoId)
    .maybeSingle();
  if (!prestamo) return { error: "No se encontró el préstamo." };

  const datosPrestamo = resumen(prestamo, prestamo.pagos ?? [], hoyISO());

  // Cada tipo de cobro tiene un monto natural; el formulario solo lo pisa
  // cuando el cliente entregó otra cosa.
  const montoSugerido: Record<TipoPago, number> = {
    interes: datosPrestamo.interes,
    capital: 0,
    cuota: datosPrestamo.cuotaMonto ?? 0,
    total: datosPrestamo.aDevolver,
  };
  const monto = parsearPesos(String(datos.get("monto"))) ?? montoSugerido[tipo];

  if (!monto || monto <= 0) return { error: "Poné cuánto te pagó." };

  const { error } = await supabase.from("pagos").insert({
    owner_id: ownerId,
    prestamo_id: prestamoId,
    fecha,
    monto: pesos(monto),
    tipo,
    nota,
  });
  if (error) return { error: `No se pudo guardar el pago: ${error.message}` };

  const cambios: Record<string, unknown> = {};

  if (tipo === "interes") {
    // Cobró el interés: el capital queda igual y corre otro mes.
    cambios.fecha_vencimiento = sumarMeses(prestamo.fecha_vencimiento, 1);
  } else if (tipo === "capital") {
    const capitalNuevo = Math.max(0, pesos(prestamo.capital_actual - monto));
    cambios.capital_actual = capitalNuevo;
    if (capitalNuevo === 0) cambios.estado = "pagado";
  } else if (tipo === "cuota") {
    const cuotasPagadas = (prestamo.pagos ?? []).filter(
      (pago: { tipo: string }) => pago.tipo === "cuota"
    ).length + 1;
    if (cuotasPagadas >= (prestamo.cuotas_total ?? 1)) {
      cambios.estado = "pagado";
      cambios.capital_actual = 0;
    } else {
      cambios.fecha_vencimiento = sumarMeses(prestamo.fecha_vencimiento, 1);
    }
  } else if (tipo === "total") {
    cambios.estado = "pagado";
    cambios.capital_actual = 0;
  }

  if (Object.keys(cambios).length > 0) {
    await supabase.from("prestamos").update(cambios).eq("id", prestamoId);
  }

  refrescar();
  return undefined;
}

export async function borrarPago(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  const { supabase } = await sesion();
  await supabase.from("pagos").delete().eq("id", id);
  refrescar();
}

// --------------------------------------------------------------------- salir

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
