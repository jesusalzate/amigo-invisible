"use client";

import { useActionState } from "react";
import {
  addExclusion,
  createGroup,
  joinGroup,
  runDraw,
  requestRecovery,
  saveTastes,
  setExpectedCount,
  type FormState,
} from "@/app/actions";
import { INTERESTS, type InterestId } from "@/lib/interests";
import { FormError, SavedNote, SubmitButton } from "./ui";

export function CreateGroupForm() {
  const [state, action] = useActionState<FormState, FormData>(createGroup, undefined);
  return (
    <form action={action} className="space-y-6">
      <section>
        <h2 className="section-header">El grupo</h2>
        <div className="list">
          <label className="row">
            <span className="w-28 shrink-0">Nombre</span>
            <input
              name="name"
              required
              maxLength={60}
              placeholder="Navidad con los amigos"
              className="field"
              autoComplete="off"
            />
          </label>
          <label className="row">
            <span className="w-28 shrink-0">Fecha</span>
            <input name="eventDate" type="date" className="field focus-ring" />
          </label>
          <label className="row">
            <span className="w-28 shrink-0">Presupuesto</span>
            <input
              name="budget"
              maxLength={30}
              placeholder="20 €"
              className="field"
              autoComplete="off"
            />
          </label>
          <label className="row">
            <span className="w-28 shrink-0">Personas</span>
            <input
              name="expectedCount"
              type="number"
              inputMode="numeric"
              required
              min={3}
              max={50}
              placeholder="Contándote a ti"
              className="field focus-ring"
            />
          </label>
        </div>
        <p className="section-footer">
          El sorteo se podrá hacer cuando se hayan unido todas. La fecha y el presupuesto son opcionales.
        </p>
      </section>

      <section>
        <h2 className="section-header">Tú</h2>
        <div className="list">
          <label className="row">
            <span className="w-28 shrink-0">Tu nombre</span>
            <input
              name="organizer"
              required
              maxLength={40}
              placeholder="Como te conocen"
              className="field"
              autoComplete="given-name"
            />
          </label>
        </div>
        <p className="section-footer">Organizas el grupo y también participas en el sorteo.</p>
        <FormError error={state?.error} />
      </section>

      <SubmitButton pendingLabel="Creando…">Crear grupo</SubmitButton>
    </form>
  );
}

export function JoinForm({ groupId }: { groupId: string }) {
  const [state, action] = useActionState<FormState, FormData>(joinGroup, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="groupId" value={groupId} />
      <section>
        <div className="list">
          <label className="row">
            <span className="w-28 shrink-0">Tu nombre</span>
            <input
              name="name"
              required
              maxLength={40}
              placeholder="Como te conocen"
              className="field"
              autoComplete="given-name"
              autoFocus
            />
          </label>
        </div>
        <p className="section-footer">Sin cuentas ni contraseñas: entras con un enlace personal.</p>
        <FormError error={state?.error} />
      </section>
      <SubmitButton pendingLabel="Entrando…">Unirme al grupo</SubmitButton>
    </form>
  );
}

