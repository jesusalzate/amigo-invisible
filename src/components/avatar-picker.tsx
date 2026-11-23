"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { saveAvatar, type FormState } from "@/app/actions";
import { AVATAR_EMOJIS } from "@/lib/avatars";
import { Avatar } from "./avatar";
import { SavedNote } from "./ui";

/** Center-crops and shrinks a photo to a 256px JPEG so it stays small. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    256,
    256,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AvatarPicker({
  token,
  name,
  emoji,
  photo,
}: {
  token: string;
  name: string;
  emoji: string | null;
  photo: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveAvatar, undefined);
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  function submit(fields: Record<string, string>) {
    const fd = new FormData();
    fd.set("token", token);
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    startTransition(() => action(fd));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLocalError(undefined);
    try {
      submit({ kind: "photo", photo: await toAvatarDataUrl(file) });
    } catch {
      setLocalError("No se pudo leer esa imagen. Prueba con otra.");
    }
  }

  const error = localError ?? state?.error;

  return (
    <section aria-labelledby="tu-avatar">
      <h3 id="tu-avatar" className="section-header">
        Tu foto o icono
      </h3>
      <div className="list">
        <div className="row gap-4 !py-4">
          <Avatar name={name} emoji={emoji} photo={photo} size={64} className={pending ? "opacity-50" : ""} />
          <div className="flex flex-1 flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary !min-h-11 !w-auto !px-4 t-subhead"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
            >
              {photo ? "Cambiar foto" : "Subir foto"}
            </button>
            {(photo || emoji) && (
              <button
                type="button"
                className="btn btn-plain t-subhead"
                onClick={() => submit({ kind: "none" })}
                disabled={pending}
              >
                Quitar
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={onFile}
          />
        </div>
        <div className="row !block !pb-4">
          <p className="t-subhead mb-2 text-label2">O elige un icono</p>
          <div role="radiogroup" aria-label="Iconos" className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {AVATAR_EMOJIS.map((e) => {
              const selected = !photo && emoji === e;
              return (
                <button
                  key={e}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Icono ${e}`}
                  disabled={pending}
                  onClick={() => submit({ kind: "emoji", emoji: e })}
                  className={`focus-ring flex aspect-square min-h-11 items-center justify-center rounded-full text-2xl transition-transform active:scale-90 ${
                    selected ? "bg-accent shadow-[0_0_0_3px_var(--gold)]" : "bg-fill"
                  }`}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {error ? (
        <p role="alert" className="section-footer !text-accent-text">
          {error}
        </p>
      ) : (
        <SavedNote at={state?.at} label="Guardado" />
      )}
      <p className="section-footer !pt-0">La verán las personas de tu grupo.</p>
    </section>
  );
}
