# Security Specification: School Census & Demographics (ប.សរោគ)

## 1. Data Invariants
- Citizen records (`/citizens/{citizenId}`) must contain valid `name`, `gender`, numeric `age` (0-120), `householdId` (> 0), and an allowed school string.
- School statistics (`/schools/{schoolId}`) must contain valid `schoolId`, `schoolName`, and non-negative integers for demographic cohorts.
- User profiles (`/users/{userId}`) can only be written by the authenticated owner (`request.auth.uid == userId`).
- Anyone can read census data and school statistics for transparent educational planning and public reporting, while writes (create, update, delete) are permitted for authenticated staff/administrators with strict schema validation.
- All IDs must match safe identifier pattern: `^[a-zA-Z0-9_\\-]+$`.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated injection**: Writing citizen record without authentication credentials.
2. **Ghost field attack**: Sending extra shadow fields like `isAdmin: true` into `/citizens/{citizenId}`.
3. **Invalid Age Overflow**: Attempting to record a citizen with negative age or age > 150.
4. **Invalid Gender injection**: Attempting to set gender to arbitrary strings outside `['ប្រុស', 'ស្រី', 'Male', 'Female']`.
5. **Path Traversal / ID Poisoning**: Using a 1KB string or SQL injection pattern as document ID.
6. **Self-Escalation in User Profile**: Authenticated user trying to update their own `role` to `admin`.
7. **User Profile Hijacking**: User A attempting to modify `/users/{userB}`.
8. **Negative Population in School Stat**: Setting `totalPopulation` or child cohort counts to negative numbers.
9. **Blanket Query Scraping on PII**: Requesting unvalidated collections without valid document IDs.
10. **Household ID Poisoning**: Setting `householdId` to 0 or negative numbers or strings.
11. **Huge String Denial-of-Wallet**: Sending a 500KB `name` string to exhaust memory and storage.
12. **Orphaned Writes**: Attempting to delete critical school records without valid credentials.
