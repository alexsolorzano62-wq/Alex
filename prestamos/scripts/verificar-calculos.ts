import { aplicarPago, calcularPlan, numerarCuotas, resumen, revertirPago, tasaImplicita, capitalizar, renovar } from "@/lib/calc";
import { vencimientoAnterior } from "@/lib/periodos";
import { sumarMeses, diasEntre } from "@/lib/fechas";
import { normalizarTelefono, mensajeDe } from "@/lib/whatsapp";
import { aplicarPlantilla, plantillaDe, variablesDePrestamo, EJEMPLOS, MODALIDADES, PLANTILLAS_POR_DEFECTO, TIPOS } from "@/lib/plantillas";
import { nombreCoincide, parsearPesos, parsearTasa } from "@/lib/parseo";
import { cuotaSemanal, planesPara, PLANES_SEMANALES, SEMANAS_CON_PLAN } from "@/lib/planes";
import { cronogramaPendiente, gananciaPorCobro, proyeccionDelMes, resolver, resumenPorMes, serieHistorica, totales as totalesDe, mesesConVencimientos } from "@/lib/agregados";
import type { PrestamoConCliente } from "@/lib/types";
import { sumarSemanas, sumarDias } from "@/lib/fechas";
import { siguienteVencimiento, datosFrecuencia, textoCuotas } from "@/lib/periodos";
import { mesDe, nombreMes } from "@/lib/fechas";
import type { Prestamo } from "@/lib/types";

let fallos = 0;
function chequear(nombre: string, obtenido: unknown, esperado: unknown) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "OK  " : "FALLA"} ${nombre}: ${JSON.stringify(obtenido)}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)})`}`);
}

console.log("--- Planilla: modalidad mensual ---");
chequear("Miriam 200.000 al 30%", calcularPlan({ modalidad: "mensual", capital: 200000, tasa: 30 }), { interes: 60000, total: 260000, cuotaMonto: null });
chequear("Eva 100.000 al 30%", calcularPlan({ modalidad: "mensual", capital: 100000, tasa: 30 }), { interes: 30000, total: 130000, cuotaMonto: null });
chequear("Willy 500.000 al 25%", calcularPlan({ modalidad: "mensual", capital: 500000, tasa: 25 }), { interes: 125000, total: 625000, cuotaMonto: null });

console.log("--- Planilla: Luciana, total pactado a mano en 3 cuotas ---");
chequear("Luciana total 256.110 en 3", calcularPlan({ modalidad: "cuotas", capital: 200000, tasa: 0, cuotas: 3, totalManual: 256110 }), { interes: 56110, total: 256110, cuotaMonto: 85370 });
chequear("tasa implicita Luciana", Number(tasaImplicita(200000, 256110).toFixed(3)), 28.055);

console.log("--- Totales de la planilla ---");
const capitales = 200000 + 100000 + 500000 + 200000;
const totales = 260000 + 130000 + 625000 + 256110;
chequear("capital total", capitales, 1000000);
chequear("a devolver total", totales, 1271110);
chequear("interes total", totales - capitales, 271110);

console.log("--- Vencimientos de la planilla ---");
chequear("Miriam 7/8 + 1 mes = 7/9", sumarMeses("2026-08-07", 1), "2026-09-07");
chequear("Willy 16/8 + 1 mes = 16/9", sumarMeses("2026-08-16", 1), "2026-09-16");
chequear("31/1 + 1 mes cae en 28/2", sumarMeses("2026-01-31", 1), "2026-02-28");
chequear("31/1/2028 + 1 mes cae en 29/2 (bisiesto)", sumarMeses("2028-01-31", 1), "2028-02-29");
chequear("cruce de anio 15/12 + 1", sumarMeses("2026-12-15", 1), "2027-01-15");
chequear("dias 7/8 a 6/9", diasEntre("2026-08-07", "2026-09-06"), 30);

console.log("--- Renovar vs capitalizar (interes compuesto) ---");
const base: Prestamo = {
  id: "1", cliente_id: "c1", modalidad: "mensual",
  capital_inicial: 200000, capital_actual: 200000, tasa_mensual: 30,
  fecha_inicio: "2026-08-07", fecha_vencimiento: "2026-09-06",
  cuotas_total: null, cuota_monto: null, total_a_devolver: null,
  estado: "vigente", observacion: null, created_at: "",
};
chequear("cobro interes: capital igual, vence +1 mes", renovar(base), { fecha_vencimiento: "2026-10-06" });
chequear("no pago: capital 200.000 -> 260.000", capitalizar(base), { capital_actual: 260000, fecha_vencimiento: "2026-10-06" });
const capitalizado = { ...base, ...capitalizar(base) };
chequear("mes 2 sobre 260.000 = 78.000 de interes", resumen(capitalizado, [], "2026-09-10").interes, 78000);
chequear("mes 2 a devolver 338.000", resumen(capitalizado, [], "2026-09-10").aDevolver, 338000);

console.log("--- Estados ---");
chequear("vencido", resumen(base, [], "2026-09-20").estadoVisual, "vencido");
chequear("por vencer", resumen(base, [], "2026-09-02").estadoVisual, "por_vencer");
chequear("al dia", resumen(base, [], "2026-08-10").estadoVisual, "al_dia");
chequear("dias negativos si vencio", resumen(base, [], "2026-09-20").diasParaVencer, -14);

console.log("--- Cuotas: Luciana paga 1 de 3 ---");
const luciana: Prestamo = {
  id: "2", cliente_id: "c2", modalidad: "cuotas",
  capital_inicial: 200000, capital_actual: 200000, tasa_mensual: 28.055,
  fecha_inicio: "2026-08-13", fecha_vencimiento: "2026-09-10",
  cuotas_total: 3, cuota_monto: 85370, total_a_devolver: 256110,
  estado: "vigente", observacion: "3 cuotas de $85.370", created_at: "",
};
const unaCuota = [{ id: "p1", prestamo_id: "2", fecha: "2026-09-10", monto: 85370, tipo: "cuota" as const, nota: null, created_at: "" }];
const r = resumen(luciana, unaCuota, "2026-09-11");
chequear("saldo tras 1 cuota", r.aDevolver, 170740);
chequear("cuotas pagadas", r.cuotasPagadas, 1);
chequear("cobrado", r.cobrado, 85370);
chequear("interes del plan", r.interes, 56110);
const tresCuotas = [1, 2, 3].map((n) => ({ id: `p${n}`, prestamo_id: "2", fecha: "2026-09-10", monto: 85370, tipo: "cuota" as const, nota: null, created_at: "" }));
chequear("saldo tras 3 cuotas", resumen(luciana, tresCuotas, "2026-11-11").aDevolver, 0);

console.log("--- Importes escritos a mano ---");
chequear("200.000", parsearPesos("200.000"), 200000);
chequear("$200.000", parsearPesos("$200.000"), 200000);
chequear("200000", parsearPesos("200000"), 200000);
chequear("85.370,50", parsearPesos("85.370,50"), 85370.5);
chequear("vacio", parsearPesos(""), null);
chequear("tasa 30", parsearTasa("30"), 30);
chequear("tasa 28,055 con coma", parsearTasa("28,055"), 28.055);
chequear("tasa 28.055 con punto", parsearTasa("28.055"), 28.055);

console.log("--- Telefonos para WhatsApp ---");
chequear("11 5555 4444", normalizarTelefono("11 5555 4444"), "5491155554444");
chequear("+54 9 11 5555 4444", normalizarTelefono("+54 9 11 5555 4444"), "5491155554444");
chequear("011 15 5555 4444 (saca 0 y 15)", normalizarTelefono("011 15 5555 4444"), "5491155554444");
chequear("(11) 5555-4444", normalizarTelefono("(11) 5555-4444"), "5491155554444");
chequear("caracteristica de 3: 351 155 55 4444", normalizarTelefono("351 15 555 4444"), "5493515554444");
chequear("sin telefono", normalizarTelefono(null), null);
chequear("basura", normalizarTelefono("no tiene"), null);

