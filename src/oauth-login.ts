import type {
	OAuthCredentials,
	OAuthLoginCallbacks,
} from "@earendil-works/pi-ai";
import { normalizeBaseUrl } from "./config.ts";

/**
 * Fetches the live model catalog for (baseUrl, apiKey) and registers it as
 * the real provider. Called from inside login() so the catalog is live by
 * the time pi's login dialog closes — pi calls modelRegistry.refresh()
 * synchronously right after login() resolves, before credentials even reach
 * storage. This login path deliberately fetches immediately; the background
 * poll is only a fallback for startup/refresh outside the login flow.
 */
export type RegisterFreellmapiFromLogin = (
	baseUrl: string,
	apiKey: string,
) => Promise<{ ok: true } | { ok: false; error: string }>;

/**
 * Drives pi's native "Use a subscription" /login flow for freellmapi: prompts for
 * base URL then API key via the two onPrompt calls the login dialog exposes.
 * Stored as an oauth-typed credential (access/refresh/expires are required by
 * OAuthCredentials but unused — freellmapi has no token refresh); auth-storage.ts
 * reads baseUrl/access back out via loadfreellmapiCredential().
 */
export function createLoginFreellmapi(register: RegisterFreellmapiFromLogin) {
	return async function loginFreellmapi(
		callbacks: OAuthLoginCallbacks,
	): Promise<OAuthCredentials> {
		const rawBaseUrl = await callbacks.onPrompt({
			message: "FREELLMAPI base URL",
			placeholder: "http://127.0.0.1:31415/v1",
		});
		const baseUrl = normalizeBaseUrl(rawBaseUrl);

		const apiKey = (
			await callbacks.onPrompt({
				message: "FREELLMAPI API key (leave empty for a keyless server)",
				allowEmpty: true,
			})
		).trim();

		callbacks.onProgress?.("Fetching FREELLMAPI model catalog...");
		const result = await register(baseUrl, apiKey);
		if (!result.ok) {
			throw new Error(
				`Could not reach FREELLMAPI at ${baseUrl}: ${result.error}`,
			);
		}

		return {
			access: apiKey,
			refresh: "",
			expires: Number.POSITIVE_INFINITY,
			baseUrl,
		};
	};
}

export function refreshFreellmapiToken(
	credentials: OAuthCredentials,
): Promise<OAuthCredentials> {
	return Promise.resolve(credentials);
}

export function getFreellmapiApiKey(credentials: OAuthCredentials): string {
	return typeof credentials.access === "string" ? credentials.access : "";
}
