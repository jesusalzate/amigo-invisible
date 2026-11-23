import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { approveRecovery, rejectRecovery, removeExclusion, removeParticipant, resetDraw } from "@/app/actions";
import { DrawForm, ExclusionForm, ExpectedCountForm, TastesForm } from "@/components/forms";
import { Avatar } from "@/components/avatar";
import { AvatarPicker } from "@/components/avatar-picker";
import { ProfileView } from "@/components/profile";
import { GiftBox, Reveal } from "@/components/reveal";
import { CopyLink, ShareLink } from "@/components/ui";
import {
  getGroup,
  getMyReceiver,
  getParticipantByToken,
  hasTastes,
  listExclusions,
  listMembers,
  listRecoveryRequests,
  type Group,
  type Member,
  type Participant,
} from "@/lib/data";
import { groupMeta } from "@/lib/format";

export const metadata = { title: "Tu grupo" };

export default function ParticipantPage(props: PageProps<"/p/[token]">) {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-label2">Cargando…</p>}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const isNew = (await searchParams).nuevo === "1";
  const me = await getParticipantByToken(token);
  if (!me) notFound();
  const group = await getGroup(me.groupId);
  if (!group) notFound();

  const [people, receiver] = await Promise.all([
    listMembers(group.id),
    group.status === "drawn" ? getMyReceiver(me.id) : Promise.resolve(null),
  ]);
  const meta = groupMeta(group.eventDate, group.budget);
  const ready = people.filter((p) => p.hasTastes).length;

  return (
    <div className="space-y-10">
      <nav className="-mx-2 !mb-1">
        <Link href="/" className="btn btn-plain t-subhead">
          ‹ Tus grupos
        </Link>
      </nav>

      <header className="space-y-1">
        <h1 className="t-large-title break-words">{group.name}</h1>
        {meta && <p className="text-label2">{meta}</p>}
        <p className="t-subhead text-label2">Hola, {me.name}.</p>
      </header>

      {group.status === "drawn" && receiver ? (
        <section aria-labelledby="tu-amigo" className="space-y-3">
          <h2 id="tu-amigo" className="sr-only">
            Tu amigo invisible
          </h2>
          <Reveal
            storageKey={`ai-open-${group.id}-${me.id}`}
            name={receiver.name}
            avatar={
              <Avatar
                name={receiver.name}
                emoji={receiver.avatarEmoji}
                photo={receiver.avatarPhoto}
                size={72}
                className="mx-auto mb-2 ring-4 ring-[var(--gold)]"
              />
            }
          >
            <ProfileView profile={receiver} />
            <p className="section-footer">Es secreto: nadie más ve esta asignación, ni siquiera quien organiza.</p>
          </Reveal>
        </section>
      ) : (
        <StatusCard group={group} joined={people.length} ready={ready} isAdmin={me.isAdmin} />
      )}

      {me.isAdmin && <AdminPanel me={me} group={group} people={people} />}

      <section aria-labelledby="tus-gustos">
        <h2 id="tus-gustos" className="t-title2 mb-1 px-1">
          Sobre ti
        </h2>
        <p className="t-subhead mb-4 px-1 text-label2">
          {isNew && !hasTastes(me)
            ? "Cuenta qué te gusta para que quien te toque acierte."
            : "Puedes cambiarlos cuando quieras, también después del sorteo."}
        </p>
        <div className="mb-6">
          <AvatarPicker token={me.token} name={me.name} emoji={me.avatarEmoji} photo={me.avatarPhoto} />
        </div>
        <TastesForm
          token={me.token}
          initial={{ interests: me.interests, likes: me.likes, dislikes: me.dislikes, sizes: me.sizes }}
        />
      </section>

      <section aria-labelledby="personas">
        <h2 id="personas" className="section-header">
          En el grupo ({people.length}
          {group.expectedCount != null ? ` de ${group.expectedCount}` : ""})
        </h2>
        <ul className="list">
          {people.map((p) => (
            <li key={p.id} className="row">
              <Avatar name={p.name} emoji={p.avatarEmoji} photo={p.avatarPhoto} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {p.name}
                  {p.id === me.id && <span className="text-label2"> (tú)</span>}
                </span>
                <span className="t-footnote block text-label2">
                  {p.isAdmin ? "Organiza · " : ""}
                  {p.hasTastes ? "Gustos listos" : "Sin gustos todavía"}
                </span>
              </span>
              {p.hasTastes && (
                <span aria-hidden className="text-success">
                  ✓
                </span>
              )}
            </li>
          ))}
          {group.expectedCount != null && people.length < group.expectedCount && (
            <li className="row">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--label3)] text-label3"
              >
                ?
              </span>
              <span className="text-label2">
                {group.expectedCount - people.length === 1
                  ? "Falta 1 persona por unirse"
                  : `Faltan ${group.expectedCount - people.length} personas por unirse`}
              </span>
            </li>
          )}
        </ul>
      </section>

      <section aria-labelledby="tu-enlace">
        <h2 id="tu-enlace" className="section-header">
          Tu enlace personal
        </h2>
        <div className="list">
          <div className="row justify-between">
            <span className="t-subhead text-label2">Es tu llave para volver. No lo compartas.</span>
            <CopyLink url={`/p/${me.token}`} label="Copiar" />
          </div>
        </div>
        <p className="section-footer">
          Guárdalo en tus notas o en favoritos. En este dispositivo también lo encontrarás en el inicio.
        </p>
      </section>
    </div>
  );
}

