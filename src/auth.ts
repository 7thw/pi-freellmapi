import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export const PROVIDER_ID = "freellmapi";

export interface StoredFreeLlmApiCredential {
	baseUrl?: string;
	apiKey?: string;
}

type RawCredential = {
	type?: unknown;
	access?: unknown;
	key?: unknown;
	baseUrl?: unknown;
};

/** Read only FreeLLMAPI's non-secret settings and key from the host auth file. */
export function loadStoredCredential(
	agentDir: string = getAgentDir(),
): StoredFreeLlmApiCredential | undefined {
	try {
		const raw = readFileSync(join(agentDir, "auth.json"), "utf8");
		const data: unknown = JSON.parse(raw);
		if (!isRecord(data)) return undefined;

		const credential = data[PROVIDER_ID];
		if (!isRecord(credential)) return undefined;
		const value = credential as RawCredential;
		const baseUrl = nonEmptyString(value.baseUrl);
		let apiKey: string | undefined;
		if (value.type === "oauth") apiKey = nonEmptyString(value.access);
		if (value.type === "api_key") apiKey = nonEmptyString(value.key);

		if (!baseUrl && !apiKey) return undefined;
		return { baseUrl, apiKey };
	} catch {
		return undefined;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value : undefined;
}