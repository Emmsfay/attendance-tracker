import { env } from "./_generated/server";

/*
 * Shared helpers for the attendance tracker.
 *
 * Business rules (locked in requirements):
 *  - Work day starts at 08:00. Clock-in after 08:00:00 => LATE.
 *  - Work day ends at 17:00 (5pm). Clock-out before 17:00:00 => TOO EARLY.
 *  - No grace period. Times are evaluated against the server clock.
 */

export const LATE_HOUR = 8;   // 08:00
export const EARLY_HOUR = 17; // 17:00 (5pm)

/** Calendar date string "YYYY-MM-DD" (server time). */
export function todayDateString(ms: number = Date.now()): string {
	return new Date(ms).toISOString().slice(0, 10);
}

/** Seconds since midnight for a timestamp. */
export function secondsSinceMidnight(ms: number): number {
	const d = new Date(ms);
	return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
}

export function isLate(ms: number): boolean {
	return secondsSinceMidnight(ms) > LATE_HOUR * 3600;
}

export function isTooEarly(ms: number): boolean {
	return secondsSinceMidnight(ms) < EARLY_HOUR * 3600;
}

export function hhmm(ms: number): string {
	const d = new Date(ms);
	const h = String(d.getUTCHours()).padStart(2, "0");
	const m = String(d.getUTCMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

/* ---------- Geofence (haversine) ---------- */

const RADIUS_EARTH_M = 6_371_000;

function toRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

export function distanceMeters(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * RADIUS_EARTH_M * Math.asin(Math.sqrt(a));
}

export interface Office {
	latitude: number;
	longitude: number;
	radiusMeters: number;
}

export function officeConfig(): Office {
	const e = env as Record<string, string | undefined>;
	return {
		latitude: Number(e["OFFICE_LATITUDE"] ?? 40.7128),
		longitude: Number(e["OFFICE_LONGITUDE"] ?? -74.006),
		radiusMeters: Number(e["OFFICE_RADIUS_METERS"] ?? 200),
	};
}

export function isWithinOffice(
	latitude: number,
	longitude: number,
): { within: boolean; distanceMeters: number } {
	const office = officeConfig();
	const d = distanceMeters(
		latitude,
		longitude,
		office.latitude,
		office.longitude,
	);
	return { within: d <= office.radiusMeters, distanceMeters: d };
}
