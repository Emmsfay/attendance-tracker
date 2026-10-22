## Problem Statement

Workers in a company need a way to record when they come to work and when they leave. Anything clocked in above 8:00am is considered late, and anything clocked out before 5pm is considered too early. The system must also track the worker's location at each punch. Managers need visibility into everyone's attendance and the ability to correct records (for example, when a worker forgets to clock out). Workers should only see their own records.

## Solution

A full-stack attendance tracking application built with SvelteKit (frontend) and Convex (backend database, auth, and server functions). Workers sign in with email/password and clock in/out from a dashboard; each punch is stamped with the time and GPS location. The system flags late arrivals (>08:00) and early departures (<17:00) with no grace period, checks each punch against an office geofence, and enforces one clock-in + one clock-out per calendar day. Managers can create worker accounts, view all shifts, and correct records.

## User Stories

1. As a worker, I want to sign in with my email and password, so that I can access my own attendance dashboard.
2. As a worker, I want to click "Clock in" when I arrive at work, so that my arrival time and GPS location are recorded.
3. As a worker, I want to click "Clock out" when I leave work, so that my departure time and GPS location are recorded.
4. As a worker, I want to see my clock-in and clock-out times for today, so that I know whether my shift is complete.
5. As a worker, I want to see a "Late" flag when I clock in after 08:00, so that I am aware of my tardiness.
6. As a worker, I want to see an early-out flag when I clock out before 17:00, so that I am aware I left early.
7. As a worker, I want to see my attendance history (date, clock-in, clock-out, status, location), so that I can review my past shifts.
8. As a worker, I want the system to prevent me from clocking in twice in one day, so that my record stays accurate.
9. As a worker, I want the system to prevent me from clocking out without clocking in first, so that shifts are well-formed.
10. As a worker, I want my GPS location recorded at every punch, so that there is an auditable record of where I was.
11. As a manager, I want to sign in with my email and password, so that I can access the admin dashboard.
12. As a manager, I want to create worker accounts (name, email, password, employee id, role), so that new employees can use the system.
13. As a manager, I want to view all workers' attendance records, so that I can oversee the whole team.
14. As a manager, I want to view today's attendance for all workers at a glance, so that I can see who is present, late, or has an open shift.
15. As a manager, I want to see late and early-out flags on every worker's record, so that I can spot attendance issues quickly.
16. As a manager, I want to see whether each punch was on-site or off-site relative to the office geofence, so that I know where workers were.
17. As a manager, I want to correct a worker's clock-in or clock-out time (e.g. when they forgot to clock out), so that records stay accurate.
18. As a manager, I want to add a note when correcting a record, so that the reason for the correction is documented.
19. As a manager, I want workers to only see their own records (not their colleagues'), so that privacy is respected.
20. As a manager, I want to create additional manager accounts, so that other supervisors can use the admin features.
21. As the first person setting up the system, I want to bootstrap the initial manager account, so that the system can be used.
22. As a worker or manager, I want to sign out, so that my session is secured when I leave the computer.

## Implementation Decisions

- Stack: SvelteKit 5 (runes) frontend + Convex backend (database, auth, server functions).
- Authentication: Convex Auth with the email/password provider; roles `worker` and `manager` stored on a `workers` profile linked to the Convex Auth `users` table.
- Database schema: `workers` (userId, role, employeeId, name, isActive) and `attendance` (workerId, date, clockIn, clockOut, clockInLocation, clockOutLocation, note), plus Convex Auth tables (`users`, `authSessions`, `authAccounts`, ...). Indexes on `workers.by_user`, `workers.by_role`, `attendance.by_worker_date`, `attendance.by_date`.
- Location: GPS latitude/longitude (+ accuracy, timestamp) captured at each clock-in and clock-out; optional if geolocation is denied.
- Geofence: office latitude/longitude/radius (meters) configured via environment variables (`OFFICE_LATITUDE`, `OFFICE_LONGITUDE`, `OFFICE_RADIUS_METERS`); each punch tagged on-site/off-site via haversine distance. Does not block punches.
- Business rules: work day resets at midnight; one clock-in + one clock-out per calendar day; late = clock-in strictly after 08:00:00; too early = clock-out strictly before 17:00:00; no grace period; no overnight shifts; all times evaluated against server-local time on the same calendar day.
- Access control: workers query only their own attendance and profile; managers can read all workers and all attendance, create workers, and correct records; bootstrap `createFirstManager` only callable when no workers exist.
- Frontend routes: `/login`, `/dashboard` (worker clock in/out + own history), `/attendance` (worker full history), `/admin` (manager: create workers, today's attendance, correct records).
- Navigation/auth gating: unauthenticated users redirected to `/login`; manager-only routes guarded server-side in Convex functions.

## Testing Decisions

- Good tests assert external behavior only (what a user or caller observes), not implementation details.
- Highest test seam: the Convex backend functions (`clockIn`, `clockOut`, `updateAttendance`, `createWorker`, `getMyAttendance`, `getTodayAttendance`, `getWorkers`, `getMe`), because they encapsulate all business rules (late/early, geofence, one-shift-per-day, access control). Testing at this seam covers the logic without requiring browser automation.
- Modules to test: `convex/attendance.ts` and `convex/workers.ts` functions.
- Prior art: none yet in this repo (no test framework configured). Add Vitest for Convex function tests if test coverage is desired; the Convex functions are deterministic and DB-backed, so tests should run against a throwaway local Convex deployment and assert on returned records/flags/errors.

## Out of Scope

- Notifications/alerts (email, SMS, in-app) for late or early punches.
- Multiple offices, multiple time zones, or overnight shifts.
- Mobile app (native iOS/Android); this is a web app.
- Payroll integration, overtime calculation, or leave management.
- Self-registration of workers (accounts are created by a manager).
- Email verification or password reset flows.

## Further Notes

- The `JWT_PRIVATE_KEY` environment variable must be set on the Convex deployment (via the Convex dashboard) for sign-in to work; the CLI cannot reliably multiline-paste it from all shells.
- Office geofence defaults to New York City (40.7128, -74.0060) with a 200 m radius; adjust via env vars.
- The first manager account must be bootstrapped via `npx convex run workers:createFirstManager ...` before anyone can sign in.
