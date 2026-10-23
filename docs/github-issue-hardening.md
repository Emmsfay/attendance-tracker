# GitHub issue draft (paste into https://github.com/Emmsfay/attendance-tracker/issues/new)

**Title:** Harden attendance app: auth, worker profiles, dashboard clock-in

**Labels:** `ready-for-human` (optional)

## Summary

Fixes from first manager/worker onboarding: sign-in, admin worker creation, and worker clock-in were failing or crashing in dev.

## Problems observed

- **Convex Auth**: Sign-in failed without `JWT_PRIVATE_KEY`; session confirmation timed out without **JWKS** (both required).
- **Bootstrap**: `createFirstManager` requires JSON args; re-run fails with "A manager already exists".
- **Duplicate worker profiles**: Multiple `workers` rows per auth user broke `getMe`.
- **Worker dashboard**: After clock-in, page crashed because **Worked** time treated epoch-ms `clockIn` as `HH:mm`.
- **UI/routing**: Hash routes, missing data loads, prototype login copy.

## Test plan

- [ ] Set `JWT_PRIVATE_KEY` and `JWKS` on dev deployment
- [ ] Bootstrap manager; sign in → Admin
- [ ] Create worker; sign in → Dashboard; clock in/out
- [ ] Manager sees Today's attendance
