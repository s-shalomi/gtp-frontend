// api/currencies.ts
import { AuthTokens } from "../contexts/AuthContext";
import { fetchWithAuth } from "./auth/auth-wrapper";

export interface Category {
    id: number;
    category: string;
    created_at: Date;
    updated_at: Date;
}

export async function fetchCategories(
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Category[]> {
    return fetchWithAuth<Category[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/categories`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}
