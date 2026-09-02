import { redondear, formatearMoneda } from "@/lib/dinero";
import { sumarMeses, diasEntre, vencimientoDelPeriodo, primerDiaDelMes, nombreDelPeriodo,
         diaDeLaSemana, sumarDias, proximoDiaHabil, vencimientoHabilDelPeriodo } from "@/lib/fechas";
import { armarRecibo } from "@/lib/recibo";
import { calcularAjuste, coeficientePorIndice, coeficienteFijo, proximoAjuste, tocaAjustar } from "@/lib/ajustes";
import { calcularPunitorios, diasDeAtraso } from "@/lib/punitorios";
import { calcularTotales, honorariosDe, armarDetalle } from "@/lib/liquidacion";
import { agrupar, claveDeEdificio, coincide, ordenar, type Unidad } from "@/lib/unidades";
import { armarFila, contarMesesAdeudados, estadoDeFila, totales as totalesPlanilla } from "@/lib/planilla";
import { normalizarTelefono, linkWhatsApp } from "@/lib/whatsapp";
import { avisoDeVencimiento, avisoDeAumento, avisoDeLiquidacion } from "@/lib/avisos";

let fallos = 0;
function chequear(nombre: string, obtenido: unknown, esperado: unknown) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "OK  " : "FALLA"} ${nombre}: ${JSON.stringify(obtenido)}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)})`}`);
}

console.log("--- Redondeo de plata ---");
chequear("1.005 redondea para arriba", redondear(1.005), 1.01);
chequear("no arrastra basura binaria", redondear(0.1 + 0.2), 0.3);
chequear("un monto entero queda igual", redondear(480000), 480000);

console.log("--- Fechas de contrato ---");
chequear("31/1 + 1 mes cae en 28/2", sumarMeses("2026-01-31", 1), "2026-02-28");
chequear("31/1/2028 + 1 mes cae en 29/2 (bisiesto)", sumarMeses("2028-01-31", 1), "2028-02-29");
chequear("contrato de 2 años", sumarMeses("2026-03-01", 24), "2028-03-01");
chequear("vence el 10, en febrero vence el 10", vencimientoDelPeriodo("2026-02-01", 10), "2026-02-10");
chequear("vence el 30, en febrero cae el 28", vencimientoDelPeriodo("2026-02-01", 30), "2026-02-28");
chequear("el periodo se guarda el dia 1", primerDiaDelMes("2026-08-17"), "2026-08-01");
chequear("nombre legible del periodo", nombreDelPeriodo("2026-08-01"), "agosto 2026");

console.log("--- Ajuste por indice (ICL) ---");
chequear("coeficiente entre dos valores de serie", redondear(coeficientePorIndice(8.5, 10.2)), 1.2);
const ajusteICL = calcularAjuste({ montoActual: 480000, indice: "ICL", valorIndiceBase: 8.5, valorIndiceFinal: 10.2 });
chequear("alquiler de 480.000 con ICL 1,20", ajusteICL.montoNuevo, 576000);
chequear("la variacion se muestra como 20%", ajusteICL.variacionPorcentual, 20);

console.log("--- Ajuste por porcentaje pactado ---");
chequear("12% pactado da coeficiente 1,12", coeficienteFijo(12), 1.12);
chequear("500.000 con 12% pactado", calcularAjuste({ montoActual: 500000, indice: "FIJO", porcentajeFijo: 12 }).montoNuevo, 560000);
chequear("sin ajuste no mueve el monto", calcularAjuste({ montoActual: 500000, indice: "SIN_AJUSTE" }).montoNuevo, 500000);

console.log("--- Cuando toca ajustar ---");
chequear("trimestral desde el 15/1", proximoAjuste("2026-01-15", 3), "2026-04-15");
chequear("cuatrimestral desde el 1/3", proximoAjuste("2026-03-01", 4), "2026-07-01");
chequear("ya vencio el ajuste", tocaAjustar("2026-08-01", "2026-08-20"), true);
chequear("todavia no toca", tocaAjustar("2026-09-01", "2026-08-20"), false);
chequear("contrato sin proximo ajuste", tocaAjustar(null, "2026-08-20"), false);

