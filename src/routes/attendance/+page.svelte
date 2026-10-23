<script lang="ts">
	import { onMount } from "svelte";
	import { convex } from "#lib/convex/client";
	import { api } from "#lib/convex/generated";
	import { icon } from "#lib/icons";

	let rows = $state<any[]>([]);
	let loading = $state(true);
	let error = $state("");

	const hhmm = (ms: number | null) => {
		if (!ms) return "\u2014";
		const d = new Date(ms);
		return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
	};
	const isLate = (ms: number) => {
		const d = new Date(ms);
		return d.getUTCHours() * 60 + d.getUTCMinutes() > 8 * 60;
	};
	const isTooEarly = (ms: number) => {
		const d = new Date(ms);
		return d.getUTCHours() * 60 + d.getUTCMinutes() < 17 * 60;
	};

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

	const statusText = (row: any) => {
		const parts: string[] = [];
		if (row.isLate) parts.push("Late");
		if (row.isTooEarly) parts.push("Left early");
		if (row.clockInOnSite === false) parts.push("In: off-site");
		if (row.clockOutOnSite === false) parts.push("Out: off-site");
		if (row.clockIn && !row.clockOut) parts.push("Open shift (no clock-out)");
		return parts.length ? parts.join(", ") : "On time";
	};
</script>

<article class="onsite-page">
	<div class="onsite-page-head">
		<div>
			<p class="onsite-eyebrow">Your attendance</p>
			<h1 class="onsite-page-title">History.</h1>
			<p class="onsite-page-sub">
				Every punch you have made, newest first. Only you can see these records.
			</p>
		</div>
	</div>

	{#if error}
		<div class="onsite-alert">{error}</div>
	{/if}

	{#if loading}
		<p style="padding:40px 0;text-align:center;color:var(--onsite-ink-soft)">Loading&hellip;</p>
	{:else if rows.length === 0}
		<div class="onsite-card">
			<div class="empty">
				<span class="empty-icon">{@html icon("clock")}</span>
				<h2>No records yet</h2>
				<p>
					Your punches will appear here as soon as you complete your first shift.
				</p>
				<a class="onsite-btn onsite-btn-primary" href="/dashboard">Go to dashboard {@html icon("arrow")}</a>
			</div>
		</div>
	{:else}
		<table>
			<thead>
				<tr>
					<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Date</th>
					<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Clock in</th>
					<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Clock out</th>
					<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Location</th>
					<th style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border);font-size:0.8rem;color:var(--onsite-ink-soft);background:var(--onsite-surface)">Status</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr style="text-align:left;padding:0.55rem 0.75rem;border-bottom:1px solid var(--onsite-border)">
						<td>{row.date}</td>
						<td>{row.clockInTime ?? "\u2014"}</td>
						<td>{row.clockOutTime ?? "\u2014"}</td>
						<td>
							{#if row.clockInLocation}
								({row.clockInLocation.latitude.toFixed(4)}, {row.clockInLocation.longitude.toFixed(4)})
							{:else}
								—
							{/if}
							{#if row.clockOutLocation}
								<br />
								({row.clockOutLocation.latitude.toFixed(4)}, {row.clockOutLocation.longitude.toFixed(4)})
							{/if}
						</td>
						<td class="status">{statusText(row)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</article>

<style>

	.status {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--onsite-danger-ink);
		white-space: nowrap;
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
