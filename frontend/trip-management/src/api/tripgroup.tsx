// api/tripgroup.ts
import { AuthTokens } from "../contexts/AuthContext";
import { fetchWithAuth } from "./auth/auth-wrapper";

interface TripGroup {
    id: number;
    trip_id: number;
    user_id: number;
    created_at: Date;
    updated_at: Date;
    created_by: number;
    updated_by: number;
}

interface CreateTripGroupDto {
    trip_id: number;
    user_id: number;
    created_by: number;
    updated_by: number;
}

interface UpdateTripGroupDto {
    trip_id?: number;
    user_id?: number;
    updated_by: number;
}

export async function createTripGroup(
    createTripGroupDto: CreateTripGroupDto,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<TripGroup> {
    return fetchWithAuth<TripGroup>(
        `${process.env.NEXT_PUBLIC_API_URL}/tripgroups`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createTripGroupDto),
        },
        tokens,
        setAuthTokens
    );
}

export async function getAllTripGroups(
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<TripGroup[]> {
    return fetchWithAuth<TripGroup[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/tripgroups`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}

export async function getTripGroup(
    id: number,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<TripGroup> {
    return fetchWithAuth<TripGroup>(
        `${process.env.NEXT_PUBLIC_API_URL}/tripgroups/${id}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}

export async function updateTripGroup(
    id: number,
    updateTripGroupDto: UpdateTripGroupDto,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<TripGroup> {
    return fetchWithAuth<TripGroup>(
        `${process.env.NEXT_PUBLIC_API_URL}/tripgroups/${id}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateTripGroupDto),
        },
        tokens,
        setAuthTokens
    );
}

export async function deleteTripGroup(
    id: number,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<void> {
    return fetchWithAuth<void>(
        `${process.env.NEXT_PUBLIC_API_URL}/tripgroups/${id}`,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}
