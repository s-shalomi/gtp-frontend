"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, message, Space, Spin, Alert, Tag } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    CalendarOutlined,
    TeamOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { AuthTokens, useAuth } from "../../../../contexts/AuthContext";
import { createTripGroup, getAllTripGroups } from "../../../../api/tripgroup";
import ErrorBoundary from "../../../components/ErrorBoundary";

interface TripDetails {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    budget?: {
        amount: number;
        currency: {
            code: string;
        };
    };
    participants?: number;
}

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function JoinTripPage({ params }: PageProps) {
    const router = useRouter();
    const { tokens, isAuthenticated, setAuthTokens, userId } = useAuth();
    const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tripId, setTripId] = useState<string | null>(null);
    const [api, contextHolder] = message.useMessage();

    useEffect(() => {
        Promise.resolve(params)
            .then((resolvedParams) => {
                if (resolvedParams.id) {
                    setTripId(resolvedParams.id);
                } else {
                    setError("Invalid trip parameters");
                }
            })
            .catch((err) => {
                setError("Failed to load trip parameters");
            });
    }, [params]);

    useEffect(() => {
        const checkAuthAndFetchTrip = async () => {
            if (!isAuthenticated || !tripId) {
                if (tripId) {
                    sessionStorage.setItem("pendingTripJoin", tripId);
                }
                router.push("/login");
                return;
            }

            if (!tokens) {
                setError("Authentication required");
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const handleAuthTokens = (newTokens: AuthTokens) => {
                    setAuthTokens(newTokens, userId!);
                };


                const tripGroups = await getAllTripGroups(
                    tokens!,
                    handleAuthTokens
                );
                const isAlreadyMember = tripGroups.some(
                    (group) => group.trip_id === parseInt(tripId)
                );

                if (isAlreadyMember) {
                    api.open({
                        type: 'warning',
                        content: "You are already a member of this trip.",
                      });
                    router.push(`/trips/view-trip/${tripId}`);
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${tokens!.accessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch trip details");
                }

                const tripData = await response.json();
                setTripDetails(tripData);
            } catch (error) {
                setError(
                    "Failed to load trip details. Please try again later."
                );
                api.open({
                    type: 'error',
                    content: "Failed to load trip details",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (tripId) {
            checkAuthAndFetchTrip();
        }
    }, [isAuthenticated, tripId, router, tokens, setAuthTokens]);

    const handleAcceptInvite = async () => {
        if (!tripId) return;

        const handleAuthTokens = (newTokens: AuthTokens) => {
            setAuthTokens(newTokens, userId!);
        };

        setIsJoining(true);
        try {
            const response = await createTripGroup(
                {
                    trip_id: parseInt(tripId),
                    user_id: Number(userId),
                    created_by: Number(userId),
                    updated_by: Number(userId),
                },
                tokens!,
                handleAuthTokens
            );

            if (response) {
                api.open({
                    type: 'error',
                    content: "Succesfully joined trip",
                });
                // Use a short timeout to ensure the message is visible before navigation
                setTimeout(() => {
                    router.push(`/trips/view-trip/${tripId}`);
                }, 1000);
            }
        } catch (error) {
            api.open({
                type: 'error',
                content: "Failed to join trip. Please try again",
            });
        } finally {
            setIsJoining(false);
        }
    };

    const handleDeclineInvite = () => {
        api.open({
            type: 'warning',
            content: "Invitation declined",
        });
        router.push("/dashboard");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spin
                    indicator={
                        <LoadingOutlined style={{ fontSize: 24 }} spin />
                    }
                    tip="Loading trip details..."
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button onClick={() => router.push("/")} type="primary">
                            Return Home
                        </Button>
                    }
                />
            </div>
        );
    }

    if (!tripDetails) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <Alert
                    message="Trip Not Found"
                    description="The requested trip could not be found."
                    type="warning"
                    showIcon
                    action={
                        <Button onClick={() => router.push("/")} type="primary">
                            Return Home
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div
                className="min-h-screen py-8 px-6 flex items-center justify-center"
                style={{
                    backgroundImage: "url(/images/bg1.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="w-full max-w-lg px-6 py-8 bg-white bg-opacity-30 rounded-lg shadow-lg">
                    <h1 className="text-4xl font-bold text-center text-white drop-shadow-lg mb-6">
                        Join Trip
                    </h1>
                    <Card
                        title={
                            <div className="flex justify-between items-center">
                                <span className="text-xl">
                                    {tripDetails.name}
                                </span>
                                <Tag
                                    color={
                                        tripDetails.status === "completed"
                                            ? "green"
                                            : tripDetails.status === "incomplete"
                                            ? "purple"
                                            : tripDetails.status === "cancelled"
                                            ? "red"
                                            : "orange"
                                    }
                                >
                                    {tripDetails.status.toUpperCase()}
                                </Tag>
                            </div>
                        }
                        bordered={false}
                        className="shadow-xl"
                    >
                        <p className="mt-2 text-lg text-gray-600">
                            {tripDetails.description}
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center text-gray-700">
                                <CalendarOutlined className="mr-2" />
                                <span>
                                    <strong>Duration:</strong>{" "}
                                    {dayjs(tripDetails.start_date).format(
                                        "MMMM D, YYYY"
                                    )}{" "}
                                    -{" "}
                                    {dayjs(tripDetails.end_date).format(
                                        "MMMM D, YYYY"
                                    )}
                                </span>
                            </div>
                            {tripDetails.budget && (
                                <div className="flex items-center text-gray-700">
                                    <DollarOutlined className="mr-2" />
                                    <span>
                                        <strong>Budget:</strong>{" "}
                                        {tripDetails.budget.amount}{" "}
                                        {tripDetails.budget.currency.code}
                                    </span>
                                </div>
                            )}
                            {tripDetails.participants && (
                                <div className="flex items-center text-gray-700">
                                    <TeamOutlined className="mr-2" />
                                    <span>
                                        <strong>Participants:</strong>{" "}
                                        {tripDetails.participants}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between gap-4 mt-6">
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={handleAcceptInvite}
                                loading={isJoining}
                                className="w-full text-lg bg-[#0066b2] hover:bg-[#6CB4EE] rounded-lg shadow-md"
                            >
                                Join Trip
                            </Button>
                            <Button
                                icon={<CloseCircleOutlined />}
                                onClick={handleDeclineInvite}
                                className="w-full text-lg text-gray-600 border-gray-300 hover:border-gray-500 rounded-lg shadow-md hover:bg-gray-100"
                            >
                                Decline
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </ErrorBoundary>
    );
}