console.log("--- Plantillas de WhatsApp ---");
const muestra = EJEMPLOS.semanal;
chequear("reemplaza una etiqueta", aplicarPlantilla("Hola {cliente}", muestra), "Hola Miriam Marquez");
chequear("reemplaza varias", aplicarPlantilla("{cliente} debe {saldo}", muestra), "Miriam Marquez debe $418.500");
chequear("etiqueta repetida", aplicarPlantilla("{saldo} y {saldo}", muestra), "$418.500 y $418.500");
chequear("etiqueta inventada queda a la vista", aplicarPlantilla("Hola {nocxiste}", muestra), "Hola {nocxiste}");
chequear("una etiqueta vacia se lleva su renglon", aplicarPlantilla("Uno\nCuota: {vacio}\nDos", { ...muestra, vacio: "" }), "Uno\nDos");
chequear("texto sin etiquetas queda igual", aplicarPlantilla("Pasa el jueves", muestra), "Pasa el jueves");
chequear("plantilla vacia no rompe", aplicarPlantilla("", muestra), "");
chequear("un renglon en blanco a proposito se respeta", aplicarPlantilla("A\n\nB", muestra), "A\n\nB");
chequear("dos renglones en blanco seguidos se juntan en uno", aplicarPlantilla("A\n\n\nB", muestra), "A\n\nB");

console.log("--- Los nueve mensajes de fabrica ---");
chequear(
  "estado de cuenta / semanal",
  aplicarPlantilla(PLANTILLAS_POR_DEFECTO.estado_cuenta.semanal, EJEMPLOS.semanal),
  "Hola Miriam Marquez 👋\nTu estado de cuenta al 25/08/2026:\n\nMonto: $200.000\n*Te quedan 15 cuotas de $27.900*\nPróximo vencimiento: 01/09/2026 (faltan 7 días)"
);
chequear(
  "estado de cuenta / mensual: muestra el total, sin cuotas",
  aplicarPlantilla(PLANTILLAS_POR_DEFECTO.estado_cuenta.mensual, EJEMPLOS.mensual),
  "Hola Willy Marquez 👋\nTu estado de cuenta al 18/08/2026:\n\nMonto: $500.000\n*A devolver: $625.000*\nPróximo vencimiento: 15/09/2026 (faltan 28 días)"
);
chequear(
  "prestamo nuevo / semanal",
  aplicarPlantilla(PLANTILLAS_POR_DEFECTO.prestamo_nuevo.semanal, EJEMPLOS.semanal),
  "Hola Miriam Marquez 👋\nPrestamo confirmado ✅:\n\nImporte: $200.000\n*A devolver: 16 cuotas semanales de $27.900*\nPrimer vencimiento: 01/09/2026"
);
chequear(
  "prestamo nuevo / mensual",
  aplicarPlantilla(PLANTILLAS_POR_DEFECTO.prestamo_nuevo.mensual, EJEMPLOS.mensual),
  "Hola Willy Marquez 👋\nPrestamo confirmado ✅:\n\nImporte: $500.000\n*A devolver: $625.000*\nFecha de vencimiento: 15/09/2026"
);
chequear(
  "comprobante / semanal",
  aplicarPlantilla(PLANTILLAS_POR_DEFECTO.comprobante.semanal, EJEMPLOS.semanal),
  "Hola Miriam Marquez 👋\nRecibimos tu pago ✅\n\nImporte abonado: $27.900\nFecha: 25/08/2026\nTe quedan 15 cuotas de $27.900\n*Saldo: $418.500*\nPróximo vencimiento: 01/09/2026"
);
chequear(
  "comprobante / mensual: sin renglon de cuotas",
  aplicarPlantilla(PLANTILLAS_POR_DEFECTO.comprobante.mensual, EJEMPLOS.mensual),
  "Hola Willy Marquez 👋\nRecibimos tu pago ✅\n\nImporte abonado: $125.000\nFecha: 18/08/2026\n*Saldo: $625.000*\nPróximo vencimiento: 15/09/2026"
);

console.log("--- Ninguno de los nueve filtra la tasa ---");
let filtra: string | null = null;
for (const { tipo } of TIPOS) {
  for (const { modalidad } of MODALIDADES) {
    const texto = aplicarPlantilla(PLANTILLAS_POR_DEFECTO[tipo][modalidad], EJEMPLOS[modalidad]);
    if (texto.includes("%")) filtra = `${tipo}/${modalidad} dice la tasa`;
    if (texto.trim() === "") filtra = `${tipo}/${modalidad} sale vacio`;
  }
}
chequear("ningun mensaje de fabrica muestra la tasa ni sale vacio", filtra, null);

console.log("--- Elegir plantilla ---");
chequear("sin nada guardado usa la de fabrica", plantillaDe(null, "estado_cuenta", "semanal"), PLANTILLAS_POR_DEFECTO.estado_cuenta.semanal);
chequear("usa la del usuario cuando existe", plantillaDe({ estado_cuenta: { semanal: "Hola {cliente}" } }, "estado_cuenta", "semanal"), "Hola {cliente}");
chequear("una en blanco vuelve a la de fabrica", plantillaDe({ estado_cuenta: { semanal: "   " } }, "estado_cuenta", "semanal"), PLANTILLAS_POR_DEFECTO.estado_cuenta.semanal);
chequear("lo guardado en una modalidad no pisa a las otras", plantillaDe({ estado_cuenta: { semanal: "propia" } }, "estado_cuenta", "mensual"), PLANTILLAS_POR_DEFECTO.estado_cuenta.mensual);
chequear("los tres ejemplos tienen las mismas etiquetas", MODALIDADES.map(({ modalidad }) => Object.keys(EJEMPLOS[modalidad]).sort().join()).every((k, _, todos) => k === todos[0]), true);

console.log("--- Planes semanales: la lista de precios sale exacta ---");
for (const plan of PLANES_SEMANALES) {
  const r = cuotaSemanal(plan.capital, plan.semanas)!;
  chequear(
    `${plan.capital / 1000}k a ${plan.semanas} semanas`,
    { cuota: r.cuota, total: r.total, exacto: r.exacto },
    { cuota: plan.cuota, total: plan.cuota * plan.semanas, exacto: true }
  );
}

console.log("--- Planes semanales: montos fuera de la lista ---");
const entre = cuotaSemanal(350000, 20)!;
chequear("350k a 20 semanas cae entre 300k y 400k", entre.entre, [300000, 400000]);
chequear("350k a 20: cuota interpolada y redondeada al cien", entre.cuota, 40700);
chequear("350k a 20: no es un precio de lista", entre.exacto, false);
chequear("120k a 16 semanas", cuotaSemanal(120000, 16)!.cuota, 16700);
chequear("50k a 16: por debajo del menor, misma proporcion", cuotaSemanal(50000, 16)!.cuota, 7000);
chequear("700k a 20: por encima del mayor, misma proporcion", cuotaSemanal(700000, 20)!.cuota, 78300);
chequear("las cuotas calculadas son multiplos de cien", [350000, 120000, 275000, 640000].every((c) => cuotaSemanal(c, 16)!.cuota % 100 === 0), true);
chequear("un plazo sin lista de precios no se inventa (6 sem)", cuotaSemanal(200000, 6), null);
chequear("tampoco uno mas largo que los tuyos (24 sem)", cuotaSemanal(200000, 24), null);
chequear("un capital de cero no devuelve plan", cuotaSemanal(0, 16), null);
chequear("planesPara trae los cinco plazos ordenados", planesPara(200000).map((p) => p.semanas), [8, 10, 12, 16, 20]);

