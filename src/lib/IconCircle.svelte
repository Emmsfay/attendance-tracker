<script lang="ts">
	import { ICONS } from "./icons";

	type IconName = keyof typeof ICONS;

	interface Props {
		name: IconName;
		size?: number;
		variant?: "pitch" | "note";
	}

	let { name, size = 18, variant = "pitch" }: Props = $props();

	const paths = ICONS[name] ?? "";
</script>

<span class="onsite-icon-circle" class:onsite-icon-circle--note={variant === "note"}>
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{@html paths}
	</svg>
</span>
