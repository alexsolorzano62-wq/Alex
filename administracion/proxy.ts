import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PUBLICAS = ["/login", "/mantenimiento"];

const MANTENIMIENTO = process.env.MAINTENANCE_MODE === "true";
const MANTENIMIENTO_PERMITIDOS = (process.env.MAINTENANCE_ALLOW_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((p) => ruta.startsWith(p));
  // Las rutas de API responden JSON y hacen su propio control: redirigirlas al
  // login rompería el fetch del navegador, que espera JSON.
  const esApi = ruta.startsWith("/api/");

  if (MANTENIMIENTO) {
    const permitido =
      user?.email != null &&
      MANTENIMIENTO_PERMITIDOS.includes(user.email.toLowerCase());

    if (!permitido) {
      if (ruta !== "/mantenimiento" && ruta !== "/login" && !esApi) {
        return NextResponse.redirect(new URL("/mantenimiento", request.url));
      }
      if (esApi) {
        return NextResponse.json(
          { error: "El sistema está pausado por mantenimiento." },
          { status: 503 }
        );
      }
    } else if (ruta === "/mantenimiento") {
      return NextResponse.redirect(new URL("/panel", request.url));
    }
  }

  if (!user && !esPublica && !esApi) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirectTo", ruta);
    return NextResponse.redirect(login);
  }

  if (user && ruta === "/login") {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