console.log("--- Punitorios ---");
chequear("paga el mismo dia: sin atraso", diasDeAtraso("2026-03-10", "2026-03-10"), 0);
chequear("paga antes: sin atraso", diasDeAtraso("2026-03-10", "2026-03-05"), 0);
chequear("10 dias de atraso", diasDeAtraso("2026-03-10", "2026-03-20"), 10);
chequear("con 3 dias de gracia quedan 7", diasDeAtraso("2026-03-10", "2026-03-20", 3), 7);
chequear("0,1% diario sobre 500.000 por 10 dias", calcularPunitorios({ montoAlquiler: 500000, vencimiento: "2026-03-10", fechaPago: "2026-03-20", tipo: "porcentaje_diario", valor: 0.1 }), { dias: 10, monto: 5000 });
chequear("monto fijo de 2.000 por dia", calcularPunitorios({ montoAlquiler: 500000, vencimiento: "2026-03-10", fechaPago: "2026-03-15", tipo: "monto_fijo_diario", valor: 2000 }), { dias: 5, monto: 10000 });
chequear("contrato sin punitorios", calcularPunitorios({ montoAlquiler: 500000, vencimiento: "2026-03-10", fechaPago: "2026-03-25", tipo: "ninguno", valor: 0 }), { dias: 15, monto: 0 });

console.log("--- Honorarios ---");
chequear("8% de 500.000", honorariosDe(500000, 8), 40000);
chequear("7% de 320.000", honorariosDe(320000, 7), 22400);
chequear("10% de 350.000", honorariosDe(350000, 10), 35000);

console.log("--- Liquidacion: un propietario con dos propiedades a distinto % ---");
const cobros = [
  { descripcion: "Alquiler agosto — Mitre 450 2ºB", contratoId: "c1", cobroId: "r1", montoCobrado: 500000, honorariosPorcentaje: 8 },
  { descripcion: "Alquiler agosto — Belgrano 1200", contratoId: "c2", cobroId: "r2", montoCobrado: 350000, honorariosPorcentaje: 10 },
];
const gastos = [
  { descripcion: "Expensas agosto — Mitre 450", gastoId: "g1", contratoId: "c1", monto: 45000 },
  { descripcion: "Reparación termotanque", gastoId: "g2", contratoId: "c2", monto: 30000 },
];
const totales = calcularTotales({ cobros, gastos, ajustes: [] });
chequear("total cobrado", totales.totalCobrado, 850000);
chequear("honorarios renglon por renglon", totales.totalHonorarios, 75000);
chequear("total de gastos descontados", totales.totalGastos, 75000);
chequear("neto a transferir al propietario", totales.netoAPagar, 700000);

// Este es el motivo por el que los honorarios se calculan por renglón: aplicar
// un promedio al total daría 76.500 y la liquidación cerraría mal.
const promedioMal = redondear(850000 * 0.09);
chequear("aplicar el promedio daria otro numero", promedioMal === totales.totalHonorarios, false);

console.log("--- Liquidacion con ajuste manual a favor del propietario ---");
const conAjuste = calcularTotales({ cobros, gastos, ajustes: [{ descripcion: "Reintegro cobrado de más en julio", monto: -12000 }] });
chequear("el ajuste negativo descuenta", conAjuste.netoAPagar, 688000);

console.log("--- Detalle que ve el propietario ---");
const detalle = armarDetalle({ cobros, gastos, ajustes: [] });
chequear("cantidad de renglones", detalle.length, 4);
chequear("primer renglon: neto del cobro", detalle[0].neto, 460000);
chequear("el gasto entra en negativo", detalle[2].montoBruto, -45000);
chequear("los gastos no pagan honorarios", detalle[2].honorariosMonto, 0);
chequear("el % queda congelado en el renglon", detalle[1].honorariosPorcentaje, 10);

