import type {
	OAuthCredentials,
	OAuthLoginCallbacks,
} from "@earendil-works/pi-ai";
import { type FreeLlmApiModel, fetchCatalog } from "./catalog.js";
import { normalizeBaseUrl } from "./config.js";

export type RegisterLoginCatalog = (
	baseUrl: string,
	apiKey: string,
	models: FreeLlmApiModel[],
) => Promise<void> | void;

export type CatalogFetcher = (
	baseUrl: string,
	apiKey: string,
) => Promise<FreeLlmApiModel[]>;

export function createLoginFreeLlmApi(
	register: RegisterLoginCatalog,
	fetcher: CatalogFetcher = (baseUrl, apiKey) => fetchCatalog(baseUrl, apiKey),
) {
	return async function loginFreeLlmApi(
		callbacks: OAuthLoginCallbacks,
	): Promise<OAuthCredentials> {
		const enteredBaseUrl = await callbacks.onPrompt({
			message: "FreeLLMAPI base URL",
			placeholder: "http://127.0.0.1:31415/v1",
		});
		const baseUrl = normalizeBaseUrl(enteredBaseUrl);
		const apiKey = (
			await callbacks.onPrompt({
				message:
					"FreeLLMAPI unified API key (leave empty for a keyless server)",
				allowEmpty: true,
			})
		).trim();

		callbacks.onProgress?.("Fetching FreeLLMAPI model catalog...");
		let models: FreeLlmApiModel[];
		try {
			models = await fetcher(baseUrl, apiKey);
		} catch (error) {
			throw new Error(
				`Could not reach FreeLLMAPI at ${baseUrl}: ${errorMessage(error)}`,
			);
		}
		if (models.length === 0) {
			throw new Error(
				`Could not reach FreeLLMAPI at ${baseUrl}: no available models with valid context windows`,
			);
		}

		await register(baseUrl, apiKey, models);
		return {
			access: apiKey,
			refresh: "",
			expires: Number.POSITIVE_INFINITY,
			baseUrl,
		};
	};
}

export function refreshFreeLlmApiToken(
	credentials: OAuthCredentials,
): Promise<OAuthCredentials> {
	return Promise.resolve(credentials);
}

export function getFreeLlmApiKey(credentials: OAuthCredentials): string {
	return typeof credentials.access === "string" ? credentials.access : "";
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
