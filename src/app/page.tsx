import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { CreateGroupForm } from "@/components/forms";
import { getGroup, getParticipantByToken } from "@/lib/data";
import { groupMeta } from "@/lib/format";

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="space-y-3 pt-2 text-center">
        <h1 className="t-large-title !text-[3rem]">Amigo invisible</h1>
        <p className="mx-auto max-w-sm text-label2">
          Crea un grupo, comparte el enlace y que cada uno cuente qué le gusta. Así acertarás con
          quien te toque.
        </p>
      </header>

      <Suspense fallback={null}>
        <MyGroups />
      </Suspense>

      <section aria-labelledby="crear">
        <h2 id="crear" className="t-title2 mb-4 px-1">
          Nuevo grupo
        </h2>
        <CreateGroupForm />
      </section>
    </div>
  );
}

async function MyGroups() {
  const jar = await cookies();
  let tokens: string[] = [];
  try {
    tokens = JSON.parse(jar.get("ai_groups")?.value ?? "[]");
  } catch {}
  if (!Array.isArray(tokens) || tokens.length === 0) return null;

  const items = (
    await Promise.all(
      tokens.slice(0, 10).map(async (token) => {
        const me = await getParticipantByToken(String(token));
        if (!me) return null;
        const group = await getGroup(me.groupId);
        return group ? { token: me.token, me, group } : null;
      }),
    )
  ).filter((x) => x !== null);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="mis-grupos">
      <h2 id="mis-grupos" className="section-header">
        Tus grupos
      </h2>
      <ul className="list">
        {items.map(({ token, me, group }) => (
          <li key={token} className="row !p-0">
            <Link
              href={`/p/${token}`}
              className="focus-ring flex min-h-11 w-full items-center gap-3 px-4 py-2.5 active:bg-[var(--card-pressed)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{group.name}</span>
                <span className="t-footnote block text-label2">
                  Como {me.name} ·{" "}
                  {group.status === "drawn" ? "Sorteo hecho" : "Esperando el sorteo"}
                  {groupMeta(group.eventDate, null) && ` · ${groupMeta(group.eventDate, null)}`}
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chevron() {
  return (
    <svg aria-hidden width="8" height="14" viewBox="0 0 8 14" className="shrink-0 text-label3">
      <path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
