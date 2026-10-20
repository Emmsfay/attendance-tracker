import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/*
 * Convex Auth configuration.
 *
 * - `Password` provider: email + password, Convex-compatible Scrypt hashing,
 *   no email verification required (workers are created by a manager).
 * - Exported `signIn` / `signOut` are Convex actions callable from the client.
 *   `signIn({ provider: "password", params: { flow: "signIn"|"signUp", email, password } })
 *   returns { tokens: { token, refreshToken } }.
 *
 * The SvelteKit frontend stores these tokens in localStorage and configures
 * the ConvexClient with them, so every subsequent call is authenticated.
 */
export const { auth, signIn, signOut, store, isAuthenticated } =
	convexAuth({
		providers: [Password],
	});
