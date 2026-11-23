/** A person's photo, chosen icon, or initials as a fallback. Decorative: the name is always shown next to it. */
export function Avatar({
  name,
  emoji,
  photo,
  size = 32,
  className = "",
}: {
  name: string;
  emoji?: string | null;
  photo?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: size * 0.55 };
  const base = `flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`;

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small inline data URL
      <img src={photo} alt="" aria-hidden style={style} className={`${base} object-cover`} />
    );
  }
  if (emoji) {
    return (
      <span aria-hidden style={style} className={`${base} bg-fill leading-none`}>
        {emoji}
      </span>
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: size * 0.4 }}
      className={`${base} bg-accent-soft font-semibold text-accent-text`}
    >
      {initials}
    </span>
  );
}
