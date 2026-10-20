<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import type { Snippet } from "svelte";
	import { convex } from "../lib/convex/client";
	import { api } from "../lib/convex/generated";
	import { signOut, isSignedIn } from "../lib/convex/auth";

	let props: { children: Snippet } = $props();
	let authed = $state(isSignedIn());
	let me: any = $state(null);

	onMount(async () => {
		authed = isSignedIn();
		if (!authed && $page.url.pathname !== "/login") {
			goto("/login");
			return;
		}
		if (authed) {
			try {
				me = await convex.query(api.workers.getMe, {});
			} catch {
				authed = false;
				me = null;
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
	<div class="links">
		<a href="/dashboard" class={$page.url.pathname === "/dashboard" ? "active" : ""}
			>Dashboard</a
		>
		<a href="/attendance" class={$page.url.pathname === "/attendance" ? "active" : ""}
			>Attendance</a
		>
		{#if me?.role === "manager"}
			<a href="/admin" class={$page.url.pathname === "/admin" ? "active" : ""}>Admin</a>
		{/if}
	</div>
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

<style>
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
</style>
