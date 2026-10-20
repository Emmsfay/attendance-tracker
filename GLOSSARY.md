# Glossary

Domain vocabulary for the attendance tracker. Use these terms (and only these) when naming concepts in issues, PRs, and code.

## Actors

- **Worker**: an employee who clocks in and clock out each work day. Sees only their own attendance records.
- **Manager**: a worker with the `manager` role. Can create worker accounts, view all workers' shifts, and correct records (e.g. forgotten clock-outs).

## Events

- **Clock in**: the action recording when a worker arrives at work. Must happen once per calendar day; after 08:00:00 it is flagged **late**.
- **Clock out**: the action recording when a worker leaves work. Must happen once per calendar day; before 17:00:00 (5pm) it is flagged **too early**.

## Status flags

- **Late**: clock-in timestamp is strictly after 08:00:00 on the same calendar day. No grace period.
- **Too early**: clock-out timestamp is strictly before 17:00:00 (5pm) on the same calendar day.
- **Open shift**: a worker has clocked in but not yet clocked out. Visible to managers for correction.
- **On site / Off site**: whether a punch's GPS coordinates fall within the office geofence radius. Recorded but does not block the punch.

## Data

- **Shift / Attendance record**: one row per worker per calendar day, holding clock-in time, clock-out time, GPS locations for both punches, status flags, and optional manager note.
- **Geofence**: the office location (latitude/longitude) and radius (meters) used to tag punches as on-site or off-site. Configurable via environment variables.

## Rules

- Work day resets at midnight.
- One clock-in + one clock-out per calendar day.
- No overnight shifts; all times evaluated against server-local time on the same calendar day.
