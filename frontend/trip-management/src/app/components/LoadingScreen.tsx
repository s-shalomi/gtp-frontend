import React from "react";

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-gray-100 flex flex-col items-center justify-center z-50">
            <div className="relative">
                {/* Outer circle */}
                <div className="w-16 h-16 border-4 border-[#002D62] border-t-transparent rounded-full animate-spin"></div>
            </div>

            {/* Loading text */}
            <div className="mt-4 space-y-2 text-center">
                <h2 className="text-xl font-semibold text-[#002D62]">
                    Loading Trip Data
                </h2>
                <p className="text-gray-500">
                    Please wait while we fetch your trip details...
                </p>
            </div>
        </div>
    );
}
