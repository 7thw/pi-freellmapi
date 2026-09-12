export const PROVIDER_KEY = "freellmapi";

export interface FreellmapiStoredCredential {
	baseUrl?: string;
	apiKey: string;
}

let _authPathOverrideForTesting: string | undefined;

export function _setAuthPathForTesting(path: string | undefined): void {
	_authPathOverrideForTesting = path;
}
