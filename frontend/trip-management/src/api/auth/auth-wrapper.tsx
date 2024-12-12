// api/auth/auth-wrapper.tsx
import { AuthTokens } from "../../contexts/AuthContext";

// Helper function to handle token refresh
async function refreshToken(
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<AuthTokens> {
    const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!refreshResponse.ok) {
        throw new Error("Unable to refresh token");
    }

    const newTokens = await refreshResponse.json();
    setAuthTokens(newTokens);
    return newTokens;
}

// Main fetch wrapper
export async function fetchWithAuth<T>(
    url: string,
    options: RequestInit,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<T> {
    try {
        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${tokens.accessToken}`,
            },
        };

        let response = await fetch(url, authOptions);

        if (response.status === 401) {
            const newTokens = await refreshToken(tokens, setAuthTokens);
            authOptions.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            response = await fetch(url, authOptions);
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message ||
                    `Request failed with status ${response.status}`
            );
        }

        return response.json();
    } catch (error) {
        throw error;
    }
}
