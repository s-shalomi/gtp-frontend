// api/locations.ts
import { AuthTokens } from "../contexts/AuthContext";
import { fetchWithAuth } from "./auth/auth-wrapper";

export interface Location {
    id: number;
    trip_id: number;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    start_date: Date;
    end_date: Date;
    visited: boolean;
    created_by: number;
    updated_by: number;
    created_at: Date;
    updated_at: Date;
}

export interface CreateLocationPayload {
    trip_id: number;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    start_date: string;
    end_date: string;
    visited?: boolean;
    created_by: number;
    updated_by: number;
}

export interface UpdateLocationPayload {
    name?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    start_date?: string;
    end_date?: string;
    visited?: boolean;
    updated_by: number | null;
}

export async function createLocation(
    payload: CreateLocationPayload,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Location> {
    return fetchWithAuth<Location>(
        `${process.env.NEXT_PUBLIC_API_URL}/locations`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payload,
                start_date: payload.start_date,
                end_date: payload.end_date,
                created_by: Number(payload.created_by),
                updated_by: Number(payload.updated_by),
            }),
        },
        tokens,
        setAuthTokens
    );
}

export async function getLocationsByTripId(
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void,
    tripId: number
): Promise<Location[]> {
    return fetchWithAuth<Location[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/locations?trip_id=${tripId}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
}

export async function updateLocation(
    locationId: number,
    payload: UpdateLocationPayload,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<Location> {
    return fetchWithAuth<Location>(
        `${process.env.NEXT_PUBLIC_API_URL}/locations/${locationId}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payload,
                updated_by: Number(payload.updated_by),
            }),
        },
        tokens,
        setAuthTokens
    );
}

export async function deleteLocation(
    locationId: number,
    tokens: AuthTokens,
    setAuthTokens: (tokens: AuthTokens) => void
): Promise<boolean> {
    await fetchWithAuth<void>(
        `${process.env.NEXT_PUBLIC_API_URL}/locations/${locationId}`,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        },
        tokens,
        setAuthTokens
    );
    return true;
}
