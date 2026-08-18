import { calcularPlan, resumen, tasaImplicita, capitalizar, renovar } from "@/lib/calc";
import { sumarMeses, diasEntre } from "@/lib/fechas";
import { normalizarTelefono, mensajeEstadoDeCuenta } from "@/lib/whatsapp";
import { aplicarPlantilla, variablesDePrestamo, EJEMPLOS, PLANTILLA_ESTADO_CUENTA, PLANTILLA_PRESTAMO_NUEVO, PLANTILLA_COMPROBANTE } from "@/lib/plantillas";
import { parsearPesos, parsearTasa } from "@/lib/parseo";
import { cuotaSemanal, planesPara, PLANES_SEMANALES, SEMANAS_CON_PLAN } from "@/lib/planes";
import { sumarSemanas } from "@/lib/fechas";
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
const muestra = EJEMPLOS[0].variables;
chequear("reemplaza una etiqueta", aplicarPlantilla("Hola {cliente}", muestra), "Hola Miriam Marquez");
chequear("reemplaza varias", aplicarPlantilla("{cliente} debe {total}", muestra), "Miriam Marquez debe $418.500");
chequear("etiqueta repetida", aplicarPlantilla("{total} y {total}", muestra), "$418.500 y $418.500");
chequear("etiqueta inventada queda a la vista", aplicarPlantilla("Hola {nocxiste}", muestra), "Hola {nocxiste}");
chequear("una etiqueta vacia se lleva su renglon", aplicarPlantilla("Uno\nCuota: {noexiste_vacio}\nDos", { ...muestra, noexiste_vacio: "" }), "Uno\nDos");
chequear("texto sin etiquetas queda igual", aplicarPlantilla("Pasa el jueves", muestra), "Pasa el jueves");
chequear("plantilla vacia no rompe", aplicarPlantilla("", muestra), "");
chequear(
  "estado de cuenta por defecto (plan semanal)",
  aplicarPlantilla(PLANTILLA_ESTADO_CUENTA, muestra),
  "Hola Miriam Marquez 👋\nTu estado de cuenta al 25/08/2026:\n\nMonto: $200.000\nForma de pago: 16 cuotas semanales de $27.900\nAbonadas: 1 de 16\nPróximo vencimiento: 01/09/2026 (faltan 7 días)"
);
chequear(
  "prestamo nuevo por defecto",
  aplicarPlantilla(PLANTILLA_PRESTAMO_NUEVO, muestra),
  "Hola Miriam Marquez 👋\nPrestamo confirmado ✅:\n\nImporte: $200.000\nForma de pago: 16 cuotas semanales de $27.900\nPrimer vencimiento: 01/09/2026"
);
chequear(
  "comprobante por defecto",
  aplicarPlantilla(PLANTILLA_COMPROBANTE, muestra),
  "Hola Miriam Marquez 👋\nRecibimos tu pago ✅\n\nImporte abonado: $27.900\nFecha: 25/08/2026\nTe quedan 15 cuotas de $27.900\nSaldo: $418.500\nPróximo vencimiento: 01/09/2026"
);

console.log("--- Lo que es tuyo no sale en el mensaje ---");
for (const [nombre, plantilla] of [
  ["estado de cuenta", PLANTILLA_ESTADO_CUENTA],
  ["prestamo nuevo", PLANTILLA_PRESTAMO_NUEVO],
] as const) {
  const texto = aplicarPlantilla(plantilla, muestra);
  chequear(`${nombre}: no dice la tasa`, texto.includes("%"), false);
  chequear(`${nombre}: no dice el total a devolver`, texto.includes("$446.400"), false);
  chequear(`${nombre}: no dice el interes`, texto.includes("$246.400"), false);
}

console.log("--- Un prestamo mensual no habla de cuotas ---");
const mensual = EJEMPLOS[1].variables;
chequear(
  "el renglon de cuotas desaparece entero",
  aplicarPlantilla(PLANTILLA_ESTADO_CUENTA, mensual),
  "Hola Willy Marquez 👋\nTu estado de cuenta al 18/08/2026:\n\nMonto: $500.000\nForma de pago: $125.000 por mes\nPróximo vencimiento: 15/09/2026 (faltan 28 días)"
);
chequear("no queda un 'de' colgado", aplicarPlantilla(PLANTILLA_ESTADO_CUENTA, mensual).includes("Abonadas"), false);
chequear(
  "el comprobante mensual tampoco cuenta cuotas",
  aplicarPlantilla(PLANTILLA_COMPROBANTE, mensual).includes("Te quedan"),
  false
);

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

console.log("--- La forma de pago describe sin revelar la tasa ---");
const varsSemanal = variablesDePrestamo(semanal, resumen(semanal, unaSemana, "2026-08-26"), "Miriam", "2026-08-26", unaSemana[0]);
chequear("plan semanal", varsSemanal.forma_pago, "16 cuotas semanales de $27.900");
chequear("saldo tras una cuota", varsSemanal.saldo, "$418.500");
chequear("cuotas restantes", varsSemanal.cuotas_restantes, "15");
chequear("importe del pago", varsSemanal.pago, "$27.900");
const varsMensual = variablesDePrestamo(base, resumen(base, [], "2026-08-18"), "Miriam", "2026-08-18");
chequear("interes mensual: forma de pago sin tasa", varsMensual.forma_pago, "$60.000 por mes");
chequear("interes mensual: sin cuotas", `${varsMensual.cuotas}|${varsMensual.cuotas_pagadas}|${varsMensual.cuotas_restantes}`, "||");

chequear("un renglon en blanco a proposito se respeta", aplicarPlantilla("A\n\nB", muestra), "A\n\nB");
chequear("dos renglones en blanco seguidos se juntan en uno", aplicarPlantilla("A\n\n\nB", muestra), "A\n\nB");
chequear(
  "sin plantilla guardada usa la de por defecto",
  mensajeEstadoDeCuenta(base, resumen(base, [], "2026-08-18"), "Miriam Marquez", "2026-08-18", null).split("\n")[0],
  "Hola Miriam Marquez 👋"
);
chequear(
  "con plantilla propia usa la del usuario",
  mensajeEstadoDeCuenta(base, resumen(base, [], "2026-08-18"), "Miriam Marquez", "2026-08-18", "Buenas {cliente}, son {total}"),
  "Buenas Miriam Marquez, son $260.000"
);
chequear(
  "una plantilla en blanco vuelve a la de por defecto",
  mensajeEstadoDeCuenta(base, resumen(base, [], "2026-08-18"), "Miriam Marquez", "2026-08-18", "   ").split("\n")[0],
  "Hola Miriam Marquez 👋"
);
// Los ejemplos de la vista previa tienen que cerrar entre si: si no, el
// usuario configura sus mensajes mirando numeros que no existen.
chequear("el ejemplo semanal cierra: cuota x restantes = saldo", `${27900 * 15}`, "418500");
chequear("el ejemplo mensual no tiene cuotas cargadas", `${EJEMPLOS[1].variables.cuotas}|${EJEMPLOS[1].variables.cuota}|${EJEMPLOS[1].variables.cuotas_restantes}`, "||");
chequear("los dos ejemplos tienen las mismas etiquetas", Object.keys(EJEMPLOS[0].variables).sort().join(), Object.keys(EJEMPLOS[1].variables).sort().join());

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
