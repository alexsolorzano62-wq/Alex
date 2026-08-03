"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Photo {
  path: string;
  url: string;
  uploading?: boolean;
}

export default function PhotoUploader({
  userId,
  initialPhotos = [],
  onChange,
}: {
  userId: string;
  initialPhotos?: { path: string; url: string }[];
  onChange: (paths: string[]) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const inputRef = useRef<HTMLInputElement>(null);

  function emitChange(next: Photo[]) {
    setPhotos(next);
    onChange(next.filter((p) => !p.uploading).map((p) => p.path));
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const supabase = createClient();
    const files = Array.from(fileList);

    const pending: Photo[] = files.map((file) => ({
      path: `pending-${crypto.randomUUID()}`,
      url: URL.createObjectURL(file),
      uploading: true,
    }));

    let current = [...photos, ...pending];
    emitChange(current);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempEntry = pending[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        current = current.filter((p) => p.path !== tempEntry.path);
        emitChange(current);
        continue;
      }

      const { data: signed } = await supabase.storage
        .from("listing-photos")
        .createSignedUrl(path, 60 * 60);

      current = current.map((p) =>
        p.path === tempEntry.path
          ? { path, url: signed?.signedUrl ?? p.url, uploading: false }
          : p
      );
      emitChange(current);
    }
  }

  async function handleRemove(path: string) {
    const next = photos.filter((p) => p.path !== path);
    emitChange(next);
    if (!path.startsWith("pending-")) {
      const supabase = createClient();
      await supabase.storage.from("listing-photos").remove([path]);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.path}
            className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
          >
            <Image
              src={photo.url}
              alt="Foto del alquiler"
              fill
              sizes="120px"
              className="object-cover"
              unoptimized={photo.path.startsWith("pending-")}
            />
            {photo.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs text-white">
                Subiendo...
              </div>
            )}
            {!photo.uploading && (
              <button
                type="button"
                onClick={() => handleRemove(photo.path)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                aria-label="Quitar foto"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 active:bg-slate-50"
        >
          <span className="text-2xl">📷</span>
          <span className="text-xs">Agregar</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
