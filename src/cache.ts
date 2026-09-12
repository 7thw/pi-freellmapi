import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import type { FreeLlmApiModel } from "./catalog.ts";
import { parseModelArray } from "./catalog.ts";

const CACHE_FILE_NAME = "freellmapi-models.json";

export function readCatalogCache(
	apiRoot: string,
	agentDir: string = getAgentDir(),
): FreeLlmApiModel[] | undefined {
	try {
		const raw = readFileSync(join(agentDir, "cache", CACHE_FILE_NAME), "utf8");
		const data: unknown = JSON.parse(raw);
		if (
			!isRecord(data) ||
			data.apiRoot !== apiRoot ||
			!Array.isArray(data.models)
		) {
			return undefined;
		}
		return parseCachedModels(data.models);
	} catch {
		return undefined;
	}
}

export function writeCatalogCache(
	apiRoot: string,
	models: FreeLlmApiModel[],
	agentDir: string = getAgentDir(),
): void {
	try {
		const cacheDir = join(agentDir, "cache");
		mkdirSync(cacheDir, { recursive: true });
		writeFileSync(
			join(cacheDir, CACHE_FILE_NAME),
			JSON.stringify({ apiRoot, models, savedAt: Date.now() }, null, 2),
			"utf8",
		);
	} catch {
		// The live catalog remains usable when the best-effort cache cannot be written.
	}
}

export function parseCachedModels(
	values: unknown[],
): FreeLlmApiModel[] | undefined {
	const models = parseModelArray(values);
	return models.length > 0 ? models : undefined;
}

function _positiveFiniteNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value > 0
		? value
		: undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
