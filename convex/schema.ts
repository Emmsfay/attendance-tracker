import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/*
 * Attendance tracker schema.
 *
 * - `users`, `authSessions`, `authAccounts`, ... come from Convex Auth
 *   (`authTables`) and handle sign-in / sessions securely.
 * - `workers` is a profile linked to a Convex Auth `user`. It holds the
 *   role (worker | manager) and employee id.
 * - `attendance` stores one row per worker per calendar day with clock
 *   in/out times and GPS locations.
 */
export default defineSchema({
	...authTables,
	workers: defineTable({
		userId: v.id("users"),
		role: v.union(v.literal("worker"), v.literal("manager")),
		employeeId: v.string(),
		name: v.string(),
		isActive: v.boolean(),
	})
		.index("by_user", ["userId"])
		.index("by_role", ["role"]),
	attendance: defineTable({
		workerId: v.id("workers"),
		// Local calendar date, e.g. "2026-10-20"
		date: v.string(),
		clockIn: v.optional(v.number()), // epoch ms
		clockOut: v.optional(v.number()), // epoch ms
		clockInLocation: v.optional(
			v.object({
				latitude: v.number(),
				longitude: v.number(),
				accuracy: v.optional(v.number()),
				timestamp: v.number(),
			})
		),
		clockOutLocation: v.optional(
			v.object({
				latitude: v.number(),
				longitude: v.number(),
				accuracy: v.optional(v.number()),
				timestamp: v.number(),
			})
		),
		note: v.optional(v.string()),
	})
		.index("by_worker_date", ["workerId", "date"])
		.index("by_date", ["date"]),
});
