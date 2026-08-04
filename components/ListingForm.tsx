"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Listing,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  RENTAL_PURPOSE_LABELS,
  CONTRACT_MONTHS_OPTIONS,
  Currency,
  AdjustmentIndex,
  RentalPurpose,
} from "@/lib/types";

interface Props {
  userId: string;
  listing?: Listing;
}

function boolToStr(value: boolean | null | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function strToBool(value: string): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

const inputClass =
  "w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function ListingForm({ userId, listing }: Props) {
  const router = useRouter();
  const isEditing = Boolean(listing);

  const [address, setAddress] = useState(listing?.address ?? "");
  const [neighborhood, setNeighborhood] = useState(listing?.neighborhood ?? "");
  const [city, setCity] = useState(listing?.city ?? "");
  const [price, setPrice] = useState(listing?.price?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(listing?.currency ?? "ARS");
  const [propertyType, setPropertyType] = useState(
    listing?.property_type ?? "departamento"
  );
  const [status, setStatus] = useState(listing?.status ?? "disponible");
  const [bedrooms, setBedrooms] = useState(listing?.bedrooms?.toString() ?? "");
  const [bathrooms, setBathrooms] = useState(listing?.bathrooms?.toString() ?? "");
  const [areaM2, setAreaM2] = useState(listing?.area_m2?.toString() ?? "");
  const [purpose, setPurpose] = useState<RentalPurpose | "">(
    listing?.rental_purpose ?? ""
  );

  const knownMonths = CONTRACT_MONTHS_OPTIONS.map(String);
  const initialMonths = listing?.contract_months?.toString() ?? "";
  const [contractOption, setContractOption] = useState(
    initialMonths === "" ? "" : knownMonths.includes(initialMonths) ? initialMonths : "otro"
  );
  const [contractCustom, setContractCustom] = useState(
    initialMonths !== "" && !knownMonths.includes(initialMonths) ? initialMonths : ""
  );

  const knownFreqs = ["trimestral", "cuatrimestral"];
  const initialFreq = listing?.adjustment_frequency ?? "";
  const [freqOption, setFreqOption] = useState(
    initialFreq === "" ? "" : knownFreqs.includes(initialFreq) ? initialFreq : "otro"
  );
  const [freqCustom, setFreqCustom] = useState(
    initialFreq !== "" && !knownFreqs.includes(initialFreq) ? initialFreq : ""
  );

  const [adjIndex, setAdjIndex] = useState<AdjustmentIndex | "">(
    listing?.adjustment_index ?? ""
  );
  const [fixedPct, setFixedPct] = useState(
    listing?.adjustment_fixed_pct?.toString() ?? ""
  );

  const [expenses, setExpenses] = useState(listing?.expenses?.toString() ?? "");
  const [petsAllowed, setPetsAllowed] = useState(boolToStr(listing?.pets_allowed));
  const [furnished, setFurnished] = useState(boolToStr(listing?.furnished));
  const [priorityNote, setPriorityNote] = useState(listing?.priority_note ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocal = propertyType === "local";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!address.trim()) {
      setError("La dirección es obligatoria.");
      return;
    }

    const contractMonths =
      contractOption === "otro"
        ? contractCustom
          ? Number(contractCustom)
          : null
        : contractOption
          ? Number(contractOption)
          : null;

    const adjustmentFrequency =
      freqOption === "otro" ? freqCustom.trim() || null : freqOption || null;

    setSaving(true);
    const supabase = createClient();

    const payload = {
      title: address.trim(),
      address: address.trim(),
      neighborhood: neighborhood.trim() || null,
      city: city.trim() || null,
      price: price ? Number(price) : null,
      currency,
      property_type: propertyType,
      status,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      area_m2: isLocal && areaM2 ? Number(areaM2) : null,
      rental_purpose: purpose || null,
      contract_months: contractMonths,
      adjustment_frequency: adjustmentFrequency,
      adjustment_index: adjIndex || null,
      adjustment_fixed_pct: adjIndex === "fijo" && fixedPct ? Number(fixedPct) : null,
      expenses: expenses ? Number(expenses) : null,
      pets_allowed: strToBool(petsAllowed),
      furnished: strToBool(furnished),
      priority_note: priorityNote.trim() || null,
      description: description.trim() || null,
    };

    if (isEditing && listing) {
      const { error: updateError } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", listing.id);

      setSaving(false);
      if (updateError) {
        setError("No se pudo guardar. Probá de nuevo.");
        return;
      }
      router.push(`/listings/${listing.id}`);
      router.refresh();
      return;
    }

    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({ ...payload, created_by: userId })
      .select("id")
      .single();

    setSaving(false);
    if (insertError || !data) {
      setError("No se pudo guardar. Probá de nuevo.");
      return;
    }
    router.push(`/listings/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-10">
      <div>
        <label className={labelClass}>Dirección *</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="Av. Siempre Viva 123"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as typeof propertyType)}
            className={selectClass}
          >
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={selectClass}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Barrio / Zona</label>
          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Palermo"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Ciudad</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Buenos Aires"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Precio</label>
          <input
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="250000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={selectClass}
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Dormitorios</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Baños</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {isLocal && (
        <div>
          <label className={labelClass}>Superficie (m²)</label>
          <input
            type="number"
            inputMode="numeric"
            value={areaM2}
            onChange={(e) => setAreaM2(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className={labelClass}>Destino del alquiler</label>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as RentalPurpose | "")}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          {Object.entries(RENTAL_PURPOSE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Plazo de contrato</label>
        <select
          value={contractOption}
          onChange={(e) => setContractOption(e.target.value)}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          {CONTRACT_MONTHS_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} meses
            </option>
          ))}
          <option value="otro">Otro</option>
        </select>
        {contractOption === "otro" && (
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={contractCustom}
            onChange={(e) => setContractCustom(e.target.value)}
            placeholder="Cantidad de meses"
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Ajuste</label>
        <select
          value={freqOption}
          onChange={(e) => setFreqOption(e.target.value)}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          <option value="trimestral">Trimestral</option>
          <option value="cuatrimestral">Cuatrimestral</option>
          <option value="otro">Otro</option>
        </select>
        {freqOption === "otro" && (
          <input
            value={freqCustom}
            onChange={(e) => setFreqCustom(e.target.value)}
            placeholder="Ej: semestral, anual"
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Índice de ajuste</label>
        <select
          value={adjIndex}
          onChange={(e) => setAdjIndex(e.target.value as AdjustmentIndex | "")}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          <option value="icl">ICL</option>
          <option value="ipc">IPC</option>
          <option value="fijo">Fijo (%)</option>
        </select>
        {adjIndex === "fijo" && (
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            value={fixedPct}
            onChange={(e) => setFixedPct(e.target.value)}
            placeholder="Porcentaje, ej: 7"
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Expensas</label>
        <input
          type="number"
          inputMode="numeric"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
          placeholder="Opcional"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Mascotas</label>
          <select
            value={petsAllowed}
            onChange={(e) => setPetsAllowed(e.target.value)}
            className={selectClass}
          >
            <option value="">Sin especificar</option>
            <option value="true">Se permiten</option>
            <option value="false">No se permiten</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Amoblado</label>
          <select
            value={furnished}
            onChange={(e) => setFurnished(e.target.value)}
            className={selectClass}
          >
            <option value="">Sin especificar</option>
            <option value="true">Amoblado</option>
            <option value="false">Sin amoblar</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Detalle importante <span className="text-amber-600">(prioridad)</span>
        </label>
        <textarea
          value={priorityNote}
          onChange={(e) => setPriorityNote(e.target.value)}
          rows={2}
          placeholder="Lo primero que hay que saber de esta propiedad"
          className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-base placeholder:text-amber-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div>
        <label className={labelClass}>Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Más información: requisitos, garantías, detalles del inmueble, etc."
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Publicar alquiler"}
      </button>
    </form>
  );
}
