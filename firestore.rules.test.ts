/**
 * Phase 0 Security Rules Verification Suite — Dirty Dozen Adversarial Payloads
 * Verifies all 12 adversarial payloads against the Celebrate AI Firestore ruleset invariants.
 */

export interface MockAuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
}

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: "get" | "list" | "create" | "update" | "delete";
  auth: MockAuthContext | null;
  existingDoc?: Record<string, unknown> | null;
  parentExists?: boolean;
  parentOwnerId?: string;
  parentStatus?: string;
  incomingDoc?: Record<string, unknown>;
  queryOwnerFilter?: string | null;
  expectedResult: "PERMISSION_DENIED";
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: "Shadow Field Injection (isAdmin: true on user profile)",
    collectionPath: "/users/uid_alice",
    operation: "create",
    auth: { uid: "uid_alice", email: "alice@example.com", email_verified: true },
    incomingDoc: {
      uid: "uid_alice",
      displayName: "Alice",
      photoURL: "",
      preferredCity: "Bengaluru",
      isAdmin: true,
      createdAt: "__SERVER_TIMESTAMP__",
      updatedAt: "__SERVER_TIMESTAMP__",
    },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 2,
    name: "Unverified Email Write Attempt",
    collectionPath: "/users/uid_unverified",
    operation: "create",
    auth: { uid: "uid_unverified", email: "spoof@example.com", email_verified: false },
    incomingDoc: {
      uid: "uid_unverified",
      displayName: "Spoofer",
      photoURL: "",
      preferredCity: "Bengaluru",
      createdAt: "__SERVER_TIMESTAMP__",
      updatedAt: "__SERVER_TIMESTAMP__",
    },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 3,
    name: "Cross-User PII Scrape on /users/{uid}/private/profile",
    collectionPath: "/users/uid_alice/private/profile",
    operation: "get",
    auth: { uid: "uid_bob", email: "bob@example.com", email_verified: true },
    existingDoc: { uid: "uid_alice", email: "alice@example.com", phone: "+919800000000" },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 4,
    name: "Orphaned Event Creation Without Existing User Profile",
    collectionPath: "/events/evt-123",
    operation: "create",
    auth: { uid: "uid_ghost", email: "ghost@example.com", email_verified: true },
    parentExists: false,
    incomingDoc: { id: "evt-123", ownerId: "uid_ghost" },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 5,
    name: "Event Ownership Spoofing",
    collectionPath: "/events/evt-spoof",
    operation: "create",
    auth: { uid: "uid_bob", email: "bob@example.com", email_verified: true },
    parentExists: true,
    incomingDoc: { id: "evt-spoof", ownerId: "uid_alice" },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 6,
    name: "ID Poisoning Attack (Invalid Characters / Length > 64)",
    collectionPath: `/events/${"x".repeat(200)}`,
    operation: "create",
    auth: { uid: "uid_alice", email: "alice@example.com", email_verified: true },
    parentExists: true,
    incomingDoc: { id: "x".repeat(200), ownerId: "uid_alice" },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 7,
    name: "Forged Client Timestamp on Event Create",
    collectionPath: "/events/evt-time",
    operation: "create",
    auth: { uid: "uid_alice", email: "alice@example.com", email_verified: true },
    parentExists: true,
    incomingDoc: {
      id: "evt-time",
      ownerId: "uid_alice",
      createdAt: "2020-01-01T00:00:00Z",
      updatedAt: "__SERVER_TIMESTAMP__",
    },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 8,
    name: "Immutable ownerId Mutation on Update",
    collectionPath: "/events/evt-123",
    operation: "update",
    auth: { uid: "uid_alice", email: "alice@example.com", email_verified: true },
    existingDoc: { id: "evt-123", ownerId: "uid_alice", status: "planning" },
    incomingDoc: { id: "evt-123", ownerId: "uid_bob", status: "planning" },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 9,
    name: "Terminal State Bypass (Updating an Archived Event)",
    collectionPath: "/events/evt-archived",
    operation: "update",
    auth: { uid: "uid_alice", email: "alice@example.com", email_verified: true },
    existingDoc: { id: "evt-archived", ownerId: "uid_alice", status: "archived", title: "Old" },
    incomingDoc: {
      id: "evt-archived",
      ownerId: "uid_alice",
      status: "planning",
      title: "Reopened",
      updatedAt: "__SERVER_TIMESTAMP__",
    },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 10,
    name: "Unbounded Array Resource Exhaustion (500 Shortlisted Vendors)",
    collectionPath: "/events/evt-123",
    operation: "update",
    auth: { uid: "uid_alice", email: "alice@example.com", email_verified: true },
    existingDoc: { id: "evt-123", ownerId: "uid_alice", status: "planning", shortlistedVendorIds: [] },
    incomingDoc: {
      id: "evt-123",
      ownerId: "uid_alice",
      status: "planning",
      shortlistedVendorIds: Array.from({ length: 500 }, (_, i) => `v-${i}`),
      updatedAt: "__SERVER_TIMESTAMP__",
    },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 11,
    name: "Subcollection Cross-Tenant Task Injection",
    collectionPath: "/events/evt_alice/tasks/tsk-1",
    operation: "create",
    auth: { uid: "uid_bob", email: "bob@example.com", email_verified: true },
    parentExists: true,
    parentOwnerId: "uid_alice",
    parentStatus: "planning",
    incomingDoc: {
      id: "tsk-1",
      eventId: "evt_alice",
      ownerId: "uid_bob",
      title: "Malicious Task",
      category: "misc",
      dueDate: "2026-12-01",
      daysBefore: 10,
      priority: "high",
      completed: false,
      createdAt: "__SERVER_TIMESTAMP__",
      updatedAt: "__SERVER_TIMESTAMP__",
    },
    expectedResult: "PERMISSION_DENIED",
  },
  {
    id: 12,
    name: "Unfiltered List Query Scraping Across All Events",
    collectionPath: "/events",
    operation: "list",
    auth: { uid: "uid_bob", email: "bob@example.com", email_verified: true },
    queryOwnerFilter: null,
    expectedResult: "PERMISSION_DENIED",
  },
];
