<script lang="ts">
	import { onMount } from "svelte";
	import { convex } from "#lib/convex/client";
	import { api } from "#lib/convex/generated";
	import { icon } from "#lib/icons";

	let rows = $state<any[]>([]);
	let today = $state<any>(null);
	let loading = $state(true);
	let error = $state("");
	let msg = $state("");

	const OFFICE = {
		name: "Main office",
		address: "Office geofence (see env vars)",
		lat: 40.7128,
		lng: -74.0060,
		radius: 200
	};

	const todayISO = () => new Date().toISOString().slice(0, 10);
	const minutesFromMs = (ms: number) => {
		const d = new Date(ms);
		return d.getUTCHours() * 60 + d.getUTCMinutes();
	};
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
			const todayStr = todayISO();
			today = rows.find((r) => r.date === todayStr) ?? null;
		} catch (err: any) {
			error = err?.message || "Failed to load attendance";
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		const tick = () => {
			const now = new Date();
			const hm = document.getElementById("live-hm");
			const sec = document.getElementById("live-sec");
			if (hm) {
				hm.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
			}
			if (sec) {
				sec.textContent = `:${String(now.getSeconds()).padStart(2, "0")}`;
			}
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});

	function getLocation(): Promise<any | null> {
		return new Promise((resolve) => {
			if (!navigator.geolocation) return resolve(null);
			navigator.geolocation.getCurrentPosition(
				(pos) =>
					resolve({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
						accuracy: pos.coords.accuracy,
						timestamp: pos.timestamp
					}),
				() => resolve(null),
				{ timeout: 8000, enableHighAccuracy: true }
			);
		});
	}

	const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
		const R = 6371000;
		const toRad = Math.PI / 180;
		const dLat = (lat2 - lat1) * toRad;
		const dLng = (lng2 - lng1) * toRad;
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	};

	const locationFromCoords = (coords: any) => {
		const distance = haversineMeters(coords.latitude, coords.longitude, OFFICE.lat, OFFICE.lng);
		return {
			lat: Number(coords.latitude.toFixed(5)),
			lng: Number(coords.longitude.toFixed(5)),
			accuracy: Math.round(coords.accuracy || 0),
			distance: Math.round(distance),
			onSite: distance <= OFFICE.radius
		};
	};

	const distanceLabel = (meters: number | null) => {
		if (meters == null) return "unknown distance";
		if (meters < 1000) return `${Math.round(meters)} m`;
		return `${(meters / 1000).toFixed(1)} km`;
	};

	const workedLabel = (rec: any) => {
		if (!rec || rec.clockIn == null) return "\u2014";
		const start = minutesFromMs(rec.clockIn);
		const end = rec.clockOut != null ? minutesFromMs(rec.clockOut) : minutesFromMs(Date.now());
		if (end < start) return "\u2014";
		const h = Math.floor((end - start) / 60);
		const m = (end - start) % 60;
		if (h <= 0) return `${m}m`;
		return `${h}h ${String(m).padStart(2, "0")}m`;
	};

	async function clockIn() {
		msg = "";
		const loc = await getLocation();
		try {
			await convex.mutation(api.attendance.clockIn, {
				location: loc
					? {
							latitude: loc.latitude,
							longitude: loc.longitude,
							accuracy: loc.accuracy,
							timestamp: loc.timestamp
					  }
					: undefined
			});
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
			await convex.mutation(api.attendance.clockOut, {
				location: loc
					? {
							latitude: loc.latitude,
							longitude: loc.longitude,
							accuracy: loc.accuracy,
							timestamp: loc.timestamp
					  }
					: undefined
			});
			msg = "Clocked out";
			await load();
		} catch (err: any) {
			error = err?.message || "Clock out failed";
		}
	}

	const rec = $derived(today);
	const f = $derived(
		rec
			? {
					late: rec.clockIn != null ? isLate(rec.clockIn) : false,
					early: rec.clockOut ? isTooEarly(rec.clockOut) : false,
					open: !rec.clockOut,
					complete: !!rec.clockOut
			  }
			: { late: false, early: false, open: false, complete: false }
	);

	const gpsLoc = $derived(
		rec
			? rec.clockOut
				? rec.clockOutLocation
					? locationFromCoords(rec.clockOutLocation)
					: null
				: rec.clockInLocation
					? locationFromCoords(rec.clockInLocation)
					: null
			: null
	);