console.log("--- Buscador de unidades ---");
function unidad(direccion: string, propietario: string, inquilino: string | null, monto: number | null, fin: string | null, edificio: string | null = null, piso: string | null = null): Unidad {
  return {
    id: `${direccion} ${piso ?? ""}`.trim(), direccion, pisoDepto: piso,
    direccionCompleta: `${direccion}${piso ? ` ${piso}` : ""}`,
    localidad: "San Miguel de Tucumán", tipo: "departamento", estado: monto == null ? "disponible" : "alquilado", edificio,
    propietarioId: propietario, propietario, contratoId: null, inquilino, monto, moneda: "ARS",
    indice: "ICL", honorarios: 8, fechaFin: fin, proximoAjuste: null,
  };
}
const cartera = [
  unidad("Mitre 450", "Roberto Peña", "María Gutiérrez", 612000, "2027-03-01"),
  unidad("Belgrano 1287", "Marta Iglesias", "Carlos Ruiz", 448500, "2026-11-30"),
  unidad("Alsina 670", "Roberto Peña", "Diego Sosa", 585500, "2026-09-12"),
  unidad("Núñez 90", "Nélida Ferrari", null, null, null),
];

chequear("busca por direccion", cartera.filter((u) => coincide(u, "mitre")).map((u) => u.direccion), ["Mitre 450"]);
chequear("busca por propietario", cartera.filter((u) => coincide(u, "peña")).map((u) => u.direccion), ["Mitre 450", "Alsina 670"]);
chequear("busca por inquilino", cartera.filter((u) => coincide(u, "sosa")).map((u) => u.direccion), ["Alsina 670"]);
chequear("sin tilde encuentra igual", cartera.filter((u) => coincide(u, "nunez")).map((u) => u.direccion), ["Núñez 90"]);
chequear("con tilde tambien", cartera.filter((u) => coincide(u, "NÚÑEZ")).map((u) => u.direccion), ["Núñez 90"]);
chequear("dos palabras cruzan campos", cartera.filter((u) => coincide(u, "alsina peña")).map((u) => u.direccion), ["Alsina 670"]);
chequear("busqueda vacia trae todo", cartera.filter((u) => coincide(u, "   ")).length, 4);
chequear("sin coincidencias", cartera.filter((u) => coincide(u, "rivadavia")).length, 0);

console.log("--- Orden de la cartera ---");
chequear("alfabetico por direccion", ordenar(cartera, "direccion").map((u) => u.direccion), ["Alsina 670", "Belgrano 1287", "Mitre 450", "Núñez 90"]);
chequear("alfabetico al reves", ordenar(cartera, "direccion_desc").map((u) => u.direccion), ["Núñez 90", "Mitre 450", "Belgrano 1287", "Alsina 670"]);
chequear("del mas caro al mas barato", ordenar(cartera, "precio_desc").map((u) => u.monto), [612000, 585500, 448500, null]);
chequear("del mas barato al mas caro", ordenar(cartera, "precio_asc").map((u) => u.monto), [448500, 585500, 612000, null]);
chequear("las vacantes quedan al final", ordenar(cartera, "precio_desc")[3].direccion, "Núñez 90");
chequear("por contrato que vence primero", ordenar(cartera, "vencimiento").map((u) => u.direccion), ["Alsina 670", "Belgrano 1287", "Mitre 450", "Núñez 90"]);
chequear("los numeros de calle ordenan como numeros", ordenar([unidad("Mitre 100", "x", null, null, null), unidad("Mitre 9", "x", null, null, null)], "direccion").map((u) => u.direccion), ["Mitre 9", "Mitre 100"]);

console.log("--- Agrupar por propietario ---");
// Peña tiene dos unidades en direcciones distintas; Ferrari, un edificio entero.
const conEdificio = [
  ...cartera,
  unidad("Rivadavia 2340", "Nélida Ferrari", "Ana Vera", 400000, "2027-01-31", null, "1ºA"),
  unidad("Rivadavia 2340", "Nélida Ferrari", null, null, null, null, "2ºA"),
  unidad("Av. Rivadavia 2340", "Nélida Ferrari", "Luis Paz", 430000, "2027-02-28", "Edificio Rivadavia", "3ºA"),
];

