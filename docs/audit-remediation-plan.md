# Rootaroo Backend — Audit Remediation Plan (P0–P3, full findings register)

## Context

`Rootaroo-Backend-Architecture-Technical-Audit.pdf` (1 Sep 2026) audited the backend at
`server/` (TS/Express/Sequelize, 16 feature modules, 147 routes). Verdict: **Developing**
maturity, not production-ready — 0 Critical, 7 High, 9 Medium, 4 Low, 1 Info. The blockers are
all identity/tenant-isolation gaps (password reset, OAuth linking, phone takeover, chat isolation)
plus one destructive-confirm gap (household deletion skips its own 30-day grace period).
Confirmed against live source via 3 parallel Explore passes — every finding below cites the exact
current function.

Goal: fix the full register (P0–P3, per the audit's own priority bands), without a rewrite —
these are targeted patches to existing functions.

---

## P0 — Identity, recovery, chat isolation, destructive confirm

### F-01 — Password reset / OTP is 6-digit, plaintext, code-only lookup
`modules/auth/service.ts`: `forgotPassword`, `checkResetCode`, `resetPassword`, `sendPhoneOtp`, `verifyPhoneOtp`. `app.ts` `authLimiter` (20/min, shared across all `/auth/*`), `redisRateLimiter` (fails **open** when `redis.status !== 'ready'`).

- Bind `checkResetCode`/`resetPassword` lookups to `{ token: code, ... }` **plus** the requesting email/userId (add `email` to the request schema; look up `PasswordReset` joined to `User.email`, not by token alone).
- Hash reset/OTP codes at rest (`PasswordReset.token`, `PhoneVerification.token`) — store `sha256(code)`, compare hashed.
- Add a per-account attempt counter (new column or reuse existing row) and lock out after N failed checks within the 15-min window, independent of the IP-based `authLimiter`.
- Make `redisRateLimiter` **fail closed** for the `/api/v1/auth/` prefix specifically (keep fail-open elsewhere if that's intentional for non-auth routes) — reject with 503 instead of `next()` when Redis isn't ready.
- Stop returning the raw code in JSON responses except behind an explicit local-dev-only flag (already partially gated by SMTP presence — tighten to `NODE_ENV !== 'production'` explicitly).

### F-02 — Google/Apple sign-in binds by email with no verified-email check
`modules/auth/service.ts`: `googleAuth` (207-271), `appleAuth` (277-332), `cancelPendingRegistration` (521-535).

- In both `googleAuth` and `appleAuth`, when `User.findOne` resolves via the `email` branch of the `Op.or` (i.e., no existing `googleId`/`appleId` on that row), **do not auto-link**. Require the provider's token to assert a verified email (Google: `tokeninfo.email_verified === 'true'`; Apple: JWKS payload `email_verified`), and only then set `user.googleId`/`user.appleId` + `isVerified: true`. If not verified, reject with a clear error directing the user to link via an authenticated in-app flow instead.
- `cancelPendingRegistration`: also block if `user.googleId || user.appleId` is set (not just `isVerified`/`isPhoneVerified`), so a hard-delete can't remove a row that already has a linked IdP identity.

### F-03 — Unauthenticated phone register overwrites unverified phone users
`modules/auth/service.ts`: `registerPhone` (583-635), `sendPhoneOtp` (637-670). `modules/auth/routes.ts` (phone routes have no `authenticate`).

- `registerPhone`: remove the overwrite-on-unverified-match branch. If `User.findOne({ phone })` finds any row (verified or not) that isn't the caller's own authenticated session, do not overwrite it or issue tokens — require OTP verification first.
- Only issue access/refresh tokens for a phone identity **after** `verifyPhoneOtp` succeeds, not from `registerPhone` directly.
- `sendPhoneOtp` unauthenticated path: keep the find-or-create placeholder user (needed to send the OTP), but do not attach it to any session/token until OTP verification.

### F-04 / M-01 / M-02 — Chat tenant isolation
`modules/chat/service.ts` (758 lines): `listMessages` (396-449), `getMessageById` (453-478), `updateMessage` (482-526), `deleteMessage` (530-568), `createConversation` (57-143), `addParticipant` (681-691), `deleteConversation` (739-757, already correctly household-scoped — no change needed there).

- **F-04** `listMessages`: when `query.conversationId` is provided, add a `ConversationParticipant.findOne({ where: { conversationId, userId } })` check (same pattern `sendMessage` already uses) before returning messages — reject with `ForbiddenError` if the caller isn't a participant. Do the same participant check in `getMessageById` (currently household-only).
- **M-01** `deleteConversation`: it's household-scoped but has no participant/creator/admin check — add: allow only `conversation.createdBy === userId`, or an explicit household-admin acting on that conversation. For `type === 'dm'`, require the caller be one of the two participants (no admin override — "leave, don't wipe" per audit recommendation).
- **M-02** `createConversation`: validate every id in `body.participantIds` against `HouseholdMember` for the caller's `householdId` (mirror the check `inviteToGroup` already does) before `ConversationParticipant.bulkCreate`. Apply the same membership check in `addParticipant` (currently only checks creator/admin, not that the target belongs to the household).
- Stamp `ChatMessage.householdId` from `Conversation.householdId` (already done) — keep, but make `getUserConversations` filter explicitly by household too (audit notes it currently doesn't).

### F-07 — Household deletion: grace period unenforced, OAuth/phone admins skip password
`modules/household/service.ts`: `assertAdminWithPassword` (359-379), `scheduleHouseholdDeletion` (381-401), `confirmHouseholdDeletion` (427-440). Mirror in `modules/auth/service.ts` (`scheduleDeletion`/`confirmDeletion` — same pattern, same fix needed).

- `assertAdminWithPassword`: when `user.passwordHash` is empty (OAuth/phone-only account), don't skip the check — require a fresh IdP re-proof (re-run `googleAuth`/`appleAuth` token exchange in this call) instead of silently passing.
- `confirmHouseholdDeletion`: add a guard — `if (!household.scheduledDeletionAt || household.scheduledDeletionAt > new Date()) throw new AppError(400, 'Deletion must be scheduled and the 30-day window must elapse first')`. Same fix in `auth/service.ts confirmDeletion`.
- Add a job (new file `jobs/purge-scheduled-deletions.ts`, registered in `index.ts` alongside the other 4) that finds `Household`/`User` rows where `scheduledDeletionAt <= now` and finalizes/purges them — this replaces relying on a human to call confirm. Once this job exists, `confirmHouseholdDeletion`/`confirmDeletion` become optional manual-early-confirm paths, not the only path.

---

## P1 — Authz source of truth, invites, secrets at rest

### F-06 — JWT `role` used as admin authority; `requireHouseholdMembership` dead
`shared/middleware/auth.ts` (`authenticate`), `shared/middleware/rbac.ts` (`requireRole`, `requireHouseholdMembership` — unused), `modules/auth/service.ts:42` (`generateAccessToken`), consumers: `modules/vault/service.ts` (`updateDocument`, `deleteDocument`, `hardDeleteDocument`), `modules/feed/service.ts` (`deletePost`, `deleteComment`), `modules/task/controller.ts` (`getUserRole`).

- Add a shared helper `getCurrentMembership(userId, householdId)` (or reuse the pattern `household/service.ts getMembership` already uses correctly) and have vault/feed/task destructive/admin-gated actions re-check `HouseholdMember.role` from the DB instead of trusting `req.user.role` from the JWT. Prioritize `vault.hardDeleteDocument` (currently pure-JWT-gated permanent delete) first.
- Either wire `requireHouseholdMembership` in as real middleware on routes that need it, or delete it — don't leave a dead security-sounding helper in `rbac.ts`. Given `JwtPayload.householdId` is never actually signed into the token, deleting it (and any confusion it causes) is the simpler fix; enforcement moves entirely to the DB-backed membership check above.

### F-05 — Permanent 8-hex invite code never rotates
`modules/household/service.ts`: `generateCode` (13-15), `createHousehold` (49-70), `toHouseholdResponse` (36-47), `joinViaCode` (135-200, permanent-code fallback at 163-170).

- Add `rotateInviteCode(adminUserId, householdId)` (admin-only, re-runs `generateCode()`, persists, returns new code) — new route `POST /households/:id/invite-code/rotate`.
- Stop returning `inviteCode` in `toHouseholdResponse` for non-admin members (children in particular, per audit) — only admins see/share it; other members go through `Invitation` (7-day, single-use) instead.
- Prefer one-time `Invitation` codes as the primary documented flow; keep the permanent code as an admin-managed fallback only.

### F-09 — Google Calendar OAuth tokens stored plaintext
`shared/utils/googleCalendar.ts` (`getValidAccessToken`), `modules/calendar/service.ts` (`connectGoogleCalendar`, `syncUserCalendar`), `database/models/CalendarSyncState.ts` (`accessToken`/`refreshToken` as plain `TEXT`).

- Add a small crypto helper (`shared/utils/crypto.ts`): AES-256-GCM encrypt/decrypt using a new `CALENDAR_TOKEN_KEK` env var (dedicated — do not reuse `JWT_ACCESS_SECRET`).
- Encrypt before `state.save()`/`CalendarSyncState.create` in `connectGoogleCalendar`; decrypt in `getValidAccessToken` before use. Add a migration to re-key existing plaintext rows once (best-effort — flag as a one-time backfill script, not blocking).

### F-14 — Hardcoded JWT/S3 dev fallbacks live in production if env unset
`config/env.ts` (`jwt.accessSecret`/`refreshSecret` fallbacks, `s3.accessKeyId`/`secretAccessKey` fallbacks).

- Add a startup guard in `index.ts` (or `env.ts` itself): `if (env.nodeEnv === 'production' && (!process.env.JWT_ACCESS_SECRET || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY)) { throw / process.exit(1) }`. Keep the fallbacks for local dev only.

### F-15 — Feed comment delete/react skip parent-household check
`modules/feed/service.ts`: `deleteComment` (544-568), `toggleCommentReaction` (573-598) — both do `FeedComment.findByPk` with no household scoping; `getComments` already does it right (load post, check `post.householdId === callerHouseholdId`).

- Add a small helper `loadCommentInHousehold(commentId, householdId)` that does `FeedComment.findByPk` + `FeedPost.findByPk(comment.postId)` and throws `NotFoundError` if `post.householdId !== householdId`. Use it in both `deleteComment` and `toggleCommentReaction` before any other check.

---

## P2 — Schema, RBAC product decisions, tenant helper, prefs

### F-10 — No baseline migration; schema only exists via `sequelize.sync()`
`database/migrations/` (only incremental ALTERs since `20260802-*`), `index.ts` (`sequelize.sync()` gated to `nodeEnv === 'development'` only).

- Generate one baseline migration (`sequelize-cli migration:generate` seeded from current models, or `--init` snapshot) that `CREATE TABLE`s every one of the 39 models with their current shape, then mark it as already-applied in `SequelizeMeta` for existing dev/staging DBs (so it only matters for genuinely fresh environments, e.g. new prod). This unblocks any environment where `sequelize.sync()` is skipped (production) — today those have **no way** to create the schema at all.

### F-12 — `changeMemberRole` can mint unlimited extra admins
`modules/household/service.ts`: `changeMemberRole` (applies `body.role` with no restriction), `removeMember` (blanket-blocks removing any `admin` target), `transferAdmin` (clean 1:1 swap, no change needed).

- **Decision: single admin only.** Reject `body.role === 'admin'` in `changeMemberRole` (throw `AppError(400, ...)` directing to `transferAdmin` instead). No change needed to `removeMember`'s existing blanket admin-removal block — it already correctly enforces "transfer first" under a single-admin model. Update `modules/household/validation.ts`'s `ChangeRoleBody` schema/enum if it doesn't already reject `'admin'` at the Zod layer too (belt-and-suspenders with the service-layer check).

### F-13 — `getUserHousehold`/`getUserHouseholdId`/`ensureHouseholdMember` cloned in 13 files
Files: `calendar`, `chat`, `checkin`, `dashboard`, `expense`, `feed`, `grocery`, `journal`, `ping`, `place`, `task`, `todo`, `vault` service.ts — all near-identical `HouseholdMember.findOne({ where: { userId } })` bodies, only the thrown error message differs.

- Extract one shared helper into `shared/middleware/rbac.ts` or a new `shared/utils/household.ts`: `getUserHousehold(userId: string, context?: string): Promise<string>` — parameterize the error message. Replace all 13 local copies with imports. This is pure dedup — no behavior change (each call site keeps its own error copy via the `context` string), and it's the prerequisite for any future "second household per user" work the audit calls out.
- Wrap the one-membership-per-user invariant (`createHousehold`/`joinViaCode` conflict check) in a transaction — audit notes it's currently not transactional, which is a real race under concurrent join attempts.

### F-08 — Notification preferences never actually applied
`shared/services/notifications.ts` (`notifyUser`, `notifyHousehold` — no preference check), `modules/notification/service.ts` (`sendToUser` — only checks `env.fcm.enabled` + `options.skipPush`, never `NotificationPreference`).

- Add a `type → NotificationPreference field` map (e.g. `feed→newPost`, `task_assigned→taskAssigned`, `calendar→calendarEvent`, etc.) in `notification/service.ts`. In `sendToUser`, look up `NotificationPreference.findOne({ where: { userId } })` and skip the FCM push (keep history write, or gate that too — product decision) when the mapped field is `false`.
- Collapse the dual send paths (`shared/services/notifications.ts` wrapper vs direct `notification/service.ts sendToUser` imports) to one entry point so the preference gate can't be bypassed by callers that import the wrapped version vs the raw one.

---

## P3 — Jobs, docs, edges

### F-11 — Dashboard/jobs scan broadly, ignore household timezone, 4 crons share the API process
`jobs/overdue-points.ts`, `event-reminder.ts` (→ `modules/calendar/service.ts notifyUpcomingEvents`), `grocery-archive.ts`, `calendar-sync.ts`, all registered inline in `index.ts start()`; `ecosystem.config.js` (`instances: 1, fork`).

- Replace global `findAll` + JS filtering with `Task.count`/date-range `WHERE` clauses (SQL-side filtering) in `overdue-points.ts`.
- Read `households.timezone` (already a column per audit) in `notifyUpcomingEvents`/`overdue-points`/`grocery-archive` instead of raw server `Date` math — compute "today"/"1h window" per household's timezone.
- Leave the 4 jobs in-process (audit explicitly does **not** recommend a job-queue rewrite) — just fix the query shape and timezone handling. Only worth revisiting if a second PM2 instance is ever introduced (it isn't today — `ecosystem.config.js` confirms `instances: 1`).

### F-16 — Cover photo upload writes S3 before authorization; old object never deleted
`modules/household/controller.ts` (`uploadCoverPhoto`), `modules/household/service.ts` (`updateCoverPhoto`) — `deleteObject` already exists in `shared/utils/s3.ts` and is simply unused here.

- In `updateCoverPhoto`, capture `household.coverPhotoUrl` (old key) before overwriting; after `household.save()` succeeds, call `deleteObject(oldKey)` best-effort (catch/log, don't fail the request). Ideally also reorder `uploadCoverPhoto` controller to check membership/role **before** calling `uploadBuffer`, so a failed-authz request doesn't write to S3 at all — but `updateCoverPhoto` already re-checks `membership.role !== 'admin'` after upload, so at minimum add a pre-check in the controller to avoid the wasted upload.

### F-17 — Chat typing REST path broadcasts to the wrong room; FeedMedia query references a non-existent column
`modules/chat/service.ts` (`typingStart`/`typingStop`, lines 648-677 — emit to bare `householdId` instead of `household:${householdId}`), `sendMessage` (338-346 — `FeedMedia.findAll({ where: { householdId } })`, but `FeedMedia` has no such column).

- **Decision: remove the REST path.** Delete `typingStart`/`typingStop` from `modules/chat/service.ts`, their controller handlers, and the `POST /chat/typing` route in `modules/chat/routes.ts` — the socket-event path (`chat:typing`/`chat:stop-typing` in `socket/chatSocket.ts`) is already correct and is the one clients should use. Remove the corresponding dead test cases if `chat.service.test.ts` covers the REST path.
- Fix the `FeedMedia.findAll` query: either add a denormalized `householdId` column to `FeedMedia` (migration + backfill from `FeedPost`), or join through `FeedPost` (`include: [{ model: FeedPost, where: { householdId } }]`) instead of querying a nonexistent attribute directly.

### F-19 — `PingRequest.status: 'expired'` has no worker, only set as a side-effect
`modules/ping/service.ts` (`respondToPingRequest` sets `'expired'` only for stale duplicates of the *same* requester/target pair), `jobs/*` (none touch ping).

- **Decision: add 24h TTL expiry.** New job `jobs/ping-expiry.ts`, hourly (`0 * * * *`, same cadence as `grocery-archive`/`overdue-points`), does `PingRequest.update({ status: 'expired', respondedAt: new Date() }, { where: { status: 'pending', createdAt: { [Op.lte]: new Date(Date.now() - 24*60*60*1000) } } })` — no household filter needed (blanket update, matching the `grocery-archive` pattern). Register in `index.ts` alongside the other 4 `start*Job()` calls.

### F-18 — OpenAPI covers ~9 auth routes out of 147; Google body doc disagrees with the handler
`config/swagger.ts`, `modules/auth/routes.ts` (9 `@openapi` blocks, Google schema says `code`/`redirectUri` but handler expects `idToken`).

- Fix the existing Google `@openapi` JSDoc block to match the real request body (`idToken`), not the stale `code`/`redirectUri` shape.
- Incrementally add `@openapi` blocks to the highest-value modules first (household, chat, vault — the authz-sensitive ones per the audit's own P3 note), not all 147 routes in one pass.

---

## Explicitly not doing (per audit's own recommendation, still valid)
- No rewrite to microservices, new ORM, or job-queue platform.
- Not treating Jest's 70% `coverageThreshold` as a ship gate until the suite actually runs in CI with artifacts (`server/node_modules` currently missing — separate infra task, out of scope here).
- Not building a Socket.IO Redis adapter before a second Node instance exists (`ecosystem.config.js` is `instances: 1` today).

## Sequencing
Work P0 → P1 → P2 → P3 in that order, one finding (or tightly-related cluster, e.g. F-04/M-01/M-02 together, F-01/F-02/F-03 together) per commit, so each is independently reviewable and revertable. Do not batch unrelated findings into one commit.

## Verification
- For each P0 finding, write/extend the corresponding `modules/<x>/__tests__/service.test.ts` (test files already exist for all 16 modules) with a case that reproduces the exploit path pre-fix and asserts it's blocked post-fix (e.g. chat: non-participant `listMessages(conversationId=foreign)` → `ForbiddenError`; auth: `resetPassword` with correct code but wrong email → rejected).
- Run `cd server && npm test` after each cluster of fixes (note: audit flags `server/node_modules` as currently missing — will need `npm install` first; confirm this is expected/fine to run).
- For F-14/F-10 (env guard, baseline migration), manually verify: boot with `NODE_ENV=production` and unset `JWT_ACCESS_SECRET` → process must exit non-zero, not silently start.
- For F-06/F-13 refactors (JWT role → DB check, shared household helper), run the full existing test suite for every touched module (vault, feed, task, calendar, chat, checkin, dashboard, expense, grocery, journal, ping, place, todo) to catch behavior regressions from the dedup.
- No live DB, staging, or production environment should be touched — all verification is via the existing Jest suite plus manual boot checks in a local/dev environment.
