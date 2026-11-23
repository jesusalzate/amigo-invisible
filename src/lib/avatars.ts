export const AVATAR_EMOJIS = [
  "🎅", "🤶", "🧝", "⛄️", "🦌", "🐧", "🐻‍❄️", "🦊",
  "🎄", "🎁", "⭐️", "🔔", "🍪", "☕️", "🧦", "❄️",
  "🐱", "🐶", "🦉", "🐸", "🦄", "🐼", "🌟", "🎸",
] as const;

const VALID = new Set<string>(AVATAR_EMOJIS);

export function isValidAvatarEmoji(v: string) {
  return VALID.has(v);
}

/** ~300 KB of base64 is plenty for a 256px JPEG. */
export const MAX_PHOTO_LENGTH = 300_000;

export function isValidAvatarPhoto(v: string) {
  return (
    v.length <= MAX_PHOTO_LENGTH && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)
  );
}
