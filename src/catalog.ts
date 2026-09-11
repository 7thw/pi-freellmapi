import { normalizeBaseUrl } from "./config.js";

export interface FreeLlmApiModel {
	id: string;
	name: string;
	ownedBy?: string;
	contextWindow: number;
	available: true;
	supportedParameters: string[];
}

export interface FetchCatalogOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
	fetchFn?: typeof fetch;
}

/** Parse and filter an OpenAI-compatible /models response. */
export function parseCatalogResponse(payload: unknown): FreeLlmApiModel[] {
	if (!isRecord(payload) || !Array.isArray(payload.data)) {
		throw new Error(
			"FreeLLMAPI /models response does not contain a data array",
		);
	}

	const models: FreeLlmApiModel[] = [];
	const seen = new Set<string>();
	for (const raw of payload.data) {
		if (!isRecord(raw)) continue;
		const id = typeof raw.id === "string" ? raw.id.trim() : "";
		if (!id || seen.has(id) || raw.available !== true) continue;

		const contextWindow =
			positiveFiniteNumber(raw.context_window) ??
			positiveFiniteNumber(raw.context_length);
		if (contextWindow === undefined) continue;

		const name =
			typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : id;
		const ownedBy =
			typeof raw.owned_by === "string" && raw.owned_by.trim()
				? raw.owned_by.trim()
				: undefined;
		const supportedParameters = Array.isArray(raw.supported_parameters)
			? raw.supported_parameters.filter(
					(value): value is string => typeof value === "string",
				)
			: [];

		seen.add(id);
		models.push({
			id,
			name,
			ownedBy,
			contextWindow,
			available: true,
			supportedParameters,
		});
	}
	return models;
}

export async function fetchCatalog(
	baseUrl: string,
	apiKey: string,
	options: FetchCatalogOptions = {},
): Promise<FreeLlmApiModel[]> {
	const apiRoot = normalizeBaseUrl(baseUrl);
	const timeoutMs = options.timeoutMs ?? 15_000;
	const timed = withTimeout(options.signal, timeoutMs);
	const fetchFn = options.fetchFn ?? fetch;
	const url = `${apiRoot}/models`;
	try {
		let response: Response;
		try {
			response = await fetchFn(url, {
				method: "GET",
				headers: { Authorization: `Bearer ${apiKey}` },
				signal: timed.signal,
			});
		} catch (error) {
			if (timed.signal.aborted) {
				throw new Error(`GET ${url} timed out after ${timeoutMs}ms`);
			}
			throw new Error(`GET ${url} failed: ${errorMessage(error)}`);
		}

		if (!response.ok) {
			throw new Error(
				`GET ${url} failed: ${response.status} ${response.statusText}`.trim(),
			);
		}

		let payload: unknown;
		try {
			payload = await response.json();
		} catch (error) {
			if (timed.signal.aborted) {
				throw new Error(`GET ${url} timed out after ${timeoutMs}ms`);
			}
			throw new Error(
				`GET ${url} returned invalid JSON: ${errorMessage(error)}`,
			);
		}
		return parseCatalogResponse(payload);
	} finally {
		timed.cleanup();
	}
}

function positiveFiniteNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value > 0
		? value
		: undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function withTimeout(
	parent: AbortSignal | undefined,
	timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	timer.unref?.();
	const abort = () => controller.abort();
	if (parent) {
		if (parent.aborted) controller.abort();
		else parent.addEventListener("abort", abort, { once: true });
	}
	return {
		signal: controller.signal,
		cleanup: () => {
			clearTimeout(timer);
			parent?.removeEventListener("abort", abort);
		},
	};
}
