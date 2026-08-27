"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { updateAvatar, removeAvatar } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

const AVATAR_SIZE = 256;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Recorta al centro en cuadrado y reescala a AVATAR_SIZE, exporta como JPEG. */
async function resizeToSquareDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUpload({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(image);
  const [loading, setLoading] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Elige un archivo de imagen");
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await resizeToSquareDataUrl(file);
      await updateAvatar({ dataUrl });
      setPreview(dataUrl);
      toast.success("Foto de perfil actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la foto");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    setLoading(true);
    try {
      await removeAvatar();
      setPreview(null);
    } catch {
      toast.error("No se pudo quitar la foto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-semibold text-primary-foreground",
            loading && "opacity-60"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            initials(name)
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          aria-label="Cambiar foto de perfil"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
      {preview && (
        <button
          type="button"
          onClick={onRemove}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Quitar foto
        </button>
      )}
    </div>
  );
}
