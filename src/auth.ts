import type { ApiKeyCredential, OAuthCredential } from "@earendil-works/pi-ai";
import { readStoredCredential } from "@earendil-works/pi-coding-agent";

export const PROVIDER_ID = "freellmapi";

export interface StoredFreeLlmApiCredential {
	baseUrl?: string;
	apiKey?: string;
}

type FreeLlmApiCredential = ApiKeyCredential & { baseUrl?: string };
type FreeLlmApiOAuthCredential = OAuthCredential & { baseUrl?: string };

let authPathOverrideForTesting: string | undefined;

export function _setAuthPathForTesting(path: string | undefined): void {
	authPathOverrideForTesting = path;
}

/** Read only FreeLLMAPI's non-secret settings and key from the host auth file. */
export function loadStoredCredential(): StoredFreeLlmApiCredential | undefined {
	const cred = readStoredCredential(PROVIDER_ID, authPathOverrideForTesting) as
		| FreeLlmApiCredential
		| FreeLlmApiOAuthCredential
		| undefined;
	if (!cred) return undefined;
	if (cred.type === "api_key") {
		if (!cred.key) return undefined;
		const baseUrl = nonEmptyString(cred.baseUrl);
		const apiKey = nonEmptyString(cred.key);
		// Only include non-empty values
		const result: StoredFreeLlmApiCredential = {};
		if (baseUrl !== undefined) result.baseUrl = baseUrl;
		if (apiKey !== undefined) result.apiKey = apiKey;
		return Object.keys(result).length > 0 ? result : undefined;
	}
	if (cred.type === "oauth") {
		// access may be legitimately empty for a keyless server
		// (skip_api_key_verification) — baseUrl alone still counts as configured.
		if (!cred.access && !cred.baseUrl) return undefined;
		const baseUrl = nonEmptyString(cred.baseUrl);
		const apiKey = nonEmptyString(cred.access);
		// Only include non-empty values
		const result: StoredFreeLlmApiCredential = {};
		if (baseUrl !== undefined) result.baseUrl = baseUrl;
		if (apiKey !== undefined) result.apiKey = apiKey;
		return Object.keys(result).length > 0 ? result : undefined;
	}
	return undefined;
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