console.log("--- Planes semanales: mas capital nunca sale mas barato ---");
let monotono = true;
for (const semanas of SEMANAS_CON_PLAN) {
  let anterior = 0;
  for (let capital = 50000; capital <= 800000; capital += 10000) {
    const cuota = cuotaSemanal(capital, semanas)!.cuota;
    if (cuota < anterior) monotono = false;
    anterior = cuota;
  }
}
chequear("la cuota nunca baja al subir el capital", monotono, true);

// El descuento por volumen tiene que bajar de a poco. Si un escalon cae de
// golpe, prestar mas deja de rendir: con el 300k a 33.900 la cuota por cada
// mil caia de 125,2 a 113,0 y prestar 300k dejaba casi lo mismo que 250k.
const MAXIMA_CAIDA = 10;
let paredon: string | null = null;
for (const semanas of SEMANAS_CON_PLAN) {
  const escalones = PLANES_SEMANALES.filter((p) => p.semanas === semanas).sort((a, b) => a.capital - b.capital);
  for (let i = 1; i < escalones.length; i++) {
    const antes = (escalones[i - 1].cuota / escalones[i - 1].capital) * 1000;
    const ahora = (escalones[i].cuota / escalones[i].capital) * 1000;
    if (antes - ahora > MAXIMA_CAIDA) {
      paredon = `${escalones[i - 1].capital} -> ${escalones[i].capital} a ${semanas} sem: cae ${(antes - ahora).toFixed(1)} por mil`;
    }
  }
}
chequear("ningun escalon de descuento cae de golpe", paredon, null);

// Estirar el plazo tiene que dejar mas ganancia. Si un plazo largo rindiera
// menos que uno corto, convendria no ofrecerlo.
let inversion: string | null = null;
for (const capital of [...new Set(PLANES_SEMANALES.map((p) => p.capital))]) {
  let anterior = 0;
  for (const semanas of SEMANAS_CON_PLAN) {
    const ganancia = cuotaSemanal(capital, semanas)!.interes;
    if (ganancia <= anterior) {
      inversion = `${capital} a ${semanas} sem deja ${ganancia} y el plazo anterior ${anterior}`;
    }
    anterior = ganancia;
  }
}
chequear("un plazo mas largo siempre deja mas ganancia", inversion, null);
chequear("los plazos cortos van a 11,5% parejo", [100000, 500000].map((c) => Math.round((cuotaSemanal(c, 12)!.cuota / c) * 1000)), [158, 158]);

console.log("--- Semanas en el calendario ---");
chequear("una semana son 7 dias", sumarSemanas("2026-08-18", 1), "2026-08-25");
chequear("16 semanas", sumarSemanas("2026-08-18", 16), "2026-12-08");
chequear("cruza fin de mes", sumarSemanas("2026-08-28", 1), "2026-09-04");
chequear("cruza fin de anio", sumarSemanas("2026-12-28", 2), "2027-01-11");
chequear("cruza el 29 de febrero bisiesto", sumarSemanas("2028-02-26", 1), "2028-03-04");

console.log("--- Un prestamo semanal completo (200k, 16 semanas) ---");
const planSemanal = calcularPlan({ modalidad: "semanal", capital: 200000, tasa: 0, cuotas: 16 });
chequear("cuota, total e interes", planSemanal, { interes: 246400, total: 446400, cuotaMonto: 27900 });
chequear("tasa implicita del plan", Number(tasaImplicita(200000, 446400).toFixed(1)), 123.2);
const semanal: Prestamo = {
  id: "3", cliente_id: "c3", modalidad: "semanal",
  capital_inicial: 200000, capital_actual: 200000, tasa_mensual: 123.2,
  fecha_inicio: "2026-08-18", fecha_vencimiento: "2026-08-25",
  cuotas_total: 16, cuota_monto: 27900, total_a_devolver: 446400,
  estado: "vigente", observacion: null, created_at: "",
};
const unaSemana = [{ id: "s1", prestamo_id: "3", fecha: "2026-08-25", monto: 27900, tipo: "cuota" as const, nota: null, created_at: "" }];
chequear("saldo tras 1 cuota", resumen(semanal, unaSemana, "2026-08-26").aDevolver, 418500);
chequear("cuotas pagadas", resumen(semanal, unaSemana, "2026-08-26").cuotasPagadas, 1);
const todas = Array.from({ length: 16 }, (_, i) => ({ id: `s${i}`, prestamo_id: "3", fecha: "2026-08-25", monto: 27900, tipo: "cuota" as const, nota: null, created_at: "" }));
chequear("saldo tras las 16", resumen(semanal, todas, "2026-12-09").aDevolver, 0);
chequear("una cuota escrita a mano pisa la lista", calcularPlan({ modalidad: "semanal", capital: 200000, tasa: 0, cuotas: 16, cuotaManual: 30000 }).total, 480000);

console.log("--- La forma de pago y el mensaje real ---");
const varsSemanal = variablesDePrestamo(semanal, resumen(semanal, unaSemana, "2026-08-26"), "Miriam", "2026-08-26", unaSemana[0]);
chequear("plan semanal", varsSemanal.forma_pago, "16 cuotas semanales de $27.900");
chequear("saldo tras una cuota", varsSemanal.saldo, "$418.500");
chequear("cuotas restantes", varsSemanal.cuotas_restantes, "15");
chequear("importe del pago", varsSemanal.pago, "$27.900");
const varsMensual = variablesDePrestamo(base, resumen(base, [], "2026-08-18"), "Miriam", "2026-08-18");
chequear("interes mensual: forma de pago sin tasa", varsMensual.forma_pago, "$60.000 por mes");
chequear("interes mensual: sin cuotas", `${varsMensual.cuotas}|${varsMensual.cuotas_pagadas}|${varsMensual.cuotas_restantes}`, "||");
chequear(
  "el mensaje real de un prestamo semanal",
  mensajeDe("comprobante", semanal, resumen(semanal, unaSemana, "2026-08-26"), "Miriam", "2026-08-26", { pago: unaSemana[0] }),
  "Hola Miriam 👋\nRecibimos tu pago ✅\n\nImporte abonado: $27.900\nFecha: 25/08/2026\nTe quedan 15 cuotas de $27.900\n*Saldo: $418.500*\nPróximo vencimiento: 25/08/2026"
);
chequear(
  "el mensaje real de uno mensual usa su propia plantilla",
  mensajeDe("estado_cuenta", base, resumen(base, [], "2026-08-18"), "Miriam", "2026-08-18").includes("A devolver: $260.000"),
  true
);

