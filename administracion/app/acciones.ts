"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/supabase/perfil";
import { parsearMonto, parsearPorcentaje, textoONulo, enteroONulo } from "@/lib/parseo";
import { calcularAjuste, proximoAjuste } from "@/lib/ajustes";
import { primerDiaDelMes, vencimientoDelPeriodo, hoyISO, nombreDelPeriodo } from "@/lib/fechas";
import { calcularTotales, armarDetalle } from "@/lib/liquidacion";
import { redondear } from "@/lib/dinero";
import type { Indice, Moneda } from "@/lib/types";

// Toda acción del servidor se puede invocar por POST directo, sin pasar por la
// pantalla. Por eso cada una verifica sesión y pertenencia al equipo acá
// adentro, además de la RLS que aplica la base.
async function sesion() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Se venció la sesión. Volvé a entrar.");

  const perfil = await getPerfil(supabase, user.id);
  if (!perfil) throw new Error("Tu usuario no forma parte del equipo.");

  return { supabase, user, perfil };
}

async function sesionAdmin() {
  const datos = await sesion();
  if (datos.perfil.rol !== "admin") {
    throw new Error("Solo un administrador puede hacer esto.");
  }
  return datos;
}

// ---------------------------------------------------------- propietarios --

export async function crearPropietario(formData: FormData) {
  const { supabase, user } = await sesion();

  const { data, error } = await supabase
    .from("propietarios")
    .insert({
      nombre: String(formData.get("nombre") ?? "").trim(),
      documento: textoONulo(formData.get("documento")),
      telefono: textoONulo(formData.get("telefono")),
      email: textoONulo(formData.get("email")),
      forma_cobro: String(formData.get("forma_cobro") ?? "transferencia"),
      cbu: textoONulo(formData.get("cbu")),
      alias_cbu: textoONulo(formData.get("alias_cbu")),
      titular_cuenta: textoONulo(formData.get("titular_cuenta")),
      notas: textoONulo(formData.get("notas")),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(`No se pudo guardar el propietario: ${error.message}`);

  revalidatePath("/propietarios");
  redirect(`/propietarios/${data.id}`);
}

export async function actualizarPropietario(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("propietarios")
    .update({
      nombre: String(formData.get("nombre") ?? "").trim(),
      documento: textoONulo(formData.get("documento")),
      telefono: textoONulo(formData.get("telefono")),
      email: textoONulo(formData.get("email")),
      forma_cobro: String(formData.get("forma_cobro") ?? "transferencia"),
      cbu: textoONulo(formData.get("cbu")),
      alias_cbu: textoONulo(formData.get("alias_cbu")),
      titular_cuenta: textoONulo(formData.get("titular_cuenta")),
      notas: textoONulo(formData.get("notas")),
    })
    .eq("id", id);

  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);

  revalidatePath("/propietarios");
  revalidatePath(`/propietarios/${id}`);
  redirect(`/propietarios/${id}`);
}

// Nada se borra: se archiva. Un propietario archivado desaparece de las listas
// pero su historial de liquidaciones queda intacto.
export async function archivarPropietario(formData: FormData) {
  const { supabase } = await sesionAdmin();
  const id = String(formData.get("id"));

  const { count } = await supabase
    .from("propiedades")
    .select("id", { count: "exact", head: true })
    .eq("propietario_id", id)
    .is("deleted_at", null);

  if ((count ?? 0) > 0) {
    throw new Error(
      `No se puede archivar: el propietario todavía tiene ${count} propiedades activas.`
    );
  }

  const { error } = await supabase
    .from("propietarios")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/propietarios");
  redirect("/propietarios");
}

// ------------------------------------------------------------ inquilinos --

export async function crearInquilino(formData: FormData) {
  const { supabase, user } = await sesion();

  const { data, error } = await supabase
    .from("inquilinos")
    .insert({
      nombre: String(formData.get("nombre") ?? "").trim(),
      documento: textoONulo(formData.get("documento")),
      telefono: textoONulo(formData.get("telefono")),
      email: textoONulo(formData.get("email")),
      notas: textoONulo(formData.get("notas")),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(`No se pudo guardar el inquilino: ${error.message}`);

  revalidatePath("/inquilinos");
  redirect(`/inquilinos/${data.id}`);
}

export async function actualizarInquilino(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("inquilinos")
    .update({
      nombre: String(formData.get("nombre") ?? "").trim(),
      documento: textoONulo(formData.get("documento")),
      telefono: textoONulo(formData.get("telefono")),
      email: textoONulo(formData.get("email")),
      notas: textoONulo(formData.get("notas")),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/inquilinos/${id}`);
  redirect(`/inquilinos/${id}`);
}

// ----------------------------------------------------------- propiedades --

function datosPropiedad(formData: FormData) {
  return {
    propietario_id: String(formData.get("propietario_id")),
    titulares_adicionales: textoONulo(formData.get("titulares_adicionales")),
    direccion: String(formData.get("direccion") ?? "").trim(),
    edificio: textoONulo(formData.get("edificio")),
    piso_depto: textoONulo(formData.get("piso_depto")),
    localidad: textoONulo(formData.get("localidad")),
    provincia: textoONulo(formData.get("provincia")),
    tipo: String(formData.get("tipo") ?? "departamento"),
    ambientes: enteroONulo(formData.get("ambientes")),
    superficie_m2: parsearMonto(String(formData.get("superficie_m2") ?? "")),
    partida_inmobiliaria: textoONulo(formData.get("partida_inmobiliaria")),
    cuenta_luz: textoONulo(formData.get("cuenta_luz")),
    cuenta_gas: textoONulo(formData.get("cuenta_gas")),
    cuenta_agua: textoONulo(formData.get("cuenta_agua")),
    expensas_unidad: textoONulo(formData.get("expensas_unidad")),
    estado: String(formData.get("estado") ?? "alquilado"),
    notas: textoONulo(formData.get("notas")),
  };
}

export async function crearPropiedad(formData: FormData) {
  const { supabase, user } = await sesion();

  const { data, error } = await supabase
    .from("propiedades")
    .insert({ ...datosPropiedad(formData), created_by: user.id })
    .select("id")
    .single();

  if (error) throw new Error(`No se pudo guardar la propiedad: ${error.message}`);

  revalidatePath("/propiedades");
  redirect(`/propiedades/${data.id}`);
}

export async function actualizarPropiedad(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("propiedades")
    .update(datosPropiedad(formData))
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${id}`);
  redirect(`/propiedades/${id}`);
}

// ------------------------------------------------------------- contratos --

function datosContrato(formData: FormData) {
  const indice = String(formData.get("indice") ?? "ICL") as Indice;
  const montoInicial = parsearMonto(String(formData.get("monto_inicial") ?? ""));
  if (montoInicial == null || montoInicial <= 0) {
    throw new Error("El monto del alquiler es obligatorio.");
  }

  const fechaInicio = String(formData.get("fecha_inicio"));
  const frecuencia = enteroONulo(formData.get("ajuste_frecuencia_meses")) ?? 3;

  return {
    propiedad_id: String(formData.get("propiedad_id")),
    inquilino_id: String(formData.get("inquilino_id")),
    garantes: textoONulo(formData.get("garantes")),
    fecha_inicio: fechaInicio,
    fecha_fin: String(formData.get("fecha_fin")),
    destino: String(formData.get("destino") ?? "vivienda"),
    moneda: String(formData.get("moneda") ?? "ARS") as Moneda,
    monto_inicial: montoInicial,
    deposito_monto: parsearMonto(String(formData.get("deposito_monto") ?? "")),
    dia_vencimiento: enteroONulo(formData.get("dia_vencimiento")) ?? 10,
    honorarios_porcentaje: parsearPorcentaje(String(formData.get("honorarios_porcentaje") ?? "")) ?? 8,
    indice,
    ajuste_frecuencia_meses: frecuencia,
    ajuste_porcentaje_fijo:
      indice === "FIJO"
        ? parsearPorcentaje(String(formData.get("ajuste_porcentaje_fijo") ?? ""))
        : null,
    punitorio_tipo: String(formData.get("punitorio_tipo") ?? "porcentaje_diario"),
    punitorio_valor: parsearMonto(String(formData.get("punitorio_valor") ?? "")) ?? 0,
    punitorio_dias_gracia: enteroONulo(formData.get("punitorio_dias_gracia")) ?? 0,
    observaciones: textoONulo(formData.get("observaciones")),
  };
}

export async function crearContrato(formData: FormData) {
  const { supabase, user } = await sesion();
  const datos = datosContrato(formData);

  // El primer ajuste se cuenta desde el inicio del contrato. Si no ajusta,
  // no hay próxima fecha que vigilar.
  const proxima =
    datos.indice === "SIN_AJUSTE"
      ? null
      : proximoAjuste(datos.fecha_inicio, datos.ajuste_frecuencia_meses);

  const { data, error } = await supabase
    .from("contratos")
    .insert({
      ...datos,
      monto_actual: datos.monto_inicial,
      fecha_proximo_ajuste: proxima,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(`No se pudo guardar el contrato: ${error.message}`);

  // Si se alquila, la propiedad deja de estar disponible.
  await supabase
    .from("propiedades")
    .update({ estado: "alquilado" })
    .eq("id", datos.propiedad_id);

  revalidatePath("/contratos");
  redirect(`/contratos/${data.id}`);
}

export async function actualizarContrato(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("id"));
  const datos = datosContrato(formData);

  // El monto vigente no se toca desde el formulario: lo mueve el motor de
  // ajustes, para que cada cambio de precio quede registrado con su motivo.
  const { error } = await supabase
    .from("contratos")
    .update({
      ...datos,
      estado: String(formData.get("estado") ?? "activo"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  redirect(`/contratos/${id}`);
}

export async function finalizarContrato(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("id"));
  const propiedadId = String(formData.get("propiedad_id"));

  const { error } = await supabase
    .from("contratos")
    .update({
      estado: String(formData.get("estado") ?? "finalizado"),
      fecha_proximo_ajuste: null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase
    .from("propiedades")
    .update({ estado: "disponible" })
    .eq("id", propiedadId);

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
}

// --------------------------------------------------------------- ajustes --

// Aplica el aumento a un contrato y deja el renglón en el historial. El monto
// nuevo empieza a regir para los recibos que se emitan desde acá en adelante.
export async function aplicarAjuste(formData: FormData) {
  const { supabase, user } = await sesion();

  const contratoId = String(formData.get("contrato_id"));
  const montoNuevo = parsearMonto(String(formData.get("monto_nuevo") ?? ""));
  if (montoNuevo == null || montoNuevo <= 0) {
    throw new Error("El monto nuevo no es válido.");
  }

  const { data: contrato, error: errorContrato } = await supabase
    .from("contratos")
    .select("id, monto_actual, indice, ajuste_frecuencia_meses, fecha_inicio, fecha_ultimo_ajuste")
    .eq("id", contratoId)
    .single();

  if (errorContrato || !contrato) throw new Error("No se encontró el contrato.");

  const fechaAplicacion = String(formData.get("fecha_aplicacion") ?? hoyISO());
  const desde = contrato.fecha_ultimo_ajuste ?? contrato.fecha_inicio;
  const montoAnterior = Number(contrato.monto_actual);

  const { error: errorAjuste } = await supabase.from("ajustes").insert({
    contrato_id: contratoId,
    fecha_aplicacion: fechaAplicacion,
    periodo_desde: desde,
    periodo_hasta: fechaAplicacion,
    indice: contrato.indice,
    valor_indice_base: parsearMonto(String(formData.get("valor_indice_base") ?? "")),
    valor_indice_final: parsearMonto(String(formData.get("valor_indice_final") ?? "")),
    coeficiente: montoAnterior > 0 ? redondear(montoNuevo / montoAnterior) : 1,
    monto_anterior: montoAnterior,
    monto_nuevo: montoNuevo,
    created_by: user.id,
  });

  if (errorAjuste) throw new Error(`No se pudo registrar el ajuste: ${errorAjuste.message}`);

  const { error: errorUpdate } = await supabase
    .from("contratos")
    .update({
      monto_actual: montoNuevo,
      fecha_ultimo_ajuste: fechaAplicacion,
      fecha_proximo_ajuste: proximoAjuste(fechaAplicacion, contrato.ajuste_frecuencia_meses),
    })
    .eq("id", contratoId);

  if (errorUpdate) throw new Error(errorUpdate.message);

  revalidatePath("/ajustes");
  revalidatePath("/contratos");
  revalidatePath(`/contratos/${contratoId}`);
}

// Marca que ya se le avisó al inquilino del aumento.
export async function marcarAjusteNotificado(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("ajuste_id"));

  const { error } = await supabase
    .from("ajustes")
    .update({ notificado_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/ajustes");
}

// ---------------------------------------------------------------- cobros --

// Emite el recibo del mes de un contrato. Una vez guardado no se edita: la
// base misma lo impide. Si hubo un error, se anula y se emite otro.
export async function registrarCobro(formData: FormData) {
  const { supabase, user } = await sesion();

  const contratoId = String(formData.get("contrato_id"));
  const periodo = primerDiaDelMes(String(formData.get("periodo")));
  const fechaPago = String(formData.get("fecha_pago") ?? hoyISO());

  const { data: contrato, error: errorContrato } = await supabase
    .from("contratos")
    .select("id, moneda, dia_vencimiento")
    .eq("id", contratoId)
    .single();

  if (errorContrato || !contrato) throw new Error("No se encontró el contrato.");

  const tipos = formData.getAll("concepto_tipo").map(String);
  const descripciones = formData.getAll("concepto_descripcion").map(String);
  const montos = formData.getAll("concepto_monto").map((m) => parsearMonto(String(m)) ?? 0);

  const conceptos = tipos
    .map((tipo, i) => ({
      tipo,
      descripcion: descripciones[i]?.trim() || null,
      monto: montos[i] ?? 0,
      orden: i,
    }))
    .filter((c) => c.monto !== 0);

  if (conceptos.length === 0) {
    throw new Error("El recibo no puede salir vacío: cargá al menos un concepto.");
  }

  const total = redondear(conceptos.reduce((suma, c) => suma + c.monto, 0));

  const { data: cobro, error: errorCobro } = await supabase
    .from("cobros")
    .insert({
      contrato_id: contratoId,
      periodo,
      fecha_pago: fechaPago,
      vencimiento: vencimientoDelPeriodo(periodo, contrato.dia_vencimiento),
      moneda: contrato.moneda,
      total,
      medio_pago: String(formData.get("medio_pago") ?? "transferencia"),
      notas: textoONulo(formData.get("notas")),
      created_by: user.id,
    })
    .select("id, numero")
    .single();

  if (errorCobro) {
    if (errorCobro.code === "23505") {
      throw new Error(
        `Este contrato ya tiene un recibo de ${nombreDelPeriodo(periodo)}. Anulá el anterior si querés reemplazarlo.`
      );
    }
    throw new Error(`No se pudo emitir el recibo: ${errorCobro.message}`);
  }

  const { error: errorConceptos } = await supabase
    .from("cobro_conceptos")
    .insert(conceptos.map((c) => ({ ...c, cobro_id: cobro.id })));

  if (errorConceptos) throw new Error(errorConceptos.message);

  // Los gastos que se le cobraron al inquilino quedan imputados a este recibo,
  // para que no se los vuelva a cobrar el mes que viene.
  const gastosImputados = formData.getAll("gasto_id").map(String).filter(Boolean);
  if (gastosImputados.length > 0) {
    await supabase
      .from("gastos")
      .update({ cobro_id: cobro.id })
      .in("id", gastosImputados);
  }

  revalidatePath("/cobros");
  revalidatePath("/panel");
  revalidatePath(`/contratos/${contratoId}`);
  redirect(`/cobros/${cobro.id}`);
}

export async function anularCobro(formData: FormData) {
  const { supabase, user } = await sesionAdmin();

  const id = String(formData.get("id"));
  const motivo = textoONulo(formData.get("motivo"));
  if (!motivo) throw new Error("Para anular un recibo hay que decir por qué.");

  const { error } = await supabase
    .from("cobros")
    .update({
      anulado_at: new Date().toISOString(),
      anulado_motivo: motivo,
      anulado_por: user.id,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Los gastos que iban en ese recibo vuelven a quedar pendientes.
  await supabase.from("gastos").update({ cobro_id: null }).eq("cobro_id", id);

  revalidatePath("/cobros");
  revalidatePath("/panel");
}

// Cada reimpresión se cuenta: a partir de la segunda, el PDF sale marcado
// como DUPLICADO.
export async function contarReimpresion(cobroId: string) {
  const { supabase } = await sesion();

  const { data } = await supabase
    .from("cobros")
    .select("emisiones")
    .eq("id", cobroId)
    .single();

  if (!data) return;

  await supabase
    .from("cobros")
    .update({ emisiones: Number(data.emisiones) + 1 })
    .eq("id", cobroId);
}

// ---------------------------------------------------------------- gastos --

export async function crearGasto(formData: FormData) {
  const { supabase, user } = await sesion();

  const monto = parsearMonto(String(formData.get("monto") ?? ""));
  if (monto == null || monto <= 0) throw new Error("El monto del gasto es obligatorio.");

  const { error } = await supabase.from("gastos").insert({
    propiedad_id: String(formData.get("propiedad_id")),
    contrato_id: textoONulo(formData.get("contrato_id")),
    fecha: String(formData.get("fecha") ?? hoyISO()),
    tipo: String(formData.get("tipo") ?? "otro"),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    monto,
    moneda: String(formData.get("moneda") ?? "ARS"),
    a_cargo_de: String(formData.get("a_cargo_de") ?? "propietario"),
    notas: textoONulo(formData.get("notas")),
    created_by: user.id,
  });

  if (error) throw new Error(`No se pudo guardar el gasto: ${error.message}`);

  revalidatePath("/gastos");
  revalidatePath("/panel");
}

export async function archivarGasto(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("id"));

  const { data: gasto } = await supabase
    .from("gastos")
    .select("cobro_id, liquidacion_id")
    .eq("id", id)
    .single();

  if (gasto?.cobro_id || gasto?.liquidacion_id) {
    throw new Error(
      "Este gasto ya está imputado en un recibo o en una liquidación. Anulá ese documento primero."
    );
  }

  const { error } = await supabase
    .from("gastos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
}

// --------------------------------------------------------- liquidaciones --

type RenglonPreparado = {
  moneda: Moneda;
  cobros: { descripcion: string; contratoId: string; cobroId: string; montoCobrado: number; honorariosPorcentaje: number }[];
  gastos: { descripcion: string; contratoId: string | null; gastoId: string; monto: number }[];
};

// Junta todo lo que le corresponde a un propietario en un mes: lo cobrado por
// sus contratos y los gastos que le tocan. Separado por moneda, porque un
// propietario puede tener un contrato en pesos y otro en dólares.
async function juntarMovimientos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propietarioId: string,
  periodo: string
): Promise<Map<Moneda, RenglonPreparado>> {
  const { data: propiedades } = await supabase
    .from("propiedades")
    .select("id, direccion, piso_depto")
    .eq("propietario_id", propietarioId)
    .is("deleted_at", null);

  const idsPropiedad = (propiedades ?? []).map((p) => p.id);
  if (idsPropiedad.length === 0) return new Map();

  const direccionDe = new Map(
    (propiedades ?? []).map((p) => [
      p.id,
      `${p.direccion}${p.piso_depto ? ` ${p.piso_depto}` : ""}`,
    ])
  );

  const { data: contratos } = await supabase
    .from("contratos")
    .select("id, propiedad_id, honorarios_porcentaje")
    .in("propiedad_id", idsPropiedad)
    .is("deleted_at", null);

  const contratosPorId = new Map(
    (contratos ?? []).map((c) => [c.id, c])
  );
  const idsContrato = (contratos ?? []).map((c) => c.id);
  if (idsContrato.length === 0) return new Map();

  // Cobros del mes que todavía no entraron en ninguna liquidación.
  const { data: cobros } = await supabase
    .from("cobros")
    .select("id, contrato_id, total, moneda")
    .in("contrato_id", idsContrato)
    .eq("periodo", periodo)
    .is("anulado_at", null);

  const { data: yaLiquidados } = await supabase
    .from("liquidacion_detalle")
    .select("cobro_id")
    .in("cobro_id", (cobros ?? []).map((c) => c.id));

  const cobrosUsados = new Set((yaLiquidados ?? []).map((d) => d.cobro_id));

  const { data: gastos } = await supabase
    .from("gastos")
    .select("id, propiedad_id, contrato_id, descripcion, monto, moneda, fecha")
    .in("propiedad_id", idsPropiedad)
    .eq("a_cargo_de", "propietario")
    .is("liquidacion_id", null)
    .is("cobro_id", null)
    .is("deleted_at", null)
    .lte("fecha", periodo.slice(0, 8) + "28");

  const porMoneda = new Map<Moneda, RenglonPreparado>();
  const asegurar = (moneda: Moneda) => {
    if (!porMoneda.has(moneda)) {
      porMoneda.set(moneda, { moneda, cobros: [], gastos: [] });
    }
    return porMoneda.get(moneda)!;
  };

  for (const cobro of cobros ?? []) {
    if (cobrosUsados.has(cobro.id)) continue;
    const contrato = contratosPorId.get(cobro.contrato_id);
    if (!contrato) continue;

    asegurar(cobro.moneda as Moneda).cobros.push({
      descripcion: `Alquiler ${nombreDelPeriodo(periodo)} — ${direccionDe.get(contrato.propiedad_id) ?? ""}`,
      contratoId: cobro.contrato_id,
      cobroId: cobro.id,
      montoCobrado: Number(cobro.total),
      honorariosPorcentaje: Number(contrato.honorarios_porcentaje),
    });
  }

  for (const gasto of gastos ?? []) {
    asegurar(gasto.moneda as Moneda).gastos.push({
      descripcion: `${gasto.descripcion} — ${direccionDe.get(gasto.propiedad_id) ?? ""}`,
      contratoId: gasto.contrato_id,
      gastoId: gasto.id,
      monto: Number(gasto.monto),
    });
  }

  return porMoneda;
}

// Arma el borrador de la liquidación. Queda editable hasta que se emite.
export async function generarLiquidacion(formData: FormData) {
  const { supabase, user } = await sesion();

  const propietarioId = String(formData.get("propietario_id"));
  const periodo = primerDiaDelMes(String(formData.get("periodo")));

  const movimientos = await juntarMovimientos(supabase, propietarioId, periodo);

  if (movimientos.size === 0) {
    throw new Error(
      `No hay nada para liquidarle a este propietario en ${nombreDelPeriodo(periodo)}.`
    );
  }

  let ultimaId: string | null = null;

  for (const [moneda, grupo] of movimientos) {
    const totales = calcularTotales({ cobros: grupo.cobros, gastos: grupo.gastos, ajustes: [] });
    const detalle = armarDetalle({ cobros: grupo.cobros, gastos: grupo.gastos, ajustes: [] });

    const { data: liquidacion, error } = await supabase
      .from("liquidaciones")
      .insert({
        propietario_id: propietarioId,
        periodo,
        moneda,
        total_cobrado: totales.totalCobrado,
        total_honorarios: totales.totalHonorarios,
        total_gastos: totales.totalGastos,
        total_ajustes: totales.totalAjustes,
        neto_a_pagar: totales.netoAPagar,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          `Ya existe una liquidación de ${nombreDelPeriodo(periodo)} para este propietario en ${moneda}.`
        );
      }
      throw new Error(`No se pudo generar la liquidación: ${error.message}`);
    }

    const { error: errorDetalle } = await supabase.from("liquidacion_detalle").insert(
      detalle.map((r) => ({
        liquidacion_id: liquidacion.id,
        contrato_id: r.contratoId,
        tipo: r.tipo,
        cobro_id: r.cobroId,
        gasto_id: r.gastoId,
        descripcion: r.descripcion,
        monto_bruto: r.montoBruto,
        honorarios_porcentaje: r.honorariosPorcentaje,
        honorarios_monto: r.honorariosMonto,
        neto: r.neto,
        orden: r.orden,
      }))
    );

    if (errorDetalle) throw new Error(errorDetalle.message);

    // Los gastos quedan reservados para esta liquidación: no los toma otra.
    const idsGasto = grupo.gastos.map((g) => g.gastoId);
    if (idsGasto.length > 0) {
      await supabase
        .from("gastos")
        .update({ liquidacion_id: liquidacion.id })
        .in("id", idsGasto);
    }

    ultimaId = liquidacion.id;
  }

  revalidatePath("/liquidaciones");
  revalidatePath("/panel");
  if (ultimaId) redirect(`/liquidaciones/${ultimaId}`);
}

// A partir de acá los números quedan congelados. Es el momento en que el PDF
// que recibe el propietario pasa a ser el documento de referencia.
export async function emitirLiquidacion(formData: FormData) {
  const { supabase, user } = await sesion();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("liquidaciones")
    .update({
      estado: "emitida",
      emitida_at: new Date().toISOString(),
      emitida_por: user.id,
    })
    .eq("id", id)
    .eq("estado", "borrador");

  if (error) throw new Error(`No se pudo emitir: ${error.message}`);

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${id}`);
}

// El respaldo de que el propietario recibió la plata: comprobante si fue
// transferencia, conformidad si fue en efectivo.
export async function registrarPagoLiquidacion(formData: FormData) {
  const { supabase } = await sesion();
  const id = String(formData.get("id"));
  const metodo = String(formData.get("metodo_pago"));

  const conformidad = textoONulo(formData.get("conformidad"));
  const comprobante = textoONulo(formData.get("comprobante_url"));

  if (metodo === "efectivo" && !conformidad) {
    throw new Error(
      "Si se pagó en efectivo, dejá registrada la conformidad del propietario: es el respaldo si mañana hay un reclamo."
    );
  }

  const { error } = await supabase
    .from("liquidaciones")
    .update({
      estado: "pagada",
      metodo_pago: metodo,
      fecha_pago: String(formData.get("fecha_pago") ?? hoyISO()),
      comprobante_url: comprobante,
      conformidad,
      recibido_por: textoONulo(formData.get("recibido_por")),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${id}`);
}

export async function anularLiquidacion(formData: FormData) {
  const { supabase } = await sesionAdmin();
  const id = String(formData.get("id"));
  const motivo = textoONulo(formData.get("motivo"));
  if (!motivo) throw new Error("Para anular una liquidación hay que decir por qué.");

  const { error } = await supabase
    .from("liquidaciones")
    .update({
      estado: "anulada",
      anulado_at: new Date().toISOString(),
      anulado_motivo: motivo,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Los gastos que tenía reservados vuelven a la bolsa de pendientes.
  await supabase.from("gastos").update({ liquidacion_id: null }).eq("liquidacion_id", id);

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${id}`);
}
