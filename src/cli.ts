import {
	mkdirSync,
	readFileSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { loadStoredCredential } from "./auth.js";
import { readCatalogCache, writeCatalogCache } from "./cache.js";
import type { FreeLlmApiModel } from "./catalog.js";
import { fetchCatalog } from "./catalog.js";
import {
	loadConfig,
	normalizeBaseUrl,
	resolveConfiguredApiKey,
} from "./config.js";

export type OutputFormat = "table" | "json" | "markdown";

export interface CliOptions {
	format?: OutputFormat;
	baseUrl?: string;
	apiKey?: string;
	timeout?: number;
	useCache?: boolean;
	showAll?: boolean;
	force?: boolean;
}

export interface ParsedArgs {
	command: string;
	subcommand?: string;
	options: CliOptions;
	help?: boolean;
}

export interface CacheInfo {
	path: string;
	exists: boolean;
	age?: number;
	modelCount?: number;
	apiRoot?: string;
}

export interface ConfigDisplay {
	baseUrl: string;
	maxTokens: number;
	authSource: string;
	cache: CacheInfo;
}

function formatContextWindow(contextWindow: number): string {
	if (contextWindow >= 1_000_000) {
		return `${Math.floor(contextWindow / 1_000_000)}M`;
	}
	if (contextWindow >= 1_000) {
		return `${Math.floor(contextWindow / 1_000)}k`;
	}
	return String(contextWindow);
}

function padStartRight(text: string, width: number): string {
	if (text.length >= width) return text;
	return text + " ".repeat(width - text.length);
}

export function formatTable(
	models: FreeLlmApiModel[],
	showAll?: boolean,
): string {
	if (models.length === 0) return "No models available.";

	if (showAll) {
		const idWidth = Math.max(2, ...models.map((m) => m.id.length), "ID".length);
		const nameWidth = Math.max(
			2,
			...models.map((m) => m.name.length),
			"NAME".length,
		);
		const contextWidth = Math.max(2, "CONTEXT".length);
		const ownerWidth = Math.max(
			2,
			...models.map((m) => (m.ownedBy ?? "").length),
			"OWNED BY".length,
		);
		const availableWidth = Math.max(2, "AVAILABLE".length, "true".length);
		const paramsWidth = Math.max(
			2,
			...models.map((m) => (m.supportedParameters ?? []).join(", ").length),
			"PARAMETERS".length,
		);

		const sep = "  ";
		const header = [
			padStartRight("ID", idWidth),
			padStartRight("NAME", nameWidth),
			padStartRight("CONTEXT", contextWidth),
			padStartRight("OWNED BY", ownerWidth),
			padStartRight("AVAILABLE", availableWidth),
			padStartRight("PARAMETERS", paramsWidth),
		].join(sep);
		const separator = [
			"-".repeat(idWidth),
			"-".repeat(nameWidth),
			"-".repeat(contextWidth),
			"-".repeat(ownerWidth),
			"-".repeat(availableWidth),
			"-".repeat(paramsWidth),
		].join("  ");

		const rows = models.map((m) => {
			const params = (m.supportedParameters ?? []).join(", ");
			return [
				padStartRight(m.id, idWidth),
				padStartRight(m.name, nameWidth),
				padStartRight(formatContextWindow(m.contextWindow), contextWidth),
				padStartRight(m.ownedBy ?? "", ownerWidth),
				padStartRight(String(m.available), availableWidth),
				padStartRight(params, paramsWidth),
			].join(sep);
		});

		return [header, separator, ...rows].join("\n");
	}

	const idWidth = Math.max(2, ...models.map((m) => m.id.length), "ID".length);
	const nameWidth = Math.max(
		2,
		...models.map((m) => m.name.length),
		"NAME".length,
	);
	const contextWidth = Math.max(2, "CONTEXT".length);
	const ownerWidth = Math.max(
		2,
		...models.map((m) => (m.ownedBy ?? "").length),
		"OWNER".length,
	);

	const sep = "  ";
	const header = [
		padStartRight("ID", idWidth),
		padStartRight("NAME", nameWidth),
		padStartRight("CONTEXT", contextWidth),
		padStartRight("OWNER", ownerWidth),
	].join(sep);
	const separator = [
		"-".repeat(idWidth),
		"-".repeat(nameWidth),
		"-".repeat(contextWidth),
		"-".repeat(ownerWidth),
	].join(sep);

	const rows = models.map((m) => {
		return [
			padStartRight(m.id, idWidth),
			padStartRight(m.name, nameWidth),
			padStartRight(formatContextWindow(m.contextWindow), contextWidth),
			padStartRight(m.ownedBy ?? "", ownerWidth),
		].join(sep);
	});

	return [header, separator, ...rows].join("\n");
}

export function formatJson(models: FreeLlmApiModel[]): string {
	return JSON.stringify(models, null, 2);
}

export function formatMarkdown(models: FreeLlmApiModel[]): string {
	if (models.length === 0) return "No models available.";

	const header = "| ID | Name | Context Window | Owned By |";
	const separator = "| --- | --- | --- | --- |";
	const rows = models
		.map(
			(m) =>
				`| ${m.id} | ${m.name} | ${m.contextWindow.toLocaleString("en-US")} | ${m.ownedBy ?? ""} |`,
		)
		.join("\n");

	return [header, separator, rows].join("\n");
}

export function getCacheInfo(): CacheInfo {
	const agentDir = getAgentDir();
	const path = join(agentDir, "cache", "freellmapi-models.json");
	try {
		const stat = statSync(path);
		const raw = readFileSync(path, "utf8");
		const data: unknown = JSON.parse(raw);
		if (!isRecord(data) || !Array.isArray(data.models)) {
			return { path, exists: false };
		}
		return {
			path,
			exists: true,
			age: Date.now() - stat.mtimeMs,
			modelCount: data.models.length,
			apiRoot: typeof data.apiRoot === "string" ? data.apiRoot : undefined,
		};
	} catch {
		return { path, exists: false };
	}
}

export function formatCacheInfo(cache: CacheInfo): string {
	if (!cache.exists) {
		return `Cache not found.\nPath: ${cache.path}`;
	}
	const ageMinutes = Math.round((cache.age ?? 0) / 60_000);
	const lines = [
		`Cache: ${cache.path}`,
		`Age: ${ageMinutes} minutes`,
		`Models: ${cache.modelCount}`,
	];
	if (cache.apiRoot) {
		lines.push(`API Root: ${cache.apiRoot}`);
	}
	return lines.join("\n");
}

export function getConfigDisplay(): ConfigDisplay {
	const config = loadConfig();
	const envKey = process.env.FREELLMAPI_API_KEY?.trim();
	const stored = loadStoredCredential();

	let authSource: string;
	if (envKey) {
		authSource = "environment variable (FREELLMAPI_API_KEY)";
	} else if (stored?.apiKey) {
		authSource = "stored credential";
	} else {
		authSource = "none";
	}

	return {
		baseUrl: config.apiRoot,
		maxTokens: config.maxTokens,
		authSource,
		cache: getCacheInfo(),
	};
}

export function formatConfigDisplay(config: ConfigDisplay): string {
	const lines = [
		`Base URL: ${config.baseUrl}`,
		`Max Tokens: ${config.maxTokens}`,
		`Auth Source: ${config.authSource}`,
		`Cache: ${config.cache.exists ? "available" : "not found"}`,
	];
	if (config.cache.exists) {
		lines.push(`  Models cached: ${config.cache.modelCount}`);
		if (config.cache.apiRoot) {
			lines.push(`  API Root: ${config.cache.apiRoot}`);
		}
	}
	return lines.join("\n");
}

function getBaseUrl(options: CliOptions): string {
	if (options.baseUrl) return normalizeBaseUrl(options.baseUrl);
	return loadConfig().apiRoot;
}

function getApiKey(options: CliOptions): string | undefined {
	if (options.apiKey) return options.apiKey;
	return resolveConfiguredApiKey();
}

export async function handleModels(options: CliOptions): Promise<string> {
	const baseUrl = getBaseUrl(options);
	const apiKey = getApiKey(options);
	const timeout = options.timeout ?? 15_000;
	const useCache = options.useCache !== false && !options.force;
	const format = options.format ?? "table";

	let models: FreeLlmApiModel[];

	if (useCache) {
		const cached = readCatalogCache(baseUrl);
		if (cached && cached.length > 0) {
			models = cached;
		} else {
			if (!apiKey)
				throw new Error(
					"API key is required (set FREELLMAPI_API_KEY or provide --api-key)",
				);
			models = await fetchCatalog(baseUrl, apiKey, { timeoutMs: timeout });
			writeCatalogCache(baseUrl, models);
		}
	} else {
		if (!apiKey)
			throw new Error(
				"API key is required (set FREELLMAPI_API_KEY or provide --api-key)",
			);
		models = await fetchCatalog(baseUrl, apiKey, { timeoutMs: timeout });
		writeCatalogCache(baseUrl, models);
	}

	return formatOutput(models, format);
}

export async function handleFetch(options: CliOptions): Promise<string> {
	const baseUrl = getBaseUrl(options);
	const apiKey = getApiKey(options);
	const timeout = options.timeout ?? 15_000;

	if (!apiKey)
		throw new Error(
			"API key is required (set FREELLMAPI_API_KEY or provide --api-key)",
		);

	const models = await fetchCatalog(baseUrl, apiKey, { timeoutMs: timeout });
	writeCatalogCache(baseUrl, models);
	const format = options.format ?? "table";
	return formatOutput(models, format);
}

export async function handleCache(subcommand?: string): Promise<string> {
	if (subcommand === "clear") {
		const agentDir = getAgentDir();
		const path = join(agentDir, "cache", "freellmapi-models.json");
		try {
			unlinkSync(path);
			return `Cache cleared: ${path}`;
		} catch {
			return "Cache file not found.";
		}
	}
	if (subcommand === "info" || subcommand === undefined) {
		const cache = getCacheInfo();
		return formatCacheInfo(cache);
	}
	throw new Error(`Unknown cache subcommand: ${subcommand}`);
}

export async function handleConfig(): Promise<string> {
	const config = getConfigDisplay();
	return formatConfigDisplay(config);
}

function formatOutput(models: FreeLlmApiModel[], format: OutputFormat): string {
	switch (format) {
		case "json":
			return formatJson(models);
		case "markdown":
			return formatMarkdown(models);
		default:
			return formatTable(models, false);
	}
}

export function formatHelp(): string {
	return `pi-freellmapi - Discover models from a FreeLLMAPI gateway

USAGE
  pi-freellmapi <command> [options]

COMMANDS
  models      List available models (default)
  fetch       Force-fetch models and update cache
  cache       Manage cache (info, clear)
  config      Show current configuration
  help        Show this help

OPTIONS
  --format <type>     Output format: table, json, markdown (default: table)
  --base-url <url>    Override base URL
  --api-key <key>     Override API key
  --timeout <ms>      Request timeout in milliseconds (default: 15000)
  --cache             Use cached models when available (default)
  --no-cache          Do not use cached models
  --show-all          Show additional columns (available, parameters)
  --force             Force re-fetch, bypassing cache
  --help, -h          Show help

EXAMPLES
  pi-freellmapi models
  pi-freellmapi fetch --format json
  pi-freellmapi cache info
  pi-freellmapi cache clear
  pi-freellmapi config
  pi-freellmapi models --show-all --format markdown`;
}

export function parseArgs(args: string[]): ParsedArgs {
	const options: CliOptions = {};
	let command = "models";
	let subcommand: string | undefined;
	let help = false;

	const positional: string[] = [];

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--help" || arg === "-h") {
			help = true;
			continue;
		}

		if (arg === "--format") {
			i++;
			const value = args[i];
			if (value !== "table" && value !== "json" && value !== "markdown") {
				throw new Error(
					`Invalid --format value: ${value}. Must be table, json, or markdown.`,
				);
			}
			options.format = value;
			continue;
		}

		if (arg === "--base-url") {
			i++;
			options.baseUrl = args[i];
			continue;
		}

		if (arg === "--api-key") {
			i++;
			options.apiKey = args[i];
			continue;
		}

		if (arg === "--timeout") {
			i++;
			const value = Number(args[i]);
			if (!Number.isFinite(value) || value <= 0) {
				throw new Error(
					`Invalid --timeout value: ${args[i]}. Must be a positive number.`,
				);
			}
			options.timeout = value;
			continue;
		}

		if (arg === "--cache") {
			options.useCache = true;
			continue;
		}

		if (arg === "--no-cache") {
			options.useCache = false;
			continue;
		}

		if (arg === "--show-all") {
			options.showAll = true;
			continue;
		}

		if (arg === "--force") {
			options.force = true;
			continue;
		}

		if (arg.startsWith("--")) {
			throw new Error(`Unknown option: ${arg}`);
		}

		positional.push(arg);
	}

	if (positional.length > 0) {
		command = positional[0];
	}
	if (positional.length > 1) {
		subcommand = positional[1];
	}

	return { command, subcommand, options, help };
}

export async function main(args?: string[]): Promise<void> {
	try {
		const parsed = parseArgs(args ?? process.argv.slice(2));

		if (parsed.help || parsed.command === "help") {
			console.log(formatHelp());
			return;
		}

		let output: string;

		switch (parsed.command) {
			case "models":
				output = await handleModels(parsed.options);
				break;
			case "fetch":
				output = await handleFetch(parsed.options);
				break;
			case "cache":
				output = await handleCache(parsed.subcommand);
				break;
			case "config":
				output = await handleConfig();
				break;
			default:
				console.error(`Unknown command: ${parsed.command}`);
				console.error("Run 'pi-freellmapi help' for usage information.");
				process.exit(1);
		}

		console.log(output);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
