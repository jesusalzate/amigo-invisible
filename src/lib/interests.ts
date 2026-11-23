export const INTERESTS = [
  { id: "libros", label: "Libros", emoji: "📚" },
  { id: "musica", label: "Música", emoji: "🎧" },
  { id: "cine", label: "Cine y series", emoji: "🎬" },
  { id: "cafe", label: "Café y té", emoji: "☕️" },
  { id: "cocina", label: "Cocina", emoji: "🍳" },
  { id: "vino", label: "Vino y cerveza", emoji: "🍷" },
  { id: "dulces", label: "Dulces", emoji: "🍫" },
  { id: "deporte", label: "Deporte", emoji: "🏃" },
  { id: "montana", label: "Naturaleza", emoji: "⛰️" },
  { id: "viajes", label: "Viajes", emoji: "✈️" },
  { id: "tecnologia", label: "Tecnología", emoji: "💻" },
  { id: "videojuegos", label: "Videojuegos", emoji: "🎮" },
  { id: "juegos", label: "Juegos de mesa", emoji: "🎲" },
  { id: "moda", label: "Moda", emoji: "👕" },
  { id: "cuidado", label: "Cuidado personal", emoji: "🧴" },
  { id: "plantas", label: "Plantas", emoji: "🪴" },
  { id: "arte", label: "Arte y manualidades", emoji: "🎨" },
  { id: "fotografia", label: "Fotografía", emoji: "📷" },
  { id: "mascotas", label: "Mascotas", emoji: "🐾" },
  { id: "experiencias", label: "Experiencias", emoji: "🎟️" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

const VALID = new Set<string>(INTERESTS.map((i) => i.id));

export function parseInterests(raw: unknown): InterestId[] {
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr)
      ? (arr.filter((x) => typeof x === "string" && VALID.has(x)) as InterestId[])
      : [];
  } catch {
    return [];
  }
}

export function interestById(id: string) {
  return INTERESTS.find((i) => i.id === id);
}
