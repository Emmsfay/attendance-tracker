<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { convex } from "#lib/convex/client";
	import { api } from "#lib/convex/generated";
	import { isSignedIn } from "#lib/convex/auth";

	onMount(async () => {
		if (!isSignedIn()) {
			goto("/login");
			return;
		}
		try {
			const me = await convex.query(api.workers.getMe, {});
			goto(me.role === "manager" ? "/admin" : "/dashboard");
		} catch {
			goto("/login");
		}
	});
</script>

<p class="onsite-muted" style="padding: 2rem; text-align: center">Loading&hellip;</p>
