export function formatEventDate(date: string | null) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function groupMeta(eventDate: string | null, budget: string | null) {
  const parts = [formatEventDate(eventDate), budget ? `Presupuesto: ${budget}` : null];
  return parts.filter(Boolean).join(" · ");
}
