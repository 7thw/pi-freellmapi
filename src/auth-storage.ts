import type { ApiKeyCredential, OAuthCredential } from "@earendil-works/pi-ai";
import { readStoredCredential } from "@earendil-works/pi-coding-agent";

export const PROVIDER_KEY = "freellmapi";

export interface FreellmapiStoredCredential {
	baseUrl?: string;
	apiKey: string;
}

type FreellmapiApiKeyCredential = ApiKeyCredential & { baseUrl?: string };
type FreellmapiOAuthCredential = OAuthCredential & { baseUrl?: string };

let authPathOverrideForTesting: string | undefined;

export function _setAuthPathForTesting(path: string | undefined): void {
	authPathOverrideForTesting = path;
}

export function loadFreellmapiCredential(): FreellmapiStoredCredential | undefined {
	const cred = readStoredCredential(PROVIDER_KEY, authPathOverrideForTesting) as
		| FreellmapiApiKeyCredential
		| FreellmapiOAuthCredential
		| undefined;
	if (!cred) return undefined;
	if (cred.type === "api_key") {
		if (!cred.key) return undefined;
		return { baseUrl: cred.baseUrl, apiKey: cred.key };
	}
	if (cred.type === "oauth") {
		// access may be legitimately empty for a keyless FREELLMAPI server
		// (skip_api_key_verification) — baseUrl alone still counts as configured.
		if (!cred.access && !cred.baseUrl) return undefined;
		return { baseUrl: cred.baseUrl, apiKey: cred.access ?? "" };
	}
	return undefined;
}
