import {
	loadStoredCredential,
	type StoredFreeLlmApiCredential,
} from "./auth.ts";

export const PROVIDER_ID = "freellmapi";
export const DEFAULT_BASE_URL = "http://127.0.0.1:3001/v1";
export const DEFAULT_MAX_TOKENS = 8192;
export const API_KEY_ENV_VAR = "FREELLMAPI_API_KEY";
export const BASE_URL_ENV_VAR = "FREELLMAPI_BASE_URL";
export const MAX_TOKENS_ENV_VAR = "FREELLMAPI_MAX_TOKENS";

export interface FreeLlmApiConfig {
	apiRoot: string;
	maxTokens: number;
}

export function normalizeBaseUrl(raw: string): string {
	const trimmed = raw.trim().replace(/\/+$/, "");
	if (!trimmed) throw new Error("FREELLMAPI_BASE_URL is empty");
	return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

export function parseMaxTokens(value: string | undefined): number {
	if (!value || !/^\d+$/.test(value.trim())) return DEFAULT_MAX_TOKENS;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0
		? parsed
		: DEFAULT_MAX_TOKENS;
}

export function loadConfig(
	env: NodeJS.ProcessEnv = process.env,
	stored: StoredFreeLlmApiCredential | undefined = loadStoredCredential(),
): FreeLlmApiConfig {
	const rawBaseUrl =
		env[BASE_URL_ENV_VAR] ?? stored?.baseUrl ?? DEFAULT_BASE_URL;
	return {
		apiRoot: normalizeBaseUrl(rawBaseUrl),
		maxTokens: parseMaxTokens(env[MAX_TOKENS_ENV_VAR]),
	};
}

/** Resolve the key without pairing an explicit environment URL with an old stored key. */
export function resolveConfiguredApiKey(
	env: NodeJS.ProcessEnv = process.env,
	stored: StoredFreeLlmApiCredential | undefined = loadStoredCredential(),
): string | undefined {
	const environmentKey = env[API_KEY_ENV_VAR]?.trim();
	if (environmentKey) return environmentKey;
	if (env[BASE_URL_ENV_VAR] !== undefined) return undefined;
	return stored?.apiKey;
}
