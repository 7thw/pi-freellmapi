import type {
	ProviderConfig,
	ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";
import type { FreeLlmApiModel } from "./catalog.ts";
import type { FreeLlmApiConfig } from "./config.ts";

export function toProviderConfig(
	config: FreeLlmApiConfig,
	models: FreeLlmApiModel[],
): ProviderConfig {
	const environmentApiKey = process.env.FREELLMAPI_API_KEY?.trim();
	return {
		name: "FreeLLMAPI",
		baseUrl: config.apiRoot,
		api: "openai-completions",
		// Pi expands "$VAR" while older Prime Agent builds resolve a plain
		// variable name. Use the configured value and an explicit header when
		// present so it also overrides an older stored credential.
		apiKey: environmentApiKey || "$FREELLMAPI_API_KEY",
		...(environmentApiKey
			? {
					authHeader: false,
					headers: { Authorization: `Bearer ${environmentApiKey}` },
				}
			: { authHeader: true }),
		models: models
			.map((model) => toProviderModel(config.maxTokens, model))
			.filter((model): model is ProviderModelConfig => model !== undefined),
	};
}

export function toProviderModels(
	config: FreeLlmApiConfig,
	models: FreeLlmApiModel[],
): ProviderModelConfig[] {
	return models
		.map((model) => toProviderModel(config.maxTokens, model))
		.filter((model): model is ProviderModelConfig => model !== undefined);
}

function toProviderModel(
	configuredMaxTokens: number,
	model: FreeLlmApiModel,
): ProviderModelConfig | undefined {
	const maxTokens = Math.min(
		configuredMaxTokens,
		Math.floor(model.contextWindow),
	);
	if (maxTokens <= 0) return undefined;
	return {
		id: model.id,
		name: model.name || model.id,
		reasoning: false,
		input: ["text"],
		cost: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
		},
		contextWindow: model.contextWindow,
		maxTokens,
		compat: {
			maxTokensField: "max_tokens",
			supportsDeveloperRole: false,
		},
	};
}