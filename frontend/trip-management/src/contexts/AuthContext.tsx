import { Spin } from "antd";
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

interface AuthContextType {
    tokens: AuthTokens | null;
    userId: number | null; // Only store user ID
    setAuthTokens: (tokens: AuthTokens, userId?: number) => void; // Updated to accept userId
    clearTokens: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [tokens, setTokens] = useState<AuthTokens | null>(null);
    const [userId, setUserId] = useState<number | null>(null); // Store only user ID
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const setAuthTokens = useCallback(
        (newTokens: AuthTokens, newUserId: number) => {
            setTokens(newTokens);
            setUserId(newUserId);
            localStorage.setItem("auth_tokens", JSON.stringify(newTokens));
            localStorage.setItem("auth_user_id", String(newUserId)); // Store only user ID
            setIsAuthenticated(true);
        },
        []
    );

    const clearTokens = useCallback(() => {
        setTokens(null);
        setUserId(null);
        localStorage.removeItem("auth_tokens");
        localStorage.removeItem("auth_user_id");
        setIsAuthenticated(false);
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-session`,
                    {
                        credentials: "include",
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.userId) {
                        // Expect userId in response
                        setAuthTokens(data, data.userId);
                    } else {
                        clearTokens();
                    }
                } else {
                    clearTokens();
                }
            } catch (error) {
                clearTokens();
            } finally {
                setIsLoading(false);
            }
        };
        initializeAuth();
    }, [clearTokens, setAuthTokens]);

    const value: AuthContextType = {
        tokens,
        userId, // Only expose userId
        setAuthTokens,
        clearTokens,
        isAuthenticated,
        isLoading,
    };

    if (isLoading) {
        return <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
        <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white rounded-lg shadow-xl opacity-90">
        <Spin size="large" className="text-[#0066b2]" />

        <h2 className="text-2xl font-semibold text-[#002D62] animate-pulse">
            Loading Group Trip Planner...
        </h2>

        </div>
    </div>;
    }

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
