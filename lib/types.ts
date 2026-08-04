export type PropertyType =
  | "monoambiente"
  | "departamento"
  | "casa"
  | "duplex"
  | "local"
  | "oficina"
  | "galpon"
  | "estacionamiento"
  | "terreno";

export type ListingStatus =
  | "disponible"
  | "reservado"
  | "proximamente"
  | "pausado";

export type Currency = "ARS" | "USD";

export type UserRole = "agent" | "admin";

export type AdjustmentIndex = "icl" | "ipc" | "fijo";

export type RentalPurpose = "vivienda" | "comercial" | "profesional" | "otro";

export type SuggestionStatus = "pendiente" | "aprobada" | "rechazada";

export interface Listing {
  id: string;
  created_by: string;
  title: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  price: number | null;
  currency: Currency;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  description: string | null;
  status: ListingStatus;
  pets_allowed: boolean | null;
  furnished: boolean | null;
  expenses: number | null;
  contract_months: number | null;
  adjustment_frequency: string | null;
  adjustment_index: AdjustmentIndex | null;
  adjustment_fixed_pct: number | null;
  rental_purpose: RentalPurpose | null;
  priority_note: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export type ActivityKind = "creada" | "precio" | "estado";

export interface Activity {
  id: string;
  listing_id: string | null;
  listing_title: string;
  changed_by: string | null;
  kind: ActivityKind;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Suggestion {
  id: string;
  listing_id: string;
  suggested_by: string;
  message: string;
  status: SuggestionStatus;
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  monoambiente: "Monoambiente",
  departamento: "Departamento",
  casa: "Casa",
  duplex: "Dúplex",
  local: "Local comercial",
  oficina: "Oficina",
  galpon: "Galpón",
  estacionamiento: "Estacionamiento",
  terreno: "Terreno",
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  proximamente: "Próximamente",
  pausado: "Pausado",
};

export const STATUS_COLORS: Record<ListingStatus, string> = {
  disponible: "bg-emerald-100 text-emerald-700",
  reservado: "bg-amber-100 text-amber-700",
  proximamente: "bg-sky-100 text-sky-700",
  pausado: "bg-slate-200 text-slate-600",
};

export const ADJUSTMENT_INDEX_LABELS: Record<AdjustmentIndex, string> = {
  icl: "ICL",
  ipc: "IPC",
  fijo: "Fijo (%)",
};

export const RENTAL_PURPOSE_LABELS: Record<RentalPurpose, string> = {
  vivienda: "Vivienda",
  comercial: "Comercial",
  profesional: "Profesional",
  otro: "Otro",
};

export const CONTRACT_MONTHS_OPTIONS = [12, 18, 24, 36];

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export const SUGGESTION_STATUS_COLORS: Record<SuggestionStatus, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  aprobada: "bg-emerald-100 text-emerald-700",
  rechazada: "bg-slate-200 text-slate-600",
};

export function formatPrice(price: number | null, currency: string): string {
  if (price == null) return "Consultar precio";
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol} ${price.toLocaleString("es-AR")}`;
}
