export const ICONS: Record<string, string> = {
	clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
	list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
	pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
	arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
	check: '<path d="M4.5 12.5l5 5 10-11"/>',
	users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M17 4.5a3.5 3.5 0 0 1 0 6.6M21 20v-1.5a4 4 0 0 0-3-3.87"/>',
	building: '<path d="M4 21V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15M15 10h4a1 1 0 0 1 1 1v10M2 21h20"/><path d="M8 9h3M8 13h3M8 17h3"/>',
	chevron: '<path d="M6 9l6 6 6-6"/>',
	x: '<path d="M6 6l12 12M18 6L6 18"/>',
	eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>',
	eyeOff: '<path d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.1 4.1"/><path d="M9.4 5.5A11.9 11.9 0 0 1 12 5c6.4 0 10 6 10 6a17 17 0 0 1-2.7 3.3M6.2 7.1A17 17 0 0 0 2 11s3.6 6 10 6a11 11 0 0 0 4.2-.8"/>',
	alert: '<path d="M12 8.5v4.5M12 16.5h.01"/><path d="M10.3 3.9 2.4 18a1.7 1.7 0 0 0 1.5 2.5h16.2a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z"/>',
	logout: '<path d="M15 17l5-5-5-5M20 12H9M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/>',
	plus: '<path d="M12 5v14M5 12h14"/>',
	calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
	doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
	refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 4v7h-7"/>'
};

export function icon(name: string, sizeClass?: string): string {
	return `<svg class="onsite-od-icon ${sizeClass || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
