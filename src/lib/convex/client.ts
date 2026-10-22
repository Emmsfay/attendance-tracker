import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const url = import.meta.env.PUBLIC_CONVEX_URL;
if (!url) {
	throw new Error(
		"Missing PUBLIC_CONVEX_URL. Set it in .env (see .env.local from `npx convex init`).",
	);
}

/** Single Convex client used across the SvelteKit app. */
export const convex = new ConvexClient(url);

convex.setAuth(async () => {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem("at_token");
});
