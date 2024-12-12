// api/budgets.ts
import { AuthTokens } from "../contexts/AuthContext";
import { Budget } from "../types/types";
import { fetchWithAuth } from "./auth/auth-wrapper";

export class UpdateBudgetPayload {
    amount?: number;
    status?: "unpaid" | "paid";
    updated_by?: number;
}

interface CreateBudgetPayload {
    amount: number;
    trip_id: number;
    currency_id: number;
    status?: string;
    created_by: number;
    updated_by: number;
}

export async function fetchBudgets(
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Budget[]> {
    return fetchWithAuth<Budget[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/budgets`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}

export async function createBudget(
    payload: CreateBudgetPayload,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Budget> {
    return fetchWithAuth<Budget>(
        `${process.env.NEXT_PUBLIC_API_URL}/budgets`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payload,
                created_by: payload.created_by,
                updated_by: payload.updated_by,
            }),
        },
        tokens,
        setAuthTokens
    );
}

export async function updateBudget(
    tripId: number,
    payload: any,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Budget> {
    return fetchWithAuth<Budget>(
        `${process.env.NEXT_PUBLIC_API_URL}/budgets/${tripId}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payload,
                amount: Number(payload.amount),
            }),
        },
        tokens,
        setAuthTokens
    );
}

export async function fetchBudgetsByTripIds(
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void,
    tripIds: number[]
): Promise<Budget[]> {
    return fetchWithAuth<Budget[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/budgets?tripIds=${tripIds.join(",")}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}

export async function updateBudgetByTripId(
    tripId: number,
    updateBudgetDto: UpdateBudgetPayload,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Budget> {
    return fetchWithAuth<Budget>(
        `${process.env.NEXT_PUBLIC_API_URL}/budgets/trip/${tripId}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateBudgetDto),
        },
        tokens,
        setAuthTokens
    );
}