console.log("--- Plan personalizado: capital + tasa por mes + cada cuanto paga ---");
// $200.000 al 30% mensual: el interes es simple sobre el plazo.
chequear(
  "3 meses cobrando por semana = 12 cuotas",
  calcularPlan({ modalidad: "personalizado", capital: 200000, tasa: 30, frecuencia: "semanal", plazoMeses: 3 }),
  { interes: 180400, total: 380400, cuotaMonto: 31700 }
);
chequear(
  "3 meses por quincena = 6 cuotas",
  calcularPlan({ modalidad: "personalizado", capital: 200000, tasa: 30, frecuencia: "quincenal", plazoMeses: 3 }),
  { interes: 179800, total: 379800, cuotaMonto: 63300 }
);
chequear(
  "3 meses por mes = 3 cuotas",
  calcularPlan({ modalidad: "personalizado", capital: 200000, tasa: 30, frecuencia: "mensual", plazoMeses: 3 }),
  { interes: 180100, total: 380100, cuotaMonto: 126700 }
);
chequear(
  "1 mes por mes es una sola cuota igual al total",
  calcularPlan({ modalidad: "personalizado", capital: 200000, tasa: 30, frecuencia: "mensual", plazoMeses: 1 }),
  { interes: 60000, total: 260000, cuotaMonto: 260000 }
);
chequear(
  "una cuota escrita a mano manda",
  calcularPlan({ modalidad: "personalizado", capital: 200000, tasa: 30, frecuencia: "semanal", plazoMeses: 3, cuotaManual: 32000 }).total,
  384000
);
chequear("la cuota siempre cae en un multiplo de cien", [17, 23, 31, 47].every((t) => calcularPlan({ modalidad: "personalizado", capital: 137000, tasa: t, frecuencia: "semanal", plazoMeses: 2 }).cuotaMonto! % 100 === 0), true);
chequear(
  "cobrar mas seguido no cambia el total pactado, solo lo parte",
  [
    calcularPlan({ modalidad: "personalizado", capital: 100000, tasa: 20, frecuencia: "semanal", plazoMeses: 2 }).total,
    calcularPlan({ modalidad: "personalizado", capital: 100000, tasa: 20, frecuencia: "quincenal", plazoMeses: 2 }).total,
    calcularPlan({ modalidad: "personalizado", capital: 100000, tasa: 20, frecuencia: "mensual", plazoMeses: 2 }).total,
  ],
  [140000, 140000, 140000]
);

console.log("--- Vencimientos segun cada cuanto paga ---");
chequear("semanal: +7 dias", siguienteVencimiento("2026-08-18", "semanal"), "2026-08-25");
chequear("quincenal: +15 dias", siguienteVencimiento("2026-08-18", "quincenal"), "2026-09-02");
chequear("mensual: +1 mes", siguienteVencimiento("2026-08-18", "mensual"), "2026-09-18");
chequear("quincenal cruzando fin de mes", siguienteVencimiento("2026-08-25", "quincenal"), "2026-09-09");
chequear("mensual desde un 31 cae en el ultimo dia", siguienteVencimiento("2026-01-31", "mensual"), "2026-02-28");
chequear("sumarDias cruza el anio", sumarDias("2026-12-28", 10), "2027-01-07");
chequear("plural", textoCuotas(4, "semanal"), "4 cuotas semanales");
chequear("singular", textoCuotas(1, "mensual"), "1 cuota mensual");
chequear("singular quincenal", textoCuotas(1, "quincenal"), "1 cuota quincenal");
chequear("cuotas por mes de cada frecuencia", [datosFrecuencia("semanal").porMes, datosFrecuencia("quincenal").porMes, datosFrecuencia("mensual").porMes], [4, 2, 1]);

console.log("--- Agrupar cobros por mes ---");
chequear("mes de una fecha", mesDe("2026-09-04"), "2026-09");
chequear("nombre del mes", nombreMes("2026-09"), "Sep 2026");
chequear("enero", nombreMes("2026-01"), "Ene 2026");
chequear("diciembre", nombreMes("2027-12"), "Dic 2027");
chequear("los meses ordenan bien como texto", ["2026-09", "2026-08", "2026-12", "2027-01"].sort().join(), "2026-08,2026-09,2026-12,2027-01");

console.log("--- Confirmar el borrado de un cliente ---");
chequear("el nombre exacto borra", nombreCoincide("Marcelo Rodriguez", "Marcelo Rodriguez"), true);
chequear("no importan las mayusculas", nombreCoincide("marcelo rodriguez", "Marcelo Rodriguez"), true);
chequear("no importan los espacios de mas", nombreCoincide("  Marcelo   Rodriguez ", "Marcelo Rodriguez"), true);
chequear("no importan los acentos", nombreCoincide("Marcelo Rodriguez", "Marcelo Rodríguez"), true);
chequear("solo el nombre de pila NO alcanza", nombreCoincide("Marcelo", "Marcelo Rodriguez"), false);
chequear("solo el apellido NO alcanza", nombreCoincide("Rodriguez", "Marcelo Rodriguez"), false);
chequear("vacio NO borra", nombreCoincide("", "Marcelo Rodriguez"), false);
chequear("espacios NO borran", nombreCoincide("   ", "Marcelo Rodriguez"), false);
chequear("otro cliente NO borra", nombreCoincide("Miriam Marquez", "Marcelo Rodriguez"), false);
chequear("un nombre que lo contiene NO alcanza", nombreCoincide("Marcelo Rodriguez Perez", "Marcelo Rodriguez"), false);

console.log("--- Numero de cuota ---");
const cobro = (id: string, fecha: string, tipo: "cuota" | "interes", creado = "") =>
  ({ id, prestamo_id: "p", fecha, monto: 27900, tipo, nota: null, created_at: creado });

chequear(
  "se numeran en orden cronologico, no como llegan",
  [...numerarCuotas([cobro("c", "2026-09-15", "cuota"), cobro("a", "2026-09-01", "cuota"), cobro("b", "2026-09-08", "cuota")])],
  [["a", 1], ["b", 2], ["c", 3]]
);
chequear(
  "dos cuotas el mismo dia se ordenan por cuando se cargaron",
  [...numerarCuotas([cobro("cuatro", "2026-09-08", "cuota", "2026-09-08T10:05:00Z"), cobro("tres", "2026-09-08", "cuota", "2026-09-08T10:00:00Z")])],
  [["tres", 1], ["cuatro", 2]]
);
chequear(
  "los pagos que no son cuota no llevan numero",
  [...numerarCuotas([cobro("i", "2026-09-01", "interes"), cobro("a", "2026-09-08", "cuota")])],
  [["a", 1]]
);
chequear("sin cuotas no numera nada", [...numerarCuotas([])], []);
chequear(
  "borrar la cuota 4 deja a la 3 como cuota 3",
  [...numerarCuotas([cobro("uno", "2026-09-01", "cuota"), cobro("dos", "2026-09-08", "cuota"), cobro("tres", "2026-09-15", "cuota")])].map(([, n]) => n),
  [1, 2, 3]
);

console.log("--- Cuotas atrasadas ---");
// Semanal de 16 cuotas, vencia el 25/08 y no pago nada.
const atraso = (hoy: string, pagos = [] as typeof unaSemana) => resumen(semanal, pagos, hoy);
chequear("al dia: no debe nada", atraso("2026-08-24").cuotasAtrasadas, 0);
chequear("el dia del vencimiento tampoco", atraso("2026-08-25").cuotasAtrasadas, 0);
chequear("un dia despues ya debe una", atraso("2026-08-26").cuotasAtrasadas, 1);
chequear("a la semana debe dos", atraso("2026-09-01").cuotasAtrasadas, 2);
chequear("a las tres semanas debe cuatro", atraso("2026-09-15").cuotasAtrasadas, 4);
chequear("el monto atrasado son las cuotas por su valor", atraso("2026-09-15").montoAtrasado, 4 * 27900);
chequear("nunca debe mas cuotas que las que le quedan", atraso("2029-01-01").cuotasAtrasadas, 16);
// El tope son las cuotas que le quedan: con 14 de 16 pagas, por mas que el
// vencimiento sea viejo, no se le pueden reclamar mas de 2.
const catorcePagas = Array.from({ length: 14 }, (_, i) => ({
  id: `q${i}`, prestamo_id: "3", fecha: "2026-08-20", monto: 27900,
  tipo: "cuota" as const, nota: null, created_at: `2026-08-20T10:${String(i).padStart(2, "0")}:00Z`,
}));
chequear("con 14 de 16 pagas, el tope son 2", resumen(semanal, catorcePagas, "2029-01-01").cuotasAtrasadas, 2);
chequear("y el monto atrasado acompaña", resumen(semanal, catorcePagas, "2029-01-01").montoAtrasado, 2 * 27900);
chequear("con todas pagas no debe ninguna", resumen(semanal, todas, "2029-01-01").cuotasAtrasadas, 0);
chequear("un prestamo cerrado no debe nada", resumen({ ...semanal, estado: "pagado" }, [], "2029-01-01").cuotasAtrasadas, 0);
chequear("el de interes mensual no cuenta cuotas", resumen(base, [], "2026-12-01").cuotasAtrasadas, 0);

