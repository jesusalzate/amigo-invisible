import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cancelRecovery, claimRecovery } from "@/app/actions";
import { RecoveryForm } from "@/components/forms";
import { SubmitButton } from "@/components/ui";
import { getGroup, getRecoveryBySecret, listMembers } from "@/lib/data";

export const metadata = { title: "Recuperar tu enlace" };

export default function RecoverPage({ params }: PageProps<"/unirse/[groupId]/recuperar">) {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-label2">Cargando…</p>}>
      <Recover params={params} />
    </Suspense>
  );
}

async function Recover({ params }: { params: PageProps<"/unirse/[groupId]/recuperar">["params"] }) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) notFound();

  const secret = (await cookies()).get(`ai_rec_${groupId}`)?.value ?? "";
  const request = await getRecoveryBySecret(groupId, secret);
  const members = await listMembers(groupId);
  const organizer = members.find((m) => m.isAdmin)?.name ?? "quien organiza";

  return (
    <div className="space-y-8">
      <header className="space-y-2 pt-2 text-center">
        <p className="t-subhead font-semibold text-gold-text">{group.name}</p>
        <h1 className="t-large-title">Recupera tu enlace</h1>
      </header>

      {request?.status === "approved" ? (
        <section className="space-y-4">
          <div className="list">
            <p className="row">
              {organizer} ha aprobado tu solicitud, {request.name}. Ya puedes entrar con tu enlace nuevo.
            </p>
          </div>
          <form action={claimRecovery}>
            <input type="hidden" name="groupId" value={groupId} />
            <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
          </form>
          <p className="section-footer">Guárdalo bien esta vez: el enlace anterior ya no funciona.</p>
        </section>
      ) : request?.status === "pending" ? (
        <section className="space-y-4">
          <div className="list">
            <p className="row">
              Solicitud enviada como {request.name}. Avisa a {organizer} para que la apruebe desde su
              página del grupo.
            </p>
          </div>
          <Link href={`/unirse/${groupId}/recuperar`} className="btn btn-primary">
            Comprobar si ya está aprobada
          </Link>
          <form action={cancelRecovery} className="text-center">
            <input type="hidden" name="groupId" value={groupId} />
            <button className="btn btn-plain t-subhead">Cancelar solicitud</button>
          </form>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="px-1 text-label2">
            Si ya estabas en el grupo y has perdido tu enlace personal, elige tu nombre. {organizer}{" "}
            tendrá que aprobarlo y después podrás entrar desde este mismo móvil.
          </p>
          <RecoveryForm
            groupId={groupId}
            people={members.filter((m) => !m.isAdmin).map((m) => ({ id: m.id, name: m.name }))}
          />
          <p className="section-footer">
            Por seguridad, tu enlace anterior dejará de funcionar. Nadie, ni siquiera quien organiza, verá
            a quién te ha tocado.
          </p>
        </section>
      )}

      <div className="text-center">
        <Link href={`/unirse/${groupId}`} className="btn btn-plain t-subhead">
          ‹ Volver
        </Link>
      </div>
    </div>
  );
}
