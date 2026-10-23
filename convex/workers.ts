import {
	action,
	query,
	internalQuery,
	internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId, createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
	dedupeWorkerProfiles,
	workerProfileForUserId,
} from "./workerProfile";

/* ------------------------------------------------------------------ */
/* Internal helpers (usable from actions via ctx.runQuery/runMutation) */
/* ------------------------------------------------------------------ */

/** Whether any worker profile exists yet (used for one-time bootstrap). */
export const hasWorkers = internalQuery({
	args: {},
	handler: async (ctx) => {
		const row = await ctx.db.query("workers").take(1);
		return row.length > 0;
	},
});

/** Look up a worker profile by Convex Auth user id (no auth check). */
export const getWorkerByUserId = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await workerProfileForUserId(ctx, args.userId);
	},
});

/** One-time cleanup when duplicate profiles exist for the same login. */
export const dedupeWorkerProfilesMutation = internalMutation({
	args: {},
	handler: async (ctx) => {
		const removed = await dedupeWorkerProfiles(ctx);
		return { removed };
	},
});

/** Look up a worker profile by employee id (no auth check). */
export const getWorkerByEmployeeId = internalQuery({
	args: { employeeId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workers")
			.filter((q) => q.eq(q.field("employeeId"), args.employeeId))
			.unique();
	},
});

/** Insert a worker profile row. */
export const insertWorker = internalMutation({
	args: {
		userId: v.id("users"),
		role: v.union(v.literal("worker"), v.literal("manager")),
		employeeId: v.string(),
		name: v.string(),
		isActive: v.boolean(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("workers", args);
	},
});

/* ------------------------------------------------------------------ */
/* Auth-aware helpers                                                 */
/* ------------------------------------------------------------------ */

async function requireWorker(ctx: any): Promise<any> {
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
	const worker = await requireWorker(ctx);
	if (worker.role !== "manager") {
		throw new Error("Manager only");
	}
	return worker;
}

async function requireManagerInAction(ctx: any): Promise<any> {
	const userId = await getAuthUserId(ctx);
	if (userId === null) {
		throw new Error("Not authenticated");
	}
	const worker = await ctx.runQuery(internal.workers.getWorkerByUserId, {
		userId,
	});
	if (!worker) {
		throw new Error("No worker profile for this account");
	}
	if (worker.role !== "manager") {
		throw new Error("Manager only");
	}
	return worker;
}

/* ------------------------------------------------------------------ */
/* Bootstrap: create the very first manager account                   */
/* ------------------------------------------------------------------ */

/**
 * Create the first manager account. Only callable when no workers exist
 * yet (one-time bootstrap). After this, managers create workers via
 * `createWorker`.
 */
export const createFirstManager = action({
	args: {
		email: v.string(),
		password: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const done = await ctx.runQuery(internal.workers.hasWorkers, {});
		if (done) {
			throw new Error("A manager already exists");
		}
		const created = await createAccount(ctx, {
			provider: "password",
			account: { id: args.email, secret: args.password },
			profile: { name: args.name, email: args.email },
			shouldLinkViaEmail: false,
			shouldLinkViaPhone: false,
		});
		const userId = created.user._id;
		await ctx.runMutation(internal.workers.insertWorker, {
			userId,
			role: "manager",
			employeeId: "MGR-001",
			name: args.name,
			isActive: true,
		});
		return { userId, role: "manager" as const };
	},
});

/* ------------------------------------------------------------------ */
/* Worker management (manager only)                                   */
/* ------------------------------------------------------------------ */

/**
 * Create a worker account + profile. Manager only.
 */
export const createWorker = action({
	args: {
		email: v.string(),
		password: v.string(),
		name: v.string(),
		employeeId: v.string(),
		role: v.union(v.literal("worker"), v.literal("manager")),
	},
	handler: async (ctx, args) => {
		await requireManagerInAction(ctx);
		const existing = await ctx.runQuery(internal.workers.getWorkerByEmployeeId, {
			employeeId: args.employeeId,
		});
		if (existing) {
			throw new Error("Employee id already exists");
		}
		const created = await createAccount(ctx, {
			provider: "password",
			account: { id: args.email, secret: args.password },
			profile: { name: args.name, email: args.email },
			shouldLinkViaEmail: false,
			shouldLinkViaPhone: false,
		});
		const userId = created.user._id;
		const existingProfile = await ctx.runQuery(
			internal.workers.getWorkerByUserId,
			{ userId },
		);
		if (existingProfile) {
			throw new Error("This email already has a worker profile");
		}
		await ctx.runMutation(internal.workers.insertWorker, {
			userId,
			role: args.role,
			employeeId: args.employeeId,
			name: args.name,
			isActive: true,
		});
		return { userId, role: args.role };
	},
});

export const getWorkers = query({
	args: {},
	handler: async (ctx) => {
		await requireManager(ctx);
		return await ctx.db.query("workers").order("desc").collect();
	},
});

export const getMe = query({
	args: {},
	handler: async (ctx) => {
		const worker = await requireWorker(ctx);
		return worker;
	},
});

export const getWorker = query({
	args: { workerId: v.id("workers") },
	handler: async (ctx, args) => {
		const caller = await requireWorker(ctx);
		if (caller.role !== "manager" && caller._id !== args.workerId) {
			throw new Error("Not allowed");
		}
		return await ctx.db.get(args.workerId);
	},
});
