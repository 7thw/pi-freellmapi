import { describe, expect, it } from "vitest";
import type { FreeLlmApiConfig, FreeLlmApiModel } from "../src/catalog.ts";
import { toProviderConfig, toProviderModels } from "../src/provider.ts";

const config: FreeLlmApiConfig = {
	apiRoot: "http://example.com/v1",
	maxTokens: 8192,
};

const models: FreeLlmApiModel[] = [
	{
		id: "auto",
		name: "Auto Router",
		ownedBy: "freellmapi",
		contextWindow: 8192,
		available: true,
		supportedParameters: ["temperature"],
	},
	{
		id: "auto:embed",
		name: "Auto Embed",
		contextWindow: 100,
		available: true,
		supportedParameters: [],
	},
];

describe("toProviderModels", () => {
	it("maps models to provider model configs", () => {
		const result = toProviderModels(config, models);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			id: "auto",
			name: "Auto Router",
			reasoning: false,
			input: ["text"],
			contextWindow: 8192,
			maxTokens: 8192,
			compat: {
				maxTokensField: "max_tokens",
				supportsDeveloperRole: false,
			},
		});
		expect(result[0].cost).toEqual({
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
		});
	});

	it("uses id as name when name is missing", () => {
		const result = toProviderModels(config, [
			{
				id: "auto:embed",
				name: "",
				contextWindow: 1024,
				available: true,
				supportedParameters: [],
			},
		]);
		expect(result[0].name).toBe("auto:embed");
	});

	it("clamps maxTokens to the model's context window", () => {
		const result = toProviderModels(config, models);
		expect(result[1].maxTokens).toBe(100);
	});

	it("omits models with non-positive context windows", () => {
		const result = toProviderModels(config, [
			{
				id: "auto:vision",
				name: "Auto Vision",
				contextWindow: 0,
				available: true,
				supportedParameters: [],
			},
		]);
		expect(result).toEqual([]);
	});
});

describe("toProviderConfig", () => {
	it("builds a provider config with openai-completions api", () => {
		const originalEnv = process.env.FREELLMAPI_API_KEY;
		delete process.env.FREELLMAPI_API_KEY;
		try {
			const result = toProviderConfig(config, models);
			expect(result.name).toBe("FreeLLMAPI");
			expect(result.baseUrl).toBe("http://example.com/v1");
			expect(result.api).toBe("openai-completions");
			expect(result.apiKey).toBe("$FREELLMAPI_API_KEY");
			expect(result.authHeader).toBe(true);
			expect(result.headers).toBeUndefined();
			expect(result.models).toHaveLength(2);
		} finally {
			if (originalEnv !== undefined)
				process.env.FREELLMAPI_API_KEY = originalEnv;
		}
	});

	it("uses the environment API key and disables authHeader when set", () => {
		const originalEnv = process.env.FREELLMAPI_API_KEY;
		process.env.FREELLMAPI_API_KEY = "env-key";
		try {
			const result = toProviderConfig(config, models);
			expect(result.apiKey).toBe("env-key");
			expect(result.authHeader).toBe(false);
			expect(result.headers).toEqual({ Authorization: "Bearer env-key" });
		} finally {
			if (originalEnv !== undefined)
				process.env.FREELLMAPI_API_KEY = originalEnv;
			else delete process.env.FREELLMAPI_API_KEY;
		}
	});

	it("filters out models with invalid context windows", () => {
		const originalEnv = process.env.FREELLMAPI_API_KEY;
		delete process.env.FREELLMAPI_API_KEY;
		try {
			const result = toProviderConfig(config, [
				{
					id: "auto:vision",
					name: "Auto Vision",
					contextWindow: 0,
					available: true,
					supportedParameters: [],
				},
				{
					id: "auto",
					name: "Auto Router",
					contextWindow: 1024,
					available: true,
					supportedParameters: [],
				},
			]);
			expect(result.models).toHaveLength(1);
			expect(result.models[0].id).toBe("auto");
		} finally {
			if (originalEnv !== undefined)
				process.env.FREELLMAPI_API_KEY = originalEnv;
		}
	});
});
