import "server-only";
import { createClient, type Client } from "@libsql/client";

// Local: a SQLite file in the project. Production: a Turso URL + token.
const url = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const globalForDb = globalThis as unknown as {
  __db?: Client;
  __dbReady?: Promise<void>;
};

const client = globalForDb.__db ?? createClient({ url, authToken });
globalForDb.__db = client;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    event_date TEXT,
    budget TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    drawn_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    interests TEXT NOT NULL DEFAULT '[]',
    likes TEXT NOT NULL DEFAULT '',
    dislikes TEXT NOT NULL DEFAULT '',
    sizes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS participants_group ON participants(group_id)`,
  `CREATE TABLE IF NOT EXISTS exclusions (
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    a_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    b_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    PRIMARY KEY (a_id, b_id)
  )`,
  `CREATE TABLE IF NOT EXISTS assignments (
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    giver_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    PRIMARY KEY (giver_id)
  )`,
  // "I lost my link": the requester's device keeps `secret`; once the organizer
  // approves, the participant gets a fresh token that only that device can claim.
  `CREATE TABLE IF NOT EXISTS recovery_requests (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL UNIQUE REFERENCES participants(id) ON DELETE CASCADE,
    secret TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    new_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

/** Tiny forward-only migration: add columns that older databases lack. */
async function addColumns(table: string, columns: Record<string, string>) {
  const { rows } = await client.execute(`PRAGMA table_info(${table})`);
  const existing = new Set(rows.map((r) => String(r.name)));
  for (const [name, type] of Object.entries(columns)) {
    if (!existing.has(name)) await client.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
  }
}

export async function db(): Promise<Client> {
  if (!globalForDb.__dbReady) {
    globalForDb.__dbReady = (async () => {
      await client.execute("PRAGMA foreign_keys = ON");
      await client.batch(SCHEMA, "write");
      await addColumns("groups", { expected_count: "INTEGER" });
      await addColumns("participants", { avatar_emoji: "TEXT", avatar_photo: "TEXT" });
    })();
  }
  await globalForDb.__dbReady;
  return client;
}