export function TastesForm({
  token,
  initial,
}: {
  token: string;
  initial: { interests: InterestId[]; likes: string; dislikes: string; sizes: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveTastes, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />

      <fieldset>
        <legend className="section-header">Te interesa</legend>
        <div className="flex flex-wrap gap-2 px-1">
          {INTERESTS.map((i) => (
            <label key={i.id} className="chip">
              <input
                type="checkbox"
                name="interests"
                value={i.id}
                defaultChecked={initial.interests.includes(i.id)}
                className="sr-only"
              />
              <span aria-hidden>{i.emoji}</span>
              {i.label}
            </label>
          ))}
        </div>
        <p className="section-footer">Marca todo lo que te guste. Son pistas, no una lista de la compra.</p>
      </fieldset>

      <TextSection
        name="likes"
        label="Cosas que te encantan"
        placeholder="Grupos de música, autores, tu equipo, ese olor a café recién hecho…"
        defaultValue={initial.likes}
        rows={4}
        max={1000}
      />
      <TextSection
        name="dislikes"
        label="Mejor no te regalen…"
        placeholder="Velas aromáticas, tazas, cosas de plástico…"
        defaultValue={initial.dislikes}
        rows={2}
        max={600}
      />
      <TextSection
        name="sizes"
        label="Tallas y datos útiles"
        placeholder="Camiseta M, pie 42, alérgico a los frutos secos…"
        defaultValue={initial.sizes}
        rows={2}
        max={300}
        footer="Opcional. Solo lo verá quien te regale."
      />

      <div>
        <SubmitButton pendingLabel="Guardando…">Guardar gustos</SubmitButton>
        <SavedNote at={state?.at} label="Gustos guardados" />
      </div>
    </form>
  );
}

function TextSection({
  name,
  label,
  placeholder,
  defaultValue,
  rows,
  max,
  footer,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  rows: number;
  max: number;
  footer?: string;
}) {
  const id = `f-${name}`;
  return (
    <section>
      <label htmlFor={id} className="section-header block">
        {label}
      </label>
      <div className="list">
        <div className="row">
          <textarea
            id={id}
            name={name}
            rows={rows}
            maxLength={max}
            placeholder={placeholder}
            defaultValue={defaultValue}
            className="field"
          />
        </div>
      </div>
      {footer && <p className="section-footer">{footer}</p>}
    </section>
  );
}

export function ExclusionForm({
  token,
  people,
}: {
  token: string;
  people: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState<FormState, FormData>(addExclusion, undefined);
  return (
    <form action={action} className="list">
      <input type="hidden" name="token" value={token} />
      <label className="row">
        <span className="w-16 shrink-0">Entre</span>
        <PersonSelect name="a" people={people} />
      </label>
      <label className="row">
        <span className="w-16 shrink-0">y</span>
        <PersonSelect name="b" people={people} />
      </label>
      <div className="row">
        <SubmitButton variant="gray" pendingLabel="Añadiendo…">
          Que no se toquen
        </SubmitButton>
      </div>
      {state?.error && (
        <div className="row">
          <p role="alert" className="t-footnote text-accent-text">
            {state.error}
          </p>
        </div>
      )}
    </form>
  );
}

function PersonSelect({ name, people }: { name: string; people: Array<{ id: string; name: string }> }) {
  return (
    <select name={name} required defaultValue="" className="field focus-ring min-h-11 cursor-pointer">
      <option value="" disabled>
        Elige a alguien
      </option>
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export function ExpectedCountForm({
  token,
  expected,
  joined,
}: {
  token: string;
  expected: number | null;
  joined: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(setExpectedCount, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <div className="list">
        <label className="row">
          <span className="flex-1">Personas en el grupo</span>
          <input
            name="expectedCount"
            type="number"
            inputMode="numeric"
            required
            min={Math.max(3, joined)}
            max={50}
            defaultValue={expected ?? joined}
            className="field focus-ring !w-16 text-right"
          />
          <SubmitButton variant="gray" pendingLabel="…" className="!min-h-9 !w-auto !px-4 t-subhead">
            Guardar
          </SubmitButton>
        </label>
      </div>
      {state?.error ? (
        <FormError error={state.error} />
      ) : (
        <p className="section-footer">
          Se han unido {joined}
          {expected != null ? ` de ${expected}` : ""}. Si alguien se suma, aumenta el número.
        </p>
      )}
    </form>
  );
}

export function DrawForm({
  token,
  count,
  expected,
  missing,
}: {
  token: string;
  count: number;
  expected: number | null;
  missing: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(runDraw, undefined);
  const pendingPeople = expected != null ? Math.max(0, expected - count) : 0;
  const notEnough = count < 3 || pendingPeople > 0;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          missing > 0 &&
          !confirm(
            `${missing === 1 ? "Una persona aún no ha" : `${missing} personas aún no han`} puesto sus gustos. Podrán hacerlo después del sorteo. ¿Hacer el sorteo ya?`,
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="token" value={token} />
      <SubmitButton pendingLabel="Sorteando…" disabled={notEnough}>
        Hacer el sorteo
      </SubmitButton>
      <FormError error={state?.error} />
      {notEnough && (
        <p className="section-footer">
          {pendingPeople > 0
            ? `${pendingPeople === 1 ? "Falta 1 persona" : `Faltan ${pendingPeople} personas`} por unirse (${count} de ${expected}). El sorteo se activará cuando estéis todos.`
            : `Hacen falta al menos 3 personas. ${count === 1 ? "De momento solo estás tú." : `Ahora sois ${count}.`}`}
        </p>
      )}
    </form>
  );
}

export function RecoveryForm({
  groupId,
  people,
}: {
  groupId: string;
  people: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState<FormState, FormData>(requestRecovery, undefined);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="groupId" value={groupId} />
      <section>
        <div className="list">
          <label className="row">
            <span className="w-24 shrink-0">Soy</span>
            <PersonSelect name="participantId" people={people} />
          </label>
        </div>
        <FormError error={state?.error} />
      </section>
      <SubmitButton pendingLabel="Enviando…">Pedir enlace nuevo</SubmitButton>
    </form>
  );
}
