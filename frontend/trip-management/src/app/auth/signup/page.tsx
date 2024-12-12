"use client"; // Keep this if using app router

import React, { useEffect, useState } from "react";
import { GoogleOutlined } from "@ant-design/icons";
import AppHeader from "../../components/header";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // or 'next/router' for pages router
import Link from "next/link";
import { notification, message } from "antd";
import useMediaQuery from "@mui/material/useMediaQuery";
import AppHeaderMobile from "../../components/headerMobile";

interface SignupFormData {
    name: string;
    email: string;
    password: string;
    password_match: string;
}

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState<SignupFormData>({
        name: "",
        email: "",
        password: "",
        password_match: "",
    });
    const [isPasswordError, setIsPasswordError] = useState<boolean>(false);
    const [isEmailError, setIsEmailError] = useState<boolean>(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [api, contextHolder] = message.useMessage();

    // In Signup.tsx, after your state declarations
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        const message = urlParams.get("message");

        if (error === "account_exists") {
            api.open({
                type: "error",
                content:
                    "An account with this Google email already exists. Please log in instead.",
            });
            router.push("/auth/login");
        } else if (message === "signup_success") {
            api.open({
                type: "success",
                content: "Account created successfully. Please log in.",
            });
        }
    }, [api, router]);

    // In Signup.tsx
    const handleGoogleSignup = async () => {
        try {
            // First try to revoke Google's session
            const revokeUrl = "https://accounts.google.com/logout";
            const popupWindow = window.open(
                revokeUrl,
                "google_logout",
                "width=450,height=600"
            );

            // Wait for logout window
            await new Promise((resolve) =>
                setTimeout(() => {
                    if (popupWindow) popupWindow.close();
                    resolve(true);
                }, 2000)
            );

            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();

            // Aggressively clear all cookies
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                const cookieName = cookie.split("=")[0].trim();
                // Clear cookie for all possible paths and domains
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
            }

            // Construct the Google auth URL with all necessary parameters
            const authUrl = new URL(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/google/signup`
            );

            // Add all parameters to force fresh authentication
            authUrl.searchParams.append("prompt", "consent select_account");
            authUrl.searchParams.append("response_type", "code");
            authUrl.searchParams.append("access_type", "offline");
            authUrl.searchParams.append("approval_prompt", "force");
            authUrl.searchParams.append("include_granted_scopes", "true");

            // Add cache busting parameters
            authUrl.searchParams.append(
                "state",
                Math.random().toString(36).substring(7)
            );
            authUrl.searchParams.append(
                "nonce",
                Math.random().toString(36).substring(7)
            );
            authUrl.searchParams.append("timestamp", Date.now().toString());

            // Redirect to the authentication URL
            window.location.href = authUrl.toString();
        } catch (error) {
            console.error("Error during Google signup preparation:", error);

            // Fallback - direct to auth URL if something fails
            const fallbackUrl = new URL(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/google/signup`
            );
            fallbackUrl.searchParams.append("prompt", "select_account");
            window.location.href = fallbackUrl.toString();
        }
    };

    const showErrorMessage = (message: string) => {
        api.open({
            type: "error",
            content: message,
        });
    };

    const getInputClassName = (isPassword: boolean) => {
        return `block w-full rounded-md border-2 ${
            isPassword && isPasswordError
                ? "border-red-500 focus:ring-red-500"
                : "border-[#0066b2] focus:ring-[#6CB4EE]"
        } py-2 px-4 text-[#3A2A1D] shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:border-transparent sm:text-sm`;
    };

    const getEmailClassName = (isEmail: boolean) => {
        return `block w-full rounded-md border-2 ${
            isEmail && isEmailError
                ? "border-red-500 focus:ring-red-500"
                : "border-[#0066b2] focus:ring-[#6CB4EE]"
        } py-2 px-4 text-[#3A2A1D] shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:border-transparent sm:text-sm`;
    };

    const signupMutation = useMutation({
        mutationFn: async (
            userData: Omit<SignupFormData, "password_match">
        ) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: userData.name,
                        email: userData.email,
                        password_hash: userData.password,
                        created_by: 1,
                        updated_by: 1,
                        refreshToken: "",
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message === "User already exists") {
                    setIsEmailError(true);
                } else {
                    showErrorMessage("Failed to sign up. Try again");
                }
                throw new Error(errorData.message || "Failed to sign up");
            }
            return response.json();
        },
        onSuccess: () => {
            router.push("/auth/login");
        },
        onError: (error: Error) => {
            showErrorMessage(error.message);
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "email") {
            setIsEmailError(false);
        }

        if (name === "password_match" && formData.password) {
            setIsPasswordError(value !== formData.password);
        }

        if (name === "password" && formData.password_match) {
            setIsPasswordError(value !== formData.password_match);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.password) {
            showErrorMessage("All fields are required");
            return;
        }

        if (formData.password !== formData.password_match) {
            showErrorMessage("Passwords do not match");
            setIsPasswordError(true);
            return;
        }

        const { password_match, ...signupData } = formData;
        signupMutation.mutate(signupData);
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
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {contextHolder}
            <AppHeaderMobile />

            <div className="auth-container mb-10">
                <h2 className="text-center text-3xl font-extrabold text-[#3A2A1D] mb-4">
                    Create an account
                </h2>

                <form className="space-y-6 mb-5" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-[#3A2A1D]"
                        >
                            Name
                        </label>
                        <div className="mt-2">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="block w-full rounded-md border-2 border-[#0066b2] py-2 px-4 text-[#3A2A1D] shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#6CB4EE] focus:border-transparent sm:text-sm"
                            />
                        </div>
                    </div>

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
                                className={getEmailClassName(true)}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-[#3A2A1D]"
                        >
                            Password
                        </label>
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

                    <div>
                        <label
                            htmlFor="password_match"
                            className="block text-sm font-medium text-[#3A2A1D]"
                        >
                            Confirm Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="password_match"
                                name="password_match"
                                type="password"
                                value={formData.password_match}
                                onChange={handleInputChange}
                                required
                                className={getInputClassName(true)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <p>Already have an account?</p>
                        <Link
                            href="/auth/login"
                            className="text-[#6CB4EE] ml-2 hover:underline"
                        >
                            Login
                        </Link>
                    </div>

                    <div className="flex justify-start space-x-2">
                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            className="w-full text-center py-3 bg-white border-2 rounded-lg shadow-md hover:bg-[#f0f0f0] focus:ring-2 focus:ring-[#6CB4EE] focus:ring-offset-2 transition duration-200"
                        >
                            <GoogleOutlined className="px-4" />
                            Sign up with Google
                        </button>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={signupMutation.isPending}
                            className="w-full py-3 px-4 text-white bg-[#0066b2] rounded-lg shadow-md hover:bg-[#6CB4EE] focus:ring-2 focus:ring-[#6CB4EE] focus:ring-offset-2 transition duration-200 flex items-center justify-center"
                        >
                            {signupMutation.isPending ? (
                                <span className="flex items-center">
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Creating Account...
                                </span>
                            ) : (
                                "Sign up"
                            )}
                        </button>
                    </div>
                </form>
                <div className="mb-2 text-white"> . </div>
            </div>
        </div>
    );
}