const porDueno = agrupar(conEdificio, "propietario", "direccion");
chequear("un grupo por propietario", porDueno.length, 3);
chequear("Peña junta sus dos direcciones", porDueno.find((g) => g.titulo === "Roberto Peña")?.unidades.length, 2);
chequear("y se ve que son dos direcciones", porDueno.find((g) => g.titulo === "Roberto Peña")?.subtitulo, "2 direcciones");
chequear("la renta del grupo suma", porDueno.find((g) => g.titulo === "Roberto Peña")?.renta, 1197500);
chequear("Ferrari tiene una vacante", porDueno.find((g) => g.titulo === "Nélida Ferrari")?.vacantes, 2);

console.log("--- Agrupar por edificio ---");
chequear("dos unidades de la misma direccion comparten clave", claveDeEdificio(conEdificio[4]) === claveDeEdificio(conEdificio[5]), true);
chequear("el nombre cargado a mano hace su propia clave", claveDeEdificio(conEdificio[6]).startsWith("n:"), true);

const porEdificio = agrupar(conEdificio.slice(4), "edificio", "direccion");
chequear("las dos unidades de Rivadavia 2340 quedan juntas", porEdificio.find((g) => g.titulo === "Rivadavia 2340")?.unidades.length, 2);
chequear("y el edificio muestra a su dueño", porEdificio.find((g) => g.titulo === "Rivadavia 2340")?.subtitulo, "Nélida Ferrari");
chequear("la unidad con nombre propio se muestra con ese nombre", porEdificio.some((g) => g.titulo === "Edificio Rivadavia"), true);

const mismoNombre = agrupar([
  unidad("Rivadavia 2340", "Nélida Ferrari", "Ana Vera", 400000, null, "Edificio Rivadavia", "1ºA"),
  unidad("Av. Rivadavia 2340", "Nélida Ferrari", "Luis Paz", 430000, null, "Edificio Rivadavia", "3ºA"),
], "edificio", "direccion");
chequear("el nombre une direcciones escritas distinto", mismoNombre.length, 1);
chequear("y la renta del edificio suma", mismoNombre[0].renta, 830000);

chequear(
  "el piso dentro de la direccion parte el edificio (por eso van en campos separados)",
  agrupar([
    unidad("Rivadavia 2340 1ºA", "Nélida Ferrari", "Ana Vera", 400000, null),
    unidad("Rivadavia 2340 2ºA", "Nélida Ferrari", "Luis Paz", 430000, null),
  ], "edificio", "direccion").length,
  2
);

console.log("--- Orden de los grupos ---");
const porPlata = agrupar(conEdificio, "propietario", "precio_desc");
chequear("el propietario que mas renta va primero", porPlata[0].titulo, "Roberto Peña");
chequear("sin agrupar no arma grupos", agrupar(conEdificio, "ninguno", "direccion").length, 0);

console.log("--- Planilla del mes ---");
const planilla = [
  // Pagó el alquiler completo más expensas: abonada.
  armarFila({ ...cartera[0], honorarios: 8 }, { id: "r1", total: 620000, alquilerCobrado: 612000, medio_pago: "transferencia", fecha_pago: "2026-08-12" }, null),
  // Pagó todo el alquiler pero debe un mes anterior: con saldo.
  armarFila({ ...cartera[1], honorarios: 10 }, { id: "r2", total: 448500, alquilerCobrado: 448500, medio_pago: "efectivo", fecha_pago: "2026-08-05" }, "debe agua", 1),
  // No pagó nada: impaga.
  armarFila({ ...cartera[2], honorarios: 8 }, null, null),
];

chequear("la que pago queda marcada", planilla[0].cobroId !== null, true);
chequear("la que no pago, no", planilla[2].cobroId === null, true);
chequear("honorarios sobre lo cobrado, no sobre el alquiler", planilla[0].honorariosMonto, 49600);
chequear("neto al propietario", planilla[0].netoPropietario, 570400);
chequear("sin cobro no hay honorarios devengados", planilla[2].honorariosMonto, 0);
chequear("la observacion viaja a la fila", planilla[1].observaciones, "debe agua");

console.log("--- Los tres colores ---");
chequear("verde: pago todo y no debe nada", estadoDeFila(planilla[0]), "abonado");
chequear("amarillo: pago pero arrastra un mes", estadoDeFila(planilla[1]), "con_saldo");
chequear("naranja: no pago nada", estadoDeFila(planilla[2]), "impago");

