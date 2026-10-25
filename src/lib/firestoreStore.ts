import { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import {
  City,
  CityEnum,
  EventType,
  HydratedEvent,
  Task,
  Guest,
  ChatMessage,
  Plan,
  InvitationBundle,
  BudgetAllocation,
} from "../shared/schemas";
import { db, handleFirestoreError, OperationType } from "./firebase";

// Blueprint constants synchronized verbatim with /firebase-blueprint.json & /firestore.rules
export const BLUEPRINT_LIMITS = {
  ID_MAX: 128,
  EVENT_ID_MAX: 64,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  DISPLAY_NAME_MAX: 80,
  PHOTO_URL_MAX: 500,
  EMAIL_MAX: 254,
  PHONE_MAX: 24,
  TITLE_MIN: 2,
  TITLE_MAX: 120,
  SUB_TRADITION_MAX: 120,
  VIBE_MAX: 500,
  DIETARY_LIST_MAX: 10,
  DIETARY_ITEM_MAX: 60,
  TRADEOFF_NOTE_MAX: 1000,
  SHORTLIST_MAX: 30,
  SUMMARY_PITCH_MAX: 1500,
  VENUE_SUGGESTIONS_MAX: 5,
  RUN_SHEET_MAX: 20,
  INVITE_TONE_MAX: 80,
  INVITE_HOST_MAX: 200,
  TASK_TITLE_MAX: 240,
  TASK_CATEGORY_MAX: 40,
  GUEST_NAME_MAX: 120,
  GUEST_CONTACT_MAX: 120,
  GUEST_DIETARY_MAX: 80,
  GUEST_NOTES_MAX: 500,
  CHAT_CONTENT_MAX: 4000,
  CHAT_SECTIONS_MAX: 10,
} as const;

export interface UserPublicProfileData {
  uid: string;
  displayName: string;
  photoURL: string;
  preferredCity: City;
}

export interface UserPrivateInfoData {
  uid: string;
  email: string;
  phone: string;
}

export interface SavedCloudEventSummary {
  id: string;
  title: string;
  eventType: EventType;
  city: City;
  date: string;
  guestCount: number;
  totalBudget: number;
  status: "planning" | "confirmed" | "archived";
  updatedAtMs: number;
}

function sanitizeId(raw: string, maxLen: number): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : `id-${Date.now()}`;
}

function clampStr(raw: string | undefined | null, maxLen: number, fallback = ""): string {
  const val = (raw ?? fallback).trim();
  return val.slice(0, maxLen);
}

function sanitizePlanMap(plan: Plan | null): Record<string, unknown> | null {
  if (!plan) return null;
  return {
    summaryPitch: clampStr(plan.summaryPitch, BLUEPRINT_LIMITS.SUMMARY_PITCH_MAX, "Celebration plan"),
    theme: plan.theme,
    venueSuggestions: (plan.venueSuggestions || []).slice(0, BLUEPRINT_LIMITS.VENUE_SUGGESTIONS_MAX),
    cateringPlan: plan.cateringPlan,
    decorPlan: plan.decorPlan,
    entertainmentPlan: plan.entertainmentPlan,
    photographyPlan: plan.photographyPlan,
    culturalAdvisory: plan.culturalAdvisory,
    runSheet: (plan.runSheet || []).slice(0, BLUEPRINT_LIMITS.RUN_SHEET_MAX),
    generatedVia: plan.generatedVia,
  };
}

function sanitizeInvitationMap(inv: InvitationBundle | null): Record<string, unknown> | null {
  if (!inv) return null;
  return {
    tone: clampStr(inv.tone, BLUEPRINT_LIMITS.INVITE_TONE_MAX, "Warm Traditional"),
    hostLine: clampStr(inv.hostLine, BLUEPRINT_LIMITS.INVITE_HOST_MAX, "Hosted with love by the Family"),
    english: inv.english,
    hindi: inv.hindi,
    kannada: inv.kannada,
  };
}

function sanitizeBudgetList(budget: BudgetAllocation[]): Record<string, unknown>[] {
  return budget.slice(0, 6).map((b) => ({
    category: b.category,
    label: b.label,
    plannedAmount: Math.round(b.plannedAmount),
    actualSpent: Math.round(b.actualSpent),
    minPct: b.minPct,
    maxPct: b.maxPct,
    priorityWeight: b.priorityWeight,
    locked: Boolean(b.locked),
    rationale: String(b.rationale || "").slice(0, 400),
  }));
}

