import "server-only";
import { db } from "./db";
import { parseInterests, type InterestId } from "./interests";

export type Group = {
  id: string;
  name: string;
  eventDate: string | null;
  budget: string | null;
  status: "open" | "drawn";
  /** How many people the organizer expects; null on groups created before this existed. */
  expectedCount: number | null;
};

export type Participant = {
  id: string;
  groupId: string;
  token: string;
  name: string;
  isAdmin: boolean;
  interests: InterestId[];
  likes: string;
  dislikes: string;
  sizes: string;
  avatarEmoji: string | null;
  avatarPhoto: string | null;
};

/** Public profile: what others in the group may see (never the token). */
export type Profile = Omit<Participant, "token" | "groupId">;

export function hasTastes(p: Pick<Participant, "interests" | "likes">) {
  return p.interests.length > 0 || p.likes.trim().length > 0;
}

type Row = Record<string, unknown>;

const toGroup = (r: Row): Group => ({
  id: String(r.id),
  name: String(r.name),
  eventDate: (r.event_date as string | null) ?? null,
  budget: (r.budget as string | null) ?? null,
  status: r.status === "drawn" ? "drawn" : "open",
  expectedCount: r.expected_count == null ? null : Number(r.expected_count),
});

const toParticipant = (r: Row): Participant => ({
  id: String(r.id),
  groupId: String(r.group_id),
  token: String(r.token),
  name: String(r.name),
  isAdmin: Number(r.is_admin) === 1,
  interests: parseInterests(r.interests),
  likes: String(r.likes ?? ""),
  dislikes: String(r.dislikes ?? ""),
  sizes: String(r.sizes ?? ""),
  avatarEmoji: (r.avatar_emoji as string | null) ?? null,
  avatarPhoto: (r.avatar_photo as string | null) ?? null,
});

const toProfile = (p: Participant): Profile => ({
  id: p.id,
  name: p.name,
  isAdmin: p.isAdmin,
  interests: p.interests,
  likes: p.likes,
  dislikes: p.dislikes,
  sizes: p.sizes,
  avatarEmoji: p.avatarEmoji,
  avatarPhoto: p.avatarPhoto,
});

export async function getGroup(id: string): Promise<Group | null> {
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT * FROM groups WHERE id = ?", args: [id] });
  return rows[0] ? toGroup(rows[0]) : null;
}

export async function getParticipantByToken(token: string): Promise<Participant | null> {
  if (!token || token.length < 16) return null;
  const c = await db();
  const { rows } = await c.execute({
    sql: "SELECT * FROM participants WHERE token = ?",
    args: [token],
  });
  return rows[0] ? toParticipant(rows[0]) : null;
}

/** What everyone in a group may see about each other: never tastes, never tokens. */
export type Member = {
  id: string;
  name: string;
  isAdmin: boolean;
  avatarEmoji: string | null;
  avatarPhoto: string | null;
  hasTastes: boolean;
};

export async function listMembers(groupId: string): Promise<Member[]> {
  const c = await db();
  // Select only public columns so other people's tastes never leave the database here.
  const { rows } = await c.execute({
    sql: `SELECT id, name, is_admin, avatar_emoji, avatar_photo,
            (interests <> '[]' OR trim(likes) <> '') AS has_tastes
          FROM participants WHERE group_id = ? ORDER BY created_at, rowid`,
    args: [groupId],
  });
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    isAdmin: Number(r.is_admin) === 1,
    avatarEmoji: (r.avatar_emoji as string | null) ?? null,
    avatarPhoto: (r.avatar_photo as string | null) ?? null,
    hasTastes: Number(r.has_tastes) === 1,
  }));
}

export type RecoveryRequest = { id: string; participantId: string; name: string };

/** Pending "I lost my link" requests, for the organizer to approve. */
export async function listRecoveryRequests(groupId: string): Promise<RecoveryRequest[]> {
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT r.id, r.participant_id, p.name FROM recovery_requests r
          JOIN participants p ON p.id = r.participant_id
          WHERE r.group_id = ? AND r.status = 'pending' ORDER BY r.created_at`,
    args: [groupId],
  });
  return rows.map((r) => ({
    id: String(r.id),
    participantId: String(r.participant_id),
    name: String(r.name),
  }));
}

export async function getRecoveryBySecret(groupId: string, secret: string) {
  if (!secret || secret.length < 16) return null;
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT r.status, p.name FROM recovery_requests r
          JOIN participants p ON p.id = r.participant_id
          WHERE r.group_id = ? AND r.secret = ?`,
    args: [groupId, secret],
  });
  return rows[0]
    ? { status: String(rows[0].status) as "pending" | "approved", name: String(rows[0].name) }
    : null;
}

export async function listExclusions(groupId: string): Promise<Array<[string, string]>> {
  const c = await db();
  const { rows } = await c.execute({
    sql: "SELECT a_id, b_id FROM exclusions WHERE group_id = ?",
    args: [groupId],
  });
  return rows.map((r) => [String(r.a_id), String(r.b_id)]);
}

/** Only ever returns the giver's own receiver. */
export async function getMyReceiver(giverId: string): Promise<Profile | null> {
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT p.* FROM assignments a JOIN participants p ON p.id = a.receiver_id
          WHERE a.giver_id = ?`,
    args: [giverId],
  });
  return rows[0] ? toProfile(toParticipant(rows[0])) : null;
}
