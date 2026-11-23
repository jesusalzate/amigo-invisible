"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
  variant?: "primary" | "gray";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`btn btn-${variant} ${className}`}
    >
      {pending ? (pendingLabel ?? "Un momento…") : children}
    </button>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="section-footer !text-accent-text">
      {error}
    </p>
  );
}

/** Briefly shows a confirmation after a successful save. */
export function SavedNote({ at, label = "Guardado" }: { at?: number; label?: string }) {
  const [hiddenAt, setHiddenAt] = useState<number | undefined>();
  useEffect(() => {
    if (!at) return;
    const t = setTimeout(() => setHiddenAt(at), 2500);
    return () => clearTimeout(t);
  }, [at]);
  const visible = !!at && hiddenAt !== at;
  return (
    <p aria-live="polite" className="section-footer h-6 text-center !text-success">
      {visible ? `✓ ${label}` : ""}
    </p>
  );
}

export function ShareLink({
  url,
  title,
  text,
  label,
  variant = "primary",
}: {
  url: string;
  title: string;
  text: string;
  label: string;
  variant?: "primary" | "gray";
}) {
  const [copied, setCopied] = useState(false);
  const fullUrl = () => new URL(url, window.location.origin).toString();

  async function share() {
    const href = fullUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: href });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} className={`btn btn-${variant}`}>
      <span aria-live="polite">{copied ? "Enlace copiado" : label}</span>
    </button>
  );
}

export function CopyLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-plain t-subhead"
      onClick={async () => {
        await navigator.clipboard.writeText(new URL(url, window.location.origin).toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <span aria-live="polite">{copied ? "Copiado" : label}</span>
    </button>
  );
}
