import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readCatalogCache, writeCatalogCache } from "../src/cache.ts";
import type { FreeLlmApiModel } from "../src/catalog.ts";

const sampleModels: FreeLlmApiModel[] = [
	{
		id: "auto",
		name: "Auto Router",
		ownedBy: "freellmapi",
		contextWindow: 8192,
		available: true,
		supportedParameters: ["temperature"],
	},
];

describe("writeCatalogCache", () => {
	it("writes a cache file with the apiRoot and models", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			writeCatalogCache("http://127.0.0.1:31415/v1", sampleModels, dir);
			const raw = readFileSync(
				join(dir, "cache", "freellmapi-models.json"),
				"utf8",
			);
			const data = JSON.parse(raw);
			expect(data.apiRoot).toBe("http://127.0.0.1:31415/v1");
			expect(data.models).toEqual(sampleModels);
			expect(typeof data.savedAt).toBe("number");
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("creates the cache directory recursively", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			writeCatalogCache(
				"http://127.0.0.1:31415/v1",
				sampleModels,
				join(dir, "nested", "dir"),
			);
			expect(
				readFileSync(
					join(dir, "nested", "dir", "cache", "freellmapi-models.json"),
					"utf8",
				),
			).toBeDefined();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("swallows errors when writing fails", () => {
		expect(() =>
			writeCatalogCache(
				"http://127.0.0.1:31415/v1",
				sampleModels,
				"/nonexistent-root/that/cannot/be/created",
			),
		).not.toThrow();
	});
});

describe("readCatalogCache", () => {
	it("returns undefined when the cache file does not exist", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			expect(readCatalogCache("http://127.0.0.1:31415/v1", dir)).toBeUndefined();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when the apiRoot does not match", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			writeCatalogCache("http://127.0.0.1:31415/v1", sampleModels, dir);
			expect(readCatalogCache("http://other.com/v1", dir)).toBeUndefined();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns the cached models when apiRoot matches", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			writeCatalogCache("http://127.0.0.1:31415/v1", sampleModels, dir);
			const result = readCatalogCache("http://127.0.0.1:31415/v1", dir);
			expect(result).toEqual(sampleModels);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when the cache contains invalid JSON", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			mkdirSync(join(dir, "cache"), { recursive: true });
			writeFileSync(
				join(dir, "cache", "freellmapi-models.json"),
				"not-json{",
				"utf8",
			);
			expect(readCatalogCache("http://127.0.0.1:31415/v1", dir)).toBeUndefined();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when the cache is missing the models array", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			mkdirSync(join(dir, "cache"), { recursive: true });
			writeFileSync(
				join(dir, "cache", "freellmapi-models.json"),
				JSON.stringify({ apiRoot: "http://127.0.0.1:31415/v1" }),
				"utf8",
			);
			expect(readCatalogCache("http://127.0.0.1:31415/v1", dir)).toBeUndefined();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when cached models are invalid", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-cache-test-"));
		try {
			mkdirSync(join(dir, "cache"), { recursive: true });
			writeFileSync(
				join(dir, "cache", "freellmapi-models.json"),
				JSON.stringify({
					apiRoot: "http://127.0.0.1:31415/v1",
					models: [{ id: "bad", contextWindow: 0 }],
				}),
				"utf8",
			);
			expect(readCatalogCache("http://127.0.0.1:31415/v1", dir)).toBeUndefined();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
