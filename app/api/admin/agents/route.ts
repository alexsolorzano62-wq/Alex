import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = await getRole(supabase, user.id);
  if (role !== "admin") return null;

  return user;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const role = body.role === "admin" ? "admin" : "agent";

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email y contraseña (mínimo 6 caracteres) son obligatorios." },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "No se pudo crear el usuario." },
      { status: 400 }
    );
  }

  if (role === "admin") {
    const { error: roleError } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", created.user.id);

    if (roleError) {
      return NextResponse.json(
        { error: "Usuario creado, pero no se pudo asignar el rol de administrador." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ id: created.user.id });
}
