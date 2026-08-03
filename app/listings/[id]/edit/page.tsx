import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/components/ListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) notFound();
  if (listing.created_by !== user.id) redirect(`/listings/${listing.id}`);

  let initialPhotoUrls: { path: string; url: string }[] = [];
  if (listing.photos?.length) {
    const { data: signed } = await supabase.storage
      .from("listing-photos")
      .createSignedUrls(listing.photos, 60 * 60);
    initialPhotoUrls = (signed ?? [])
      .filter((s) => s.signedUrl)
      .map((s) => ({ path: s.path ?? "", url: s.signedUrl! }));
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link
          href={`/listings/${listing.id}`}
          className="rounded-lg px-2 py-1 text-xl text-slate-500 active:bg-slate-100"
          aria-label="Volver"
        >
          ←
        </Link>
        <h1 className="text-base font-bold text-slate-900">Editar alquiler</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <ListingForm
          userId={user.id}
          listing={listing}
          initialPhotoUrls={initialPhotoUrls}
        />
      </main>
    </div>
  );
}