// Pago parcial: entregó menos de lo que dice el contrato.
const parcial = armarFila(
  { ...cartera[0], honorarios: 8 },
  { id: "r9", total: 300000, alquilerCobrado: 300000, medio_pago: "efectivo", fecha_pago: "2026-08-20" },
  null
);
chequear("amarillo tambien cuando entrego de menos", estadoDeFila(parcial), "con_saldo");
chequear("y el saldo es la diferencia", parcial.saldoDelMes, 312000);

// Pagó de más: no es deuda, es saldo a favor. Sigue verde.
const demas = armarFila(
  { ...cartera[0], honorarios: 8 },
  { id: "r10", total: 700000, alquilerCobrado: 650000, medio_pago: "efectivo", fecha_pago: "2026-08-02" },
  null
);
chequear("pagar de mas no genera deuda", demas.saldoDelMes, 0);
chequear("y queda en verde", estadoDeFila(demas), "abonado");

// Diferencias de centavos son redondeo, no deuda.
const centavos = armarFila(
  { ...cartera[0], honorarios: 8 },
  { id: "r11", total: 611999.5, alquilerCobrado: 611999.5, medio_pago: "efectivo", fecha_pago: "2026-08-02" },
  null
);
chequear("medio peso de diferencia no es deuda", estadoDeFila(centavos), "abonado");

console.log("--- Meses adeudados ---");
const cobrados = new Set(["2026-06-01", "2026-07-01"]);
chequear("al dia: no debe meses", contarMesesAdeudados({ fechaInicio: "2026-06-01", periodoActual: "2026-08-01", periodosCobrados: cobrados }), 0);
chequear("le falta julio", contarMesesAdeudados({ fechaInicio: "2026-06-01", periodoActual: "2026-08-01", periodosCobrados: new Set(["2026-06-01"]) }), 1);
chequear("no cuenta meses previos al contrato", contarMesesAdeudados({ fechaInicio: "2026-07-01", periodoActual: "2026-08-01", periodosCobrados: new Set() }), 1);
chequear("contrato nuevo no arrastra nada", contarMesesAdeudados({ fechaInicio: "2026-08-01", periodoActual: "2026-08-01", periodosCobrados: new Set() }), 0);
chequear("se corta al ano", contarMesesAdeudados({ fechaInicio: "2020-01-01", periodoActual: "2026-08-01", periodosCobrados: new Set() }), 12);

const tp = totalesPlanilla(planilla);
chequear("abonadas", tp.abonadas, 1);
chequear("con saldo", tp.conSaldo, 1);
chequear("impagas", tp.impagas, 1);
chequear("alquiler esperado del mes", tp.alquilerEsperado, 1646000);
chequear("cobrado hasta hoy", tp.cobrado, 1068500);
chequear("honorarios del mes", tp.honorarios, 94450);
chequear("neto a repartir", tp.netoPropietarios, 974050);
chequear("falta cobrar: solo las impagas", tp.faltaCobrar, 585500);
chequear("saldos: lo que quedo a medias", tp.saldos, 0);

// El recibo puede traer expensas y punitorios: el cobrado supera al alquiler y
// los honorarios se calculan sobre ese total, que es como se liquida.
chequear("cobrado puede superar al alquiler pactado", planilla[0].cobrado! > planilla[0].monto!, true);

console.log("--- Telefonos para WhatsApp ---");
chequear("como lo escribe la gente", normalizarTelefono("381 415-8877"), "5493814158877");
chequear("con el 0 adelante", normalizarTelefono("0381 415 8877"), "5493814158877");
chequear("con el 15 viejo", normalizarTelefono("0381 15 415 8877"), "5493814158877");
chequear("ya en formato internacional", normalizarTelefono("+54 9 381 415 8877"), "5493814158877");
chequear("de Buenos Aires", normalizarTelefono("11 5555-4444"), "5491155554444");
chequear("sin telefono", normalizarTelefono(null), null);
chequear("basura no pasa", normalizarTelefono("123"), null);
chequear("sin numero igual abre WhatsApp", linkWhatsApp(null, "hola").startsWith("https://wa.me/?text="), true);
chequear("con numero apunta al chat", linkWhatsApp("381 415-8877", "hola"), "https://wa.me/5493814158877?text=hola");

