import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/** One profile per auth user; if duplicates exist, prefer manager then newest. */
export async function workerProfileForUserId(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<Doc<"workers"> | null> {
	const rows = await ctx.db
		.query("workers")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();
	if (rows.length === 0) {
		return null;
	}
	if (rows.length === 1) {
		return rows[0];
	}
	rows.sort((a, b) => b._creationTime - a._creationTime);
	const manager = rows.find((w) => w.role === "manager");
	return manager ?? rows[0];
}

/** Remove duplicate worker rows for the same userId (keeps one profile per user). */
export async function dedupeWorkerProfiles(ctx: MutationCtx): Promise<number> {
	const all = await ctx.db.query("workers").collect();
	const byUser = new Map<Id<"users">, Doc<"workers">[]>();
	for (const w of all) {
		const list = byUser.get(w.userId) ?? [];
		list.push(w);
		byUser.set(w.userId, list);
	}
	let removed = 0;
	for (const list of byUser.values()) {
		if (list.length <= 1) {
			continue;
		}
		list.sort((a, b) => b._creationTime - a._creationTime);
		const keep =
			list.find((w) => w.role === "manager" && w.isActive) ??
			list.find((w) => w.role === "manager") ??
			list.find((w) => w.isActive) ??
			list[0];
		for (const w of list) {
			if (w._id !== keep._id) {
				await ctx.db.delete(w._id);
				removed++;
			}
		}
	}
	return removed;
}
