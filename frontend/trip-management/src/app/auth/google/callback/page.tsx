"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";

export default function GoogleCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuthTokens } = useAuth(); // Add setUserId from useAuth

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const tokensParam = searchParams.get("tokens");
                if (!tokensParam) {
                    throw new Error("No tokens received");
                }

                const tokens = JSON.parse(decodeURIComponent(tokensParam));

                if (tokens.accessToken && tokens.refreshToken) {
                    // Set auth tokens
                    setAuthTokens({
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        
                    }, tokens.userId);

                    // Set user ID if it exists in the response

                    router.push("/dashboard");
                } else {
                    throw new Error("Invalid token format");
                }
            } catch (error) {
                router.push("/auth/login?error=callback_failed");
            }
        };

        handleCallback();
    }, [router, setAuthTokens, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">
                    Completing sign in...
                </h2>
                <p>Please wait while we redirect you.</p>
            </div>
        </div>
    );
}