console.log("--- Textos de los avisos ---");
const recordatorio = avisoDeVencimiento({
  inquilino: "María Fernanda Gutiérrez", direccion: "Mitre 450 2ºB", periodo: "2026-08-01",
  vencimiento: "2026-08-10", monto: 612000, moneda: "ARS", diasDeAtraso: 0,
});
chequear("usa el nombre de pila", recordatorio.startsWith("Hola María,"), true);
chequear("antes del vencimiento es un recordatorio", recordatorio.includes("vence el 10/08/2026"), true);
chequear("y no habla de atraso", recordatorio.includes("atraso"), false);

const atrasado = avisoDeVencimiento({
  inquilino: "Diego Sosa", direccion: "Alsina 670 1ºC", periodo: "2026-08-01",
  vencimiento: "2026-08-10", monto: 585500, moneda: "ARS", diasDeAtraso: 8,
});
chequear("pasado el vencimiento cambia el tono", atrasado.includes("todavía figura impago"), true);
chequear("y dice cuantos dias", atrasado.includes("Van 8 días de atraso"), true);

const unDia = avisoDeVencimiento({
  inquilino: "Ana Vera", direccion: "Rivadavia 2340 1ºA", periodo: "2026-08-01",
  vencimiento: "2026-08-10", monto: 400000, moneda: "ARS", diasDeAtraso: 1,
});
chequear("un solo dia va en singular", unDia.includes("Van 1 día de atraso"), true);

const aumento = avisoDeAumento({
  inquilino: "Carlos Alberto Ruiz", direccion: "Belgrano 1287", montoAnterior: 380000,
  montoNuevo: 448500, moneda: "ARS", desde: "2026-09-01", indice: "ICL",
});
chequear("el aumento dice el monto nuevo primero", /pasa a \$\s448\.500,00/.test(aumento), true);
chequear("y explica contra que indice", aumento.includes("según ICL"), true);

const fijo = avisoDeAumento({
  inquilino: "Rocío Konsorki", direccion: "Rivadavia 2340 3ºA", montoAnterior: 430000,
  montoNuevo: 481600, moneda: "ARS", desde: "2026-09-01", indice: "FIJO",
});
chequear("con porcentaje pactado no nombra un indice", fijo.includes("porcentaje de actualización"), true);

const rendicion = avisoDeLiquidacion({
  propietario: "Nélida Ferrari", periodo: "2026-08-01", neto: 1432775,
  moneda: "ARS", unidades: 4, metodoPago: "efectivo",
});
chequear("al que cobra en efectivo lo invita a la oficina", rendicion.includes("pasás por la oficina"), true);
chequear("y dice cuantas unidades", rendicion.includes("4 unidades"), true);

const unaSola = avisoDeLiquidacion({
  propietario: "Roberto Peña", periodo: "2026-08-01", neto: 563040,
  moneda: "ARS", unidades: 1, metodoPago: "transferencia",
});
chequear("una unidad va en singular", unaSola.includes("1 unidad ·"), true);
chequear("al que cobra por transferencia se le avisa la transferencia", unaSola.includes("hacemos la transferencia"), true);

console.log("--- Vencimiento cuando cae domingo o feriado ---");
// El 10 de mayo de 2026 es domingo; el 11 es lunes hábil.
chequear("10/5/2026 es domingo", diaDeLaSemana("2026-05-10"), 0);
chequear("un domingo corre al lunes", proximoDiaHabil("2026-05-10"), "2026-05-11");
chequear("un sábado NO corre", proximoDiaHabil("2026-05-09"), "2026-05-09");

const FERIADOS = new Set(["2026-07-09", "2026-05-25", "2026-05-01"]);
chequear("un feriado corre al día siguiente", proximoDiaHabil("2026-07-09", FERIADOS), "2026-07-10");
// El 24/5/2026 es domingo y el 25 es feriado: hay que saltar los dos.
chequear("domingo pegado a feriado salta los dos", proximoDiaHabil("2026-05-24", FERIADOS), "2026-05-26");
chequear("un día común queda donde está", proximoDiaHabil("2026-08-10", FERIADOS), "2026-08-10");
chequear("el vencimiento del período se corre solo",
  vencimientoHabilDelPeriodo("2026-05-01", 10, FERIADOS), "2026-05-11");
