"use client";

import { Spin } from "antd";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function AppHeader() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const navigateTo = (path) => {
        setLoading(true)
        router.push(path);
    };

    return (
        <header className="bg-transparent  w-full z-10 top-0 py-4 pb-5">
            <div className="flex justify-between items-center px-6 mx-auto">
                <div className="text-2xl font-bold text-white">
                    <a onClick={() => navigateTo("/")}>GTP</a>
                </div>

                {/* Navigation Buttons */}
                <div className="space-x-6">
                    <button
                        onClick={() => navigateTo("/auth/login")}
                        className="px-5 py-2 bg-[#0066b2] text-white text-lg font-semibold rounded-full hover:bg-[#6CB4EE] transition ease-in-out duration-300"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigateTo("/auth/signup")}
                        className="px-5 py-2 bg-[#0066b2] text-white text-lg font-semibold rounded-full hover:bg-[#6CB4EE] transition ease-in-out duration-300"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
            {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <Spin size="large" tip="Loading..." className="text-white" />
        </div>
      )}

        </header>
    );
}
