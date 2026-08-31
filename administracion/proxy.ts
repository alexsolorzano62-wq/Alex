import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PUBLICAS = ["/login", "/mantenimiento"];

const MANTENIMIENTO = process.env.MAINTENANCE_MODE === "true";
const MANTENIMIENTO_PERMITIDOS = (process.env.MAINTENANCE_ALLOW_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Sin estas dos, `createServerClient` tira una excepción y, como esto corre
// antes de cada página, el sitio entero responde 500 sin decir por qué. Mejor
// cortar acá con un cartel que nombre la variable que falta.
function faltanVariables(): string[] {
  return (["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const)
    .filter((nombre) => !process.env[nombre]);
}

function avisoDeConfiguracion(faltantes: string[]) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8">
     <title>Falta configurar</title>
     <div style="font:16px/1.5 system-ui;max-width:34rem;margin:15vh auto;padding:0 1.5rem">
       <h1 style="font-size:1.25rem">Falta configurar la conexión</h1>
       <p>La aplicación se construyó sin estas variables de entorno:</p>
       <ul><li><code>${faltantes.join("</code></li><li><code>")}</code></li></ul>
       <p>Cargalas en el proyecto de Vercel y volvé a deployar.</p>
     </div>`,
    { status: 503, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function proxy(request: NextRequest) {
  const faltantes = faltanVariables();
  if (faltantes.length > 0) return avisoDeConfiguracion(faltantes);

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

  // Si Supabase no contesta, tratamos la sesión como ausente: el guardia manda
  // al login en vez de tumbar la request entera.
  const user = await supabase.auth
    .getUser()
    .then(({ data }) => data.user)
    .catch(() => null);

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