function StatusCard({
  group,
  joined,
  ready,
  isAdmin,
}: {
  group: Group;
  joined: number;
  ready: number;
  isAdmin: boolean;
}) {
  return (
    <section aria-label="Estado del sorteo">
      <GiftBox
        tag={
          <div className="gift-tag max-w-72 px-6 pb-5 pt-7 text-center">
            <p className="t-headline">
              {group.status === "drawn" ? "El sorteo está hecho" : "Aún no hay sorteo"}
            </p>
            <p className="t-subhead mt-1 opacity-80">
              {isAdmin
                ? "Cuando estéis todos, haz el sorteo desde Organizar."
                : "Cuando estéis todos, quien organiza hará el sorteo."}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <span className="t-footnote rounded-full bg-[var(--accent-deep)] px-3 py-1 font-semibold text-white">
                {joined}
                {group.expectedCount != null ? ` de ${group.expectedCount}` : ""} unidos
              </span>
              <span className="t-footnote rounded-full bg-[var(--pine)] px-3 py-1 font-semibold text-white">
                {ready} con gustos
              </span>
            </div>
          </div>
        }
      />
    </section>
  );
}

function AdminPanel({ me, group, people }: { me: Participant; group: Group; people: Member[] }) {
  const drawn = group.status === "drawn";
  return (
    <section aria-labelledby="organizar" className="space-y-6">
      <h2 id="organizar" className="t-title2 px-1">
        Organizar
      </h2>

      <Suspense fallback={null}>
        <RecoveryRequests me={me} group={group} />
      </Suspense>

      {!drawn && (
        <div>
          <ShareLink
            url={`/unirse/${group.id}`}
            title={group.name}
            text={`Únete al amigo invisible “${group.name}”`}
            label="Invitar amigos"
            variant="gray"
          />
          <p className="section-footer">
            Envía el enlace por WhatsApp o donde queráis. Cada persona entra con su nombre.
          </p>
        </div>
      )}

      {!drawn && <ExpectedCountForm token={me.token} expected={group.expectedCount} joined={people.length} />}

      {!drawn && people.length > 1 && (
        <div>
          <h3 className="section-header">Quitar a alguien</h3>
          <ul className="list">
            {people
              .filter((p) => p.id !== me.id)
              .map((p) => (
                <li key={p.id} className="row">
                  <Avatar name={p.name} emoji={p.avatarEmoji} photo={p.avatarPhoto} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <form action={removeParticipant}>
                    <input type="hidden" name="token" value={me.token} />
                    <input type="hidden" name="participantId" value={p.id} />
                    <button className="btn btn-plain t-subhead" aria-label={`Quitar a ${p.name}`}>
                      Quitar
                    </button>
                  </form>
                </li>
              ))}
          </ul>
        </div>
      )}

      {!drawn && people.length >= 2 && (
        <Suspense fallback={null}>
          <Exclusions me={me} group={group} people={people} />
        </Suspense>
      )}

      {drawn ? (
        <div>
          <form action={resetDraw}>
            <input type="hidden" name="token" value={me.token} />
            <button className="btn btn-gray">Rehacer el sorteo</button>
          </form>
          <p className="section-footer">
            Borra las asignaciones actuales y reabre el grupo para que entre más gente. Avisa a todos
            antes: lo que vieron dejará de valer.
          </p>
        </div>
      ) : (
        <DrawForm
          token={me.token}
          count={people.length}
          expected={group.expectedCount}
          missing={people.filter((p) => !p.hasTastes).length}
        />
      )}
    </section>
  );
}

async function RecoveryRequests({ me, group }: { me: Participant; group: Group }) {
  const requests = await listRecoveryRequests(group.id);
  if (requests.length === 0) return null;
  return (
    <div>
      <h3 className="section-header">Piden un enlace nuevo</h3>
      <ul className="list">
        {requests.map((r) => (
          <li key={r.id} className="row flex-wrap">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.name}</span>
              <span className="t-footnote block text-label2">Dice que ha perdido su enlace</span>
            </span>
            <form action={rejectRecovery}>
              <input type="hidden" name="token" value={me.token} />
              <input type="hidden" name="requestId" value={r.id} />
              <button className="btn btn-plain t-subhead">Rechazar</button>
            </form>
            <form action={approveRecovery}>
              <input type="hidden" name="token" value={me.token} />
              <input type="hidden" name="requestId" value={r.id} />
              <button className="btn btn-primary !min-h-11 !w-auto !px-4 t-subhead">Aprobar</button>
            </form>
          </li>
        ))}
      </ul>
      <p className="section-footer">
        Aprueba solo si esa persona te lo ha pedido. Su enlace anterior dejará de funcionar y el nuevo
        solo se abrirá en el móvil desde el que lo pidió. Tú no verás a quién le ha tocado.
      </p>
    </div>
  );
}

async function Exclusions({ me, group, people }: { me: Participant; group: Group; people: Member[] }) {
  const pairs = await listExclusions(group.id);
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "?";
  return (
    <div className="space-y-3">
      <h3 className="section-header !pb-0">Parejas que no se pueden tocar</h3>
      {pairs.length > 0 && (
        <ul className="list">
          {pairs.map(([a, b]) => (
            <li key={`${a}-${b}`} className="row justify-between">
              <span className="truncate">
                {name(a)} y {name(b)}
              </span>
              <form action={removeExclusion}>
                <input type="hidden" name="token" value={me.token} />
                <input type="hidden" name="a" value={a} />
                <input type="hidden" name="b" value={b} />
                <button className="btn btn-plain t-subhead" aria-label={`Quitar la regla entre ${name(a)} y ${name(b)}`}>
                  Quitar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <ExclusionForm token={me.token} people={people.map((p) => ({ id: p.id, name: p.name }))} />
      <p className="section-footer !pt-0">Por ejemplo, parejas o personas que viven juntas.</p>
    </div>
  );
}
