import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PROVIDER_ID, loadStoredCredential } from "./src/auth.js";
import { readCatalogCache, writeCatalogCache } from "./src/cache.js";
import { type FreeLlmApiModel, fetchCatalog } from "./src/catalog.js";
import {
	DEFAULT_BASE_URL,
	type FreeLlmApiConfig,
	loadConfig,
	parseMaxTokens,
	resolveConfiguredApiKey,
} from "./src/config.js";
import {
	createLoginFreeLlmApi,
	getFreeLlmApiKey,
	refreshFreeLlmApiToken,
} from "./src/login.js";
import { toProviderConfig } from "./src/provider.js";

const EXTENSION_SINGLETON_KEY = Symbol.for("pi-freellmapi/loaded");
const STARTUP_TIMEOUT_MS = 2_000;
const NORMAL_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 10 * 60 * 1000;
const BACKOFF_BASE_MS = 2_000;
const BACKOFF_MAX_MS = 60_000;

interface State {
	config: FreeLlmApiConfig;
	catalog: FreeLlmApiModel[];
	registered: boolean;
	stopped: boolean;
	lastError?: string;
	timer?: ReturnType<typeof setTimeout>;
	wake?: () => void;
	refreshController?: AbortController;
}

type RefreshResult = "registered" | "not_configured" | "failed";

export default async function freellmapiExtension(
	pi: ExtensionAPI,
): Promise<void> {
	const globalState = globalThis as Record<PropertyKey, unknown>;
	if (globalState[EXTENSION_SINGLETON_KEY]) return;
	globalState[EXTENSION_SINGLETON_KEY] = true;

	const stored = loadStoredCredential();
	const state: State = {
		config: safeLoadConfig(stored),
		catalog: [],
		registered: false,
		stopped: false,
	};

	registerCachedOrLoginOnly(pi, state, stored);
	const initialResult = await refreshProvider(pi, state, STARTUP_TIMEOUT_MS);
	if (initialResult !== "registered" && !state.registered) {
		registerCachedOrLoginOnly(pi, state, stored);
	}

	void startPolling(pi, state).catch((error: unknown) => {
		state.lastError = errorMessage(error);
	});

	pi.on("session_shutdown", () => {
		state.stopped = true;
		state.refreshController?.abort();
		if (state.timer) clearTimeout(state.timer);
		state.timer = undefined;
		state.wake?.();
		state.wake = undefined;
		delete globalState[EXTENSION_SINGLETON_KEY];
	});
}

function buildOauth(pi: ExtensionAPI, state: State) {
	return {
		name: "FreeLLMAPI",
		login: createLoginFreeLlmApi(async (baseUrl, _apiKey, models) => {
			const config: FreeLlmApiConfig = {
				apiRoot: baseUrl,
				maxTokens: parseMaxTokens(process.env.FREELLMAPI_MAX_TOKENS),
			};
			writeCatalogCache(config.apiRoot, models);
			registerModels(pi, state, config, models);
		}),
		refreshToken: refreshFreeLlmApiToken,
		getApiKey: getFreeLlmApiKey,
	};
}

function registerModels(
	pi: ExtensionAPI,
	state: State,
	config: FreeLlmApiConfig,
	models: FreeLlmApiModel[],
): void {
	pi.unregisterProvider(PROVIDER_ID);
	pi.registerProvider(PROVIDER_ID, {
		...toProviderConfig(config, models),
		oauth: buildOauth(pi, state),
	});
	state.config = config;
	state.catalog = models;
	state.registered = true;
	state.lastError = undefined;
}

function registerLoginOnly(pi: ExtensionAPI, state: State): void {
	pi.unregisterProvider(PROVIDER_ID);
	pi.registerProvider(PROVIDER_ID, {
		name: "FreeLLMAPI",
		oauth: buildOauth(pi, state),
	});
	state.catalog = [];
	state.registered = false;
}

function registerCachedOrLoginOnly(
	pi: ExtensionAPI,
	state: State,
	stored: ReturnType<typeof loadStoredCredential>,
): void {
	const config = state.config;
	const apiKey = resolveConfiguredApiKey(process.env, stored);
	const cached = apiKey ? readCatalogCache(config.apiRoot) : undefined;
	if (cached && cached.length > 0) {
		registerModels(pi, state, config, cached);
		return;
	}
	registerLoginOnly(pi, state);
}

async function refreshProvider(
	pi: ExtensionAPI,
	state: State,
	timeoutMs: number,
	signal?: AbortSignal,
): Promise<RefreshResult> {
	let config: FreeLlmApiConfig;
	try {
		config = loadConfig();
	} catch (error) {
		state.lastError = errorMessage(error);
		return "failed";
	}
	const apiKey = resolveConfiguredApiKey();
	if (!apiKey) {
		state.lastError = "FREELLMAPI credentials are not configured";
		return "not_configured";
	}
	state.config = config;
	return fetchAndRegister(pi, state, config, apiKey, timeoutMs, signal);
}

async function fetchAndRegister(
	pi: ExtensionAPI,
	state: State,
	config: FreeLlmApiConfig,
	apiKey: string,
	timeoutMs: number,
	signal?: AbortSignal,
): Promise<RefreshResult> {
	try {
		const models = await fetchCatalog(config.apiRoot, apiKey, {
			timeoutMs,
			signal,
		});
		if (models.length === 0) {
			state.lastError =
				"FreeLLMAPI returned no available models with valid context windows";
			return "failed";
		}
		writeCatalogCache(config.apiRoot, models);
		registerModels(pi, state, config, models);
		return "registered";
	} catch (error) {
		state.lastError = errorMessage(error);
		return "failed";
	}
}

async function startPolling(pi: ExtensionAPI, state: State): Promise<void> {
	let backoffMs = BACKOFF_BASE_MS;
	while (!state.stopped) {
		const controller = new AbortController();
		state.refreshController = controller;
		const result = await refreshProvider(
			pi,
			state,
			NORMAL_TIMEOUT_MS,
			controller.signal,
		);
		if (state.refreshController === controller)
			state.refreshController = undefined;
		if (state.stopped) break;

		if (result === "registered") {
			backoffMs = BACKOFF_BASE_MS;
			await wait(state, POLL_INTERVAL_MS);
		} else {
			// Keep a last good provider in place. Only restore the login-only state
			// when no cached or live models have ever been registered.
			if (!state.registered)
				registerCachedOrLoginOnly(pi, state, loadStoredCredential());
			await wait(state, backoffMs);
			backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
		}
	}
}

function safeLoadConfig(
	stored: ReturnType<typeof loadStoredCredential>,
): FreeLlmApiConfig {
	try {
		return loadConfig(process.env, stored);
	} catch {
		return {
			apiRoot: DEFAULT_BASE_URL,
			maxTokens: parseMaxTokens(process.env.FREELLMAPI_MAX_TOKENS),
		};
	}
}

function wait(state: State, milliseconds: number): Promise<void> {
	if (state.stopped) return Promise.resolve();
	return new Promise((resolve) => {
		const finish = () => {
			if (state.timer) clearTimeout(state.timer);
			state.timer = undefined;
			state.wake = undefined;
			resolve();
		};
		state.wake = finish;
		state.timer = setTimeout(finish, milliseconds);
		state.timer.unref?.();
	});
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