console.log("--- Avance del plan ---");
chequear("sin pagar, 0%", resumen(semanal, [], "2026-08-20").avance, 0);
chequear("1 de 16 = 6%", resumen(semanal, unaSemana, "2026-09-01").avance, 6);
chequear("8 de 16 = 50%", resumen(semanal, todas.slice(0, 8), "2026-09-01").avance, 50);
chequear("12 de 16 = 75%", resumen(semanal, todas.slice(0, 12), "2026-09-01").avance, 75);
chequear("16 de 16 = 100%", resumen(semanal, todas, "2026-12-09").avance, 100);
chequear("3 de 4 cuotas = 75%", resumen({ ...semanal, cuotas_total: 4 }, todas.slice(0, 3), "2026-09-01").avance, 75);
chequear("el de interes mensual no tiene avance", resumen(base, [], "2026-08-18").avance, null);

console.log("--- Recuperar el capital prestado ---");
// Presta 100.000 al 30%: le pagan el interes mes a mes.
const cien: Prestamo = { ...base, capital_inicial: 100000, capital_actual: 100000, tasa_mensual: 30 };
const interesesDe = (cantidad: number) =>
  Array.from({ length: cantidad }, (_, i) => ({
    id: `i${i}`, prestamo_id: "1", fecha: "2026-09-01", monto: 30000,
    tipo: "interes" as const, nota: null, created_at: "",
  }));
chequear("sin cobrar nada, faltan los 100.000", resumen(cien, [], "2026-08-18").faltaRecuperar, 100000);
chequear("con 1 interes cobrado faltan 70.000", resumen(cien, interesesDe(1), "2026-08-18").faltaRecuperar, 70000);
chequear("con 3 todavia falta", resumen(cien, interesesDe(3), "2026-08-18").recuperado, false);
chequear("con 3 faltan 10.000", resumen(cien, interesesDe(3), "2026-08-18").faltaRecuperar, 10000);
chequear("al cuarto ya se recupero", resumen(cien, interesesDe(4), "2026-08-18").recuperado, true);
chequear("y no queda nada por recuperar", resumen(cien, interesesDe(4), "2026-08-18").faltaRecuperar, 0);
chequear("cobrar de mas no da negativo", resumen(cien, interesesDe(9), "2026-08-18").faltaRecuperar, 0);
chequear(
  "en un plan semanal se recupera a la octava cuota",
  [7, 8].map((n) => resumen(semanal, todas.slice(0, n), "2026-12-09").recuperado),
  [false, true]
);

console.log("--- Serie historica del grafico ---");
const prest = (id: string, inicio: string, capital: number) =>
  ({ id, cliente_id: "c", cliente: { id: "c", nombre: "X", telefono: null }, modalidad: "mensual" as const,
     capital_inicial: capital, capital_actual: capital, tasa_mensual: 30, fecha_inicio: inicio,
     fecha_vencimiento: inicio, cuotas_total: null, cuota_monto: null, total_a_devolver: null,
     frecuencia: null, estado: "vigente" as const, observacion: null, created_at: "", pagos: [] });
const movimiento = (fecha: string, monto: number, tipo: "interes" | "cuota") =>
  ({ id: fecha + monto, prestamo_id: "p", fecha, monto, tipo, nota: null, created_at: "", prestamo: null });

// 100.000 prestados en julio. Cobra 30.000 en agosto y 30.000 en septiembre:
// los dos tapan capital, todavia no hay ganancia. El tercero, de 50.000, tapa
// los 40.000 que faltaban y recien los otros 10.000 son ganancia.
const conCobros = {
  ...prest("a", "2026-07-10", 100000),
  pagos: [
    movimiento("2026-08-10", 30000, "interes"),
    movimiento("2026-09-10", 30000, "interes"),
    movimiento("2026-09-20", 50000, "cuota"),
  ],
};
const serie = serieHistorica([conCobros, prest("b", "2026-09-02", 200000)], "2026-09-30");
chequear("arranca en el primer movimiento y llega a hoy", serie.map((p) => p.mes), ["2026-07", "2026-08", "2026-09"]);
chequear("lo prestado se acumula", serie.map((p) => p.prestado), [100000, 100000, 300000]);
chequear("la ganancia empieza recien cuando se recupero el capital", serie.map((p) => p.ganado), [0, 0, 10000]);
chequear("la ganancia acumulada = cobrado - lo que se recupero", serie[2].ganado, 110000 - 100000);
chequear("los meses sin movimiento igual aparecen", serie.length, 3);
chequear("sin datos no hay serie", serieHistorica([], "2026-09-30"), []);
chequear(
  "cruza el fin de anio sin saltear meses",
  serieHistorica([prest("c", "2026-11-05", 50000)], "2027-02-10").map((p) => p.mes),
  ["2026-11", "2026-12", "2027-01", "2027-02"]
);


console.log("--- Proyeccion del mes: todas las cuotas, no solo la proxima ---");

const cliente = { id: "c1", nombre: "Marcelo", telefono: null };
function planDe(over: Partial<PrestamoConCliente>): PrestamoConCliente {
  return {
    id: "p1", cliente_id: "c1", modalidad: "semanal", capital_inicial: 200000,
    capital_actual: 200000, tasa_mensual: 46.4, fecha_inicio: "2026-08-01",
    fecha_vencimiento: "2026-08-08", cuotas_total: 16, cuota_monto: 18300,
    total_a_devolver: 292800, frecuencia: "semanal", estado: "vigente",
    observacion: null, created_at: "2026-08-01T00:00:00Z",
    cliente, pagos: [], ...over,
  } as PrestamoConCliente;
}
const HOY = "2026-09-11";
function proyectar(prestamos: PrestamoConCliente[], mes: string) {
  return proyeccionDelMes(cronogramaPendiente(resolver(prestamos, HOY), HOY), mes);
}

// Un plan semanal al dia: octubre de 2026 tiene cinco viernes desde el 2.
const alDia = planDe({ fecha_vencimiento: "2026-09-18" });
chequear("semanal al dia: 5 cuotas en octubre", proyectar([alDia], "2026-10").cuotas, 5);
chequear("semanal al dia: monto = 5 cuotas", proyectar([alDia], "2026-10").monto, 5 * 18300);

// El fallo que se arreglo: un prestamo atrasado dejaba meses en cero porque
// las cuotas vencidas se comian el cupo del cronograma.
const atrasado = planDe({ fecha_vencimiento: "2026-07-03" });
chequear("atrasado: las 16 cuotas siguen en el cronograma", cronogramaPendiente(resolver([atrasado], HOY), HOY)[0].cuotas.length, 16);
chequear("atrasado: septiembre tiene 4 cuotas", proyectar([atrasado], "2026-09").cuotas, 4);
chequear("atrasado: de esas, 2 ya vencieron", proyectar([atrasado], "2026-09").vencidas, 2);
chequear("atrasado: octubre tiene 3 cuotas, no cero", proyectar([atrasado], "2026-10").cuotas, 3);

// Nada del cronograma se pierde ni se cuenta dos veces.
const delAtrasado = cronogramaPendiente(resolver([atrasado], HOY), HOY)[0].cuotas;
const porMes = ["2026-07", "2026-08", "2026-09", "2026-10"].reduce((acc, m) => acc + proyectar([atrasado], m).cuotas, 0);
chequear("las cuotas se reparten entre los meses sin perderse", porMes, delAtrasado.length);

