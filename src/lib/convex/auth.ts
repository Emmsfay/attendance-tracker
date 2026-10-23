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

/** Used by ConvexClient.setAuth — must match AuthTokenFetcher signature. */
export async function fetchAccessToken({
	forceRefreshToken,
}: {
	forceRefreshToken: boolean;
}): Promise<string | null> {
	if (typeof localStorage === "undefined") return null;

	if (!forceRefreshToken) {
		return localStorage.getItem(TOKEN_KEY);
	}

	const refresh = localStorage.getItem(REFRESH_KEY);
	if (!refresh) {
		return localStorage.getItem(TOKEN_KEY);
	}

	try {
		const result = await convex.action(api.auth.signIn, {
			refreshToken: refresh,
		});
		if (result?.tokens?.token) {
			localStorage.setItem(TOKEN_KEY, result.tokens.token);
			if (result.tokens.refreshToken) {
				localStorage.setItem(REFRESH_KEY, result.tokens.refreshToken);
			}
			return result.tokens.token;
		}
	} catch {
		// Use cached access token if refresh fails (e.g. offline).
	}

	return localStorage.getItem(TOKEN_KEY);
}

convex.setAuth(fetchAccessToken);

/**
 * Persist Convex auth tokens and wire them into the client.
 * Does not wait on WebSocket auth confirmation (that requires JWKS on the deployment).
 */
export function setAuthTokens(
	token: string | null,
	refreshToken: string | null,
): Promise<void> {
	if (typeof localStorage === "undefined") return Promise.resolve();
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

	convex.setAuth(fetchAccessToken);
	return Promise.resolve();
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
	await setAuthTokens(result.tokens.token, result.tokens.refreshToken);
	// Prove the session works before leaving the login page.
	await convex.query(api.workers.getMe, {});
	return result;
}

/** Sign out the current user. */
export async function signOut() {
	void convex.action(api.auth.signOut, {}).catch(() => {
		// Local sign-out must still work if the backend is unavailable.
	});
	await setAuthTokens(null, null);
}
