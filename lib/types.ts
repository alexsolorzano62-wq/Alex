export type PropertyType =
  | "departamento"
  | "casa"
  | "ph"
  | "local"
  | "oficina"
  | "terreno";

export type ListingStatus = "disponible" | "reservado" | "alquilado";

export type Currency = "ARS" | "USD";

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
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  description: string | null;
  status: ListingStatus;
  contact_phone: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  departamento: "Departamento",
  casa: "Casa",
  ph: "PH",
  local: "Local comercial",
  oficina: "Oficina",
  terreno: "Terreno",
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  alquilado: "Alquilado",
};

export const STATUS_COLORS: Record<ListingStatus, string> = {
  disponible: "bg-emerald-100 text-emerald-700",
  reservado: "bg-amber-100 text-amber-700",
  alquilado: "bg-slate-200 text-slate-600",
};