console.log("--- Desglose capital / interes ---");

// 200.000 prestados, 292.800 a devolver. Las primeras 10 cuotas de 18.300
// (183.000) son capital; la 11 parte 17.000 de capital y 1.300 de ganancia.
const nuevo = planDe({ fecha_vencimiento: "2026-10-02" });
const oct = proyectar([nuevo], "2026-10");
chequear("prestamo nuevo: octubre es todo capital", oct.interes, 0);
chequear("prestamo nuevo: capital = el total del mes", oct.capital, oct.monto);
const cuotas16 = cronogramaPendiente(resolver([nuevo], HOY), HOY)[0].cuotas;
chequear("la cuota 11 es la que parte capital e interes", [cuotas16[10].capital, cuotas16[10].interes], [17000, 1300]);
chequear("de la 12 en adelante es toda ganancia", cuotas16[11].interes, 18300);
chequear("capital repartido = lo que se presto", cuotas16.reduce((a, c) => a + c.capital, 0), 200000);
chequear("capital + interes = lo que queda por cobrar", cuotas16.reduce((a, c) => a + c.monto, 0), 292800);

// Con 12 cuotas ya cobradas el capital volvio: lo que entra es ganancia pura.
const casiTerminado = planDe({
  fecha_vencimiento: "2026-10-02",
  pagos: Array.from({ length: 12 }, (_, i) => ({
    id: `g${i}`, prestamo_id: "p1", fecha: "2026-08-08", monto: 18300,
    tipo: "cuota", nota: null, created_at: "2026-08-08T00:00:00Z",
  })),
} as Partial<PrestamoConCliente>);
const finOct = proyectar([casiTerminado], "2026-10");
chequear("ya recupero el capital: octubre es toda ganancia", finOct.capital, 0);
chequear("le quedan 4 cuotas, no 16", cronogramaPendiente(resolver([casiTerminado], HOY), HOY)[0].cuotas.length, 4);

// La modalidad de interes mensual: la cuota es el interes, el capital no vuelve
// hasta que salden, pero igual cuenta contra lo que se puso.
const mensual = planDe({
  id: "p2", modalidad: "mensual", capital_inicial: 100000, capital_actual: 100000,
  tasa_mensual: 30, fecha_vencimiento: "2026-10-07", cuotas_total: null,
  cuota_monto: null, total_a_devolver: null, frecuencia: null,
});
const octMensual = proyectar([mensual], "2026-10");
chequear("mensual: una sola cuota en el mes", octMensual.cuotas, 1);
chequear("mensual: la cuota es el interes del mes", octMensual.monto, 30000);
chequear("mensual: cuenta contra el capital hasta estar a mano", octMensual.capital, 30000);

// Varios prestamos juntos: el total es la suma y el desglose tambien.
const juntos = proyectar([alDia, mensual], "2026-10");
chequear("dos prestamos suman sus cuotas", juntos.cuotas, 6);
chequear("dos prestamos suman su monto", juntos.monto, 5 * 18300 + 30000);
chequear("capital + interes = el total del mes", juntos.capital + juntos.interes, juntos.monto);
chequear("el detalle trae una linea por prestamo", juntos.lineas.length, 2);
chequear("las lineas van de mayor a menor", juntos.lineas.map((l) => l.monto), [91500, 30000]);

// Un prestamo ya pagado no proyecta nada.
chequear("un prestamo cerrado no aparece", proyectar([planDe({ estado: "pagado" })], "2026-10").cuotas, 0);


{
console.log("--- Borrar un cobro deshace lo que le hizo al prestamo ---");

chequear("el vencimiento anterior es el inverso del siguiente", vencimientoAnterior(siguienteVencimiento("2026-09-11", "semanal"), "semanal"), "2026-09-11");
chequear("idem quincenal", vencimientoAnterior(siguienteVencimiento("2026-09-11", "quincenal"), "quincenal"), "2026-09-11");
chequear("idem mensual", vencimientoAnterior(siguienteVencimiento("2026-01-15", "mensual"), "mensual"), "2026-01-15");

type Kobro = { id: string; prestamo_id: string; fecha: string; monto: number; tipo: "interes" | "capital" | "cuota" | "total"; nota: null; created_at: string };
const kobro = (n: number, tipo: Kobro["tipo"], monto: number): Kobro =>
  ({ id: `k${n}`, prestamo_id: "p1", fecha: "2026-08-08", monto, tipo, nota: null, created_at: "" });

const plantilla: Prestamo = {
  id: "p1", cliente_id: "c1", modalidad: "semanal", capital_inicial: 200000,
  capital_actual: 200000, tasa_mensual: 46.4, fecha_inicio: "2026-08-01",
  fecha_vencimiento: "2026-08-08", cuotas_total: 16, cuota_monto: 18300,
  total_a_devolver: 292800, frecuencia: "semanal", estado: "vigente",
  observacion: null, created_at: "",
};

/** Registra los cobros uno por uno, como hace la app. */
function registrar(inicial: Prestamo, cobros: Kobro[]) {
  let p = { ...inicial };
  const previos: Kobro[] = [];
  for (const c of cobros) {
    p = { ...p, ...aplicarPago(p, c, previos as never) };
    previos.push(c);
  }
  return p;
}

/**
 * La prueba que importa: registrar N cobros y borrar el ultimo tiene que dejar
 * el prestamo igual que si ese cobro nunca se hubiera registrado.
 */
function idaYVuelta(nombre: string, inicial: Prestamo, cobros: Kobro[]) {
  const conTodos = registrar(inicial, cobros);
  const ultimo = cobros[cobros.length - 1];
  const restantes = cobros.slice(0, -1);
  const revertido = { ...conTodos, ...revertirPago(conTodos, ultimo, restantes as never) };
  const sinEl = registrar(inicial, restantes);
  chequear(nombre, [revertido.fecha_vencimiento, revertido.capital_actual, revertido.estado],
                   [sinEl.fecha_vencimiento, sinEl.capital_actual, sinEl.estado]);
}

const unaCuota = kobro(1, "cuota", 18300);
idaYVuelta("plan semanal: borrar la 1a cuota", plantilla, [unaCuota]);
idaYVuelta("plan semanal: borrar la 4a de 4", plantilla, [unaCuota, kobro(2, "cuota", 18300), kobro(3, "cuota", 18300), kobro(4, "cuota", 18300)]);
idaYVuelta("plan semanal: borrar la 16a, la que lo cerro", plantilla, Array.from({ length: 16 }, (_, i) => kobro(i, "cuota", 18300)));
idaYVuelta("plan semanal: borrar una entrega a cuenta", plantilla, [unaCuota, kobro(9, "capital", 50000)]);
idaYVuelta("plan semanal: borrar un saldo total", plantilla, [unaCuota, kobro(9, "total", 274500)]);

const mensual: Prestamo = { ...plantilla, modalidad: "mensual", capital_inicial: 100000, capital_actual: 100000, tasa_mensual: 30, cuotas_total: null, cuota_monto: null, total_a_devolver: null, frecuencia: null, fecha_vencimiento: "2026-09-07" };
idaYVuelta("interes mensual: borrar un interes", mensual, [kobro(1, "interes", 30000)]);
idaYVuelta("interes mensual: borrar el 3er interes de 3", mensual, [kobro(1, "interes", 30000), kobro(2, "interes", 30000), kobro(3, "interes", 30000)]);
idaYVuelta("interes mensual: borrar una entrega a cuenta", mensual, [kobro(1, "interes", 30000), kobro(2, "capital", 40000)]);
idaYVuelta("interes mensual: borrar el que lo salda", mensual, [kobro(1, "interes", 30000), kobro(2, "total", 130000)]);

const quincenal: Prestamo = { ...plantilla, modalidad: "personalizado", frecuencia: "quincenal", cuotas_total: 6, cuota_monto: 40000, total_a_devolver: 240000 };
idaYVuelta("plan quincenal: borrar la 3a de 3", quincenal, [kobro(1, "cuota", 40000), kobro(2, "cuota", 40000), kobro(3, "cuota", 40000)]);

// El caso de Marcelo: cargo la cuota 3 y la 4 juntas y quiere borrar la 4.
const conCuatro = registrar(plantilla, [kobro(1, "cuota", 18300), kobro(2, "cuota", 18300), kobro(3, "cuota", 18300), kobro(4, "cuota", 18300)]);
chequear("con 4 cuotas el vencimiento esta en la 5a semana", conCuatro.fecha_vencimiento, "2026-09-05");
const sinLaCuarta = { ...conCuatro, ...revertirPago(conCuatro, kobro(4, "cuota", 18300), [kobro(1, "cuota", 18300), kobro(2, "cuota", 18300), kobro(3, "cuota", 18300)] as never) };
chequear("al borrar la 4a el vencimiento vuelve a la 4a semana", sinLaCuarta.fecha_vencimiento, "2026-08-29");
chequear("y el prestamo sigue vigente", sinLaCuarta.estado, "vigente");
}


