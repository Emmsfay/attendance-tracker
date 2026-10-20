<script lang="ts">
	import { onMount } from "svelte";
	import { convex } from "../../lib/convex/client";
	import { api } from "../../lib/convex/generated";
	import type { GenericId as Id } from "convex/values";

	let workers: any[] = $state([]);
	let today: any[] = $state([]);
	let loading = $state(true);
	let error = $state("");
	let msg = $state("");

	// Create worker form
	let newEmail = $state("");
	let newPassword = $state("");
	let newName = $state("");
	let newEmployeeId = $state("");
	let newRole: "worker" | "manager" = $state("worker");

	// Fix record form
	let fixId = $state("" as unknown as Id<"attendance">);
	let fixClockIn = $state(""); // HH:mm
	let fixClockOut = $state(""); // HH:mm
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

	async function createWorker() {
		msg = "";
		error = "";
		try {
			await convex.action(api.workers.createWorker, {
				email: newEmail,
				password: newPassword,
				name: newName,
				employeeId: newEmployeeId,
				role: newRole,
			});
			msg = "Worker created";
			newEmail = newPassword = newName = newEmployeeId = "";
			await load();
		} catch (err: any) {
			error = err?.message || "Create worker failed";
		}
	}

	function todayMs(hhmm: string): number | undefined {
		if (!hhmm) return undefined;
		const todayStr = new Date().toISOString().slice(0, 10);
		const [h, m] = hhmm.split(":").map(Number);
		return new Date(`${todayStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`).getTime();
	}

	async function fixRecord() {
		msg = "";
		error = "";
		try {
			await convex.mutation(api.attendance.updateAttendance, {
				attendanceId: fixId,
				clockIn: todayMs(fixClockIn),
				clockOut: todayMs(fixClockOut),
				note: fixNote || undefined,
			});
			msg = "Record corrected";
			fixId = "" as unknown as Id<"attendance">;
			fixClockIn = fixClockOut = fixNote = "";
			await load();
		} catch (err: any) {
			error = err?.message || "Fix failed";
		}
	}

	function flag(label: string, color: string) {
		return `<span class="flag" style="background:${color}">${label}</span>`;
	}
</script>

<div class="page">
	<h1>Admin</h1>
	<p class="hint">Manager view: create worker accounts and correct attendance records.</p>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}
	{#if msg}
		<div class="alert alert-ok">{msg}</div>
	{/if}

	{#if loading}
		<p>Loading…</p>
	{:else}
		<section class="panel">
			<h2>Create worker</h2>
			<form onsubmit={(e) => { e.preventDefault(); createWorker(); }} class="form-grid" novalidate>
				<div class="field">
					<label>Email</label>
					<input bind:value={newEmail} type="email" placeholder="alice@company.com" required />
				</div>
				<div class="field">
					<label>Password (min 8 chars)</label>
					<input bind:value={newPassword} type="password" required />
				</div>
				<div class="field">
					<label>Full name</label>
					<input bind:value={newName} placeholder="Alice Smith" required />
				</div>
				<div class="field">
					<label>Employee id</label>
					<input bind:value={newEmployeeId} placeholder="EMP-001" required />
				</div>
				<div class="field">
					<label>Role</label>
					<select bind:value={newRole}>
						<option value="worker">Worker</option>
						<option value="manager">Manager</option>
					</select>
				</div>
				<button type="submit" class="btn">Create worker</button>
			</form>
		</section>

		<section class="panel">
			<h2>Workers ({workers.length})</h2>
			<table>
				<thead>
					<tr><th>Name</th><th>Employee id</th><th>Role</th><th>Active</th></tr>
				</thead>
				<tbody>
					{#each workers as w}
						<tr>
							<td>{w.name}</td>
							<td>{w.employeeId}</td>
							<td>{w.role}</td>
							<td>{w.isActive ? "Yes" : "No"}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="panel">
			<h2>Today's attendance</h2>
			{#if today.length === 0}
				<p>No shifts recorded today.</p>
			{:else}
				<table>
					<thead>
						<tr>
							<th>Worker</th><th>Employee id</th><th>Clock in</th><th>Clock out</th><th>Status</th><th>Location</th>
						</tr>
					</thead>
					<tbody>
						{#each today as r}
							<tr>
								<td>{r.workerName}</td>
								<td>{r.employeeId}</td>
								<td>{r.clockInTime ?? "—"}</td>
								<td>{r.clockOutTime ?? "—"}</td>
								<td class="status">
									{#if r.isLate}{@html flag("Late", "#dc2626")}{/if}
									{#if r.isTooEarly}{@html flag("Early-out", "#dc2626")}{/if}
									{#if !r.clockOut && r.clockIn}{@html flag("Open shift", "#ca8a04")}{/if}
									{#if r.clockInOnSite === false}{@html flag("In: off-site", "#ca8a04")}{/if}
								</td>
								<td>
									<button
										onclick={() => {
											fixId = r._id;
											fixClockIn = r.clockInTime ?? "";
											fixClockOut = r.clockOutTime ?? "";
										}}
										class="btn btn-sm"
									>
										Fix
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<section class="panel">
			<h2>Correct a record</h2>
			<form onsubmit={(e) => { e.preventDefault(); fixRecord(); }} class="form-grid" novalidate>
				<div class="field">
					<label>Record id</label>
					<input bind:value={fixId} placeholder="attendance id" required />
				</div>
				<div class="field">
					<label>Clock in (HH:mm)</label>
					<input bind:value={fixClockIn} type="time" />
				</div>
				<div class="field">
					<label>Clock out (HH:mm)</label>
					<input bind:value={fixClockOut} type="time" />
				</div>
				<div class="field">
					<label>Note</label>
					<input bind:value={fixNote} placeholder="e.g. forgot to clock out" />
				</div>
				<button type="submit" class="btn">Correct record</button>
			</form>
			<p class="hint">Times are interpreted as today's date. Click "Fix" on a record above to pre-fill its id and times.</p>
		</section>
	{/if}
</div>

<style>
	.page { padding: 1rem; max-width: 980px; margin: 0 auto; }
	h1 { margin-top: 0; font-size: 1.75rem; color: #111827; }
	.hint { color: #6b7280; margin-bottom: 1rem; }
	.panel {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.25rem;
		background: #fff;
		margin-bottom: 1rem;
	}
	.panel h2 { margin-top: 0; font-size: 1.1rem; color: #1f2937; margin-bottom: 1rem; }
	.alert {
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	.alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
	.alert-ok { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
	table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
	th, td { text-align: left; padding: 0.55rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
	th { background: #f3f4f6; font-size: 0.8rem; color: #374151; }
	tr:hover { background: #f9fafb; }
	.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; align-items: end; }
	.field { display: flex; flex-direction: column; gap: 0.4rem; }
	label { font-size: 0.875rem; font-weight: 600; color: #374151; }
	input, select { padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
	input:focus { outline: 2px solid #3b82f6; border-color: #3b82f6; }
	.btn {
		background: #2563eb;
		color: #fff;
		border: none;
		padding: 0.6rem 1.25rem;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn:hover { background: #1d4ed8; }
	.btn-sm { padding: 0.35rem 0.7rem; font-size: 0.85rem; }
	.status { font-size: 0.85rem; font-weight: 600; color: #dc2626; white-space: nowrap; }
	.flag {
		display: inline-block;
		font-size: 0.72rem;
		font-weight: 700;
		color: #fff;
		padding: 0.12rem 0.45rem;
		border-radius: 4px;
		margin-right: 0.35rem;
	}
</style>
