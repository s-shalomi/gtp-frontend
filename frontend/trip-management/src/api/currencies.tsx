// api/currencies.ts
import { AuthTokens } from "../contexts/AuthContext";
import { fetchWithAuth } from "./auth/auth-wrapper";

export interface Currency {
    id: number;
    code: string;
    created_at: Date;
    updated_at: Date;
}

export async function fetchCurrencies(
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Currency[]> {
    return fetchWithAuth<Currency[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/currencies`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}
