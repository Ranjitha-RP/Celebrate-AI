import fs from "fs";
import path from "path";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import {
  HydratedEvent,
  EventInput,
  Plan,
  BudgetAllocation,
  Task,
  Guest,
  InvitationBundle,
  ChatMessage,
} from "../../src/shared/schemas.ts";
import {
  DEMO_EVENT_INPUT,
  DEMO_PLAN,
  DEMO_BUDGET,
  buildDemoTasks,
  buildDemoGuests,
  DEMO_INVITATION,
  DEMO_CHAT_HISTORY,
} from "../data/demoScenario.ts";

const DB_FILE_PATH = process.env.VERCEL
  ? "/tmp/celebrate_ai.sqlite"
  : path.resolve(process.cwd(), "celebrate_ai.sqlite");

let sqlDb: SqlJsDatabase | null = null;

function persistToDisk() {
  if (!sqlDb) return;
  try {
    const data = sqlDb.export();
    fs.writeFileSync(DB_FILE_PATH, Buffer.from(data));
  } catch (err) {
    console.error("SQLite persist warning:", err);
  }
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (sqlDb) return sqlDb;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE_PATH)) {
    const fileBuffer = fs.readFileSync(DB_FILE_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      rsvp_token TEXT UNIQUE NOT NULL,
      input_json TEXT NOT NULL,
      plan_json TEXT,
      budget_json TEXT NOT NULL,
      budget_tradeoff_note TEXT NOT NULL,
      shortlisted_ids_json TEXT NOT NULL,
      invitation_json TEXT,
      chat_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      due_date TEXT NOT NULL,
      days_before INTEGER NOT NULL,
      priority TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      status TEXT NOT NULL,
      party_size INTEGER NOT NULL,
      dietary_preference TEXT NOT NULL,
      notes TEXT NOT NULL
    );
  `);

  persistToDisk();
  return sqlDb;
}

function queryRows(db: SqlJsDatabase, sql: string, params: (string | number | null)[] = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export async function listRecentEvents(): Promise<
  Array<{ id: string; title: string; city: string; date: string; totalBudget: number }>
> {
  const db = await getDb();
  const rows = queryRows(
    db,
    `SELECT id, input_json, created_at FROM events ORDER BY created_at DESC LIMIT 10`
  );
  return rows.map((r) => {
    const inp = JSON.parse(String(r.input_json)) as EventInput;
    return {
      id: String(r.id),
      title: inp.title,
      city: inp.city,
      date: inp.date,
      totalBudget: inp.totalBudget,
    };
  });
}

export async function getHydratedEvent(eventId: string): Promise<HydratedEvent | null> {
  const db = await getDb();
  const rows = queryRows(db, `SELECT * FROM events WHERE id = ?`, [eventId]);
  if (rows.length === 0) return null;
  return mapRowToHydrated(db, rows[0]);
}

export async function getEventByRsvpToken(token: string): Promise<HydratedEvent | null> {
  const db = await getDb();
  const rows = queryRows(db, `SELECT * FROM events WHERE rsvp_token = ?`, [token]);
  if (rows.length === 0) return null;
  return mapRowToHydrated(db, rows[0]);
}

function mapRowToHydrated(db: SqlJsDatabase, row: Record<string, unknown>): HydratedEvent {
  const eventId = String(row.id);
  const taskRows = queryRows(
    db,
    `SELECT * FROM tasks WHERE event_id = ? ORDER BY days_before DESC, id ASC`,
    [eventId]
  );
  const guestRows = queryRows(
    db,
    `SELECT * FROM guests WHERE event_id = ? ORDER BY rowid DESC`,
    [eventId]
  );

  const tasks: Task[] = taskRows.map((t) => ({
    id: String(t.id),
    eventId: String(t.event_id),
    title: String(t.title),
    category: String(t.category),
    dueDate: String(t.due_date),
    daysBefore: Number(t.days_before),
    priority: (t.priority as "high" | "medium" | "low") || "medium",
    completed: Number(t.completed) === 1,
  }));

  const guests: Guest[] = guestRows.map((g) => ({
    id: String(g.id),
    eventId: String(g.event_id),
    name: String(g.name),
    contact: String(g.contact),
    status: (g.status as "yes" | "no" | "pending") || "pending",
    partySize: Number(g.party_size),
    dietaryPreference: String(g.dietary_preference),
    notes: String(g.notes),
  }));

  return {
    id: eventId,
    rsvpToken: String(row.rsvp_token),
    input: JSON.parse(String(row.input_json)) as EventInput,
    plan: row.plan_json ? (JSON.parse(String(row.plan_json)) as Plan) : null,
    budget: JSON.parse(String(row.budget_json)) as BudgetAllocation[],
    budgetTradeoffNote: String(row.budget_tradeoff_note || ""),
    tasks,
    guests,
    shortlistedVendorIds: JSON.parse(String(row.shortlisted_ids_json)) as string[],
    invitation: row.invitation_json
      ? (JSON.parse(String(row.invitation_json)) as InvitationBundle)
      : null,
    chatHistory: JSON.parse(String(row.chat_json)) as ChatMessage[],
    createdAt: String(row.created_at),
  };
}

export async function createEventRecord(params: {
  id: string;
  rsvpToken: string;
  input: EventInput;
  budget: BudgetAllocation[];
  budgetTradeoffNote: string;
  plan?: Plan | null;
  tasks?: Task[];
  guests?: Guest[];
  shortlistedVendorIds?: string[];
  invitation?: InvitationBundle | null;
  chatHistory?: ChatMessage[];
}): Promise<HydratedEvent> {
  const db = await getDb();
  const now = new Date().toISOString();

  db.run(`DELETE FROM events WHERE id = ?`, [params.id]);
  db.run(`DELETE FROM tasks WHERE event_id = ?`, [params.id]);
  db.run(`DELETE FROM guests WHERE event_id = ?`, [params.id]);

  db.run(
    `INSERT INTO events (
      id, rsvp_token, input_json, plan_json, budget_json, budget_tradeoff_note,
      shortlisted_ids_json, invitation_json, chat_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.id,
      params.rsvpToken,
      JSON.stringify(params.input),
      params.plan ? JSON.stringify(params.plan) : null,
      JSON.stringify(params.budget),
      params.budgetTradeoffNote,
      JSON.stringify(params.shortlistedVendorIds || []),
      params.invitation ? JSON.stringify(params.invitation) : null,
      JSON.stringify(params.chatHistory || []),
      now,
    ]
  );

  for (const t of params.tasks || []) {
    db.run(
      `INSERT INTO tasks (id, event_id, title, category, due_date, days_before, priority, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        params.id,
        t.title,
        t.category,
        t.dueDate,
        t.daysBefore,
        t.priority,
        t.completed ? 1 : 0,
      ]
    );
  }

  for (const g of params.guests || []) {
    db.run(
      `INSERT INTO guests (id, event_id, name, contact, status, party_size, dietary_preference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        g.id,
        params.id,
        g.name,
        g.contact,
        g.status,
        g.partySize,
        g.dietaryPreference,
        g.notes,
      ]
    );
  }

  persistToDisk();
  const created = await getHydratedEvent(params.id);
  return created!;
}

