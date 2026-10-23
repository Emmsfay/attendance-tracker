<script lang="ts">
	import { onMount } from "svelte";
	import { convex } from "#lib/convex/client";
	import { api } from "#lib/convex/generated";
	import { icon } from "#lib/icons";
	import type { GenericId as Id } from "convex/values";

	let workers = $state<any[]>([]);
	let today = $state<any[]>([]);
	let loading = $state(true);
	let error = $state("");
	let msg = $state("");

	let newEmail = $state("");
	let newPassword = $state("");
	let newName = $state("");
	let newEmployeeId = $state("");
	let newRole: "worker" | "manager" = $state("worker");

	let fixId = $state("" as unknown as Id<"attendance">);
	let fixClockIn = $state("");
	let fixClockOut = $state("");
	let fixNote = $state("");

	async function load() {
		loading = true;
		error = "";
		try {
			workers = await convex.query(api.workers.getWorkers, {});
			today = await convex.query(api.attendance.getTodayAttendance, {});
		} catch (err: any) {
			error = err?.message || "Failed to load admin data";
		} finally {
			loading = false;
		}
	}

	onMount(load);

	const todayMs = (hhmm: string): number | undefined => {
		if (!hhmm) return undefined;
		const todayStr = new Date().toISOString().slice(0, 10);
		const [h, m] = hhmm.split(":").map(Number);
		return new Date(`${todayStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`).getTime();
	};

	async function createWorker() {
		msg = "";
		error = "";
		try {
			await convex.action(api.workers.createWorker, {
				email: newEmail,
				password: newPassword,
				name: newName,
				employeeId: newEmployeeId,
				role: newRole
			});
			msg = "Worker created";
			newEmail = newPassword = newName = newEmployeeId = "";
			await load();
		} catch (err: any) {
			error = err?.message || "Create worker failed";
		}
	}

	async function fixRecord() {
		msg = "";
		error = "";
		try {
			await convex.mutation(api.attendance.updateAttendance, {
				attendanceId: fixId,
				clockIn: todayMs(fixClockIn),
				clockOut: todayMs(fixClockOut),
				note: fixNote || undefined
			});
			msg = "Record corrected";
			fixId = "" as unknown as Id<"attendance">;
			fixClockIn = fixClockOut = fixNote = "";
			await load();
		} catch (err: any) {
			error = err?.message || "Fix failed";
		}
	}
</script>

