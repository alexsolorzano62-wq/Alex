import Link from "next/link";
import { notFound } from "next/navigation";
import Encabezado from "@/components/Encabezado";
import EstadoBadge from "@/components/EstadoBadge";
import AvancePrestamo from "@/components/AvancePrestamo";
import FormularioPago from "@/components/FormularioPago";
import BotonesWhatsApp from "@/components/BotonesWhatsApp";
import BotonConfirmar from "@/components/BotonConfirmar";
import { borrarPago, borrarPrestamo, capitalizarPrestamo } from "@/app/acciones";
import { traerPlantillas, traerPrestamo } from "@/lib/datos";
import { numerarCuotas, resumen } from "@/lib/calc";
import { formatFecha, hoyISO } from "@/lib/fechas";
import { descripcionPlan, plata, tasaMostrada, textoVencimiento } from "@/lib/format";
import { linkWhatsApp, mensajeDe } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const NOMBRE_TIPO: Record<string, string> = {
  interes: "Interés del mes",
  capital: "Entrega a cuenta",
  cuota: "Cuota",
  total: "Saldó todo",
};

export default async function PrestamoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;

  const [prestamo, plantillas] = await Promise.all([
    traerPrestamo(id),
    traerPlantillas(),
  ]);
  if (!prestamo) notFound();

  const hoy = hoyISO();
  const datos = resumen(prestamo, prestamo.pagos, hoy);
  const nombre = prestamo.cliente?.nombre ?? "Cliente";
  const telefono = prestamo.cliente?.telefono ?? null;

  // Recién creado se ofrece el mensaje de alta; después, el estado de cuenta.
  const esNuevo = nuevo === "1";
  const mensaje = mensajeDe(
    esNuevo ? "prestamo_nuevo" : "estado_cuenta",
    prestamo,
    datos,
    nombre,
    hoy,
    { plantillas }
  );

  // El historial viene del más nuevo al más viejo, así que el último cobro
  // es el primero de la lista.
  const numeros = numerarCuotas(prestamo.pagos);
  const ultimoPago = prestamo.pagos[0] ?? null;
  const comprobante = ultimoPago
    ? mensajeDe("comprobante", prestamo, datos, nombre, hoy, {
        pago: ultimoPago,
        plantillas,
      })
    : null;

  return (
    <>
      <Encabezado subtitulo={nombre} />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href="/prestamos" className="text-sm text-slate-500">
          ← Volver
        </Link>

        {esNuevo && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            ✓ Préstamo guardado. Podés avisarle al cliente acá abajo.
          </p>
        )}

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{nombre}</h1>
            <p className="text-sm text-slate-500">
              {descripcionPlan(prestamo, datos)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <EstadoBadge estado={datos.estadoVisual} />
            <Link
              href={`/prestamos/${prestamo.id}/editar`}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600"
            >
              Corregir
            </Link>
          </div>
        </div>

        {datos.cuotasAtrasadas > 0 && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-800">
            Debe {datos.cuotasAtrasadas} cuota
            {datos.cuotasAtrasadas === 1 ? "" : "s"} atrasada
            {datos.cuotasAtrasadas === 1 ? "" : "s"}: {plata(datos.montoAtrasado)}
          </p>
        )}

        <AvancePrestamo datos={datos} cuotasTotal={prestamo.cuotas_total} />

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Prestado</dt>
              <dd className="tabular font-medium">{plata(prestamo.capital_inicial)}</dd>
            </div>
            {prestamo.capital_actual !== prestamo.capital_inicial && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Capital hoy</dt>
                <dd className="tabular font-medium">{plata(datos.capital)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-600">
                {prestamo.modalidad === "mensual" ? "Interés del mes" : "Interés del plan"}
              </dt>
              <dd className="tabular font-medium">{plata(datos.interes)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="font-semibold text-slate-800">
                {prestamo.estado === "vigente" ? "A devolver" : "Saldo"}
              </dt>
              <dd className="tabular text-lg font-bold text-brand-700">
                {plata(datos.aDevolver)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Inicio</dt>
              <dd>{formatFecha(prestamo.fecha_inicio)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Vence</dt>
              <dd
                className={datos.vencido ? "font-semibold text-red-600" : undefined}
              >
                {formatFecha(prestamo.fecha_vencimiento)}
                {prestamo.estado === "vigente" && (
                  <span className="ml-1 text-xs text-slate-400">
                    ({textoVencimiento(datos.diasParaVencer)})
                  </span>
                )}
              </dd>
            </div>
            {prestamo.observacion && (
              <div className="border-t border-slate-200 pt-2 text-slate-600">
                {prestamo.observacion}
              </div>
            )}
          </dl>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 text-sm font-bold text-slate-900">
            {esNuevo ? "Avisarle del préstamo" : "Mandarle el estado de cuenta"}
          </h2>
          <BotonesWhatsApp
            mensaje={mensaje}
            link={linkWhatsApp(telefono, mensaje)}
            etiqueta={telefono ? "Enviar por WhatsApp" : "Elegir contacto"}
          />
          {!telefono && (
            <p className="mt-2 text-xs text-slate-400">
              Este cliente no tiene WhatsApp cargado.{" "}
              <Link
                href={`/clientes/${prestamo.cliente_id}/editar`}
                className="underline"
              >
                Agregarlo
              </Link>
            </p>
          )}
        </section>

        {prestamo.estado === "vigente" && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-bold text-slate-900">Registrar un cobro</h2>
            <FormularioPago prestamo={prestamo} datos={datos} />

            {prestamo.modalidad === "mensual" && (
              <form action={capitalizarPrestamo} className="mt-3">
                <input type="hidden" name="id" value={prestamo.id} />
                <BotonConfirmar
                  pregunta={`¿Sumar ${plata(datos.interes)} de interés al capital? Va a pasar a deber ${plata(datos.capital + datos.interes)}.`}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left active:bg-amber-100"
                >
                  <span className="block text-sm font-semibold text-amber-900">
                    No pagó este mes
                  </span>
                  <span className="block text-xs text-amber-700">
                    El interés de {plata(datos.interes)} se suma al capital: pasa a
                    deber {plata(datos.capital + datos.interes)} y corre otro mes
                  </span>
                </BotonConfirmar>
              </form>
            )}
          </section>
        )}

        {comprobante && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-bold text-slate-900">
              Comprobante del último cobro
            </h2>
            <BotonesWhatsApp
              mensaje={comprobante}
              link={linkWhatsApp(telefono, comprobante)}
              etiqueta={telefono ? "Mandar comprobante" : "Elegir contacto"}
            />
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-slate-900">
            Historial
            {datos.cobrado > 0 && (
              <span className="ml-2 font-normal text-slate-500">
                cobrado {plata(datos.cobrado)}
              </span>
            )}
          </h2>
          {prestamo.pagos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              Todavía no registraste cobros.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {prestamo.pagos.map((pago) => (
                <li key={pago.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {numeros.has(pago.id)
                        ? `Cuota ${numeros.get(pago.id)}${prestamo.cuotas_total ? ` de ${prestamo.cuotas_total}` : ""}`
                        : (NOMBRE_TIPO[pago.tipo] ?? pago.tipo)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFecha(pago.fecha)}
                      {pago.nota ? ` · ${pago.nota}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular text-sm font-bold text-emerald-700">
                      {plata(pago.monto)}
                    </span>
                    <form action={borrarPago}>
                      <input type="hidden" name="id" value={pago.id} />
                      <BotonConfirmar
                        pregunta={`¿Borrar ${numeros.has(pago.id) ? `la cuota ${numeros.get(pago.id)}` : "este cobro"} de ${plata(pago.monto)} del ${formatFecha(pago.fecha)}? El préstamo vuelve a como estaba antes.`}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 active:bg-slate-100"
                      >
                        Borrar
                      </BotonConfirmar>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <details className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-500">
            Borrar este préstamo
          </summary>
          <form action={borrarPrestamo} className="border-t border-slate-100 px-4 py-4">
            <input type="hidden" name="id" value={prestamo.id} />
            <p className="text-sm text-slate-700">
              Se borra el préstamo de {nombre}
              {prestamo.pagos.length > 0 && (
                <>
                  {" "}
                  y sus {prestamo.pagos.length} cobro
                  {prestamo.pagos.length === 1 ? "" : "s"} por{" "}
                  <strong>{plata(datos.cobrado)}</strong>
                </>
              )}
              . No se puede deshacer.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Si lo que querés es corregir un cobro mal cargado, borralo desde el
              historial de acá arriba y el préstamo se acomoda solo.
            </p>
            <BotonConfirmar
              pregunta={`¿Borrar el préstamo de ${nombre} y sus ${prestamo.pagos.length} cobro(s)? No se puede deshacer.`}
              className="mt-3 w-full rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 active:bg-red-50"
            >
              Borrar definitivamente
            </BotonConfirmar>
          </form>
        </details>
      </main>
    </>
  );
}