</script>

<article class="onsite-page">
	<div class="onsite-page-head">
		<div>
			<p class="onsite-eyebrow">{todayISO()} &middot; {OFFICE.name}</p>
			<h1 class="onsite-page-title">
				{f.open ? "On the clock," : f.complete ? "Shift wrapped," : "Morning,"}
			</h1>
			<p class="onsite-page-sub">
				{f.open
					? `You clocked in at ${hhmm(rec?.clockIn ?? 0)}. Clock out before you leave.`
					: f.complete
						? "Today's shift is complete. " + (f.late || f.early ? "Flags are shown below." : "No flags on this one.")
					: "One shift a day. Clock in when you arrive and out when you leave."}
			</p>
		</div>
		<div class="onsite-head-side">
			<span class="onsite-chip onsite-chip-neutral">{@html icon("building", "onsite-od-icon-14")} Office &middot; {OFFICE.radius} m</span>
		</div>
	</div>

	{#if error}
		<div class="onsite-alert">{error}</div>
	{/if}
	{#if msg}
		<div class="onsite-notice">{msg}</div>
	{/if}

	<div class="dash-grid">
		<section class="onsite-card clock-card" aria-label="Today's shift">
			<div class="clock-top">
				<div>
					<p class="clock-label">Local time</p>
					<p class="clock-time">
						<span id="live-hm">--:--</span><span class="clock-sec" id="live-sec">:00</span>
					</p>
					<p class="clock-date">{todayISO()}</p>
				</div>
				{#if !rec || !rec.clockIn}
					<span class="onsite-chip onsite-chip-neutral">Not clocked in</span>
				{:else if f.open}
					<span class="onsite-chip onsite-chip-ok"><span class="onsite-chip-dot"></span>On shift</span>
				{:else}
					<span class="onsite-chip onsite-chip-ok"><span class="onsite-chip-dot"></span>Shift complete</span>
				{/if}
			</div>
			<div class="clock-times">
				<div class="clock-stat">
					<span class="clock-stat-label">Clock in</span>
					<strong class="onsite-clock-stat-value {rec && rec.clockIn ? "" : "is-empty"}">
						{rec && rec.clockIn ? hhmm(rec.clockIn) : "\u2014"}
					</strong>
					{#if rec && f.late}<span class="onsite-chip onsite-chip-late">Late</span>{/if}
				</div>
				<div class="clock-stat">
					<span class="clock-stat-label">Clock out</span>
					<strong class="onsite-clock-stat-value {rec && rec.clockOut ? "" : "is-empty"}">
						{rec && rec.clockOut ? hhmm(rec.clockOut) : "\u2014"}
					</strong>
					{#if rec && f.early}<span class="onsite-chip onsite-chip-early">Early out</span>{/if}
				</div>
				<div class="clock-stat">
					<span class="clock-stat-label">Worked</span>
					<strong class="onsite-clock-stat-value" id="worked-value">{workedLabel(rec)}</strong>
				</div>
			</div>
			<div class="clock-action">
				{#if !rec || !rec.clockIn}
					<button class="onsite-btn onsite-btn-primary onsite-btn-lg" onclick={clockIn}>
						{@html icon("arrow")} Clock in
					</button>
				{:else if !rec.clockOut}
					<button class="onsite-btn onsite-btn-primary onsite-btn-lg" onclick={clockOut}>
						{@html icon("check")} Clock out
					</button>
				{:else}
					<button class="onsite-btn onsite-btn-primary onsite-btn-lg" disabled>
						{@html icon("check")} Shift complete
					</button>
				{/if}
				<p class="clock-help">
					{#if !rec || !rec.clockIn}
						Your location is recorded when you clock in. Late after 08:00.
					{:else if !rec.clockOut}
						Clock out when you leave. Anything before 17:00 is marked as an early out.
					{:else}
						Both punches are saved. Corrections are handled by a manager.
					{/if}
				</p>
			</div>
			<div class="gps-line {gpsLoc?.onSite ? "is-ok" : !gpsLoc && rec ? "is-warn" : ""}">
				{#if !rec || !rec.clockIn}
					{@html icon("pin")} Location is captured when you punch
				{:else if !gpsLoc}
					{@html icon("pin")} No GPS captured &mdash; punch saved without a location
				{:else}
					{@html icon("pin")}
					{gpsLoc.onSite ? "On-site" : "Off-site"} &middot; {distanceLabel(gpsLoc.distance)}
					<span class="gps-acc">\u00b1{gpsLoc.accuracy} m</span>
				{/if}
			</div>
		</section>

		<div class="dash-side">
			<section class="onsite-card">
				<div class="onsite-card-head">
					<h2>Recent shifts</h2>
					<a class="onsite-text-link" href="/attendance">All records {@html icon("arrow")}</a>
				</div>
				<div class="mini-list">
					{#if rows.length === 0}
						<p class="mini-empty">
							No shifts recorded yet. Clock in from this page and your first day will appear here.
						</p>
					{:else}
						{#each rows.slice(0, 4) as row}
							<div class="mini-row">
								<div>
									<span class="mini-date">{row.date}</span>
									<span class="mini-weekday">{new Date(row.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })}</span>
								</div>
								<div class="mini-right">
									<span class="mini-times onsite-nowrap">{row.clockInTime ?? "\u2014"} &ndash; {row.clockOutTime ?? "\u2014"}</span>
									{#if row.isLate}<span class="onsite-chip onsite-chip-late">Late</span>{/if}
									{#if row.isTooEarly}<span class="onsite-chip onsite-chip-early">Early out</span>{/if}
									{#if !row.isLate && !row.isTooEarly && row.clockOut}<span class="onsite-chip onsite-chip-ok">On time</span>{/if}
									{#if row.clockIn && !row.clockOut}<span class="onsite-chip onsite-chip-neutral">Open</span>{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</section>

			<section class="onsite-card office-card">
				<div class="office-icon">{@html icon("pin")}</div>
				<h2>The office</h2>
				<p class="office-name">{OFFICE.name}</p>
				<p class="office-addr">{OFFICE.address}</p>
				<dl class="office-meta">
					<div>
						<dt>Geofence</dt>
						<dd>{OFFICE.radius} m radius</dd>
					</div>
					<div>
						<dt>Coordinates</dt>
						<dd>{OFFICE.lat.toFixed(4)}, {OFFICE.lng.toFixed(4)}</dd>
					</div>
				</dl>
				<p class="office-note">
					Punches outside the fence are still recorded &mdash; they are flagged off-site,
					never blocked.
				</p>
			</section>
		</div>
	</div>
</article>

<style>

	.clock-card {
		background: var(--onsite-surface-deep);
		color: #fff;
		border-radius: var(--onsite-radius-lg);
		padding: 36px;
		display: flex;
		flex-direction: column;
		gap: 28px;
		min-width: 0;
		position: relative;
		isolation: isolate;
		overflow: hidden;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 34px 70px -46px rgba(14, 15, 12, 0.9);
	}
	.clock-card > * {
		position: relative;
		z-index: 1;
	}
	.clock-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px 16px;
		flex-wrap: wrap;
	}
	.clock-label {
		font-size: 11.5px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.58);
	}
	.clock-time {
		display: flex;
		align-items: baseline;
		gap: 2px;
		margin-top: 12px;
		font-family: var(--onsite-font-display);
		font-weight: 900;
		font-size: clamp(56px, 8.4vw, 92px);
		line-height: 0.8;
		letter-spacing: -0.05em;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 70px rgba(159, 232, 112, 0.16);
	}
	.clock-sec {
		font-size: 0.32em;
		color: var(--onsite-accent);
		letter-spacing: -0.02em;
	}
	.clock-date {
		font-size: 13.5px;
		color: rgba(255, 255, 255, 0.6);
		margin-top: 12px;
		font-weight: 500;
	}
	.clock-times {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.14);
		padding-top: 22px;
	}
	.clock-stat {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		min-width: 0;
	}
	.clock-stat + .clock-stat {
		border-left: 1px solid rgba(255, 255, 255, 0.10);
		padding-left: 16px;
	}
	.clock-stat-label {
		font-size: 11px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.52);
	}
	.onsite-clock-stat-value {
		font-family: var(--onsite-font-display);
		font-weight: 900;
		font-size: 24px;
		line-height: 1.1;
		color: #fff;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.onsite-clock-stat-value.is-empty {
		color: rgba(255, 255, 255, 0.5);
	}
	.clock-stat .onsite-chip {
		margin-top: 5px;
	}
	.clock-action {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.clock-help {
		font-size: 12.5px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
		max-width: 46ch;
	}
	.gps-line {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding: 10px 14px;
		border-radius: var(--onsite-radius-pill);
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.12);
		font-size: 12.5px;
		line-height: 1.35;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
	}
	.gps-line .onsite-od-icon {
		--onsite-icon-size: 16px;
		color: rgba(255, 255, 255, 0.62);
	}
	.gps-line.is-ok .onsite-od-icon {
		color: var(--onsite-accent);
	}
	.gps-line.is-warn .onsite-od-icon {
		color: #ffd76a;
	}
	.gps-acc {
		color: rgba(255, 255, 255, 0.5);
		font-variant-numeric: tabular-nums;
	}
	.dash-side {
		display: flex;
		flex-direction: column;
		gap: 24px;
		min-width: 0;
	}
	.mini-list {
		display: flex;
		flex-direction: column;
	}
	.mini-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 13px 0;
		border-top: 1px solid var(--onsite-border);
	}
	.mini-row:first-child {
		border-top: none;
		padding-top: 0;
	}
	.mini-row:last-child {
		padding-bottom: 0;
	}
	.mini-date {
		font-size: 13.5px;
		font-weight: 700;
	}
	.mini-weekday {
		display: block;
		font-size: 11.5px;
		color: var(--onsite-ink-soft);
		margin-top: 1px;
		font-weight: 500;
	}
	.mini-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 5px;
	}
	.mini-times {
		font-size: 13.5px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.mini-empty {
		font-size: 13.5px;
		color: var(--onsite-ink-soft);
		line-height: 1.55;
		padding: 4px 0 2px;
	}
	.office-card {
		background:
			radial-gradient(110% 90% at 100% 0%, rgba(159, 232, 112, 0.24), rgba(159, 232, 112, 0) 58%),
			radial-gradient(90% 70% at 0% 100%, rgba(159, 232, 112, 0.12), rgba(159, 232, 112, 0) 60%),
			var(--onsite-accent-on);
		color: #fff;
		box-shadow: 0 26px 50px -40px rgba(22, 51, 0, 0.85);
	}
	.office-card .office-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--onsite-accent);
		color: var(--onsite-accent-on);
		display: grid;
		place-items: center;
		margin-bottom: 16px;
	}
	.office-card .office-icon .onsite-od-icon {
		--onsite-icon-size: 20px;
	}
	.office-card h2 {
		font-size: 18px;
		color: #fff;
	}
	.office-card .office-name {
		font-size: 15px;
		font-weight: 700;
		margin-top: 6px;
		color: #fff;
	}
	.office-card .office-addr {
		font-size: 13.5px;
		color: rgba(255, 255, 255, 0.68);
		margin-top: 2px;
		font-weight: 500;
	}
	.office-card .office-meta {
		display: flex;
		gap: 28px;
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
	}
	.office-card .office-meta dt {
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.56);
		font-weight: 700;
	}
	.office-card .office-meta dd {
		font-size: 13px;
		font-weight: 700;
		margin-top: 2px;
		font-variant-numeric: tabular-nums;
		color: #fff;
	}
	.office-card .office-note {
		font-size: 12.5px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.68);
		margin-top: 14px;
		font-weight: 500;
	}

	@media (max-width: 900px) {
		.dash-grid {
			grid-template-columns: 1fr;
		}
		.clock-card {
			padding: 32px;
			border-radius: 32px;
			gap: 24px;
		}
		.clock-time {
			font-size: clamp(56px, 16vw, 80px);
		}
		.clock-times {
			gap: 10px;
		}
		.clock-stat + .clock-stat {
			padding-left: 12px;
		}
		.onsite-clock-stat-value {
			font-size: 21px;
		}
	}
</style>
