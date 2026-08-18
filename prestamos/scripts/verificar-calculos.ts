import { calcularPlan, resumen, tasaImplicita, capitalizar, renovar } from "@/lib/calc";
import { sumarMeses, diasEntre } from "@/lib/fechas";
import { normalizarTelefono } from "@/lib/whatsapp";
import { parsearPesos, parsearTasa } from "@/lib/parseo";
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

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