export async function updateEventCore(
  eventId: string,
  updates: {
    input?: EventInput;
    plan?: Plan | null;
    budget?: BudgetAllocation[];
    budgetTradeoffNote?: string;
    shortlistedVendorIds?: string[];
    invitation?: InvitationBundle | null;
    chatHistory?: ChatMessage[];
  }
): Promise<HydratedEvent | null> {
  const existing = await getHydratedEvent(eventId);
  if (!existing) return null;
  const db = await getDb();

  const nextInput = updates.input ?? existing.input;
  const nextPlan = updates.plan !== undefined ? updates.plan : existing.plan;
  const nextBudget = updates.budget ?? existing.budget;
  const nextNote = updates.budgetTradeoffNote ?? existing.budgetTradeoffNote;
  const nextShortlist = updates.shortlistedVendorIds ?? existing.shortlistedVendorIds;
  const nextInvitation =
    updates.invitation !== undefined ? updates.invitation : existing.invitation;
  const nextChat = updates.chatHistory ?? existing.chatHistory;

  db.run(
    `UPDATE events
     SET input_json = ?, plan_json = ?, budget_json = ?, budget_tradeoff_note = ?,
         shortlisted_ids_json = ?, invitation_json = ?, chat_json = ?
     WHERE id = ?`,
    [
      JSON.stringify(nextInput),
      nextPlan ? JSON.stringify(nextPlan) : null,
      JSON.stringify(nextBudget),
      nextNote,
      JSON.stringify(nextShortlist),
      nextInvitation ? JSON.stringify(nextInvitation) : null,
      JSON.stringify(nextChat),
      eventId,
    ]
  );

  persistToDisk();
  return getHydratedEvent(eventId);
}

