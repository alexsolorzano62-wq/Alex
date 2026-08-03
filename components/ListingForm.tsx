"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Listing,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  Currency,
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
  const [rooms, setRooms] = useState(listing?.rooms?.toString() ?? "");
  const [bedrooms, setBedrooms] = useState(listing?.bedrooms?.toString() ?? "");
  const [bathrooms, setBathrooms] = useState(listing?.bathrooms?.toString() ?? "");
  const [areaM2, setAreaM2] = useState(listing?.area_m2?.toString() ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [status, setStatus] = useState(listing?.status ?? "disponible");
  const [contactPhone, setContactPhone] = useState(listing?.contact_phone ?? "");
  const [expenses, setExpenses] = useState(listing?.expenses?.toString() ?? "");
  const [petsAllowed, setPetsAllowed] = useState(boolToStr(listing?.pets_allowed));
  const [furnished, setFurnished] = useState(boolToStr(listing?.furnished));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!address.trim()) {
      setError("La dirección es obligatoria.");
      return;
    }

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
      rooms: rooms ? Number(rooms) : null,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      area_m2: areaM2 ? Number(areaM2) : null,
      description: description.trim() || null,
      status,
      contact_phone: contactPhone.trim() || null,
      expenses: expenses ? Number(expenses) : null,
      pets_allowed: strToBool(petsAllowed),
      furnished: strToBool(furnished),
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
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Dirección *
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="Av. Siempre Viva 123"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tipo
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as typeof propertyType)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          >
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Barrio / Zona
          </label>
          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Palermo"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Ciudad
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Buenos Aires"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Precio
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="250000"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Moneda
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Ambientes
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Dorm.
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Baños
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Superficie (m²)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={areaM2}
          onChange={(e) => setAreaM2(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Expensas
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
          placeholder="Opcional"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mascotas
          </label>
          <select
            value={petsAllowed}
            onChange={(e) => setPetsAllowed(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          >
            <option value="">Sin especificar</option>
            <option value="true">Se permiten</option>
            <option value="false">No se permiten</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Amoblado
          </label>
          <select
            value={furnished}
            onChange={(e) => setFurnished(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
          >
            <option value="">Sin especificar</option>
            <option value="true">Amoblado</option>
            <option value="false">Sin amoblar</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Teléfono de contacto
        </label>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="11 2345 6789"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Detalles del alquiler, requisitos, expensas, etc."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
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