<article class="onsite-page">
	<div class="onsite-page-head">
		<div>
			<p class="onsite-eyebrow">Manager view</p>
			<h1 class="onsite-page-title">Admin</h1>
			<p class="onsite-page-sub">
				Create worker accounts and correct attendance records.
			</p>
		</div>
		<div class="onsite-head-side"></div>
	</div>

	{#if error}
		<div class="onsite-alert">{error}</div>
	{/if}
	{#if msg}
		<div class="onsite-notice">{msg}</div>
	{/if}

	{#if loading}
		<p style="padding:40px 0;text-align:center;color:var(--onsite-ink-soft)">Loading&hellip;</p>
	{:else}
		<section class="onsite-card">
			<div class="onsite-card-head">
				<h2>Create worker</h2>
			</div>
			<form class="onsite-form-grid" onsubmit={(e) => { e.preventDefault(); createWorker(); }} novalidate>
				<div class="onsite-field">
					<label>Email</label>
					<input class="onsite-input" bind:value={newEmail} type="email" placeholder="alice@company.com" required />
				</div>
				<div class="onsite-field">
					<label>Password (min 8 chars)</label>
					<input class="onsite-input" bind:value={newPassword} type="password" required />
				</div>
				<div class="onsite-field">
					<label>Full name</label>
					<input class="onsite-input" bind:value={newName} placeholder="Alice Smith" required />
				</div>
				<div class="onsite-field">
					<label>Employee id</label>
					<input class="onsite-input" bind:value={newEmployeeId} placeholder="EMP-001" required />
				</div>
				<div class="onsite-field">
					<label>Role</label>
					<select class="onsite-input" bind:value={newRole}>
						<option value="worker">Worker</option>
						<option value="manager">Manager</option>
					</select>
				</div>
				<button type="submit" class="onsite-btn onsite-btn-primary onsite-btn-full">Create worker</button>
			</form>
		</section>

		<section class="onsite-card">
			<div class="onsite-card-head">
				<h2>Workers ({workers.length})</h2>
			</div>
			<table>
				<thead>
					<tr>
						<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Name</th>
						<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Employee id</th>
						<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Role</th>
						<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Active</th>
					</tr>
				</thead>
				<tbody>
					{#each workers as w}
						<tr style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border)">
							<td>{w.name}</td>
							<td>{w.employeeId}</td>
							<td>{w.role}</td>
							<td>{w.isActive ? "Yes" : "No"}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="onsite-card">
			<div class="onsite-card-head">
				<h2>Today's attendance</h2>
			</div>
			{#if today.length === 0}
				<p style="padding:1rem 0;color:var(--onsite-ink-soft)">No shifts recorded today.</p>
			{:else}
				<table>
					<thead>
						<tr>
							<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Worker</th>
							<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Employee id</th>
							<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Clock in</th>
							<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Clock out</th>
							<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Status</th>
							<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Action</th>
						</tr>
					</thead>
					<tbody>
						{#each today as r}
							<tr style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border)">
								<td>{r.workerName}</td>
								<td>{r.employeeId}</td>
								<td>{r.clockInTime ?? "\u2014"}</td>
								<td>{r.clockOutTime ?? "\u2014"}</td>
								<td class="status" style="white-space:normal">
									{#if r.isLate}<span class="onsite-chip onsite-chip-late">Late</span>{/if}
									{#if r.isTooEarly}<span class="onsite-chip onsite-chip-early">Early-out</span>{/if}
									{#if !r.clockOut && r.clockIn}<span class="onsite-chip onsite-chip-neutral">Open shift</span>{/if}
									{#if r.clockInOnSite === false}<span class="onsite-chip onsite-chip-neutral">In: off-site</span>{/if}
								</td>
								<td>
									<button
										onclick={() => {
											fixId = r._id as unknown as Id<"attendance">;
											fixClockIn = r.clockInTime ?? "";
											fixClockOut = r.clockOutTime ?? "";
										}}
										class="onsite-btn onsite-btn-quiet onsite-btn-sm"
									>
										{@html icon("doc", "onsite-od-icon-16")} Fix
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<section class="onsite-card">
			<div class="onsite-card-head">
				<h2>Correct a record</h2>
			</div>
			<form class="onsite-form-grid" onsubmit={(e) => { e.preventDefault(); fixRecord(); }} novalidate>
				<div class="onsite-field">
					<label>Record id</label>
					<input class="onsite-input" bind:value={fixId} placeholder="attendance id" required />
				</div>
				<div class="onsite-field">
					<label>Clock in (HH:mm)</label>
					<input class="onsite-input" bind:value={fixClockIn} type="time" />
				</div>
				<div class="onsite-field">
					<label>Clock out (HH:mm)</label>
					<input class="onsite-input" bind:value={fixClockOut} type="time" />
				</div>
				<div class="onsite-field">
					<label>Note</label>
					<input class="onsite-input" bind:value={fixNote} placeholder="e.g. forgot to clock out" />
				</div>
				<button type="submit" class="onsite-btn onsite-btn-primary">Correct record</button>
			</form>
			<p class="onsite-muted" style="margin-top:0.75rem">
				Times are interpreted as today's date. Click "Fix" on a record above to pre-fill its id and times.
			</p>
		</section>
	{/if}
</article>

<style>

	.status {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--onsite-danger-ink);
		white-space: normal;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.5rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid var(--onsite-border);
	}
	tr:hover {
		background: var(--onsite-surface);
	}
</style>
