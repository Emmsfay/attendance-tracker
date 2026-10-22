<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import type { Snippet } from "svelte";
	import { convex } from "../lib/convex/client";
	import { api } from "../lib/convex/generated";
	import { signOut, isSignedIn, setAuthTokens } from "../lib/convex/auth";

	let props: { children: Snippet } = $props();
	let authed = $state(isSignedIn());
	let me: any = $state(null);
	let authError = $state("");

	onMount(async () => {
		authed = isSignedIn();
		if (!authed && page.url.pathname !== "/login") {
			goto("/login");
			return;
		}
		if (authed) {
			try {
				me = await convex.query(api.workers.getMe, {});
			} catch {
				await setAuthTokens(null, null);
				authed = false;
				me = null;
				authError = "Your session could not be verified. Please sign in again.";
				goto("/login");
			}
		}
	});

	async function logout() {
		await signOut();
		authed = false;
		me = null;
		goto("/login");
	}
</script>

<nav class="navbar">
	<div class="brand">Attendance&nbsp;Tracker</div>
	{#if authed}
		<div class="links">
			<a href="/dashboard" class={page.url.pathname === "/dashboard" ? "active" : ""}
				>Dashboard</a
			>
			<a href="/attendance" class={page.url.pathname === "/attendance" ? "active" : ""}
				>Attendance</a
			>
			{#if me?.role === "manager"}
				<a href="/admin" class={page.url.pathname === "/admin" ? "active" : ""}>Admin</a>
			{/if}
		</div>
	{/if}
	<div class="user">
		{#if authed}
			<span>{me?.name ?? "User"} <small>({me?.role})</small></span>
			<button onclick={logout}>Sign out</button>
		{:else}
			<a href="/login">Sign in</a>
		{/if}
	</div>
</nav>

<main>{@render props.children()}</main>
{#if authError}
	<p class="auth-error" role="alert">{authError}</p>
{/if}

<style>
	:global(body) {
		margin: 0;
		background: #f9fafb;
		color: #111827;
		font-family:
			Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	}
	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		background: #1f2937;
		color: #fff;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.brand {
		font-weight: 700;
		font-size: 1.25rem;
		letter-spacing: 0.5px;
	}
	.links {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.links a {
		color: #93c5fd;
		text-decoration: none;
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
	}
	.links a:hover,
	.links a.active {
		background: #374151;
		color: #fff;
	}
	.user {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.9rem;
	}
	.user small {
		color: #cbd5e1;
	}
	.user a {
		color: #93c5fd;
		text-decoration: none;
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
	}
	.user a:hover {
		background: #374151;
		color: #fff;
	}
	button {
		background: #ef4444;
		color: #fff;
		border: none;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
	}
	button:hover {
		background: #dc2626;
	}
	main {
		max-width: 900px;
		margin: 1.5rem auto;
		padding: 0 1rem;
	}
	.auth-error {
		max-width: 900px;
		margin: 0 auto 1rem;
		padding: 0 1rem;
		color: #991b1b;
	}
</style>
