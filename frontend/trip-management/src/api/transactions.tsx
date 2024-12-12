// api/transactions.ts
import { AuthTokens } from "../contexts/AuthContext";
import { fetchWithAuth } from "./auth/auth-wrapper";

interface CreateTransactionDto {
    amount: number;
    description?: string;
    currency_id: number;
    trip_id: number;
    created_by?: number;
    updated_by?: number;
}

interface UpdateTransactionDto {
    user_id: number;
    amount?: number;
    description?: string;
    currency_id?: number;
    status?: "paid" | "unpaid";
    updated_by: number;
}

interface Transaction {
    id: number;
    amount: string;
    description: string;
    currency_id: number;
    trip_id: number;
    created_by: number;
    updated_by: number;
    created_at: Date;
    updated_at: Date;
    user_id: number;
}

export const createTransaction = async (
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void,
    data: Transaction
): Promise<Transaction> => {
    console.log("this is data");
    console.log(data);
    console.log(data.user_id);
    return fetchWithAuth<Transaction>(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...data,
                created_by: Number(data.created_by),
                updated_by: Number(data.updated_by),
                user_id: Number(data.user_id),
            }),
            credentials: "include",
        },
        tokens,
        setAuthTokens
    );
};

export const getAllTransactions = async (
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Transaction[]> => {
    return fetchWithAuth<Transaction[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
        tokens,
        setAuthTokens
    );
};

export const getTransactionById = async (
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void,
    id: number
): Promise<Transaction> => {
    return fetchWithAuth<Transaction>(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
        tokens,
        setAuthTokens
    );
};

export const updateTransaction = async (
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void,
    id: number,
    data: UpdateTransactionDto
): Promise<Transaction> => {
    return fetchWithAuth<Transaction>(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...data,
                user_id: data.user_id,
            }),
            credentials: "include",
        },
        tokens,
        setAuthTokens
    );
};

// Helper function to get transactions by trip ID with special 404 handling
export const getTransactionsByTripId = async (
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void,
    tripId: number
): Promise<Transaction[]> => {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/transactions/trip/${tripId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                    "Content-Type": "application/json",
                },
                credentials: "include",
            }
        );

        // Special handling for 404
        if (response.status === 404) {
            return [];
        }

        if (response.status === 401) {
            // Use the auth wrapper's refresh logic
            return fetchWithAuth<Transaction[]>(
                `${process.env.NEXT_PUBLIC_API_URL}/transactions/trip/${tripId}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                },
                tokens,
                setAuthTokens
            );
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch transactions for trip"
            );
        }

        return response.json();
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("No transactions found")
        ) {
            return [];
        }
        throw error;
    }
};
