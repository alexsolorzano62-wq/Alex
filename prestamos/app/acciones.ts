"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularPlan, capitalizar, pesos, resumen, tasaImplicita } from "@/lib/calc";
import { hoyISO, sumarMeses } from "@/lib/fechas";
import { datosFrecuencia, frecuenciaDe, siguienteVencimiento } from "@/lib/periodos";
import type { Frecuencia } from "@/lib/types";
import { nombreCoincide, parsearPesos, parsearTasa } from "@/lib/parseo";
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

/**
 * Borra un cliente y, con él, todos sus préstamos y pagos.
 *
 * Pide escribir el nombre a mano. La confirmación va acá y no en un cartel del
 * navegador a propósito: un cartel se puede saltear con un toque apurado, y
 * esto no se puede deshacer.
 */
export async function borrarCliente(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const id = String(datos.get("id") ?? "");
  const escrito = String(datos.get("confirmacion") ?? "").trim();

  const { supabase } = await sesion();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("nombre")
    .eq("id", id)
    .maybeSingle();
  if (!cliente) return { error: "No se encontró el cliente." };

  if (!nombreCoincide(escrito, cliente.nombre)) {
    return {
      error: `Para borrarlo, escribí su nombre tal cual: ${cliente.nombre}`,
    };
  }

  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) return { error: `No se pudo borrar: ${error.message}` };

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
  const cuotaManual = parsearPesos(String(datos.get("cuota_manual")));

  const frecuencia = (String(datos.get("frecuencia") ?? "mensual") ||
    "mensual") as Frecuencia;

  const plan = calcularPlan({
    modalidad,
    capital,
    tasa,
    cuotas,
    totalManual,
    cuotaManual,
    frecuencia,
    plazoMeses,
  });

  // En un plan personalizado la cantidad de cuotas sale del plazo y de cada
  // cuánto paga: 3 meses cobrando por semana son 12 cuotas.
  const cantidadCuotas =
    modalidad === "personalizado"
      ? Math.max(1, Math.round(Math.max(1, plazoMeses) * datosFrecuencia(frecuencia).porMes))
      : cuotas;

  // Todo lo que no sea 'mensual' es un plan cerrado con cuotas.
  const esPlan = modalidad !== "mensual";

  // El primer vencimiento cae a la semana en los planes semanales, al mes en
  // los mensuales, y según el plazo elegido en la modalidad de interés mensual.
  const fechaVencimiento = esPlan
    ? siguienteVencimiento(
        fechaInicio,
        modalidad === "semanal" ? "semanal" : modalidad === "cuotas" ? "mensual" : frecuencia
      )
    : sumarMeses(fechaInicio, Math.max(1, plazoMeses));

  // Un plan semanal no tiene tasa escrita: se guarda la que quedó implícita,
  // para poder mostrarla después.
  const tasaGuardada =
    modalidad === "semanal" ? tasaImplicita(capital, plan.total) : tasa;

  const { supabase, ownerId } = await sesion();
  const { data, error } = await supabase
    .from("prestamos")
    .insert({
      owner_id: ownerId,
      cliente_id: clienteId,
      modalidad,
      capital_inicial: pesos(capital),
      capital_actual: pesos(capital),
      tasa_mensual: tasaGuardada,
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVencimiento,
      cuotas_total: esPlan ? cantidadCuotas : null,
      frecuencia: esPlan
        ? modalidad === "semanal"
          ? "semanal"
          : modalidad === "cuotas"
            ? "mensual"
            : frecuencia
        : null,
      cuota_monto: plan.cuotaMonto,
      total_a_devolver: esPlan ? plan.total : null,
      observacion: String(datos.get("observacion") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  refrescar();
  redirect(`/prestamos/${data.id}?nuevo=1`);
}

/**
 * Corrige un préstamo ya cargado sin tocar sus cobros.
 *
 * Se editan los números y las fechas, no la modalidad: cambiarla con cobros
 * registrados dejaría un historial que no se corresponde con el plan. El
 * vencimiento se edita a mano en vez de recalcularse, porque en los préstamos
 * con interés mensual ya se corrió con cada renovación.
 */
export async function editarPrestamo(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const id = String(datos.get("id") ?? "");
  const capital = parsearPesos(String(datos.get("capital")));
  if (capital == null || capital <= 0) return { error: "Poné el monto prestado." };

  const { supabase } = await sesion();

  const { data: previo } = await supabase
    .from("prestamos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!previo) return { error: "No se encontró el préstamo." };

  const tasa = parsearTasa(String(datos.get("tasa"))) ?? 0;
  const cuotas = Number(datos.get("cuotas") ?? 0) || null;
  const cuotaMonto = parsearPesos(String(datos.get("cuota_monto")));
  const esPlan = previo.modalidad !== "mensual";

  if (esPlan && (!cuotas || !cuotaMonto || cuotaMonto <= 0)) {
    return { error: "Poné la cantidad de cuotas y cuánto es cada una." };
  }

  // El capital que sigue debiendo se mueve lo mismo que el prestado, así no se
  // pierden las entregas a cuenta que ya estaban registradas.
  const diferencia = pesos(capital) - pesos(previo.capital_inicial);
  const capitalActual = Math.max(0, pesos(previo.capital_actual + diferencia));

  const { error } = await supabase
    .from("prestamos")
    .update({
      capital_inicial: pesos(capital),
      capital_actual: capitalActual,
      tasa_mensual: esPlan
        ? tasaImplicita(capital, pesos((cuotaMonto ?? 0) * (cuotas ?? 1)))
        : tasa,
      fecha_inicio: String(datos.get("fecha_inicio") || previo.fecha_inicio),
      fecha_vencimiento: String(
        datos.get("fecha_vencimiento") || previo.fecha_vencimiento
      ),
      cuotas_total: esPlan ? cuotas : null,
      cuota_monto: esPlan ? pesos(cuotaMonto ?? 0) : null,
      total_a_devolver: esPlan ? pesos((cuotaMonto ?? 0) * (cuotas ?? 1)) : null,
      observacion: String(datos.get("observacion") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  refrescar();
  redirect(`/prestamos/${id}`);
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
      cambios.fecha_vencimiento = siguienteVencimiento(
        prestamo.fecha_vencimiento,
        frecuenciaDe(prestamo)
      );
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

// ---------------------------------------------------------------- plantillas

export async function guardarPlantillas(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const { supabase, ownerId } = await sesion();

  // Los campos llegan como "estado_cuenta.semanal". Solo se guarda lo que
  // tiene texto: lo vacío vuelve al texto de fábrica.
  const plantillas: Record<string, Record<string, string>> = {};
  for (const [campo, valor] of datos.entries()) {
    if (!campo.includes(".")) continue;
    const [tipo, modalidad] = campo.split(".");
    const texto = String(valor).trim();
    if (!texto) continue;
    plantillas[tipo] = { ...plantillas[tipo], [modalidad]: texto };
  }

  const { error } = await supabase.from("ajustes").upsert({
    owner_id: ownerId,
    plantillas,
    actualizado_at: new Date().toISOString(),
  });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  refrescar();
  return undefined;
}

// --------------------------------------------------------------------- salir

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
