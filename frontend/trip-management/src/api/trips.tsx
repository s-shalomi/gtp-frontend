// api/trips.ts
import { AuthTokens } from "../contexts/AuthContext";
import { createBudget, updateBudgetByTripId } from "./budgets";
import { createTripGroup } from "./tripgroup";
import { fetchWithAuth } from "./auth/auth-wrapper";

interface Trip {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    created_by: number;
    updated_by: number;
    creator_id: number;
    created_at: Date;
    updated_at: Date;
}

interface CreateTripPayload {
    trip: {
        name: string;
        description: string;
        start_date: string;
        end_date: string;
        status: string;
        created_by: number;
        updated_by: number;
        creator_id: number;
    };
    budget: {
        amount: number;
        currency_id: number;
    };
}

interface TripPayload {
    trip: {
        name: string;
        description: string;
        start_date: string;
        end_date: string;
        status: string;
        updated_by: number;
    };
    budget: {
        amount: number;
        currency_id: number;
    };
}

export async function createTrip(
    payload: CreateTripPayload,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Trip> {
    // Create the trip first
    
    const data = await fetchWithAuth<Trip>(
        `${process.env.NEXT_PUBLIC_API_URL}/trips`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload.trip),
        },
        tokens,
        setAuthTokens
    );

    console.log(payload);

    // Create associated budget and trip group in parallel
    await Promise.all([
        createBudget(
            {
                ...payload.budget,
                trip_id: data.id,
                status: "unpaid",
                created_by: payload.trip.created_by,
                updated_by: payload.trip.updated_by,
            },
            tokens,
            setAuthTokens
        ),
        createTripGroup(
            {
                trip_id: data.id,
                created_by: payload.trip.created_by,
                updated_by: payload.trip.updated_by,
                user_id: payload.trip.created_by,
            },
            tokens,
            setAuthTokens
        ),
    ]);

    return data;
}

export async function updateTrip(
    tripId: number,
    payload: TripPayload,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Trip> {
    // Update trip and budget in parallel
    const [tripData] = await Promise.all([
        fetchWithAuth<Trip>(
            `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload.trip),
            },
            tokens,
            setAuthTokens
        ),
        updateBudgetByTripId(
            tripId,
            {
                ...payload.budget,
                updated_by: payload.trip.updated_by,
            },
            tokens,
            setAuthTokens
        ),
    ]);

    return tripData;
}
