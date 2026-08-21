import { redondear, formatearMoneda } from "@/lib/dinero";
import { sumarMeses, diasEntre, vencimientoDelPeriodo, primerDiaDelMes, nombreDelPeriodo } from "@/lib/fechas";
import { calcularAjuste, coeficientePorIndice, coeficienteFijo, proximoAjuste, tocaAjustar } from "@/lib/ajustes";
import { calcularPunitorios, diasDeAtraso } from "@/lib/punitorios";
import { calcularTotales, honorariosDe, armarDetalle } from "@/lib/liquidacion";
import { coincide, ordenar, type Unidad } from "@/lib/unidades";

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
function unidad(direccion: string, propietario: string, inquilino: string | null, monto: number | null, fin: string | null): Unidad {
  return {
    id: direccion, direccion, pisoDepto: null, direccionCompleta: direccion,
    localidad: "San Miguel de Tucumán", tipo: "departamento", estado: monto == null ? "disponible" : "alquilado",
    propietarioId: null, propietario, contratoId: null, inquilino, monto, moneda: "ARS",
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

console.log("--- Formato ---");
chequear("dias entre vencimiento y pago", diasEntre("2026-08-10", "2026-09-09"), 30);
console.log(`     muestra de formato: ${formatearMoneda(700000)}`);

console.log(fallos === 0 ? "\nTodo OK." : `\n${fallos} chequeos fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