{
console.log("--- Que todo cierre: identidades contables sobre una cartera mezclada ---");

type P = PrestamoConCliente;
type Mov = { id: string; prestamo_id: string; fecha: string; monto: number; tipo: "interes"|"capital"|"cuota"|"total"; nota: null; created_at: string };

const HOY_A = "2026-09-11";
let n = 0;
const pref = (pid: string, fecha: string, monto: number, tipo: Mov["tipo"]): Mov =>
  ({ id: `${pid}-${++n}`, prestamo_id: pid, fecha, monto, tipo, nota: null, created_at: `${fecha}T0${n % 9}:00:00Z` });

function arma(o: Partial<P>): P {
  return { id: "x", cliente_id: "cx", modalidad: "semanal", capital_inicial: 200000,
    capital_actual: 200000, tasa_mensual: 46.4, fecha_inicio: "2026-05-01",
    fecha_vencimiento: "2026-09-18", cuotas_total: 16, cuota_monto: 18300,
    total_a_devolver: 292800, frecuencia: "semanal", estado: "vigente",
    observacion: null, created_at: "", cliente: { id: "cx", nombre: "X", telefono: null },
    pagos: [], ...o } as P;
}

// Seis prestamos que cubren las cuatro modalidades y los estados que importan.
const cartera: P[] = [
  // 1. Plan semanal recien arrancado: 3 de 16 cobradas.
  // Atrasado a proposito: sin un caso vencido, el chequeo de atrasadas no prueba nada.
  arma({ id: "s1", cliente_id: "c1", cliente: { id: "c1", nombre: "Ana", telefono: null },
    fecha_vencimiento: "2026-08-07",
    pagos: ["2026-08-28","2026-09-04","2026-09-11"].map((f) => pref("s1", f, 18300, "cuota")) }),
  // 2. Plan semanal pasado el punto de equilibrio: 12 de 16.
  arma({ id: "s2", cliente_id: "c2", cliente: { id: "c2", nombre: "Beto", telefono: null },
    fecha_vencimiento: "2026-09-19",
    pagos: Array.from({ length: 12 }, (_, i) => pref("s2", `2026-0${6 + Math.floor(i/5)}-${String(1 + (i % 5) * 5).padStart(2,"0")}`, 18300, "cuota")) }),
  // 3. Plan semanal terminado.
  arma({ id: "s3", cliente_id: "c3", cliente: { id: "c3", nombre: "Cris", telefono: null },
    estado: "pagado", capital_actual: 0, fecha_vencimiento: "2026-08-30",
    pagos: Array.from({ length: 16 }, (_, i) => pref("s3", `2026-07-${String(1 + i).padStart(2,"0")}`, 18300, "cuota")) }),
  // 4. Mensual cobrando interes, todavia sin recuperar el capital.
  arma({ id: "m1", cliente_id: "c4", cliente: { id: "c4", nombre: "Dani", telefono: null },
    modalidad: "mensual", capital_inicial: 100000, capital_actual: 100000, tasa_mensual: 30,
    cuotas_total: null, cuota_monto: null, total_a_devolver: null, frecuencia: null,
    fecha_vencimiento: "2026-10-07",
    pagos: ["2026-07-07","2026-08-07","2026-09-07"].map((f) => pref("m1", f, 30000, "interes")) }),
  // 5. Plan en 3 cuotas mensuales donde el total no divide exacto: 130.000 / 3.
  arma({ id: "q1", cliente_id: "c5", cliente: { id: "c5", nombre: "Eva", telefono: null },
    modalidad: "cuotas", capital_inicial: 100000, capital_actual: 100000, tasa_mensual: 30,
    cuotas_total: 3, cuota_monto: 43333, total_a_devolver: 130000, frecuencia: "mensual",
    fecha_vencimiento: "2026-09-20", pagos: [] }),
  // 6. Personalizado quincenal con una entrega a cuenta de por medio.
  arma({ id: "k1", cliente_id: "c6", cliente: { id: "c6", nombre: "Fer", telefono: null },
    modalidad: "personalizado", capital_inicial: 300000, capital_actual: 300000, tasa_mensual: 15,
    cuotas_total: 6, cuota_monto: 65000, total_a_devolver: 390000, frecuencia: "quincenal",
    fecha_vencimiento: "2026-09-15",
    pagos: [pref("k1", "2026-08-15", 65000, "cuota"), pref("k1", "2026-08-30", 65000, "cuota")] }),
];

const res = resolver(cartera, HOY_A);

// --- Identidades de cada prestamo ---
for (const { prestamo, datos } of res) {
  chequear(`${prestamo.id}: recuperado + ganancia = cobrado`, datos.capitalRecuperado + datos.ganancia, datos.cobrado);
  chequear(`${prestamo.id}: recuperado + falta = capital prestado`, datos.capitalRecuperado + datos.faltaRecuperar, prestamo.capital_inicial);
  if (prestamo.modalidad !== "mensual") {
    chequear(`${prestamo.id}: cobrado + lo que falta = total del plan`, datos.cobrado + datos.aDevolver, prestamo.total_a_devolver);
    chequear(`${prestamo.id}: total del plan = capital + interes`, prestamo.capital_inicial + datos.interes, prestamo.total_a_devolver);
  }
}

// --- El cronograma cierra con lo que falta cobrar ---
const pend = cronogramaPendiente(res, HOY_A);
for (const linea of pend) {
  const p = cartera.find((x) => x.id === linea.prestamoId)!;
  const d = res.find((x) => x.prestamo.id === linea.prestamoId)!.datos;
  const suma = linea.cuotas.reduce((a, c) => a + c.monto, 0);
  if (p.modalidad !== "mensual") {
    chequear(`${p.id}: el cronograma suma lo que falta cobrar`, suma, d.aDevolver);
  }
  chequear(`${p.id}: capital del cronograma = lo que falta recuperar`, linea.cuotas.reduce((a, c) => a + c.capital, 0), d.faltaRecuperar);
  chequear(`${p.id}: capital + interes = monto, cuota por cuota`, linea.cuotas.every((c) => c.capital + c.interes === c.monto), true);
}

// --- Los meses reparten el cronograma sin perder ni duplicar un peso ---
const mesesCron = mesesConVencimientos(pend);
const porMeses = mesesCron.reduce((acc, m) => {
  const pr = proyeccionDelMes(pend, m);
  return { monto: acc.monto + pr.monto, capital: acc.capital + pr.capital, interes: acc.interes + pr.interes, cuotas: acc.cuotas + pr.cuotas };
}, { monto: 0, capital: 0, interes: 0, cuotas: 0 });
const todoElCron = pend.flatMap((l) => l.cuotas);
chequear("los meses suman el cronograma entero", porMeses.monto, todoElCron.reduce((a, c) => a + c.monto, 0));
chequear("y sus cuotas tambien", porMeses.cuotas, todoElCron.length);
chequear("capital + interes = monto, en el total de los meses", porMeses.capital + porMeses.interes, porMeses.monto);
chequear("el capital proyectado = lo que falta recuperar de toda la cartera", porMeses.capital, res.reduce((a, x) => a + x.datos.faltaRecuperar, 0));

// --- La cartera ---
const t = totalesDe(res);
const cobradoTotal = res.reduce((a, x) => a + x.datos.cobrado, 0);
const prestadoTotal = cartera.reduce((a, p) => a + p.capital_inicial, 0);
const recuperadoTotal = res.reduce((a, x) => a + x.datos.capitalRecuperado, 0);
chequear("cartera: recuperado + ganancia = cobrado", recuperadoTotal + t.gananciaCobrada, cobradoTotal);
chequear("cartera: recuperado + falta recuperar = prestado", recuperadoTotal + res.reduce((a, x) => a + x.datos.faltaRecuperar, 0), prestadoTotal);
chequear("cartera: en la calle = capital de cada prestamo", t.enLaCalle, res.filter((x) => x.prestamo.estado === "vigente").reduce((a, x) => a + x.datos.capital, 0));
chequear("cartera: a cobrar - en la calle = interes pendiente", t.aCobrar - t.enLaCalle, t.interesPendiente);

// --- Los meses del resumen cierran con los cobros reales ---
const todosLosCobros = cartera.flatMap((p) => p.pagos);
const desde = [...todosLosCobros.map((p) => p.fecha), ...cartera.map((p) => p.fecha_inicio)].sort()[0].slice(0, 7);
const cuantos = (Number(HOY_A.slice(0,4)) * 12 + Number(HOY_A.slice(5,7))) - (Number(desde.slice(0,4)) * 12 + Number(desde.slice(5,7))) + 1;
const porMes = resumenPorMes(cartera, HOY_A, cuantos);
chequear("los meses suman todo lo que entro", porMes.reduce((a, m) => a + m.cobrado, 0), cobradoTotal);
chequear("los meses suman toda la ganancia", porMes.reduce((a, m) => a + m.ganancia, 0), t.gananciaCobrada);
chequear("los meses suman todo lo prestado", porMes.reduce((a, m) => a + m.prestado, 0), prestadoTotal);
chequear("ningun mes tiene mas ganancia que lo que entro", porMes.every((m) => m.ganancia <= m.cobrado), true);

// --- La serie historica cierra con la cartera ---
const serieA = serieHistorica(cartera, HOY_A);
chequear("la serie termina en todo lo prestado", serieA[serieA.length - 1].prestado, prestadoTotal);
chequear("la serie termina en toda la ganancia cobrada", serieA[serieA.length - 1].ganado, t.gananciaCobrada);
chequear("la serie nunca baja", serieA.every((p, i) => i === 0 || (p.prestado >= serieA[i-1].prestado && p.ganado >= serieA[i-1].ganado)), true);

// --- Ningun numero puede ser negativo ---
chequear("nada da negativo", res.every(({ datos: d }) =>
  [d.capital, d.cobrado, d.ganancia, d.capitalRecuperado, d.faltaRecuperar, d.aDevolver].every((v) => v >= 0)), true);
chequear("ningun tramo del cronograma da negativo", todoElCron.every((c) => c.monto >= 0 && c.capital >= 0 && c.interes >= 0), true);

// --- Las cuotas atrasadas dan igual en la ficha que en el cronograma ---
// Son dos codigos distintos contando lo mismo: si no coinciden, la pantalla de
// inicio y la de resumen le dicen cosas distintas al mismo prestamo.
for (const { prestamo, datos } of res) {
  if (prestamo.modalidad === "mensual") continue;
  const linea = pend.find((l) => l.prestamoId === prestamo.id);
  chequear(`${prestamo.id}: atrasadas en la ficha = vencidas en el cronograma`,
    datos.cuotasAtrasadas, (linea?.cuotas ?? []).filter((c) => c.vencida).length);
}

// El caso que rompia la cuenta vieja de 30 dias: tres vencimientos del dia 1.
const tresDel1 = arma({ id: "z1", modalidad: "cuotas", frecuencia: "mensual",
  cuotas_total: 6, cuota_monto: 50000, total_a_devolver: 300000, capital_inicial: 250000,
  capital_actual: 250000, fecha_inicio: "2025-12-01", fecha_vencimiento: "2026-01-01", pagos: [] });
const zRes = resolver([tresDel1], "2026-03-01");
const zCron = cronogramaPendiente(zRes, "2026-03-01")[0];
chequear("1/1, 1/2 y 1/3 al 1/3 son tres atrasadas, no dos", zRes[0].datos.cuotasAtrasadas, 3);
chequear("y el cronograma marca las mismas tres", zCron.cuotas.filter((c) => c.vencida).length, 3);
chequear("el monto atrasado son esas tres cuotas", zRes[0].datos.montoAtrasado, 150000);

// Si se le pasaron TODAS las que le quedaban, debe el saldo exacto y no
// cuotas redondas: aca la ultima carga el peso del resto de dividir 130.000/3.
const todasVencidas = arma({ id: "z2", modalidad: "cuotas", frecuencia: "mensual",
  cuotas_total: 3, cuota_monto: 43333, total_a_devolver: 130000, capital_inicial: 100000,
  capital_actual: 100000, fecha_inicio: "2026-01-05", fecha_vencimiento: "2026-02-05", pagos: [] });
const z2 = resolver([todasVencidas], "2026-06-01")[0].datos;
chequear("con las tres vencidas debe el saldo exacto, no 3 x 43.333", z2.montoAtrasado, 130000);
chequear("y no 129.999", z2.montoAtrasado === 43333 * 3, false);

// --- Ningun numero puede ser infinito ni NaN ---
// chequear() compara con JSON.stringify, que convierte Infinity en null: sin
// esta prueba un infinito pasa como "OK  null".
const finito = (v: number) => Number.isFinite(v);
chequear("ningun numero de prestamo es infinito ni NaN", res.every(({ datos: d }) =>
  [d.capital, d.interes, d.aDevolver, d.cobrado, d.ganancia, d.capitalRecuperado,
   d.faltaRecuperar, d.montoAtrasado, d.cuotasAtrasadas].every(finito)), true);
chequear("ninguna cuota proyectada es infinita ni NaN", todoElCron.every((c) =>
  finito(c.monto) && finito(c.capital) && finito(c.interes)), true);
chequear("ningun total de la cartera es infinito ni NaN",
  [t.enLaCalle, t.aCobrar, t.interesPendiente, t.gananciaCobrada].every(finito), true);
chequear("ningun mes es infinito ni NaN", porMes.every((m) =>
  [m.prestado, m.cobrado, m.ganancia, m.montoRenovado].every(finito)), true);

// --- El caso del total que no divide exacto ---
const eva = pend.find((l) => l.prestamoId === "q1")!;
chequear("Eva: 3 cuotas de 130.000 que no divide exacto", eva.cuotas.map((c) => c.monto), [43333, 43333, 43334]);
chequear("Eva: y las tres suman los 130.000", eva.cuotas.reduce((a, c) => a + c.monto, 0), 130000);
}

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
