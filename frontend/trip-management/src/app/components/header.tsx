"use client";

import { Spin } from "antd";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import useMediaQuery from '@mui/material/useMediaQuery';


export default function AppHeader() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const navigateTo = (path) => {
        setLoading(true)
        router.push(path);
    };

    return (
        <header className="w-full z-10  top-0 py-4 pb-5">
            <div className="flex justify-between items-center px-6 mx-auto">
                <div className="text-2xl font-bold text-white">
                    <a onClick={() => navigateTo("/")}>GTP</a>
                </div>

                {/* Navigation Buttons */}
                <div className="space-x-6">
                    <button
                        onClick={() => navigateTo("/auth/login")}
                        className={`${isMobile ? 'py-1 px-4' : 'py-2 px-5'} bg-[#0066b2] text-white text-lg font-semibold rounded-full hover:bg-[#6CB4EE] transition ease-in-out duration-300`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigateTo("/auth/signup")}
                        className={`${isMobile ? 'py-1 px-4' : 'py-2 px-5'} bg-[#0066b2] text-white text-lg font-semibold rounded-full hover:bg-[#6CB4EE] transition ease-in-out duration-300`}
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
