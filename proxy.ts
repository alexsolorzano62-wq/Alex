import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/mantenimiento"];

// Con MAINTENANCE_MODE=true nadie puede usar la app, salvo los emails
// listados en MAINTENANCE_ALLOW_EMAILS (separados por coma).
const MAINTENANCE_ON = process.env.MAINTENANCE_MODE === "true";
const MAINTENANCE_ALLOWED = (process.env.MAINTENANCE_ALLOW_EMAILS ?? "")
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Las rutas de API hacen su propio control y responden JSON: redirigirlas
  // al login rompería el `fetch` del navegador, que espera JSON.
  const isApiPath = request.nextUrl.pathname.startsWith("/api/");
  const path = request.nextUrl.pathname;

  if (MAINTENANCE_ON) {
    const isAllowed =
      user?.email != null &&
      MAINTENANCE_ALLOWED.includes(user.email.toLowerCase());

    if (!isAllowed) {
      // Se deja pasar el login para que un administrador pueda iniciar sesión
      // y seguir trabajando durante la pausa.
      if (path !== "/mantenimiento" && path !== "/login" && !isApiPath) {
        return NextResponse.redirect(new URL("/mantenimiento", request.url));
      }
      if (isApiPath) {
        return NextResponse.json(
          { error: "El sistema está pausado por mantenimiento." },
          { status: 503 }
        );
      }
    } else if (path === "/mantenimiento") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (!user && !isPublicPath && !isApiPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
