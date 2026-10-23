<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { convex } from "#lib/convex/client";
	import { api } from "#lib/convex/generated";
	import { signOut, isSignedIn } from "#lib/convex/auth";
	import { icon } from "#lib/icons";
	import "../app.css";

	let props: { children: import("svelte").Snippet } = $props();
	let authed = $state(isSignedIn());
	let me: any = $state(null);

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

	const homePath = (role: string) => (role === "manager" ? "/admin" : "/dashboard");
	const navItems = (role: string) =>
		role === "manager"
			? [
					{ path: "/admin", label: "Today", icon: "calendar" },
					{ path: "/admin/team", label: "Team", icon: "users" }
			  ]
			: [
					{ path: "/dashboard", label: "Dashboard", icon: "clock" },
					{ path: "/attendance", label: "History", icon: "list" }
			  ];
	const items = $derived(navItems(me?.role ?? "worker"));
	const currentRoute = $derived(page.url.pathname);
</script>

<header class="onsite-topbar">
	<div class="onsite-topbar-inner">
		<a class="onsite-brand" href="#/">
			<svg class="onsite-brand-mark" viewBox="0 0 34 34" aria-hidden="true">
				<circle cx="17" cy="17" r="17" fill="#9fe870" />
				<path
					d="M17 8.5v8.5l5.5 3.2"
					fill="none"
					stroke="#163300"
					stroke-width="2.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span>OnSite</span>
		</a>
		<nav class="onsite-tabs" aria-label="Primary">
			{#each items as item}
				<a
					class="onsite-tab"
					href="#{item.path}"
					aria-current={currentRoute === item.path ? "page" : undefined}
					>{@html icon(item.icon)} <span>{item.label}</span></a
				>
			{/each}
		</nav>
		<div class="onsite-topbar-right">
			{#if authed}
				<span class="onsite-topbar-date">{new Date().toLocaleDateString(undefined, { weekday: "short" })} {new Date().getDate()} {new Date().toLocaleDateString(undefined, { month: "short" })}</span>
				<div class="onsite-account-wrap">
					<button
						class="onsite-account-btn"
						id="account-btn"
						aria-expanded="false"
						aria-controls="account-menu"
						aria-label="Account menu for {me?.name ?? ""}"
					>
						<span class="onsite-avatar {me?.role === "manager" ? "onsite-avatar-dark" : ""}" aria-hidden="true"
							>{me?.name?.split(" ").map((n: string) => n[0]).join("") ?? "?"}</span
						>
						<span class="account-name">{me?.name ?? "User"}</span>
						{@html icon("chevron", "onsite-od-icon-16")}
					</button>
					<div class="onsite-account-menu" id="account-menu" hidden>
						<div class="onsite-account-id">
							<span class="onsite-avatar onsite-avatar-lg {me?.role === "manager" ? "onsite-avatar-dark" : ""}" aria-hidden="true"
								>{me?.name?.split(" ").map((n: string) => n[0]).join("") ?? "?"}</span
							>
							<div class="od-fill">
								<strong>{me?.name ?? "User"}</strong>
								<span class="onsite-ontruncate">{me?.email ?? ""}</span>
							</div>
						</div>
						<div class="onsite-account-meta">
							<span class="onsite-chip {me?.role === "manager" ? "onsite-chip-role" : "onsite-chip-neutral"}"
								>{me?.role ?? "worker"}</span
							>
							<span class="onsite-account-emp">{me?.employeeId ?? ""}</span>
						</div>
						<button class="onsite-btn onsite-btn-secondary onsite-btn-full" onclick={logout}>
							{@html icon("logout")} Sign out
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

<main class="onsite-page" id="main">{@render props.children()}</main>

<nav class="onsite-bottom-nav" aria-label="Primary">
	<div class="onsite-bnav-inner">
		{#each items as item}
			<a
				class="onsite-bnav-item"
				href="#{item.path}"
				aria-current={currentRoute === item.path ? "page" : undefined}
			>
				{@html icon(item.icon)} <span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	:global(body) {
		margin: 0;
	}
	.od-fill {
		flex: 1 1 0;
		min-width: 0;
	}
</style>
