<script lang="ts">
	import { goto } from "$app/navigation";
	import { signIn } from "../../lib/convex/auth";

	let email = $state("");
	let password = $state("");
	let error = $state("");
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = "";
		loading = true;
		try {
			await signIn(email.trim(), password);
			goto("/dashboard");
		} catch (err: any) {
			error = err?.message || "Sign in failed";
		} finally {
			loading = false;
		}
	}
</script>

<div class="page">
	<div class="card">
		<h2>Sign in</h2>
		{#if error}
			<div class="alert alert-error">{error}</div>
		{/if}
		<form onsubmit={handleSubmit} novalidate>
			<div class="field">
				<label>Email</label>
				<input
					bind:value={email}
					type="email"
					placeholder="you@company.com"
					required
				/>
			</div>
			<div class="field">
				<label>Password</label>
				<input bind:value={password} type="password" placeholder="••••••••" required />
			</div>
			<button type="submit" disabled={loading} class="btn">
				{loading ? "Signing in…" : "Sign in"}
			</button>
		</form>
		<p class="hint">
			Don't have an account? Ask your manager to create one, or use the
			Admin "Create worker" flow after the first manager is set up.
		</p>
	</div>
</div>

<style>
	.page {
		display: flex;
		justify-content: center;
		padding: 3rem 1rem;
	}
	.card {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
	}
	h2 {
		margin: 0 0 1.25rem;
		font-size: 1.5rem;
		color: #111827;
	}
	.alert {
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	.alert-error {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}
	label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}
	input {
		padding: 0.55rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}
	input:focus {
		outline: 2px solid #3b82f6;
		border-color: #3b82f6;
	}
	.btn {
		width: 100%;
		background: #2563eb;
		color: #fff;
		border: none;
		padding: 0.65rem;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn:not(:disabled):hover {
		background: #1d4ed8;
	}
	.hint {
		margin-top: 1rem;
		font-size: 0.85rem;
		color: #6b7280;
		text-align: center;
	}
</style>
