import { Suspense } from "react";
import Link from "next/link";
import { JoinForm } from "@/components/forms";
import { getGroup } from "@/lib/data";
import { groupMeta } from "@/lib/format";

export const metadata = { title: "Únete" };

export default function JoinPage({ params }: PageProps<"/unirse/[groupId]">) {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-label2">Cargando…</p>}>
      <Join params={params} />
    </Suspense>
  );
}

async function Join({ params }: { params: PageProps<"/unirse/[groupId]">["params"] }) {
  const { groupId } = await params;
  const group = await getGroup(groupId);

  if (!group) {
    return (
      <div className="space-y-4 pt-10 text-center">
        <h1 className="t-title2">Este grupo no existe</h1>
        <p className="text-label2">Puede que el enlace esté incompleto. Pide que te lo envíen otra vez.</p>
        <Link href="/" className="btn btn-plain">
          Ir al inicio
        </Link>
      </div>
    );
  }

  const meta = groupMeta(group.eventDate, group.budget);

  return (
    <div className="space-y-8">
      <header className="space-y-2 pt-2 text-center">
        <p className="t-subhead font-semibold text-gold-text">✦ Te han invitado al amigo invisible ✦</p>
        <h1 className="t-large-title break-words">{group.name}</h1>
        {meta && <p className="text-label2">{meta}</p>}
      </header>
      {group.status === "drawn" ? (
        <div className="list">
          <p className="row text-label2">
            El sorteo ya se ha hecho. Si quieres participar, pide a quien organiza que lo rehaga.
          </p>
        </div>
      ) : (
        <JoinForm groupId={group.id} />
      )}
      <div className="text-center">
        <Link href={`/unirse/${group.id}/recuperar`} className="btn btn-plain t-subhead">
          ¿Ya estabas en el grupo? Recupera tu enlace
        </Link>
      </div>
    </div>
  );
}
