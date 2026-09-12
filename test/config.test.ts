import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { _setAuthPathForTesting } from "../src/auth.ts";
import {
	API_KEY_ENV_VAR,
	BASE_URL_ENV_VAR,
	DEFAULT_BASE_URL,
	DEFAULT_MAX_TOKENS,
	loadConfig,
	MAX_TOKENS_ENV_VAR,
	normalizeBaseUrl,
	parseMaxTokens,
	resolveConfiguredApiKey,
} from "../src/config.ts";

describe("normalizeBaseUrl", () => {
	it("keeps a URL that already ends with /v1", () => {
		expect(normalizeBaseUrl("http://127.0.0.1:3001/v1")).toBe(
			"http://127.0.0.1:3001/v1",
		);
	});

	it("strips trailing slashes and appends /v1", () => {
		expect(normalizeBaseUrl("http://127.0.0.1:3001/")).toBe(
			"http://127.0.0.1:3001/v1",
		);
	});

	it("strips multiple trailing slashes", () => {
		expect(normalizeBaseUrl("http://127.0.0.1:3001///")).toBe(
			"http://127.0.0.1:3001/v1",
		);
	});

	it("throws on empty input", () => {
		expect(() => normalizeBaseUrl("")).toThrow("FREELLMAPI_BASE_URL is empty");
		expect(() => normalizeBaseUrl("   ")).toThrow(
			"FREELLMAPI_BASE_URL is empty",
		);
	});
});

describe("parseMaxTokens", () => {
	it("returns the default when value is undefined", () => {
		expect(parseMaxTokens(undefined)).toBe(DEFAULT_MAX_TOKENS);
	});

	it("returns the default when value is empty", () => {
		expect(parseMaxTokens("")).toBe(DEFAULT_MAX_TOKENS);
	});

	it("returns the default for non-numeric input", () => {
		expect(parseMaxTokens("abc")).toBe(DEFAULT_MAX_TOKENS);
	});

	it("parses a valid positive integer", () => {
		expect(parseMaxTokens("4096")).toBe(4096);
	});

	it("trims whitespace before parsing", () => {
		expect(parseMaxTokens("  2048  ")).toBe(2048);
	});

	it("returns the default for zero", () => {
		expect(parseMaxTokens("0")).toBe(DEFAULT_MAX_TOKENS);
	});

	it("returns the default for negative numbers", () => {
		expect(parseMaxTokens("-1")).toBe(DEFAULT_MAX_TOKENS);
	});

	it("returns the default for non-safe integers", () => {
		expect(parseMaxTokens(`${Number.MAX_SAFE_INTEGER + 1}`)).toBe(
			DEFAULT_MAX_TOKENS,
		);
	});
});

describe("loadConfig", () => {
	it("uses defaults when nothing is configured", () => {
		const config = loadConfig({}, undefined);
		expect(config.apiRoot).toBe(DEFAULT_BASE_URL);
		expect(config.maxTokens).toBe(DEFAULT_MAX_TOKENS);
	});

	it("prefers environment variables over stored credentials", () => {
		const config = loadConfig(
			{
				[BASE_URL_ENV_VAR]: "http://127.0.0.1:31415/v1",
				[MAX_TOKENS_ENV_VAR]: "1024",
			},
			{ baseUrl: "http://stored.example.com/v1" },
		);
		expect(config.apiRoot).toBe("http://127.0.0.1:31415/v1");
		expect(config.maxTokens).toBe(1024);
	});

	it("falls back to stored baseUrl when no env var is set", () => {
		const config = loadConfig({}, { baseUrl: "http://stored.example.com/v1" });
		expect(config.apiRoot).toBe("http://stored.example.com/v1");
	});

	it("uses stored apiKey for maxTokens when env var is absent", () => {
		const config = loadConfig({}, { baseUrl: "http://stored.example.com/v1" });
		expect(config.maxTokens).toBe(DEFAULT_MAX_TOKENS);
	});
});

describe("resolveConfiguredApiKey", () => {
	it("returns undefined when nothing is configured", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-config-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			expect(resolveConfiguredApiKey({}, undefined)).toBeUndefined();
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("prefers the environment key", () => {
		expect(
			resolveConfiguredApiKey({ [API_KEY_ENV_VAR]: "env-key" }, undefined),
		).toBe("env-key");
	});

	it("returns the stored key when no env var is set", () => {
		expect(
			resolveConfiguredApiKey(
				{},
				{ baseUrl: "http://127.0.0.1:31415/v1", apiKey: "stored-key" },
			),
		).toBe("stored-key");
	});

	it("returns undefined when a base URL env var is set but no key", () => {
		expect(
			resolveConfiguredApiKey(
				{ [BASE_URL_ENV_VAR]: "http://127.0.0.1:31415/v1" },
				undefined,
			),
		).toBeUndefined();
	});

	it("trims the environment key", () => {
		expect(
			resolveConfiguredApiKey({ [API_KEY_ENV_VAR]: "  env-key  " }, undefined),
		).toBe("env-key");
	});
});

describe("constants", () => {
	it("exports the expected constant values", () => {
		expect(DEFAULT_BASE_URL).toBe("http://127.0.0.1:31415/v1");
		expect(DEFAULT_MAX_TOKENS).toBe(8192);
		expect(API_KEY_ENV_VAR).toBe("FREELLMAPI_API_KEY");
		expect(BASE_URL_ENV_VAR).toBe("FREELLMAPI_BASE_URL");
		expect(MAX_TOKENS_ENV_VAR).toBe("FREELLMAPI_MAX_TOKENS");
	});
});
