<script lang="ts">
	import { onMount } from "svelte";
	import { convex } from "../../lib/convex/client";
	import { api } from "../../lib/convex/generated";

	let rows = $state<any[]>([]);
	let loading = $state(true);
	let error = $state("");

	async function load() {
		loading = true;
		error = "";
		try {
			rows = await convex.query(api.attendance.getMyAttendance, {});
		} catch (err: any) {
			error = err?.message || "Failed to load attendance history";
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function statusText(row: any): string {
		const parts: string[] = [];
		if (row.isLate) parts.push("Late");
		if (row.isTooEarly) parts.push("Left early");
		if (row.clockInOnSite === false) parts.push("In: off-site");
		if (row.clockOutOnSite === false) parts.push("Out: off-site");
		if (row.clockIn && !row.clockOut) parts.push("Open shift (no clock-out)");
		return parts.length ? parts.join(", ") : "On time";
	}
</script>

<div class="page">
	<h1>My Attendance</h1>
	<p class="hint">Every clock-in/out is recorded with time and GPS location.</p>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	{#if loading}
		<p>Loading…</p>
	{:else if rows.length === 0}
		<p>No attendance records yet. Clock in from the Dashboard.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th>Clock in</th>
					<th>Clock out</th>
					<th>Location</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr>
						<td>{row.date}</td>
						<td>{row.clockInTime ?? "—"}</td>
						<td>{row.clockOutTime ?? "—"}</td>
						<td>
							{#if row.clockInLocation}
								({row.clockInLocation.latitude.toFixed(4)},
								{row.clockInLocation.longitude.toFixed(4)})
							{:else}
								—
							{/if}
							{#if row.clockOutLocation}
								<br />
								({row.clockOutLocation.latitude.toFixed(4)},
								{row.clockOutLocation.longitude.toFixed(4)})
							{/if}
						</td>
						<td class="status">{statusText(row)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.page { padding: 1rem; max-width: 900px; margin: 0 auto; }
	h1 { margin-top: 0; font-size: 1.75rem; color: #111827; }
	.hint { color: #6b7280; margin-bottom: 1rem; }
	.alert {
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	.alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
	table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
	th, td { text-align: left; padding: 0.55rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
	th { background: #f3f4f6; font-size: 0.8rem; color: #374151; }
	tr:hover { background: #f9fafb; }
	.status { font-size: 0.85rem; font-weight: 600; color: #dc2626; }
</style>