chequear("sumar días cruza de mes", sumarDias("2026-01-31", 1), "2026-02-01");

console.log("--- El recibo del mes ---");
const CONTRATO = {
  periodo: "2026-08-01",
  alquiler: 500000,
  vencimiento: "2026-08-10",
  punitorio: { tipo: "porcentaje_diario" as const, valor: 1 },
};

const alDia = armarRecibo({ ...CONTRATO, fechaPago: "2026-08-10" });
chequear("pagando el día del vencimiento no hay punitorios", alDia.punitorios.monto, 0);
chequear("y el total es el alquiler solo", alDia.totalDebido, 500000);
chequear("si pagó todo no queda saldo", alDia.saldoResultante, 0);

// La regla que pidió Alex: el 11 es 1%, el 12 es 2%.
const dia11 = armarRecibo({ ...CONTRATO, fechaPago: "2026-08-11" });
chequear("el día 11 suma 1% del alquiler", dia11.punitorios.monto, 5000);
chequear("y el total sube a 505.000", dia11.totalDebido, 505000);
const dia12 = armarRecibo({ ...CONTRATO, fechaPago: "2026-08-12" });
chequear("el día 12 suma 2%", dia12.punitorios.monto, 10000);

// Con cobros fijos, el punitorio sigue saliendo del alquiler solo.
const conAgua = armarRecibo({
  ...CONTRATO,
  fechaPago: "2026-08-11",
  cargosFijos: [{ tipo: "agua", descripcion: "SAT", monto: 40000 }],
});
chequear("el agua entra en el total", conAgua.totalDebido, 545000);
chequear("pero no genera punitorios", conAgua.punitorios.monto, 5000);
chequear("el recibo muestra tres renglones", conAgua.renglones.length, 3);

// Saldo a favor y deuda arrastrada.
const conFavor = armarRecibo({ ...CONTRATO, fechaPago: "2026-08-10", saldoAnterior: 20000 });
chequear("un saldo a favor descuenta", conFavor.totalDebido, 480000);
chequear("y se ve como renglón negativo", conFavor.renglones.at(-1)?.monto, -20000);

const conDeuda = armarRecibo({ ...CONTRATO, fechaPago: "2026-08-10", saldoAnterior: -30000 });
chequear("una deuda anterior suma", conDeuda.totalDebido, 530000);
chequear("y se ve como renglón positivo", conDeuda.renglones.at(-1)?.monto, 30000);

// Pagos parciales y de más.
const aCuenta = armarRecibo({ ...CONTRATO, fechaPago: "2026-08-10", pagado: 400000 });
chequear("pagar de menos deja deuda", aCuenta.saldoResultante, -100000);
const dePlus = armarRecibo({ ...CONTRATO, fechaPago: "2026-08-10", pagado: 520000 });
chequear("pagar de más deja saldo a favor", dePlus.saldoResultante, 20000);

// El caso completo del mes siguiente: arrastra la deuda y paga tarde.
const siguiente = armarRecibo({
  periodo: "2026-09-01",
  alquiler: 500000,
  vencimiento: "2026-09-10",
  fechaPago: "2026-09-13",
  punitorio: { tipo: "porcentaje_diario", valor: 1 },
  cargosFijos: [{ tipo: "agua", descripcion: "SAT", monto: 40000 }],
  saldoAnterior: -100000,
  pagado: 600000,
});
chequear("alquiler + agua + 3% + deuda", siguiente.totalDebido, 655000);
chequear("y queda debiendo la diferencia", siguiente.saldoResultante, -55000);

console.log("--- Formato ---");
chequear("dias entre vencimiento y pago", diasEntre("2026-08-10", "2026-09-09"), 30);
console.log(`     muestra de formato: ${formatearMoneda(700000)}`);

console.log(fallos === 0 ? "\nTodo OK." : `\n${fallos} chequeos fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
