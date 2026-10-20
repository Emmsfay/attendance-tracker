import { convex } from "./client";
import { api } from "../../../convex/_generated/api";

const TOKEN_KEY = "at_token";
const REFRESH_KEY = "at_refresh";

export function getToken(): string | null {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function isSignedIn(): boolean {
	return getToken() !== null;
}

/**
 * Persist Convex auth tokens and tell the ConvexClient to send them with
 * subsequent requests. The fetcher reads localStorage so token rotation
 * (e.g. sign out) is picked up automatically.
 */
export function setAuthTokens(token: string | null, refreshToken: string | null) {
	if (typeof localStorage === "undefined") return;
	if (token) {
		localStorage.setItem(TOKEN_KEY, token);
	} else {
		localStorage.removeItem(TOKEN_KEY);
	}
	if (refreshToken) {
		localStorage.setItem(REFRESH_KEY, refreshToken);
	} else {
		localStorage.removeItem(REFRESH_KEY);
	}
	convex.setAuth(
		async () => localStorage.getItem(TOKEN_KEY),
		() => {},
	);
}

/** Sign in with email + password. Returns the Convex sign-in result. */
export async function signIn(email: string, password: string) {
	const result = await convex.action(api.auth.signIn, {
		provider: "password",
		params: { flow: "signIn", email, password },
	});
	if (!result || !result.tokens) {
		throw new Error("Invalid email or password");
	}
	setAuthTokens(result.tokens.token, result.tokens.refreshToken);
	return result;
}

/** Sign out the current user. */
export async function signOut() {
	try {
		await convex.action(api.auth.signOut, {});
	} catch {
		// Ignore errors; clear local state regardless.
	}
	setAuthTokens(null, null);
}
