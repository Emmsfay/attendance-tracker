<script lang="ts">
	interface Props {
		latitude: number;
		longitude: number;
		title?: string;
		height?: number;
	}

	let { latitude, longitude, title = "Punch location", height = 220 }: Props = $props();

	const embedUrl = $derived.by(() => {
		const pad = 0.006;
		const bbox = `${longitude - pad},${latitude - pad},${longitude + pad},${latitude + pad}`;
		return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude}%2C${longitude}`;
	});

	const openUrl = $derived(
		`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
	);
</script>

<div class="location-map">
	<div class="location-map-head">
		<span class="location-map-title">{title}</span>
		<a class="onsite-text-link" href={openUrl} target="_blank" rel="noopener noreferrer">
			Open full map
		</a>
	</div>
	<iframe
		title={title}
		src={embedUrl}
		width="100%"
		height={height}
		style="border:0;border-radius:12px;"
		loading="lazy"
		referrerpolicy="no-referrer-when-downgrade"
	></iframe>
	<p class="location-map-coords">
		{latitude.toFixed(5)}, {longitude.toFixed(5)}
	</p>
</div>

<style>
	.location-map {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 12px;
	}
	.location-map-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.location-map-title {
		font-size: 13px;
		font-weight: 700;
	}
	.location-map-coords {
		font-size: 11.5px;
		color: var(--onsite-ink-soft);
		font-variant-numeric: tabular-nums;
		margin: 0;
	}
</style>
