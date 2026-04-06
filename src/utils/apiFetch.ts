import * as SecureStore from 'expo-secure-store';

type RefreshFn = () => Promise<boolean>;

let refreshFn: RefreshFn | null = null;

// Mutex: prevent multiple concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function registerRefreshFn(fn: RefreshFn) {
    refreshFn = fn;
}

/**
 * Drop-in replacement for fetch() on authenticated endpoints.
 * On a 401 response, silently refreshes the JWT and retries once.
 * Only forces logout if the identity is explicitly rejected.
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options);

    if (response.status !== 401 || !refreshFn) {
        return response;
    }

    // Deduplicate concurrent refresh attempts
    if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshFn().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
        });
    }

    const refreshed = await refreshPromise!;
    if (!refreshed) {
        // Refresh failed — logout already handled inside refreshFn
        return response;
    }

    // Swap in the new token and retry the original request once
    const newToken = await SecureStore.getItemAsync('jwt_token');
    return fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            'Authorization': `Bearer ${newToken}`,
        },
    });
}
