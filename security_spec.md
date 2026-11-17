# FinGuide AI Firestore Security Specification

## Data Invariants
1. **Owner Isolation**: `users/{userId}` and `assessments/{userId}` can only be read, created, or updated by the verified user whose `request.auth.uid == userId` (or verified founder admin for reads).
2. **No Self-Admin Escalation**: `admins/{userId}` cannot be written by any client SDK. Admin privileges require `request.auth.token.email_verified == true` and explicit email match (`ashish.0251mba569@dgu.ac.in`) or an existing `admins` document.
3. **Strict Schema & Bounds**: Every string has `.size()` bounds, enums are strictly allowlisted, `score` is bounded `0 <= score <= 100`, and `keys().hasAll(...) && keys().hasOnly(...)` blocks shadow fields.
4. **Immutable Ownership & Timestamps**: `createdAt` and `uid`/`userId` cannot change on update; `createdAt` and `updatedAt` must equal `request.time`.
5. **Monotonic Metrics Protection**: `validation_stats/summary` counters cannot be decremented or jumped by arbitrary amounts by regular users (only +0 or +1 increments per update; only verified admin can reset).

## Dirty Dozen Adversarial Payloads
1. Unauthenticated read of `/users/user123` -> `PERMISSION_DENIED`
2. Unverified email (`email_verified: false`) writing `/users/user123` -> `PERMISSION_DENIED`
3. Spoofed `userId` in `/assessments/user123` where `incoming().userId == 'victim'` -> `PERMISSION_DENIED`
4. Shadow field injection (`{ isAdmin: true }`) in `/users/user123` -> `PERMISSION_DENIED`
5. Oversized string (`displayName` > 100 chars or `note` > 500 chars) -> `PERMISSION_DENIED`
6. Invalid enum (`stage: 'billionaire'`) in `/assessments/user123` -> `PERMISSION_DENIED`
7. Out-of-bounds score (`score: 999`) in `/assessments/user123` -> `PERMISSION_DENIED`
8. Cross-user `get` on `/wtp_feedback/fb1` where `resource.data.userId != request.auth.uid` -> `PERMISSION_DENIED`
9. Unfiltered `list` on `/wtp_feedback` by non-admin user -> `PERMISSION_DENIED`
10. Spoofed admin (`email: 'ashish.0251mba569@dgu.ac.in'`, `email_verified: false`) reading `/wtp_feedback` -> `PERMISSION_DENIED`
11. Arbitrary counter jump (`visits: 99999`) on `/validation_stats/summary` by non-admin -> `PERMISSION_DENIED`
12. Client-supplied fake timestamp (`createdAt` != `request.time`) -> `PERMISSION_DENIED`
