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

export type ListingStatus = "disponible" | "reservado" | "no_disponible";

export type Currency = "ARS" | "USD";

export type UserRole = "agent" | "admin";

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
  pets_allowed: boolean | null;
  furnished: boolean | null;
  expenses: number | null;
  created_at: string;
  updated_at: string;
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
  no_disponible: "No disponible",
};

export const STATUS_COLORS: Record<ListingStatus, string> = {
  disponible: "bg-emerald-100 text-emerald-700",
  reservado: "bg-amber-100 text-amber-700",
  no_disponible: "bg-slate-200 text-slate-600",
};
