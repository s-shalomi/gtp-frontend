"use client";

import React, { useEffect, useState } from "react";
import { GoogleOutlined } from "@ant-design/icons";
import AppHeader from "../../components/header";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { message, notification, Spin } from "antd";
import Link from "next/link";
import useMediaQuery from "@mui/material/useMediaQuery";
import AppHeaderMobile from "../../components/headerMobile";

interface SignupFormData {
    email: string;
    password: string;
}

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState<SignupFormData>({
        email: "",
        password: "",
    });
    const [error, setError] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [isLoginError, setIsLoginError] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const { setAuthTokens } = useAuth();

    // In both Login.tsx and Signup.tsx
    const handleGoogleLogin = () => {
        const authUrl = new URL(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google/login`
        );

        // Clear all possible storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear cookies more aggressively
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const cookieName = cookie.split("=")[0].trim();
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        }

        // Add a random query parameter to bust any cache
        authUrl.searchParams.append("_", Date.now().toString());

        // Open in same window but force reload
        window.location.href = authUrl.toString();
    };

    useEffect(() => {
        const logoutMessage = sessionStorage.getItem("logoutMessage");
        if (logoutMessage) {
            // Display the message from sessionStorage
            messageApi.open({
                type: "success",
                content: logoutMessage,
            });

            // Clear the message from sessionStorage after displaying
            sessionStorage.removeItem("logoutMessage");
        }
    }, [router]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        const message = urlParams.get("message");

        if (error === "account_exists") {
            messageApi.open({
                type: "error",
                content:
                    "An account with this Google email already exists. Please log in instead.",
            });
        } else if (message === "signup_success") {
            messageApi.open({
                type: "success",
                content: "Account created successfully. Please log in.",
            });
        }
    }, [messageApi, router]);

    const getInputClassName = (isLogin: boolean) => {
        return `block w-full rounded-md border-2 ${
            isLogin && isLoginError
                ? "border-red-500 focus:ring-red-500"
                : "border-[#0066b2] focus:ring-[#6CB4EE]"
        } py-2 px-4 text-[#3A2A1D] shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:border-transparent sm:text-sm`;
    };

    const loginMutation = useMutation({
        mutationFn: async (
            userData: Omit<SignupFormData, "password_match">
        ) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/signin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: userData.email,
                        password: userData.password,
                    }),
                    credentials: "include", // Important: this enables sending/receiving cookies
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                setIsLoginError(true);
                throw new Error(errorData.message || "Failed to sign in");
            }
            return response.json();
        },
        onSuccess: async (response) => {
            setLoading(true);
            // Set auth tokens and userId
            setAuthTokens(
                {
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                },
                response.userId
            );
            router.push("/dashboard");
        },
        onError: (error: Error) => {
            messageApi.open({
                type: "error",
                content: error.message,
            });
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));

        if (e.target.name === "email" || e.target.name === "password") {
            setIsLoginError(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            messageApi.open({
                type: "error",
                content: "All fields are required",
            });
            return;
        }

        loginMutation.mutate(formData);
    };

    return (
        <div
            className={`min-h-screen ${
                isMobile
                    ? "bg-white"
                    : "bg-gradient-to-r from-[#3A2A1D] to-[#5C7457]"
            } text-black font-sans`}
            style={{
                backgroundImage: `${isMobile ? "" : "url(/images/bg1.jpg)"}`,
                backgroundSize: "cover",
            }}
        >
            {contextHolder}
            <AppHeaderMobile />

            <div className="auth-container">
                <h2 className="text-center text-3xl font-extrabold text-[#3A2A1D] mb-4">
                    Sign in to your account
                </h2>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-[#3A2A1D]"
                        >
                            Email address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className={getInputClassName(true)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[#3A2A1D]"
                            >
                                Password
                            </label>
                            <div className="text-sm">
                                <a
                                    href="#"
                                    className="font-semibold text-[#0066b2] hover:text-[#6CB4EE]"
                                >
                                    Forgot password?
                                </a>
                            </div>
                        </div>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                className={getInputClassName(true)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <p>Don't have an account?</p>
                        <Link
                            href="/auth/signup"
                            className="text-[#6CB4EE] ml-2 hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>

                    <div className="flex justify-center space-x-2">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full text-center py-3 bg-white border-2 rounded-lg shadow-md hover:bg-[#f0f0f0] focus:ring-2 focus:ring-[#6CB4EE] focus:ring-offset-2 transition duration-200"
                        >
                            <GoogleOutlined className="px-4" />
                            Login with Google {"  "}
                        </button>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full py-3 px-4 text-white bg-[#0066b2] rounded-lg shadow-md hover:bg-[#6CB4EE] focus:ring-2 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
                        >
                            {loginMutation.isPending ? (
                                <span className="flex items-center">
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            {loading && (
                <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
                    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white rounded-lg shadow-xl opacity-90">
                        <Spin
                            size="large"
                            tip="Logging out..."
                            className="text-[#0066b2]"
                        />

                        <h2 className="text-2xl font-semibold text-[#002D62] animate-pulse">
                            Taking you to the dashboard...
                        </h2>

                        <p className="text-gray-500 text-sm">
                            This may take a few seconds...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
