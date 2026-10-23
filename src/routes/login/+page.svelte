<script lang="ts">
	import { goto } from "$app/navigation";
	import { convex } from "#lib/convex/client";
	import { api } from "#lib/convex/generated";
	import { signIn } from "#lib/convex/auth";
	import { icon } from "#lib/icons";

	let email = $state("");
	let password = $state("");
	let error = $state("");
	let loading = $state(false);
	let showPassword = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = "";
		loading = true;
		try {
			await signIn(email.trim(), password);
			const me = await convex.query(api.workers.getMe, {});
			goto(me.role === "manager" ? "/admin" : "/dashboard");
		} catch (err: any) {
			error = err?.message || "Sign in failed";
		} finally {
			loading = false;
		}
	}
</script>

<div class="onsite-auth">
	<aside class="onsite-auth-brand">
		<div class="onsite-auth-pitch">
			<p class="onsite-eyebrow onsite-eyebrow-on-dark">Attendance tracker</p>
			<h1 class="onsite-auth-headline">Every shift,<br /><span>on the record.</span></h1>
			<p class="onsite-auth-lede">
				One tap to clock in. Times, GPS and late or early flags are saved the moment you punch
				&mdash; and managers can correct a record without losing the trail.
			</p>
			<ul class="onsite-auth-points">
				<li>
					<span class="onsite-auth-point-icon">{@html icon("pin", "onsite-od-icon-18")}</span>
					<div>
						<strong>Every punch stamped</strong>
						<span>GPS coordinates, accuracy and distance from the office.</span>
					</div>
				</li>
				<li>
					<span class="onsite-auth-point-icon">{@html icon("clock", "onsite-od-icon-18")}</span>
					<div>
						<strong>Honest by default</strong>
						<span>Late after 08:00, early before 17:00. No grace period.</span>
					</div>
				</li>
				<li>
					<span class="onsite-auth-point-icon">{@html icon("doc", "onsite-od-icon-18")}</span>
					<div>
						<strong>Corrections with a reason</strong>
						<span>Managers edit times and leave a note on the record.</span>
					</div>
				</li>
			</ul>
			<div class="onsite-auth-stats">
				<div><strong>200 m</strong><span>office fence</span></div>
				<div><strong>0</strong><span>grace period</span></div>
			</div>
		</div>
	</aside>

	<main class="onsite-auth-main">
		<div class="onsite-auth-form">
			<div class="onsite-auth-mobile-brand">{@html icon("clock", "onsite-od-icon-20")} <span style="font-weight:900;font-size:20px">Attendance</span></div>
			<div>
				<p class="onsite-eyebrow">Sign in</p>
				<h1 class="onsite-auth-title">Welcome back.</h1>
				<p class="onsite-auth-sub">Enter your work email and password to open your attendance.</p>
			</div>
			{#if error}
				<div class="onsite-alert" id="login-error" role="alert">
					{@html icon("alert", "onsite-od-icon-18")}
					<span id="login-error-text">{error}</span>
				</div>
			{/if}
			<form class="onsite-form-stack" onsubmit={handleSubmit} novalidate>
				<div class="onsite-field">
					<label for="email">Email</label>
					<input
						class="onsite-input"
						id="email"
						name="email"
						type="email"
						inputmode="email"
						autocomplete="username"
						placeholder="you@company.com"
						bind:value={email}
						required
					/>
				</div>
				<div class="onsite-field">
					<label for="password">Password</label>
					<div class="pw-wrap">
						<input
							class="onsite-input"
							id="password"
							name="password"
							type={showPassword ? "text" : "password"}
							autocomplete="current-password"
							placeholder="Your password"
							bind:value={password}
							required
						/>
						<button
							class="pw-toggle"
							id="toggle-pw"
							type="button"
							aria-label={showPassword ? "Hide password" : "Show password"}
							aria-pressed={showPassword}
							onclick={() => (showPassword = !showPassword)}
						>
							{@html icon(showPassword ? "eyeOff" : "eye", "onsite-od-icon-20")}
						</button>
					</div>
				</div>
				<button
					class="onsite-btn onsite-btn-primary onsite-btn-lg onsite-btn-full"
					type="submit"
					disabled={loading}
				>
					{#if loading}
						<span class="onsite-spinner" aria-hidden="true"></span> Signing in&hellip;
					{:else}
						Sign in {@html icon("arrow")}
					{/if}
				</button>
			</form>

			<div class="onsite-auth-note" role="note">
				<span class="onsite-auth-note-icon">{@html icon("doc", "onsite-od-icon-18")}</span>
				<div class="onsite-auth-note-body">
					<p class="onsite-auth-note-text">
						First time here? Bootstrap the initial manager with
						<code>npx convex run workers:createFirstManager</code> (see README).
					</p>
				</div>
			</div>
		</div>
	</main>
</div>

<style>

	.onsite-auth {
		min-height: 100dvh;
		display: grid;
		grid-template-columns: minmax(0, 1.06fr) minmax(0, 1fr);
		background: var(--onsite-surface-deep);
	}
	.onsite-auth-brand {
		background: var(--onsite-surface-deep);
		color: #fff;
		padding: 44px 48px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 48px;
		min-height: 100dvh;
	}
	.onsite-auth-pitch {
		display: flex;
		flex-direction: column;
		gap: 22px;
		max-width: 520px;
	}
	.onsite-eyebrow-on-dark {
		color: rgba(255, 255, 255, 0.62);
	}
	.onsite-auth-headline {
		font-family: var(--onsite-font-display);
		font-weight: 900;
		font-size: clamp(44px, 4.6vw, 72px);
		line-height: 0.9;
		letter-spacing: -0.04em;
		color: #fff;
	}
	.onsite-auth-headline span {
		color: var(--onsite-accent);
	}
	.onsite-auth-lede {
		font-size: 16px;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.72);
		font-weight: 500;
		max-width: 42ch;
	}
	.onsite-auth-points {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 6px;
	}
	.onsite-auth-points li {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}
	.onsite-auth-point-icon {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: rgba(159, 232, 112, 0.14);
		color: var(--onsite-accent);
		display: grid;
		place-items: center;
		flex: none;
	}
	.onsite-auth-points strong {
		display: block;
		font-size: 14.5px;
		font-weight: 700;
		color: #fff;
	}
	.onsite-auth-points span {
		display: block;
		font-size: 13.5px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.64);
		margin-top: 2px;
	}
	.onsite-auth-stats {
		display: flex;
		gap: 40px;
		flex-wrap: wrap;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
		padding-top: 22px;
	}
	.onsite-auth-stats strong {
		display: block;
		font-family: var(--onsite-font-display);
		font-weight: 900;
		font-size: 24px;
		line-height: 1;
		color: #fff;
		font-variant-numeric: tabular-nums;
	}
	.onsite-auth-stats span {
		display: block;
		font-size: 11.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.58);
		margin-top: 6px;
		font-weight: 700;
	}
	.onsite-auth-main {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 56px 32px;
		background:
			radial-gradient(58% 48% at 82% 14%, rgba(159, 232, 112, 0.13), rgba(159, 232, 112, 0) 70%),
			radial-gradient(52% 46% at 8% 96%, rgba(159, 232, 112, 0.07), rgba(159, 232, 112, 0) 70%),
			var(--onsite-surface-deep);
	}
	.onsite-auth-form {
		width: 100%;
		max-width: 460px;
		padding: 30px;
		border-radius: 32px;
		background: var(--onsite-bg);
		color: var(--onsite-fg);
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 44px 90px -36px rgba(0, 0, 0, 0.85);
		display: flex;
		flex-direction: column;
		gap: 26px;
	}
	.onsite-auth-mobile-brand {
		display: none;
	}
	.onsite-auth-title {
		font-size: clamp(36px, 4vw, 44px);
		line-height: 0.96;
		letter-spacing: -0.04em;
		margin-top: 8px;
	}
	.onsite-auth-sub {
		font-size: 15px;
		line-height: 1.55;
		color: var(--onsite-ink-soft);
		margin-top: 10px;
		font-weight: 500;
	}
	.onsite-auth-note {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 14px;
		border-radius: 18px;
		background:
			radial-gradient(120% 140% at 100% 0%, rgba(159, 232, 112, 0.18), rgba(159, 232, 112, 0) 58%),
			#f7f9f4;
		box-shadow: inset 0 0 0 1px var(--onsite-border);
	}
	.onsite-auth-note-icon {
		width: 34px;
		height: 34px;
		flex: none;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--onsite-surface);
		color: var(--onsite-success);
	}
	.onsite-auth-note-icon .onsite-od-icon {
		--onsite-icon-size: 17px;
	}
	.onsite-auth-note-body {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.onsite-auth-note-head {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.onsite-auth-note-title {
		font-size: 10.5px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		font-weight: 800;
		color: var(--onsite-success);
	}
	.onsite-auth-note-fence {
		margin-left: auto;
		padding: 2px 8px;
		border-radius: var(--onsite-radius-pill);
		background: var(--onsite-accent);
		color: var(--onsite-accent-on);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}
	.onsite-auth-note-text {
		font-size: 12.5px;
		line-height: 1.5;
		color: var(--onsite-ink-soft);
		font-weight: 500;
	}
	.onsite-auth-note-geo {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--onsite-fg);
	}
	.onsite-auth-note-geo .onsite-od-icon {
		--onsite-icon-size: 14px;
		color: var(--onsite-success);
	}
	.onsite-auth-note-coords {
		font-family: var(--onsite-font-mono);
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: -0.01em;
		padding: 2px 6px;
		border-radius: 6px;
		background: rgba(22, 51, 0, 0.07);
		color: var(--onsite-fg);
	}
	.demo {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.demo-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}
	.demo-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.demo-btn {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		text-align: left;
		padding: 14px 14px 13px;
		border: 1px solid var(--onsite-border);
		border-radius: var(--onsite-radius-sm);
		background: var(--onsite-bg);
		transition: background-color var(--onsite-motion-fast) var(--onsite-ease-standard),
			border-color var(--onsite-motion-fast) var(--onsite-ease-standard);
	}
	.demo-btn:hover {
		background: var(--onsite-success-soft);
		border-color: rgba(22, 51, 0, 0.18);
	}
	.demo-role {
		font-size: 10.5px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		font-weight: 800;
		color: var(--onsite-ink-soft);
	}
	.demo-btn strong {
		font-size: 14px;
		font-weight: 700;
	}
	.demo-email {
		font-size: 11.5px;
		color: var(--onsite-ink-soft);
		font-weight: 500;
		max-width: 100%;
	}
	.demo-reset {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		align-self: flex-start;
		padding: 7px 12px;
		border: 1px solid var(--onsite-border);
		border-radius: var(--onsite-radius-pill);
		background: var(--onsite-bg);
		color: var(--onsite-ink-soft);
		font-size: 11.5px;
		font-weight: 700;
		transition: background-color var(--onsite-motion-fast) var(--onsite-ease-standard),
			border-color var(--onsite-motion-fast) var(--onsite-ease-standard),
			color var(--onsite-motion-fast) var(--onsite-ease-standard);
	}
	.demo-reset:hover {
		background: var(--onsite-success-soft);
		border-color: rgba(22, 51, 0, 0.18);
		color: var(--onsite-accent-on);
	}
	.demo-reset .onsite-od-icon {
		--onsite-icon-size: 14px;
	}
	.onsite-auth-setup {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: baseline;
		font-size: 13px;
		color: var(--onsite-ink-soft);
		border-top: 1px solid var(--onsite-border);
		padding-top: 18px;
	}
	.linkish {
		border: none;
		background: none;
		padding: 0;
		font-size: 13px;
		font-weight: 700;
		color: var(--onsite-fg);
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 2px;
	}
	.linkish:hover {
		color: var(--onsite-accent-on);
		text-decoration-color: var(--onsite-accent);
	}

	@media (max-width: 1023px) {
		.onsite-auth {
			grid-template-columns: 1fr;
		}
		.onsite-auth-brand {
			display: none;
		}
		.onsite-auth-main {
			min-height: 100dvh;
			padding: 40px 24px 56px;
			align-items: flex-start;
			padding-top: 56px;
		}
		.onsite-auth-mobile-brand {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			font-family: var(--onsite-font-display);
			font-weight: 900;
			font-size: 20px;
			margin-bottom: 24px;
		}
		.onsite-auth-form {
			max-width: 460px;
			margin: 0 auto;
		}
	}
</style>
