import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	_setAuthPathForTesting,
	loadStoredCredential,
	PROVIDER_ID,
} from "../src/auth.ts";

describe("loadStoredCredential", () => {
	it("returns undefined when the auth file does not exist", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			expect(loadStoredCredential()).toBeUndefined();
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when the auth file contains invalid JSON", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(join(dir, "auth.json"), "not-json{", "utf8");
			expect(loadStoredCredential()).toBeUndefined();
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when the auth file is not a record", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(join(dir, "auth.json"), JSON.stringify(["array"]), "utf8");
			expect(loadStoredCredential()).toBeUndefined();
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when the credential is not a record", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(
				join(dir, "auth.json"),
				JSON.stringify({ freellmapi: "string" }),
				"utf8",
			);
			expect(loadStoredCredential()).toBeUndefined();
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns undefined when there is no baseUrl and no apiKey", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(
				join(dir, "auth.json"),
				JSON.stringify({ freellmapi: { type: "oauth" } }),
				"utf8",
			);
			expect(loadStoredCredential()).toBeUndefined();
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("reads an oauth credential with baseUrl and access token", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(
				join(dir, "auth.json"),
				JSON.stringify({
					freellmapi: {
						type: "oauth",
						access: "oauth-token",
						baseUrl: "http://127.0.0.1:3001/v1",
					},
				}),
				"utf8",
			);
			const result = loadStoredCredential();
			expect(result).toEqual({
				baseUrl: "http://127.0.0.1:3001/v1",
				apiKey: "oauth-token",
			});
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("reads an api_key credential with baseUrl and key", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(
				join(dir, "auth.json"),
				JSON.stringify({
					freellmapi: {
						type: "api_key",
						key: "api-key-value",
						baseUrl: "http://127.0.0.1:31415/v1",
					},
				}),
				"utf8",
			);
			const result = loadStoredCredential();
			expect(result).toEqual({
				baseUrl: "http://127.0.0.1:31415/v1",
				apiKey: "api-key-value",
			});
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns only baseUrl when apiKey is empty", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(
				join(dir, "auth.json"),
				JSON.stringify({
					freellmapi: {
						type: "oauth",
						access: "   ",
						baseUrl: "http://127.0.0.1:31415/v1",
					},
				}),
				"utf8",
			);
			const result = loadStoredCredential();
			expect(result).toEqual({ baseUrl: "http://127.0.0.1:31415/v1" });
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns only apiKey when baseUrl is empty", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(
				join(dir, "auth.json"),
				JSON.stringify({
					freellmapi: {
						type: "api_key",
						key: "api-key-value",
						baseUrl: "   ",
					},
				}),
				"utf8",
			);
			const result = loadStoredCredential();
			expect(result).toEqual({ apiKey: "api-key-value" });
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("ignores other providers in the auth file", () => {
		const dir = mkdtempSync(join(tmpdir(), "freellmapi-auth-test-"));
		try {
			// Override the auth path for this test
			_setAuthPathForTesting(join(dir, "auth.json"));
			writeFileSync(
				join(dir, "auth.json"),
				JSON.stringify({
					other: { type: "api_key", key: "other-key" },
					freellmapi: {
						type: "api_key",
						key: "freellmapi-key",
						baseUrl: "http://127.0.0.1:31415/v1",
					},
				}),
				"utf8",
			);
			const result = loadStoredCredential();
			expect(result).toEqual({
				baseUrl: "http://127.0.0.1:31415/v1",
				apiKey: "freellmapi-key",
			});
			_setAuthPathForTesting(undefined);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("PROVIDER_ID", () => {
	it("is the expected value", () => {
		expect(PROVIDER_ID).toBe("freellmapi");
	});
});