export async function replaceEventTasks(eventId: string, tasks: Task[]): Promise<void> {
  const db = await getDb();
  db.run(`DELETE FROM tasks WHERE event_id = ?`, [eventId]);
  for (const t of tasks) {
    db.run(
      `INSERT INTO tasks (id, event_id, title, category, due_date, days_before, priority, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        eventId,
        t.title,
        t.category,
        t.dueDate,
        t.daysBefore,
        t.priority,
        t.completed ? 1 : 0,
      ]
    );
  }
  persistToDisk();
}

export async function addEventTask(task: Task): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO tasks (id, event_id, title, category, due_date, days_before, priority, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.eventId,
      task.title,
      task.category,
      task.dueDate,
      task.daysBefore,
      task.priority,
      task.completed ? 1 : 0,
    ]
  );
  persistToDisk();
}

export async function toggleEventTask(
  eventId: string,
  taskId: string,
  completed: boolean
): Promise<void> {
  const db = await getDb();
  db.run(`UPDATE tasks SET completed = ? WHERE id = ? AND event_id = ?`, [
    completed ? 1 : 0,
    taskId,
    eventId,
  ]);
  persistToDisk();
}

export async function upsertGuestRecord(guest: Guest): Promise<void> {
  const db = await getDb();
  const existing = queryRows(
    db,
    `SELECT id FROM guests WHERE id = ? AND event_id = ?`,
    [guest.id, guest.eventId]
  );
  if (existing.length > 0) {
    db.run(
      `UPDATE guests SET name = ?, contact = ?, status = ?, party_size = ?, dietary_preference = ?, notes = ?
       WHERE id = ? AND event_id = ?`,
      [
        guest.name,
        guest.contact,
        guest.status,
        guest.partySize,
        guest.dietaryPreference,
        guest.notes,
        guest.id,
        guest.eventId,
      ]
    );
  } else {
    db.run(
      `INSERT INTO guests (id, event_id, name, contact, status, party_size, dietary_preference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guest.id,
        guest.eventId,
        guest.name,
        guest.contact,
        guest.status,
        guest.partySize,
        guest.dietaryPreference,
        guest.notes,
      ]
    );
  }
  persistToDisk();
}

export async function seedOrResetDemoEvent(ownerScope?: string): Promise<HydratedEvent> {
  const cleanScope = ownerScope
    ? ownerScope.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20)
    : "";
  const demoId = cleanScope ? `evt-demo-${cleanScope}` : "evt-golden-jubilee-blr";
  const rsvpToken = cleanScope ? `rsvp-demo-${cleanScope}` : "suvarna-1976-blr";
  return createEventRecord({
    id: demoId,
    rsvpToken,
    input: DEMO_EVENT_INPUT,
    plan: DEMO_PLAN,
    budget: DEMO_BUDGET,
    budgetTradeoffNote:
      "Balanced for 120 guests in Bengaluru: 29% Heritage Courtyard Venue, 30% Pure Veg + Jain Feast, 15% Sustainable Mallige & Photo Gallery Decor.",
    tasks: buildDemoTasks(demoId, DEMO_EVENT_INPUT.date),
    guests: buildDemoGuests(demoId),
    shortlistedVendorIds: [
      "VEN-BLR-01",
      "VEN-BLR-04",
      "VEN-BLR-06",
      "VEN-BLR-08",
      "VEN-BLR-10",
    ],
    invitation: DEMO_INVITATION,
    chatHistory: DEMO_CHAT_HISTORY,
  });
}
