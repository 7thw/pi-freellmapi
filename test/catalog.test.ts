import { describe, expect, it, vi } from "vitest";
import {
	type FetchCatalogOptions,
	type FreeLlmApiModel,
	fetchCatalog,
	parseCatalogResponse,
} from "../src/catalog.ts";

describe("parseCatalogResponse", () => {
	const validModel = {
		id: "auto",
		name: "Auto Router",
		owned_by: "freellmapi",
		context_window: 8192,
		available: true,
		supported_parameters: ["temperature", "max_tokens"],
	};

	it("parses a valid OpenAI-compatible /models response", () => {
		const result = parseCatalogResponse({
			data: [validModel],
		});
		expect(result).toEqual([
			{
				id: "auto",
				name: "Auto Router",
				ownedBy: "freellmapi",
				contextWindow: 8192,
				available: true,
				supportedParameters: ["temperature", "max_tokens"],
			} as FreeLlmApiModel,
		]);
	});

	it("falls back to id when name is missing", () => {
		const result = parseCatalogResponse({
			data: [{ id: "auto:chat", context_window: 4096, available: true }],
		});
		expect(result[0].name).toBe("auto:chat");
	});

	it("falls back to context_window then context_length for context window", () => {
		const result = parseCatalogResponse({
			data: [{ id: "auto", context_length: 1024, available: true }],
		});
		expect(result[0].contextWindow).toBe(1024);
	});

	it("omits models without a valid context window", () => {
		const result = parseCatalogResponse({
			data: [
				{ id: "auto", context_window: 0, available: true },
				{ id: "auto:embed", context_window: -5, available: true },
				{ id: "auto:vision", context_window: "abc", available: true },
			],
		});
		expect(result).toEqual([]);
	});

	it("omits models that are not available", () => {
		const result = parseCatalogResponse({
			data: [{ id: "auto", context_window: 1024, available: false }],
		});
		expect(result).toEqual([]);
	});

	it("deduplicates models by id", () => {
		const result = parseCatalogResponse({
			data: [
				{ id: "auto", context_window: 1024, available: true },
				{ id: "auto", context_window: 2048, available: true },
			],
		});
		expect(result).toHaveLength(1);
		expect(result[0].contextWindow).toBe(1024);
	});

	it("filters out non-string supported_parameters", () => {
		const result = parseCatalogResponse({
			data: [
				{
					id: "auto",
					context_window: 1024,
					available: true,
					supported_parameters: ["temperature", 123, null, "max_tokens"],
				},
			],
		});
		expect(result[0].supportedParameters).toEqual([
			"temperature",
			"max_tokens",
		]);
	});

	it("defaults supported_parameters to an empty array", () => {
		const result = parseCatalogResponse({
			data: [{ id: "auto", context_window: 1024, available: true }],
		});
		expect(result[0].supportedParameters).toEqual([]);
	});

	it("trims model ids", () => {
		const result = parseCatalogResponse({
			data: [{ id: "  auto  ", context_window: 1024, available: true }],
		});
		expect(result[0].id).toBe("auto");
	});

	it("omits models with empty ids", () => {
		const result = parseCatalogResponse({
			data: [{ id: "   ", context_window: 1024, available: true }],
		});
		expect(result).toEqual([]);
	});

	it("omits non-record entries", () => {
		const result = parseCatalogResponse({
			data: [null, "string", 42, validModel],
		});
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("auto");
	});

	it("throws when payload is not a record", () => {
		expect(() => parseCatalogResponse(null)).toThrow(
			"does not contain a data array",
		);
		expect(() => parseCatalogResponse("string")).toThrow(
			"does not contain a data array",
		);
	});

	it("throws when payload has no data array", () => {
		expect(() => parseCatalogResponse({})).toThrow(
			"does not contain a data array",
		);
		expect(() => parseCatalogResponse({ data: "not-array" })).toThrow(
			"does not contain a data array",
		);
	});
});

describe("fetchCatalog", () => {
	it("fetches and parses the catalog with a custom fetch function", async () => {
		const fetchFn = vi.fn(async () => ({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({
				data: [{ id: "auto", context_window: 1024, available: true }],
			}),
		})) as unknown as typeof fetch;

		const models = await fetchCatalog("http://example.com", "key", {
			fetchFn,
		});

		expect(fetchFn).toHaveBeenCalledWith("http://example.com/v1/models", {
			method: "GET",
			headers: { Authorization: "Bearer key" },
			signal: expect.any(AbortSignal),
		});
		expect(models).toHaveLength(1);
		expect(models[0].id).toBe("auto");
	});

	it("throws when the response is not ok", async () => {
		const fetchFn = vi.fn(async () => ({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		})) as unknown as typeof fetch;

		await expect(
			fetchCatalog("http://example.com", "key", { fetchFn }),
		).rejects.toThrow(
			"GET http://example.com/v1/models failed: 500 Internal Server Error",
		);
	});

	it("throws when the network request fails", async () => {
		const fetchFn = vi.fn(async () => {
			throw new Error("network down");
		}) as unknown as typeof fetch;

		await expect(
			fetchCatalog("http://example.com", "key", { fetchFn }),
		).rejects.toThrow("GET http://example.com/v1/models failed: network down");
	});

	it("throws when the response is invalid JSON", async () => {
		const fetchFn = vi.fn(async () => ({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => {
				throw new Error("invalid json");
			},
		})) as unknown as typeof fetch;

		await expect(
			fetchCatalog("http://example.com", "key", { fetchFn }),
		).rejects.toThrow(
			"GET http://example.com/v1/models returned invalid JSON: invalid json",
		);
	});

	it("uses a custom timeout when provided", async () => {
		const fetchFn = vi.fn(async () => ({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({ data: [] }),
		})) as unknown as typeof fetch;

		await fetchCatalog("http://example.com", "key", {
			fetchFn,
			timeoutMs: 100,
		});
		// Should not throw; timeout is just a safety net.
		expect(fetchFn).toHaveBeenCalled();
	});
});

describe("FetchCatalogOptions", () => {
	it("is a usable type", () => {
		const opts: FetchCatalogOptions = {};
		expect(opts).toBeDefined();
	});
});
