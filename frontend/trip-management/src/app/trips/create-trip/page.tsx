"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import CreateTripForm from "../../components/CreateTripForm";
import { Button } from "antd";

export default function CreateTripPage() {
    const router = useRouter();
    const formRef = useRef<any>(null);

    const handleSave = async () => {
        if (formRef.current) {
            await formRef.current.handleSubmit();
            // Redirect to dashboard after successful creation
            router.push("/dashboard");
        }
    };

    return (
        <div>
            <CreateTripForm
                ref={formRef}
                editTrip={null}
                setModalVisible={() => router.push("/dashboard")}
            />
            <div className="flex justify-end px-6 py-4 bg-white border-t">
                <Button
                    type="primary"
                    onClick={handleSave}
                    className="rounded-lg text-white py-3 px-6 text-lg shadow-md hover:bg-[#005ba1] focus:ring-2 focus:ring-[#6CB4EE]"
                >
                    Save Trip
                </Button>
            </div>
        </div>
    );
}
