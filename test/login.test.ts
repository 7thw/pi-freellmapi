import type {
	OAuthCredentials,
	OAuthLoginCallbacks,
} from "@earendil-works/pi-ai";
import { describe, expect, it, vi } from "vitest";
import type { FreeLlmApiModel } from "../src/catalog.ts";
import {
	createLoginFreeLlmApi,
	getFreeLlmApiKey,
	refreshFreeLlmApiToken,
} from "../src/login.ts";

const sampleModels: FreeLlmApiModel[] = [
	{
		id: "auto",
		name: "Auto Router",
		contextWindow: 8192,
		available: true,
		supportedParameters: [],
	},
];

function createCallbacks(): OAuthLoginCallbacks & {
	prompts: string[];
	progresses: string[];
} {
	const prompts: string[] = [];
	const progresses: string[] = [];
	return {
		prompts,
		progresses,
		onPrompt: vi.fn(async (opts: { message: string }) => {
			prompts.push(opts.message);
			return "";
		}),
		onProgress: vi.fn((msg: string) => {
			progresses.push(msg);
		}),
	};
}

describe("createLoginFreeLlmApi", () => {
	it("throws when the API key is empty", async () => {
		const callbacks = createCallbacks();
		const register = vi.fn();
		const login = createLoginFreeLlmApi(register);
		let callCount = 0;
		callbacks.onPrompt = vi.fn(async () => {
			callCount++;
			return callCount === 1 ? "http://127.0.0.1:31415/v1" : "   ";
		});
		await expect(login(callbacks)).rejects.toThrow(
			"FreeLLMAPI API key is required",
		);
		expect(register).not.toHaveBeenCalled();
	});

	it("throws when the base URL is empty", async () => {
		const callbacks = createCallbacks();
		const register = vi.fn();
		const login = createLoginFreeLlmApi(register);
		let callCount = 0;
		callbacks.onPrompt = vi.fn(async () => {
			callCount++;
			return callCount === 1 ? "" : "key";
		});
		await expect(login(callbacks)).rejects.toThrow(
			"FREELLMAPI_BASE_URL is empty",
		);
	});

	it("throws when the catalog fetcher fails", async () => {
		const callbacks = createCallbacks();
		const register = vi.fn();
		const login = createLoginFreeLlmApi(
			register,
			() =>
				Promise.reject(new Error("network error")) as Promise<
					FreeLlmApiModel[]
				>,
		);
		let callCount = 0;
		callbacks.onPrompt = vi.fn(async () => {
			callCount++;
			return callCount === 1 ? "http://127.0.0.1:31415/v1" : "key";
		});
		await expect(login(callbacks)).rejects.toThrow(
			"Could not reach FreeLLMAPI at http://127.0.0.1:31415/v1: network error",
		);
		expect(register).not.toHaveBeenCalled();
	});

	it("throws when no models are available", async () => {
		const callbacks = createCallbacks();
		const register = vi.fn();
		const login = createLoginFreeLlmApi(register, () => Promise.resolve([]));
		let callCount = 0;
		callbacks.onPrompt = vi.fn(async () => {
			callCount++;
			return callCount === 1 ? "http://127.0.0.1:31415/v1" : "key";
		});
		await expect(login(callbacks)).rejects.toThrow(
			"Could not reach FreeLLMAPI at http://127.0.0.1:31415/v1: no available models with valid context windows",
		);
		expect(register).not.toHaveBeenCalled();
	});

	it("registers the catalog and returns OAuth credentials on success", async () => {
		const callbacks = createCallbacks();
		const register = vi.fn();
		const login = createLoginFreeLlmApi(register, () =>
			Promise.resolve(sampleModels),
		);
		let callCount = 0;
		callbacks.onPrompt = vi.fn(async () => {
			callCount++;
			return callCount === 1 ? "http://127.0.0.1:31415/v1" : "my-api-key";
		});

		const credentials = await login(callbacks);

		expect(register).toHaveBeenCalledWith(
			"http://127.0.0.1:31415/v1",
			"my-api-key",
			sampleModels,
		);
		expect(callbacks.onProgress).toHaveBeenCalledWith(
			"Fetching FreeLLMAPI model catalog...",
		);
		expect(credentials).toEqual({
			access: "my-api-key",
			refresh: "",
			expires: Number.POSITIVE_INFINITY,
			baseUrl: "http://127.0.0.1:31415/v1",
		});
	});

	it("normalizes the base URL", async () => {
		const callbacks = createCallbacks();
		const register = vi.fn();
		const login = createLoginFreeLlmApi(register, () =>
			Promise.resolve(sampleModels),
		);
		let callCount = 0;
		callbacks.onPrompt = vi.fn(async () => {
			callCount++;
			return callCount === 1 ? "http://example.com/" : "key";
		});

		await login(callbacks);

		expect(register).toHaveBeenCalledWith(
			"http://127.0.0.1:31415/v1",
			"key",
			sampleModels,
		);
	});
});

describe("getFreeLlmApiKey", () => {
	it("returns the access token from credentials", () => {
		const creds = {
			access: "token-123",
			refresh: "",
			expires: 0,
		} as OAuthCredentials;
		expect(getFreeLlmApiKey(creds)).toBe("token-123");
	});

	it("returns an empty string when access is not a string", () => {
		const creds = {
			access: 123,
			refresh: "",
			expires: 0,
		} as unknown as OAuthCredentials;
		expect(getFreeLlmApiKey(creds)).toBe("");
	});
});

describe("refreshFreeLlmApiToken", () => {
	it("returns the same credentials unchanged", async () => {
		const creds = {
			access: "token",
			refresh: "",
			expires: 0,
		} as OAuthCredentials;
		const result = await refreshFreeLlmApiToken(creds);
		expect(result).toBe(creds);
	});
});
