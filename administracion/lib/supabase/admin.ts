import "server-only";
import { createClient } from "@supabase/supabase-js";

// Clave de servicio: se salta la RLS. Solo para crear usuarios del equipo y
// para el proceso que baja las series de índices. Nunca llega al navegador.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