export async function ensureUserProfileInFirestore(
  user: User,
  defaultCity: City = "Bengaluru"
): Promise<{ profile: UserPublicProfileData; privateInfo: UserPrivateInfoData } | null> {
  if (!user.emailVerified || !user.email) {
    return null;
  }

  const uid = sanitizeId(user.uid, BLUEPRINT_LIMITS.ID_MAX);
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/profile`;

  const publicRef = doc(db, "users", uid);
  const privateRef = doc(db, "users", uid, "private", "profile");

  let publicSnap;
  let privateSnap;
  try {
    [publicSnap, privateSnap] = await Promise.all([
      getDoc(publicRef),
      getDoc(privateRef),
    ]);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, publicPath);
  }

  const fallbackName =
    clampStr(user.displayName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) ||
    clampStr(user.email.split("@")[0], BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) ||
    "Celebration Host";

  const photoURL = clampStr(user.photoURL, BLUEPRINT_LIMITS.PHOTO_URL_MAX, "");
  const safeCity = CityEnum.safeParse(defaultCity).success ? defaultCity : "Bengaluru";
  const safeEmail = clampStr(user.email, BLUEPRINT_LIMITS.EMAIL_MAX);

  if (!publicSnap.exists() || !privateSnap.exists()) {
    const batch = writeBatch(db);
    if (!publicSnap.exists()) {
      batch.set(publicRef, {
        uid,
        displayName: fallbackName,
        photoURL,
        preferredCity: safeCity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    if (!privateSnap.exists()) {
      batch.set(privateRef, {
        uid,
        email: safeEmail,
        phone: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, publicPath);
    }

    return {
      profile: {
        uid,
        displayName: publicSnap.exists()
          ? String(publicSnap.data().displayName || fallbackName)
          : fallbackName,
        photoURL: publicSnap.exists()
          ? String(publicSnap.data().photoURL || photoURL)
          : photoURL,
        preferredCity: publicSnap.exists()
          ? ((publicSnap.data().preferredCity as City) || safeCity)
          : safeCity,
      },
      privateInfo: {
        uid,
        email: safeEmail,
        phone: privateSnap.exists() ? String(privateSnap.data().phone || "") : "",
      },
    };
  }

  const pubData = publicSnap.data();
  const privData = privateSnap.data();

  return {
    profile: {
      uid,
      displayName: String(pubData.displayName || fallbackName),
      photoURL: String(pubData.photoURL || ""),
      preferredCity: CityEnum.safeParse(pubData.preferredCity).success
        ? (pubData.preferredCity as City)
        : "Bengaluru",
    },
    privateInfo: {
      uid,
      email: String(privData.email || safeEmail),
      phone: String(privData.phone || ""),
    },
  };
}

export async function updateUserProfileInFirestore(
  user: User,
  updates: {
    displayName: string;
    preferredCity: City;
    phone: string;
  }
): Promise<{ profile: UserPublicProfileData; privateInfo: UserPrivateInfoData }> {
  const uid = sanitizeId(user.uid, BLUEPRINT_LIMITS.ID_MAX);
  const publicPath = `users/${uid}`;
  const publicRef = doc(db, "users", uid);
  const privateRef = doc(db, "users", uid, "private", "profile");

  const displayName =
    clampStr(updates.displayName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) || "Celebration Host";
  const photoURL = clampStr(user.photoURL, BLUEPRINT_LIMITS.PHOTO_URL_MAX, "");
  const preferredCity = CityEnum.safeParse(updates.preferredCity).success
    ? updates.preferredCity
    : "Bengaluru";
  const email = clampStr(user.email, BLUEPRINT_LIMITS.EMAIL_MAX);
  const phone = clampStr(updates.phone, BLUEPRINT_LIMITS.PHONE_MAX, "");

  const batch = writeBatch(db);
  batch.update(publicRef, {
    displayName,
    photoURL,
    preferredCity,
    updatedAt: serverTimestamp(),
  });
  batch.update(privateRef, {
    email,
    phone,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, publicPath);
  }

  return {
    profile: { uid, displayName, photoURL, preferredCity },
    privateInfo: { uid, email, phone },
  };
}

export async function syncHydratedEventToFirestore(
  user: User,
  event: HydratedEvent
): Promise<void> {
  if (!user.emailVerified) return;

  await ensureUserProfileInFirestore(user, event.input.city);

  const uid = sanitizeId(user.uid, BLUEPRINT_LIMITS.ID_MAX);
  const eventId = sanitizeId(event.id, BLUEPRINT_LIMITS.EVENT_ID_MAX);
  const rsvpToken = sanitizeId(event.rsvpToken, BLUEPRINT_LIMITS.EVENT_ID_MAX);
  const eventPath = `events/${eventId}`;
  const eventRef = doc(db, "events", eventId);

  let existingEventSnap;
  try {
    existingEventSnap = await getDoc(eventRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, eventPath);
  }

  const eventExists = existingEventSnap.exists();

  let existingTaskIds = new Set<string>();
  let existingGuestIds = new Set<string>();
  let existingMessageIds = new Set<string>();

  if (eventExists) {
    try {
      const [tasksSnap, guestsSnap, msgsSnap] = await Promise.all([
        getDocs(query(collection(db, "events", eventId, "tasks"), where("ownerId", "==", uid))),
        getDocs(query(collection(db, "events", eventId, "guests"), where("ownerId", "==", uid))),
        getDocs(query(collection(db, "events", eventId, "messages"), where("ownerId", "==", uid))),
      ]);
      existingTaskIds = new Set(tasksSnap.docs.map((d) => d.id));
      existingGuestIds = new Set(guestsSnap.docs.map((d) => d.id));
      existingMessageIds = new Set(msgsSnap.docs.map((d) => d.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `${eventPath}/subcollections`);
    }
  }

  const safeTitle =
    clampStr(event.input.title, BLUEPRINT_LIMITS.TITLE_MAX) || "Celebration Plan";
  const paddedTitle = safeTitle.length < 2 ? `${safeTitle} Event` : safeTitle;
  const safeDietary = (event.input.dietaryNeeds || ["Pure Veg"])
    .slice(0, BLUEPRINT_LIMITS.DIETARY_LIST_MAX)
    .map((d) => clampStr(d, BLUEPRINT_LIMITS.DIETARY_ITEM_MAX, "Pure Veg"));
  const safeShortlist = (event.shortlistedVendorIds || [])
    .slice(0, BLUEPRINT_LIMITS.SHORTLIST_MAX)
    .map((v) => sanitizeId(v, BLUEPRINT_LIMITS.EVENT_ID_MAX));

  const mutableFields = {
    title: paddedTitle,
    eventType: event.input.eventType,
    subTradition:
      clampStr(event.input.subTradition, BLUEPRINT_LIMITS.SUB_TRADITION_MAX) ||
      "Pan-Indian Contemporary",
    date: /^\d{4}-\d{2}-\d{2}$/.test(event.input.date)
      ? event.input.date
      : new Date().toISOString().slice(0, 10),
    city: event.input.city,
    guestCount: Math.max(10, Math.min(5000, Math.round(event.input.guestCount))),
    totalBudget: Math.max(25000, Math.min(100000000, Math.round(event.input.totalBudget))),
    vibePreferences: clampStr(event.input.vibePreferences, BLUEPRINT_LIMITS.VIBE_MAX, ""),
    dietaryNeeds: safeDietary,
    budgetTradeoffNote: clampStr(
      event.budgetTradeoffNote,
      BLUEPRINT_LIMITS.TRADEOFF_NOTE_MAX,
      ""
    ),
    shortlistedVendorIds: safeShortlist,
    budget: sanitizeBudgetList(event.budget),
    plan: sanitizePlanMap(event.plan),
    invitation: sanitizeInvitationMap(event.invitation),
    status: "planning" as const,
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);

  if (!eventExists) {
    batch.set(eventRef, {
      id: eventId,
      ownerId: uid,
      rsvpToken,
      ...mutableFields,
      createdAt: serverTimestamp(),
    });
  } else {
    batch.update(eventRef, mutableFields);
  }

  // Sync Tasks Subcollection
  const incomingTaskIds = new Set<string>();
  for (const t of (event.tasks || []).slice(0, 80)) {
    const taskId = sanitizeId(t.id, BLUEPRINT_LIMITS.ID_MAX);
    incomingTaskIds.add(taskId);
    const taskRef = doc(db, "events", eventId, "tasks", taskId);
    const taskMutable = {
      title: clampStr(t.title, BLUEPRINT_LIMITS.TASK_TITLE_MAX, "Milestone"),
      category: clampStr(t.category, BLUEPRINT_LIMITS.TASK_CATEGORY_MAX, "misc"),
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)
        ? t.dueDate
        : mutableFields.date,
      daysBefore: Math.max(0, Math.min(3650, Math.round(t.daysBefore))),
      priority: t.priority,
      completed: Boolean(t.completed),
      updatedAt: serverTimestamp(),
    };
    if (!existingTaskIds.has(taskId)) {
      batch.set(taskRef, {
        id: taskId,
        eventId,
        ownerId: uid,
        ...taskMutable,
        createdAt: serverTimestamp(),
      });
    } else {
      batch.update(taskRef, taskMutable);
    }
  }
  for (const oldId of existingTaskIds) {
    if (!incomingTaskIds.has(oldId)) {
      batch.delete(doc(db, "events", eventId, "tasks", oldId));
    }
  }

  // Sync Guests Subcollection
  const incomingGuestIds = new Set<string>();
  for (const g of (event.guests || []).slice(0, 150)) {
    const guestId = sanitizeId(g.id, BLUEPRINT_LIMITS.ID_MAX);
    incomingGuestIds.add(guestId);
    const guestRef = doc(db, "events", eventId, "guests", guestId);
    const guestMutable = {
      name: clampStr(g.name, BLUEPRINT_LIMITS.GUEST_NAME_MAX, "Guest"),
      contact: clampStr(g.contact, BLUEPRINT_LIMITS.GUEST_CONTACT_MAX, ""),
      status: g.status,
      partySize: Math.max(1, Math.min(20, Math.round(g.partySize))),
      dietaryPreference: clampStr(
        g.dietaryPreference,
        BLUEPRINT_LIMITS.GUEST_DIETARY_MAX,
        "Pure Veg"
      ),
      notes: clampStr(g.notes, BLUEPRINT_LIMITS.GUEST_NOTES_MAX, ""),
      updatedAt: serverTimestamp(),
    };
    if (!existingGuestIds.has(guestId)) {
      batch.set(guestRef, {
        id: guestId,
        eventId,
        ownerId: uid,
        ...guestMutable,
        createdAt: serverTimestamp(),
      });
    } else {
      batch.update(guestRef, guestMutable);
    }
  }
  for (const oldId of existingGuestIds) {
    if (!incomingGuestIds.has(oldId)) {
      batch.delete(doc(db, "events", eventId, "guests", oldId));
    }
  }

  // Sync Chat Messages Subcollection (append-only)
  for (const m of (event.chatHistory || []).slice(-60)) {
    const msgId = sanitizeId(m.id, BLUEPRINT_LIMITS.ID_MAX);
    if (!existingMessageIds.has(msgId)) {
      const msgRef = doc(db, "events", eventId, "messages", msgId);
      const changedSections = (m.changedSections || [])
        .slice(0, BLUEPRINT_LIMITS.CHAT_SECTIONS_MAX)
        .map((s) => clampStr(s, 40, "plan"));
      batch.set(msgRef, {
        id: msgId,
        eventId,
        ownerId: uid,
        role: m.role,
        content: clampStr(m.content, BLUEPRINT_LIMITS.CHAT_CONTENT_MAX, "..."),
        changedSections,
        sentAtIso: clampStr(m.createdAt, 40, new Date().toISOString()),
        createdAt: serverTimestamp(),
      });
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(
      err,
      eventExists ? OperationType.UPDATE : OperationType.CREATE,
      eventPath
    );
  }
}

export async function loadHydratedEventFromFirestore(
  user: User,
  rawEventId: string
): Promise<HydratedEvent | null> {
  if (!user.emailVerified) return null;
  const uid = sanitizeId(user.uid, BLUEPRINT_LIMITS.ID_MAX);
  const eventId = sanitizeId(rawEventId, BLUEPRINT_LIMITS.EVENT_ID_MAX);
  const eventPath = `events/${eventId}`;

  let eventSnap;
  try {
    eventSnap = await getDoc(doc(db, "events", eventId));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, eventPath);
  }

  if (!eventSnap.exists()) return null;
  const data = eventSnap.data();

  let tasksSnap;
  let guestsSnap;
  let messagesSnap;
  try {
    [tasksSnap, guestsSnap, messagesSnap] = await Promise.all([
      getDocs(query(collection(db, "events", eventId, "tasks"), where("ownerId", "==", uid))),
      getDocs(query(collection(db, "events", eventId, "guests"), where("ownerId", "==", uid))),
      getDocs(query(collection(db, "events", eventId, "messages"), where("ownerId", "==", uid))),
    ]);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `${eventPath}/subcollections`);
  }

  const tasks: Task[] = tasksSnap.docs
    .map((d) => {
      const t = d.data();
      return {
        id: String(t.id),
        eventId: String(t.eventId),
        title: String(t.title),
        category: String(t.category),
        dueDate: String(t.dueDate),
        daysBefore: Number(t.daysBefore),
        priority: (t.priority as "high" | "medium" | "low") || "medium",
        completed: Boolean(t.completed),
      };
    })
    .sort((a, b) => b.daysBefore - a.daysBefore);

  const guests: Guest[] = guestsSnap.docs.map((d) => {
    const g = d.data();
    return {
      id: String(g.id),
      eventId: String(g.eventId),
      name: String(g.name),
      contact: String(g.contact || ""),
      status: (g.status as "yes" | "no" | "pending") || "pending",
      partySize: Number(g.partySize) || 1,
      dietaryPreference: String(g.dietaryPreference || "Pure Veg"),
      notes: String(g.notes || ""),
    };
  });

  const chatHistory: ChatMessage[] = messagesSnap.docs
    .map((d) => {
      const m = d.data();
      return {
        id: String(m.id),
        role: (m.role as "user" | "assistant") || "assistant",
        content: String(m.content),
        changedSections: Array.isArray(m.changedSections)
          ? (m.changedSections as string[])
          : undefined,
        createdAt: String(m.sentAtIso || new Date().toISOString()),
      };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const createdAtTs = data.createdAt as Timestamp | undefined;
  const createdAtIso = createdAtTs?.toDate
    ? createdAtTs.toDate().toISOString()
    : new Date().toISOString();

  return {
    id: String(data.id),
    rsvpToken: String(data.rsvpToken),
    input: {
      title: String(data.title),
      eventType: data.eventType as EventType,
      subTradition: String(data.subTradition || "Pan-Indian Contemporary"),
      date: String(data.date),
      city: data.city as City,
      guestCount: Number(data.guestCount),
      totalBudget: Number(data.totalBudget),
      vibePreferences: String(data.vibePreferences || ""),
      dietaryNeeds: Array.isArray(data.dietaryNeeds)
        ? (data.dietaryNeeds as string[])
        : ["Pure Veg"],
    },
    plan: (data.plan as Plan | null) ?? null,
    budget: (data.budget as BudgetAllocation[]) || [],
    budgetTradeoffNote: String(data.budgetTradeoffNote || ""),
    tasks,
    guests,
    shortlistedVendorIds: Array.isArray(data.shortlistedVendorIds)
      ? (data.shortlistedVendorIds as string[])
      : [],
    invitation: (data.invitation as InvitationBundle | null) ?? null,
    chatHistory,
    createdAt: createdAtIso,
  };
}

export async function deleteEventFromFirestore(
  user: User,
  rawEventId: string
): Promise<void> {
  if (!user.emailVerified) return;
  const uid = sanitizeId(user.uid, BLUEPRINT_LIMITS.ID_MAX);
  const eventId = sanitizeId(rawEventId, BLUEPRINT_LIMITS.EVENT_ID_MAX);
  const eventPath = `events/${eventId}`;

  try {
    const [tasksSnap, guestsSnap, msgsSnap] = await Promise.all([
      getDocs(query(collection(db, "events", eventId, "tasks"), where("ownerId", "==", uid))),
      getDocs(query(collection(db, "events", eventId, "guests"), where("ownerId", "==", uid))),
      getDocs(query(collection(db, "events", eventId, "messages"), where("ownerId", "==", uid))),
    ]);

    const batch = writeBatch(db);
    tasksSnap.docs.forEach((d) => batch.delete(d.ref));
    guestsSnap.docs.forEach((d) => batch.delete(d.ref));
    msgsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "events", eventId));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, eventPath);
  }
}

export function subscribeToUserEvents(
  user: User,
  onChange: (events: SavedCloudEventSummary[]) => void
): Unsubscribe {
  const uid = sanitizeId(user.uid, BLUEPRINT_LIMITS.ID_MAX);
  const q = query(collection(db, "events"), where("ownerId", "==", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedCloudEventSummary[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const updatedTs = d.updatedAt as Timestamp | undefined;
          return {
            id: String(d.id),
            title: String(d.title),
            eventType: d.eventType as EventType,
            city: d.city as City,
            date: String(d.date),
            guestCount: Number(d.guestCount),
            totalBudget: Number(d.totalBudget),
            status:
              (d.status as "planning" | "confirmed" | "archived") || "planning",
            updatedAtMs: updatedTs?.toMillis ? updatedTs.toMillis() : Date.now(),
          };
        })
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onChange(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, "events");
    }
  );
}
