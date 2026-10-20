<script lang="ts">
	import { onMount } from "svelte";
	import { convex } from "../../lib/convex/client";
	import { api } from "../../lib/convex/generated";

	let rows = $state<any[]>([]);
	let today = $state<any>(null);
	let loading = $state(true);
	let error = $state("");
	let msg = $state("");

	async function load() {
		loading = true;
		error = "";
		try {
			rows = await convex.query(api.attendance.getMyAttendance, {});
			const todayStr = new Date().toISOString().slice(0, 10);
			today = rows.find((r) => r.date === todayStr) ?? null;
		} catch (err: any) {
			error = err?.message || "Failed to load attendance";
		} finally {
			loading = false;
		}
	}

	onMount(load);

	/** Best-effort geolocation; resolves to null if unavailable/denied. */
	function getLocation(): Promise<any | null> {
		return new Promise((resolve) => {
			if (!navigator.geolocation) return resolve(null);
			navigator.geolocation.getCurrentPosition(
				(pos) =>
					resolve({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
						accuracy: pos.coords.accuracy,
						timestamp: pos.timestamp,
					}),
				() => resolve(null),
				{ timeout: 8000, enableHighAccuracy: true },
			);
		});
	}

	async function clockIn() {
		msg = "";
		const loc = await getLocation();
		try {
			await convex.mutation(api.attendance.clockIn, { location: loc });
			msg = "Clocked in";
			await load();
		} catch (err: any) {
			error = err?.message || "Clock in failed";
		}
	}

	async function clockOut() {
		msg = "";
		const loc = await getLocation();
		try {
			await convex.mutation(api.attendance.clockOut, { location: loc });
			msg = "Clocked out";
			await load();
		} catch (err: any) {
			error = err?.message || "Clock out failed";
		}
	}

	function flag(label: string, color: string) {
		return `<span class="flag" style="background:${color}">${label}</span>`;
	}
</script>

<div class="page">
	<h1>Dashboard</h1>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}
	{#if msg}
		<div class="alert alert-ok">{msg}</div>
	{/if}

	<div class="shift-card">
		<h2>Today</h2>
		{#if loading}
			<p>Loading…</p>
		{:else if today === null}
			<p>Not clocked in yet.</p>
			<button onclick={clockIn} class="btn btn-primary">Clock in</button>
		{:else if today.clockIn && !today.clockOut}
			<p>Clocked in at <b>{today.clockInTime}</b>.</p>
			{#if today.isLate}
				{@html flag("LATE (after 08:00)", "#dc2626")}
			{/if}
			{#if today.clockInOnSite === false}
				{@html flag("Clocked in outside office geofence", "#ca8a04")}
			{:else if today.clockInOnSite === true}
				{@html flag("On site", "#16a34a")}
			{/if}
			<button onclick={clockOut} class="btn btn-primary">Clock out</button>
		{:else}
			<p>
				Shift complete: <b>{today.clockInTime}</b> →
				<b>{today.clockOutTime}</b>
			</p>
			{#if today.isLate}
				{@html flag("Late arrival", "#dc2626")}
			{/if}
			{#if today.isTooEarly}
				{@html flag("Left early (before 17:00)", "#dc2626")}
			{/if}
			{#if today.clockOutOnSite === false}
				{@html flag("Clocked out outside office geofence", "#ca8a04")}
			{:else if today.clockOutOnSite === true}
				{@html flag("On site", "#16a34a")}
			{/if}
		{/if}
	</div>

	<h2>Recent history</h2>
	{#if rows.length === 0 && !loading}
		<p>No attendance records yet.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th>Clock in</th>
					<th>Clock out</th>
					<th>Status</th>
					<th>Location</th>
				</tr>
			</thead>
			<tbody>
				{#each rows.slice(0, 10) as row}
					<tr>
						<td>{row.date}</td>
						<td>{row.clockInTime ?? "—"}</td>
						<td>{row.clockOutTime ?? "—"}</td>
						<td>
							{#if row.isLate}<span class="flag" style="background:#dc2626">Late</span>{/if}
							{#if row.isTooEarly}<span class="flag" style="background:#dc2626">Early-out</span>{/if}
						</td>
						<td>
							{#if row.clockInOnSite === false}<span class="hint">in: off-site</span>{/if}
							{#if row.clockOutOnSite === false}<span class="hint">out: off-site</span>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.page { padding: 1rem; max-width: 700px; margin: 0 auto; }
	h1 { margin-top: 0; font-size: 1.75rem; color: #111827; }
	h2 { font-size: 1.2rem; margin: 1.5rem 0 0.75rem; color: #1f2937; }
	.shift-card {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.25rem;
		background: #f9fafb;
		margin: 1rem 0;
	}
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
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: #2563eb;
		color: #fff;
		border: none;
		padding: 0.6rem 1.25rem;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 0.75rem;
	}
	.btn:hover { background: #1d4ed8; }
	.btn:disabled { opacity: 0.6; cursor: not-allowed; }
	.flag {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		color: #fff;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		margin-left: 0.5rem;
	}
	.hint { font-size: 0.8rem; color: #6b7280; }
</style>
