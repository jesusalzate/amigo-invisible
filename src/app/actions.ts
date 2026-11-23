"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { drawAssignments } from "@/lib/draw";
import { getGroup, getParticipantByToken, listExclusions, type Participant } from "@/lib/data";
import { parseInterests } from "@/lib/interests";
import { isValidAvatarEmoji, isValidAvatarPhoto } from "@/lib/avatars";

export type FormState = { error?: string; ok?: boolean; at?: number } | undefined;

const MIN_PEOPLE = 3;
const MAX_PEOPLE = 50;

function parseCount(form: FormData) {
  const n = Number(text(form, "expectedCount", 3));
  return Number.isInteger(n) ? n : NaN;
}

async function countParticipants(groupId: string) {
  const c = await db();
  const { rows } = await c.execute({
    sql: "SELECT count(*) AS n FROM participants WHERE group_id = ?",
    args: [groupId],
  });
  return Number(rows[0].n);
}

const MY_GROUPS_COOKIE = "ai_groups";
const id = (bytes = 9) => randomBytes(bytes).toString("base64url");

function text(form: FormData, key: string, max: number) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

async function rememberToken(token: string) {
  const jar = await cookies();
  let tokens: string[] = [];
  try {
    tokens = JSON.parse(jar.get(MY_GROUPS_COOKIE)?.value ?? "[]");
  } catch {}
  tokens = [token, ...tokens.filter((t) => t !== token)].slice(0, 20);
  jar.set(MY_GROUPS_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

async function requireMe(form: FormData): Promise<Participant> {
  const me = await getParticipantByToken(text(form, "token", 64));
  if (!me) throw new Error("Enlace no válido");
  return me;
}

async function requireAdmin(form: FormData) {
  const me = await requireMe(form);
  if (!me.isAdmin) throw new Error("Solo quien organiza el grupo puede hacer esto");
  const group = await getGroup(me.groupId);
  if (!group) throw new Error("El grupo ya no existe");
  return { me, group };
}

export async function createGroup(_: FormState, form: FormData): Promise<FormState> {
  const name = text(form, "name", 60);
  const organizer = text(form, "organizer", 40);
  const eventDate = text(form, "eventDate", 10) || null;
  const budget = text(form, "budget", 30) || null;
  if (!name) return { error: "Ponle un nombre al grupo." };
  if (!organizer) return { error: "Escribe tu nombre para que te reconozcan." };
  const expected = parseCount(form);
  if (!(expected >= MIN_PEOPLE && expected <= MAX_PEOPLE))
    return { error: `Indica cuántos sois, contándote a ti (entre ${MIN_PEOPLE} y ${MAX_PEOPLE}).` };

  const groupId = id(8);
  const token = id(18);
  const c = await db();
  await c.batch(
    [
      {
        sql: "INSERT INTO groups (id, name, event_date, budget, expected_count) VALUES (?, ?, ?, ?, ?)",
        args: [groupId, name, eventDate, budget, expected],
      },
      {
        sql: "INSERT INTO participants (id, group_id, token, name, is_admin) VALUES (?, ?, ?, ?, 1)",
        args: [id(), groupId, token, organizer],
      },
    ],
    "write",
  );
  await rememberToken(token);
  redirect(`/p/${token}?nuevo=1`);
}

export async function joinGroup(_: FormState, form: FormData): Promise<FormState> {
  const groupId = text(form, "groupId", 32);
  const name = text(form, "name", 40);
  const group = await getGroup(groupId);
  if (!group) return { error: "Este grupo no existe. Pide el enlace otra vez." };
  if (group.status === "drawn")
    return { error: "El sorteo ya se ha hecho. Pide a quien organiza que lo rehaga para entrar." };
  if (!name) return { error: "Escribe tu nombre." };
  if (group.expectedCount != null && (await countParticipants(groupId)) >= group.expectedCount)
    return {
      error: `El grupo ya está completo (${group.expectedCount} personas). Pide a quien organiza que amplíe el número.`,
    };

  const c = await db();
  const dup = await c.execute({
    sql: "SELECT 1 FROM participants WHERE group_id = ? AND lower(name) = lower(?)",
    args: [groupId, name],
  });
  if (dup.rows.length)
    return { error: `Ya hay alguien llamado “${name}”. Añade tu apellido o un apodo.` };

  const token = id(18);
  await c.execute({
    sql: "INSERT INTO participants (id, group_id, token, name) VALUES (?, ?, ?, ?)",
    args: [id(), groupId, token, name],
  });
  await rememberToken(token);
  redirect(`/p/${token}?nuevo=1`);
}

export async function saveTastes(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireMe(form);
  const interests = parseInterests(form.getAll("interests"));
  const c = await db();
  await c.execute({
    sql: `UPDATE participants SET interests = ?, likes = ?, dislikes = ?, sizes = ? WHERE id = ?`,
    args: [
      JSON.stringify(interests),
      text(form, "likes", 1000),
      text(form, "dislikes", 600),
      text(form, "sizes", 300),
      me.id,
    ],
  });
  refresh();
  return { ok: true, at: Date.now() };
}

export async function saveAvatar(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireMe(form);
  const kind = text(form, "kind", 10);
  let emoji: string | null = null;
  let photo: string | null = null;
  if (kind === "emoji") {
    emoji = text(form, "emoji", 32);
    if (!isValidAvatarEmoji(emoji)) return { error: "Elige uno de los iconos." };
  } else if (kind === "photo") {
    const v = form.get("photo");
    photo = typeof v === "string" ? v : "";
    if (!isValidAvatarPhoto(photo)) return { error: "No se pudo usar esa foto. Prueba con otra." };
  } else if (kind !== "none") {
    return { error: "Elige una foto o un icono." };
  }
  const c = await db();
  await c.execute({
    sql: "UPDATE participants SET avatar_emoji = ?, avatar_photo = ? WHERE id = ?",
    args: [emoji, photo, me.id],
  });
  refresh();
  return { ok: true, at: Date.now() };
}

export async function setExpectedCount(_: FormState, form: FormData): Promise<FormState> {
  const { group } = await requireAdmin(form);
  if (group.status === "drawn") return { error: "Rehaz el sorteo para cambiar el número de personas." };
  const expected = parseCount(form);
  const joined = await countParticipants(group.id);
  const min = Math.max(MIN_PEOPLE, joined);
  if (!(expected >= min && expected <= MAX_PEOPLE))
    return {
      error:
        joined > MIN_PEOPLE
          ? `Ya os habéis unido ${joined}: el número no puede ser menor.`
          : `Tiene que estar entre ${MIN_PEOPLE} y ${MAX_PEOPLE}.`,
    };
  const c = await db();
  await c.execute({
    sql: "UPDATE groups SET expected_count = ? WHERE id = ?",
    args: [expected, group.id],
  });
  refresh();
  return { ok: true, at: Date.now() };
}

export async function addExclusion(_: FormState, form: FormData): Promise<FormState> {
  const { group } = await requireAdmin(form);
  if (group.status === "drawn") return { error: "Rehaz el sorteo para cambiar las parejas." };
  const a = text(form, "a", 32);
  const b = text(form, "b", 32);
  if (!a || !b) return { error: "Elige a las dos personas." };
  if (a === b) return { error: "Elige dos personas distintas." };
  const [x, y] = [a, b].sort();
  const c = await db();
  const both = await c.execute({
    sql: "SELECT count(*) AS n FROM participants WHERE group_id = ? AND id IN (?, ?)",
    args: [group.id, x, y],
  });
  if (Number(both.rows[0].n) !== 2) return { error: "Esas personas no están en el grupo." };
  await c.execute({
    sql: "INSERT OR IGNORE INTO exclusions (group_id, a_id, b_id) VALUES (?, ?, ?)",
    args: [group.id, x, y],
  });
  refresh();
  return { ok: true, at: Date.now() };
}

export async function removeExclusion(form: FormData) {
  const { group } = await requireAdmin(form);
  if (group.status === "drawn") return;
  const c = await db();
  await c.execute({
    sql: "DELETE FROM exclusions WHERE group_id = ? AND a_id = ? AND b_id = ?",
    args: [group.id, text(form, "a", 32), text(form, "b", 32)],
  });
  refresh();
}

export async function removeParticipant(form: FormData) {
  const { me, group } = await requireAdmin(form);
  const target = text(form, "participantId", 32);
  if (group.status === "drawn" || target === me.id) return;
  const c = await db();
  await c.execute({
    sql: "DELETE FROM participants WHERE id = ? AND group_id = ?",
    args: [target, group.id],
  });
  refresh();
}

export async function runDraw(_: FormState, form: FormData): Promise<FormState> {
  const { group } = await requireAdmin(form);
  const c = await db();
  const { rows } = await c.execute({
    sql: "SELECT id FROM participants WHERE group_id = ?",
    args: [group.id],
  });
  const ids = rows.map((r) => String(r.id));
  if (ids.length < MIN_PEOPLE) return { error: "Hacen falta al menos 3 personas para el sorteo." };
  if (group.expectedCount != null && ids.length < group.expectedCount) {
    const missing = group.expectedCount - ids.length;
    return {
      error: `${missing === 1 ? "Falta 1 persona" : `Faltan ${missing} personas`} por unirse. El sorteo se podrá hacer cuando estéis los ${group.expectedCount}.`,
    };
  }

  const result = drawAssignments(ids, await listExclusions(group.id));
  if (!result)
    return {
      error: "Con estas parejas excluidas no hay forma de repartir. Quita alguna e inténtalo otra vez.",
    };

  await c.batch(
    [
      { sql: "DELETE FROM assignments WHERE group_id = ?", args: [group.id] },
      ...[...result].map(([giver, receiver]) => ({
        sql: "INSERT INTO assignments (group_id, giver_id, receiver_id) VALUES (?, ?, ?)",
        args: [group.id, giver, receiver],
      })),
      {
        sql: "UPDATE groups SET status = 'drawn', drawn_at = datetime('now') WHERE id = ?",
        args: [group.id],
      },
    ],
    "write",
  );
  refresh();
  return { ok: true, at: Date.now() };
}

export async function resetDraw(form: FormData) {
  const { group } = await requireAdmin(form);
  const c = await db();
  await c.batch(
    [
      { sql: "DELETE FROM assignments WHERE group_id = ?", args: [group.id] },
      { sql: "UPDATE groups SET status = 'open', drawn_at = NULL WHERE id = ?", args: [group.id] },
    ],
    "write",
  );
  refresh();
}

/* ---------- Lost link recovery ---------- */

const recoveryCookie = (groupId: string) => `ai_rec_${groupId}`;

export async function requestRecovery(_: FormState, form: FormData): Promise<FormState> {
  const groupId = text(form, "groupId", 32);
  const participantId = text(form, "participantId", 32);
  const group = await getGroup(groupId);
  if (!group) return { error: "Este grupo no existe." };
  if (!participantId) return { error: "Elige tu nombre." };

  const c = await db();
  const { rows } = await c.execute({
    sql: "SELECT is_admin FROM participants WHERE id = ? AND group_id = ?",
    args: [participantId, groupId],
  });
  if (!rows[0]) return { error: "Esa persona no está en el grupo." };
  if (Number(rows[0].is_admin) === 1)
    return {
      error:
        "Quien organiza no puede recuperar su enlace así. Búscalo en el historial del navegador o en “Tus grupos” del inicio.",
    };

  const secret = id(18);
  await c.batch(
    [
      { sql: "DELETE FROM recovery_requests WHERE participant_id = ?", args: [participantId] },
      {
        sql: "INSERT INTO recovery_requests (id, group_id, participant_id, secret) VALUES (?, ?, ?, ?)",
        args: [id(), groupId, participantId, secret],
      },
    ],
    "write",
  );
  (await cookies()).set(recoveryCookie(groupId), secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  refresh();
  return { ok: true, at: Date.now() };
}

/** Organizer approves: the person gets a brand-new token and the old link stops working. */
export async function approveRecovery(form: FormData) {
  const { group } = await requireAdmin(form);
  const requestId = text(form, "requestId", 32);
  const c = await db();
  const { rows } = await c.execute({
    sql: "SELECT participant_id FROM recovery_requests WHERE id = ? AND group_id = ? AND status = 'pending'",
    args: [requestId, group.id],
  });
  if (!rows[0]) return;
  const newToken = id(18);
  await c.batch(
    [
      { sql: "UPDATE participants SET token = ? WHERE id = ?", args: [newToken, String(rows[0].participant_id)] },
      {
        sql: "UPDATE recovery_requests SET status = 'approved', new_token = ? WHERE id = ?",
        args: [newToken, requestId],
      },
    ],
    "write",
  );
  refresh();
}

export async function rejectRecovery(form: FormData) {
  const { group } = await requireAdmin(form);
  const c = await db();
  await c.execute({
    sql: "DELETE FROM recovery_requests WHERE id = ? AND group_id = ?",
    args: [text(form, "requestId", 32), group.id],
  });
  refresh();
}

/** The requesting device swaps its secret for the new personal link. */
export async function claimRecovery(form: FormData) {
  const groupId = text(form, "groupId", 32);
  const jar = await cookies();
  const secret = jar.get(recoveryCookie(groupId))?.value ?? "";
  const c = await db();
  const { rows } = await c.execute({
    sql: "SELECT id, new_token FROM recovery_requests WHERE group_id = ? AND secret = ? AND status = 'approved'",
    args: [groupId, secret],
  });
  if (!rows[0]) return;
  const token = String(rows[0].new_token);
  await c.execute({ sql: "DELETE FROM recovery_requests WHERE id = ?", args: [String(rows[0].id)] });
  jar.delete(recoveryCookie(groupId));
  await rememberToken(token);
  redirect(`/p/${token}`);
}

export async function cancelRecovery(form: FormData) {
  const groupId = text(form, "groupId", 32);
  const jar = await cookies();
  const secret = jar.get(recoveryCookie(groupId))?.value ?? "";
  const c = await db();
  await c.execute({
    sql: "DELETE FROM recovery_requests WHERE group_id = ? AND secret = ?",
    args: [groupId, secret],
  });
  jar.delete(recoveryCookie(groupId));
  refresh();
}
