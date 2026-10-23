import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
	isLate,
	isTooEarly,
	isWithinOffice,
	todayDateString,
	hhmm,
} from "./utils";
import { workerProfileForUserId } from "./workerProfile";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

async function getWorkerProfile(ctx: any): Promise<any> {
	const userId = await getAuthUserId(ctx);
	if (userId === null) {
		throw new Error("Not authenticated");
	}
	const worker = await workerProfileForUserId(ctx, userId);
	if (!worker) {
		throw new Error("No worker profile for this account");
	}
	return worker;
}

async function requireManager(ctx: any): Promise<any> {
	const worker = await getWorkerProfile(ctx);
	if (worker.role !== "manager") {
		throw new Error("Manager only");
	}
	return worker;
}

/** Derive display fields for an attendance row. */
function enrich(row: any): any {
	const clockIn = row.clockIn ?? null;
	const clockOut = row.clockOut ?? null;
	const clockInLoc = row.clockInLocation ?? null;
	const clockOutLoc = row.clockOutLocation ?? null;
	return {
		...row,
		clockInTime: clockIn ? hhmm(clockIn) : null,
		clockOutTime: clockOut ? hhmm(clockOut) : null,
		isLate: clockIn ? isLate(clockIn) : false,
		isTooEarly: clockOut ? isTooEarly(clockOut) : false,
		clockInOnSite: clockInLoc
			? isWithinOffice(clockInLoc.latitude, clockInLoc.longitude).within
			: null,
		clockOutOnSite: clockOutLoc
			? isWithinOffice(clockOutLoc.latitude, clockOutLoc.longitude).within
			: null,
	};
}

/* ------------------------------------------------------------------ */
/* Clock in / out                                                     */
/* ------------------------------------------------------------------ */

export const clockIn = mutation({
	args: {
		location: v.optional(
			v.object({
				latitude: v.number(),
				longitude: v.number(),
				accuracy: v.optional(v.number()),
				timestamp: v.number(),
			})
		),
	},
	handler: async (ctx, args) => {
		const worker = await getWorkerProfile(ctx);
		const now = Date.now();
		const date = todayDateString(now);

		const existing = await ctx.db
			.query("attendance")
			.withIndex("by_worker_date", (q: any) =>
				q.eq("workerId", worker._id).eq("date", date),
			)
			.unique();

		if (existing !== null) {
			if (existing.clockIn != null) {
				throw new Error("Already clocked in today");
			}
			await ctx.db.patch(existing._id, {
				clockIn: now,
				clockInLocation: args.location ?? undefined,
			});
			return enrich({
				...existing,
				clockIn: now,
				clockInLocation: args.location ?? undefined,
			});
		}

		const _id = await ctx.db.insert("attendance", {
			workerId: worker._id,
			date,
			clockIn: now,
			clockInLocation: args.location ?? undefined,
		});
		return enrich({
			_id,
			workerId: worker._id,
			date,
			clockIn: now,
			clockInLocation: args.location ?? undefined,
		});
	},
});

export const clockOut = mutation({
	args: {
		location: v.optional(
			v.object({
				latitude: v.number(),
				longitude: v.number(),
				accuracy: v.optional(v.number()),
				timestamp: v.number(),
			})
		),
	},
	handler: async (ctx, args) => {
		const worker = await getWorkerProfile(ctx);
		const now = Date.now();
		const date = todayDateString(now);

		const existing = await ctx.db
			.query("attendance")
			.withIndex("by_worker_date", (q: any) =>
				q.eq("workerId", worker._id).eq("date", date),
			)
			.unique();

		if (existing === null || existing.clockIn == null) {
			throw new Error("Not clocked in today");
		}
		if (existing.clockOut != null) {
			throw new Error("Already clocked out today");
		}

		await ctx.db.patch(existing._id, {
			clockOut: now,
			clockOutLocation: args.location ?? undefined,
		});
		return enrich({ ...existing, clockOut: now, clockOutLocation: args.location ?? undefined });
	},
});

/* ------------------------------------------------------------------ */
/* Manager correction (forgotten clock-out, etc.)                     */
/* ------------------------------------------------------------------ */

export const updateAttendance = mutation({
	args: {
		attendanceId: v.id("attendance"),
		clockIn: v.optional(v.number()),
		clockOut: v.optional(v.number()),
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireManager(ctx);
		const existing = await ctx.db.get(args.attendanceId);
		if (!existing) {
			throw new Error("Attendance record not found");
		}
		const patch: Record<string, any> = {};
		if (args.clockIn !== undefined) patch.clockIn = args.clockIn;
		if (args.clockOut !== undefined) patch.clockOut = args.clockOut;
		if (args.note !== undefined) patch.note = args.note;
		await ctx.db.patch(args.attendanceId, patch);
		return enrich({ ...existing, ...patch });
	},
});

/* ------------------------------------------------------------------ */
/* Queries                                                            */
/* ------------------------------------------------------------------ */

export const getMyAttendance = query({
	args: {},
	handler: async (ctx) => {
		const worker = await getWorkerProfile(ctx);
		const rows = await ctx.db
			.query("attendance")
			.withIndex("by_worker_date", (q: any) => q.eq("workerId", worker._id))
			.order("desc")
			.collect();
		return rows.map(enrich);
	},
});

export const getAttendance = query({
	args: { workerId: v.optional(v.id("workers")) },
	handler: async (ctx, args) => {
		await requireManager(ctx);
		let q: any = ctx.db.query("attendance");
		if (args.workerId) {
			q = q.withIndex("by_worker_date", (qb: any) =>
				qb.eq("workerId", args.workerId),
			);
		}
		q = q.order("desc");
		const rows = await q.collect();
		return rows.map(enrich);
	},
});

export const getTodayAttendance = query({
	args: {},
	handler: async (ctx) => {
		await requireManager(ctx);
		const date = todayDateString();
		const rows = await ctx.db
			.query("attendance")
			.withIndex("by_date", (q: any) => q.eq("date", date))
			.collect();
		const workers = await ctx.db.query("workers").collect();
		const byId = new Map(workers.map((w) => [w._id, w]));
		return rows.map((row) => {
			const w = byId.get(row.workerId);
			return {
				...enrich(row),
				workerName: w?.name ?? null,
				workerRole: w?.role ?? null,
				employeeId: w?.employeeId ?? null,
			};
		});
	},
});
