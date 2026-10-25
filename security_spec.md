# Celebrate AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants & Master Sources of Truth

1. **Default-Deny Catch-All**: Any path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Gate**: All writes and reads require `request.auth != null && request.auth.token.email_verified == true`. Unverified email accounts cannot spoof ownership or write records.
3. **Split-Collection PII Isolation**:
   - `/users/{userId}` stores non-PII profile preferences (`uid`, `displayName`, `photoURL`, `preferredCity`, `createdAt`, `updatedAt`). Even here, access is restricted to `request.auth.uid == userId`.
   - `/users/{userId}/private/{docId}` (`docId == 'profile'`) isolates PII (`email`, `phone`) strictly to `request.auth.uid == userId` and requires the parent `/users/{userId}` document to exist (`exists(...)` or `existsAfter(...)`).
4. **Event Master Gate & Relational Consistency**:
   - `/events/{eventId}` cannot be created unless `/users/{request.auth.uid}` exists (`exists(...)`) and `incoming().ownerId == request.auth.uid`.
   - `id`, `ownerId`, `rsvpToken`, and `createdAt` are immutable across all updates.
   - `status == 'archived'` is a **terminal state**: once an event's status is `'archived'`, all further updates are blocked.
5. **Subcollection Master Gate (`/tasks`, `/guests`, `/messages`)**:
   - Single-document operations (`get`, `create`, `update`, `delete`) fetch the parent `/events/{eventId}` document via `get()` and enforce `parent.ownerId == request.auth.uid` AND `parent.status != 'archived'` on writes.
   - `list` queries on `/events` and subcollections NEVER invoke `get()` or `exists()` (preventing $O(n)$ read cost attacks) and strictly enforce `resource.data.ownerId == request.auth.uid` (and `resource.data.eventId == eventId` on subcollections).
6. **Temporal Integrity**: `createdAt == request.time` on creation; `updatedAt == request.time` on creation and every update.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Shadow Field Injection on User Profile (`isAdmin: true`)**:
   `POST /users/uid_alice` with `{ uid: "uid_alice", displayName: "Alice", photoURL: "", preferredCity: "Bengaluru", isAdmin: true, createdAt: SERVER_TIME, updatedAt: SERVER_TIME }` -> **PERMISSION_DENIED** (`hasOnly` rejects `isAdmin`).
2. **Payload 2 — Unverified Email Write Attempt**:
   Authenticated token with `email_verified: false` writing `/users/uid_unverified` -> **PERMISSION_DENIED** (`isVerifiedUser()` fails).
3. **Payload 3 — Cross-User PII Scrape**:
   User `uid_bob` (`email_verified: true`) performs `GET /users/uid_alice/private/profile` -> **PERMISSION_DENIED** (`isOwner(userId)` fails).
4. **Payload 4 — Orphaned Event Creation Without User Profile**:
   User `uid_ghost` attempts `CREATE /events/evt-123` before `/users/uid_ghost` exists -> **PERMISSION_DENIED** (`exists(/users/$(request.auth.uid))` fails).
5. **Payload 5 — Event Ownership Spoofing**:
   User `uid_bob` creates `/events/evt-spoof` with `{ ownerId: "uid_alice", ... }` -> **PERMISSION_DENIED** (`data.ownerId == request.auth.uid` fails).
6. **Payload 6 — ID Poisoning (2KB Path ID)**:
   User creates `/events/<2000-char-id>` or `/events/bad$id!` -> **PERMISSION_DENIED** (`isValidId()` regex & `<= 64` check fail before any `get()` read).
7. **Payload 7 — Forged Client Timestamp**:
   User creates `/events/evt-123` with `createdAt: Timestamp(2020, 1, 1)` instead of `request.time` -> **PERMISSION_DENIED** (`incoming().createdAt == request.time` fails).
8. **Payload 8 — Immutable `ownerId` Transfer Attack on Update**:
   Owner updates `/events/evt-123` changing `ownerId` to `"uid_bob"` -> **PERMISSION_DENIED** (`incoming().ownerId == existing().ownerId` and `affectedKeys().hasOnly(...)` fail).
9. **Payload 9 — Terminal State Unlock (`archived` -> `planning`)**:
   Owner updates `/events/evt-archived` when `existing().status == 'archived'` -> **PERMISSION_DENIED** (`existing().status != 'archived'` gate blocks mutation).
10. **Payload 10 — Unbounded Array Denial-of-Wallet**:
    Owner updates `/events/evt-123` with `shortlistedVendorIds` containing 500 items -> **PERMISSION_DENIED** (`data.shortlistedVendorIds.size() <= 30` fails).
11. **Payload 11 — Subcollection Cross-Tenant Task Injection**:
    User `uid_bob` creates `/events/evt_owned_by_alice/tasks/tsk-1` with `{ ownerId: "uid_bob", eventId: "evt_owned_by_alice", ... }` -> **PERMISSION_DENIED** (Master Gate `get(/events/evt_owned_by_alice).data.ownerId == request.auth.uid` fails).
12. **Payload 12 — Unfiltered Collection Scraping (`list` without `ownerId` filter)**:
    User `uid_bob` runs `getDocs(collection(db, "events"))` without `where("ownerId", "==", "uid_bob")` -> **PERMISSION_DENIED** (`allow list` evaluates `resource.data.ownerId == request.auth.uid`).
