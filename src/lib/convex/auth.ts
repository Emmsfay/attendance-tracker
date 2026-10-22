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

	if (!token) {
		convex.setAuth(async () => null, () => {});
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("Timed out while confirming your Convex sign-in."));
		}, 15_000);

		convex.setAuth(
			async () => localStorage.getItem(TOKEN_KEY),
			(isAuthenticated) => {
				clearTimeout(timeout);
				if (isAuthenticated) {
					resolve();
				} else {
					reject(new Error("Convex could not authenticate this session."));
				}
			},
		);
	});
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
	try {
		await setAuthTokens(result.tokens.token, result.tokens.refreshToken);
	} catch (error) {
		await setAuthTokens(null, null);
		throw error;
	}
	return result;
}

/** Sign out the current user. */
export async function signOut() {
	void convex.action(api.auth.signOut, {}).catch(() => {
		// Local sign-out must still work if the backend is unavailable.
	});
	setAuthTokens(null, null);
}
