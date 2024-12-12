"use client";

import React, { useEffect, useRef, useState } from "react";
import { ReactDOM } from "react-dom";
import { Card, Select, Button, Input, Modal, message, notification, Spin } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    PlusOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import CreateTripForm from "../components/CreateTripForm";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { fetchBudgetsByTripIds } from "../../api/budgets";
import { getAllTripGroups } from "../../api/tripgroup";
import LoadingScreen from "../components/LoadingScreen";
import { io } from 'socket.io-client';

const { Meta } = Card;
const { Option } = Select;

interface CreateTripRef {
    handleSubmit: () => Promise<void>; 
    resetForm: () => void;
};

interface TripGroups {
    trip_id:number;
    user_id: number;
    created_at: Date;
    updated_at: Date;
    created_by: number;
    updated_by: number;
}

interface Trip {
    id: number;
    name: string;
    description: string;
    status: string;
}

interface Currency {
    code: string;
}

interface Budgets {
    amount: string;
    status: string;
    trip: Trip;
    currency: Currency
}

interface Notification {
    id: number;
    message: string;
    user_id: number;
}

export default function Dashboard() {
    const {
        userId,
        isLoading,
        tokens,
        isAuthenticated,
        clearTokens,
        setAuthTokens,
    } = useAuth();
    const router = useRouter();
    const createTripRef = useRef<CreateTripRef>(null);

    // State declarations
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("incomplete");
    const [modalVisible, setModalVisible] = useState(false);
    const [editTrip, setEditTrip] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [budgets, setBudgets] = useState<Budgets[]>([]);
    const [tripGroups, setTripGroups] = useState<TripGroups[]>([]);
    const [tripIds, setTripIds] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isViewLoading, setIsViewLoading] = useState<string | null>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false); 
    const [fetchedNotifs, setFetchedNotifs] = useState(false)
    const [isHovered, setIsHovered] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [threshold, setThreshold] = useState(1);
    const [api, notifcontextHolder] = notification.useNotification({
        stack: {threshold: 1}
      });

    // Socket.io: Listen for real-time notifications
    useEffect(() => {
        const userId = localStorage.getItem("auth_user_id");

        // Connect to WebSocket
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
          query: { userId }, // Include userId
          reconnectionAttempts: 5,  // Attempt 5 reconnections before giving up
          reconnectionDelay: 1000,  // Delay of 1 second between reconnection attempts
          reconnectionDelayMax: 5000, // Maximum delay between reconnections
        });
    
        socket.on('notification', (newNotif) => {

            // Only add the notification if it is not already in the state
            setNotifications((prev) => {
                const existing = prev.some((notif) => notif.id === newNotif.id);
                if (!existing) {
                    // Show the real-time notification
                    showNotification(newNotif)
                }
                return existing ? prev : [newNotif, ...prev];
            });
        });

        socket.on('connect_error', (error) => {
            messageApi.open({
                type: 'error',
                content: 'Lost connection to notification service.',
            });
        });

        socket.on('reconnect', (attemptNum) => {
            messageApi.open({
                type: 'success',
                content: 'Reconnected to notification service.',
            });
        });

        socket.on('reconnect_failed', () => {
            messageApi.open({
                type: 'error',
                content: 'Failed to connect to notification service.',
            });
        });

        return () => {
            socket.disconnect(); // Clean up the socket connection when the component unmounts
        };


    }, []);

    useEffect(() => {
        setEnabled(true)
    }, [])

    const showNotification = (notification) => {
        api.open({
        key: `${notification.id}-${Date.now()}`, // unique key
        message: "New Notification",
        description:  (
            <div style={{ height: "80px", display: "flex", alignItems: "center" }}>
                {notification.message}
            </div>
        ),
        duration: null,
        onClose: () => markAsRead(notification.id),
        icon: <span>🔔 {" "} </span>,
        });
    };

    
    useEffect(() => {
        fetchNotifications()
    }, []);

      const fetchNotifications = async () => {
        try {
            const userId = localStorage.getItem("auth_user_id");
            if (!userId) throw new Error("Failed to retrieve user ID");
    
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();

            setNotifications((prevNotifications) => {
                const newNotifications = data.filter((notif) => {
                    return !prevNotifications.some((existingNotif) => existingNotif.id === notif.id);
                });
    
                // If new notifications exist, add them
                if (newNotifications.length > 0) {
                    newNotifications.forEach((notification) => {
                        showNotification(notification)
                    });
                }
    
                // Return the updated list (concatenating the previous state with new notifications)
                return [...prevNotifications, ...newNotifications];
            });
        } catch (error) {
            messageApi.open({
                type: 'error',
                content: 'We failed to fetch some notifications. You have new updates.',
            });
        }
    };
    
    
      // Mark notification as read
      const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-as-read/${notificationId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
        
            if (!response.ok) {
                throw new Error(`Error marking notification as read: ${response.statusText}`);
            }
            // Update state to reflect the read notification
            setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
        
          } catch (error) {
          }
      };
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            console.log("Ref exists:", !!createTripRef.current);
            if (createTripRef.current) {
                await createTripRef.current.handleSubmit();
                console.log("Submission completed");
            }
        } catch (error) {
            console.error("Submission error:", error);
            messageApi.open({
                type: "error",
                content: "Failed to save trip. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // useEffect to reset form when modal is closed
    useEffect(() => {
        if (!modalVisible && createTripRef.current) {
            createTripRef.current.resetForm(); // Ensure form is reset to initial state
        }
    }, [modalVisible]);

    const loadBudgets = async () => {
        try {
            setIsLoadingData(true);
            const storedTokens = localStorage.getItem("auth_tokens");
            if (!storedTokens) {
                messageApi.open({
                    type: "error",
                    content: "Session expired. Please log in again.",
                });
                router.replace("/login");
                return;
            }

            const tripGroups = await getAllTripGroups(
                JSON.parse(storedTokens),
                setAuthTokens
            );

            const tripIds = tripGroups.map((tripGroup) => tripGroup.trip_id);
            setTripIds(tripIds);
            setTripGroups(tripGroups);

            if (tripIds.length > 0) {
                const budgets = await fetchBudgetsByTripIds(
                    JSON.parse(storedTokens),
                    setAuthTokens,
                    tripIds
                );
                setBudgets(budgets);
            } else {
                setBudgets([]);
            }
        } catch (error) {
            messageApi.open({
                type: "error",
                content: "Failed to load budgets. Please try again.",
            });
            router.replace("/login");
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const storedTokens = localStorage.getItem("auth_tokens");
            if (!isLoading && !isAuthenticated) {
                messageApi.open({
                    type: "error",
                    content:
                        "You are not authenticated. Redirecting to login...",
                });
                router.replace("/auth/login");
            }
        };
        checkAuth();
    }, [isLoading, isAuthenticated, router]);

    // Initial data loading effect
    useEffect(() => {
        setIsClient(true);
        if (isAuthenticated) {
            loadBudgets();
        }
    }, [isAuthenticated]);

    // Trip update event listener effect
    useEffect(() => {
        const handleTripUpdate = () => {
            loadBudgets();
        };

        window.addEventListener("tripUpdated", handleTripUpdate);
        return () => {
            window.removeEventListener("tripUpdated", handleTripUpdate);
        };
    }, []);

    const handleLogout = async () => {
        try {
            // Show loading spinner
            setLoadingLogout(true);

            // Call logout API to clear backend cookies
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokens?.accessToken}`, // Use the access token here
                },
                credentials: 'include',
            });
    
            // Clear auth tokens and session data
            clearTokens();
            sessionStorage.removeItem('logoutMessage');
            sessionStorage.setItem(
                'logoutMessage',
                'You have logged out successfully.'
            );
    
    
            // Clear all cookies from the client
            document.cookie.split(';').forEach((cookie) => {
                const name = cookie.split('=')[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
    
            // Redirect to login page
            router.replace('/auth/login');
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            setLoadingLogout(false);
        }
    };
    
    const showModal = (trip) => {
        setEditTrip(trip);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        loadBudgets();
    };

    const filteredTrips = budgets.filter((budget) => {
        const matchesQuery = budget.trip.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterType === "all" || budget.trip.status === filterType;
        return matchesQuery && matchesFilter;
    });

    // Replace the existing loading return statement with this:
    if (isLoading) {
        return <LoadingScreen />;
    }

    useEffect(() => {
        return () => {
            setNotifications([]);
        };
    }, []); // clean up on unmount

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            {notifcontextHolder}

            <div
                style={{
                    backgroundImage: "url(/images/bg1.jpg)",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                }}
                className="bg-gradient-to-r from-[#6CB4EE] to-[#0066b2] w-full py-20 pb-5 relative"
            >
                <div className="absolute top-4 right-7">
                    <button
                        onClick={handleLogout}
                        className="text-white text-sm font-semibold hover:scale-110 transform transition"
                    >
                        Logout
                    </button>
                </div>
                <div className="flex justify-start px-7 mx-auto">
                    <div className="text-6xl font-bold text-white">
                        <p>Trips Dashboard</p>
                    </div>
                </div>
            </div>

            <div className="w-full px-7 pt-5">
                <div className="flex gap-5 mb-4">
                    <Input
                        placeholder="Search trips..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-lg border-2 border-[#0066b2] focus:outline-none focus:ring-2 focus:ring-[#6CB4EE] text-lg shadow-lg"
                    />
                    <Select
                        value={filterType}
                        onChange={(value) => setFilterType(value)}
                        className="h-12 w-[30%] rounded-lg shadow-lg"
                        style={{ fontSize: "16px" }}
                    >
                        <Option value="incomplete">Active Trips</Option>
                        <Option value="cancelled">Cancelled Trips</Option>
                        <Option value="postponed">Postponed Trips</Option>
                        <Option value="all">All Trips</Option>
                    </Select>
                </div>

                <Button
                    onClick={() => showModal(null)}
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{
                        backgroundColor: "#0066b2",
                        borderColor: "#6CB4EE",
                        borderRadius: "8px",
                        fontSize: "16px",
                        boxShadow: "0px 4px 10px rgba(0, 102, 178, 0.2)",
                        transition: "transform 0.3s ease",
                    }}
                    className="mb-5 py-4 hover:scale-105"
                >
                    Create Trip
                </Button>

                <Button
                    onClick={loadBudgets}
                    icon={<SyncOutlined spin={isLoadingData} />}
                    style={{
                        borderRadius: "8px",
                        fontSize: "16px",
                        transition: "transform 0.3s ease",
                    }}
                    className="mb-5 py-4 hover:scale-105 ml-2"
                    disabled={isLoadingData}
                >
                    Refresh
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {filteredTrips.map((budget, index) => (
                        <Card
                            key={index}
                            title={budget.trip.name}
                            extra={
                                <span
                                    style={{
                                        color:
                                            budget.trip.status === "cancelled"
                                                ? "red"
                                                : budget.trip.status ===
                                                  "postponed"
                                                ? "orange"
                                                : budget.trip.status ===
                                                  "completed"
                                                ? "green"
                                                : "purple",
                                    }}
                                >
                                    {budget.trip.status
                                        .charAt(0)
                                        .toUpperCase() +
                                        budget.trip.status.slice(1)}
                                </span>
                            }
                            style={{
                                borderRadius: "10px",
                                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                                background: "#f5f5f5",
                                border: "none",
                            }}
                            actions={[
                                <Button
                                    key="view"
                                    onClick={async () => {
                                        setIsViewLoading(
                                            budget.trip.id.toString()
                                        );
                                        router.push(
                                            `/trips/view-trip/${budget.trip.id}`
                                        );
                                    }}
                                    loading={
                                        isViewLoading ===
                                        budget.trip.id.toString()
                                    }
                                >
                                    <EyeOutlined />
                                </Button>,
                                <Button
                                    key="edit"
                                    onClick={() => showModal(budget)}
                                >
                                    <EditOutlined />
                                </Button>,
                            ]}
                        >
                            <Meta
                                description={
                                    <>
                                        <p>{budget.trip.description}</p>
                                        <p>
                                            <strong>Budget:</strong>{" "}
                                            {budget.amount}{" "}
                                            {budget.currency.code}
                                        </p>
                                    </>
                                }
                            />
                        </Card>
                    ))}
                </div>
            </div>

            <Modal
                title=""
                open={modalVisible}
                onCancel={handleModalClose}
                onOk={handleSave}
                footer={[
                    <Button
                        key="cancel"
                        type="link"
                        onClick={handleModalClose}
                        className="text-sm font-semibold text-gray-700"
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        htmlType="submit"
                        className="rounded-lg text-white py-3 px-6 text-lg shadow-md hover:bg-[#005ba1] focus:ring-2 focus:ring-[#6CB4EE]"
                        onClick={handleSave}
                        loading={isSubmitting}
                    >
                        Save Trip
                    </Button>,
                ]}
                width={800}
                style={{ maxHeight: "calc(100vh - 50px)", overflowY: "auto" }}
                centered
            >
                <CreateTripForm
                    ref={createTripRef}
                    editTrip={editTrip}
                    setModalVisible={setModalVisible}
                />
            </Modal>

            {loadingLogout && (
                <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
                    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white rounded-lg shadow-xl opacity-90">
                        <Spin
                            size="large"
                            tip="Logging out..."
                            className="text-[#0066b2]"
                        />

                        <h2 className="text-2xl font-semibold text-[#002D62] animate-pulse">
                            Please wait while we log you out...
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
