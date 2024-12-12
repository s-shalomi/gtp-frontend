"use client";

import Link from "next/link";
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CopyOutlined,
    EditOutlined,
    PlusOutlined,
    PushpinOutlined,
} from "@ant-design/icons";
import { ClockCircleOutlined } from "@ant-design/icons";
import {
    Table,
    Card,
    Timeline,
    Modal,
    Button,
    Form,
    Input,
    DatePicker,
    ConfigProvider,
    Switch,
    message,
    Spin,
} from "antd";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Map, Marker } from "pigeon-maps";
import { Tooltip } from "antd"; // Optional: Add tooltips for better UX
import { Pie, Bar } from "react-chartjs-2";
import { fetchBudgetsByTripIds } from "../../../../api/budgets";
import { AuthTokens, useAuth } from "../../../../contexts/AuthContext";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getAllTripGroups } from "../../../../api/tripgroup";
import {
    Chart as ChartJS,
    BarElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    Title,
    Legend,
    LineElement,
    PointElement,
} from "chart.js";
import ExpenseModal from "../../../components/expenseform";
import {
    getTransactionsByTripId,
    updateTransaction,
} from "../../../../api/transactions";
import { Category, fetchCategories } from "../../../../api/categories";
import { Line } from "react-chartjs-2";
import {
    createLocation,
    getLocationsByTripId,
    updateLocation,
    deleteLocation,
    CreateLocationPayload,
} from "../../../../api/location";
import dayjs from "dayjs";
import QRCodeModal from "../../../components/QRCodeModal";
import FilteredLocationsTimeline from "../../../components/FilteredLocationsTimeline";
import LoadingScreen from "../../../components/LoadingScreen";

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    Title,
    Legend,
    BarElement,
    LineElement,
    PointElement
);

interface Transaction {
    id: number;
    amount: string;
    transaction_date?: Date;
    category_id?: number;
    category?: {
        category: string;
    };
}

interface Location {
    id?: number;
    trip_id: number;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    start_date: Date;
    end_date: Date;
    visited?: boolean;
    created_by: number;
    updated_by: number;
}

interface TripGroup {
    trip_id: number;
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
    start_date: Date | string;
    end_date: Date | string;
}

interface Currency {
    id?: number;
    code: string;
}

interface Budgets {
    amount: string;
    status: string;
    trip: Trip;
    currency: Currency;
}

interface Marker {
    latitude: number;
    longitude: number;
    activityName: string;
    startDate: string;
    endDate: string;
    notes: string;
}

const notVisitedIcon = (
    <img
        src="https://example.com/red-icon.png" // Replace with the URL for your red icon
        alt="Not Visited"
        style={{ width: 30, height: 30 }}
    />
);

const visitedIcon = (
    <img
        src="https://example.com/green-icon.png" // Replace with the URL for your green icon
        alt="Visited"
        style={{ width: 30, height: 30 }}
    />
);

const EditLocationModal = ({
    visible,
    onCancel,
    onSubmit,
    form,
    loading,
    renderDateFields,
}) => (
    <Modal
        title="Edit Destination"
        open={visible}
        onCancel={onCancel}
        maskClosable={!loading}
        closable={!loading}
        keyboard={!loading}
        destroyOnClose={false}
        footer={null}
        width={600}
    >
        <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            preserve={false}
        >
            <Form.Item
                label="Activity Name"
                name="activityName"
                rules={[
                    {
                        required: true,
                        message: "Please enter an activity name",
                    },
                ]}
            >
                <Input placeholder="Enter activity name" disabled={loading} />
            </Form.Item>

            {renderDateFields()}

            <Form.Item
                label="Latitude"
                name="lat"
                rules={[{ required: true, message: "Please enter a latitude" }]}
            >
                <Input placeholder="Enter latitude" disabled={loading} />
            </Form.Item>

            <Form.Item
                label="Longitude"
                name="lng"
                rules={[
                    { required: true, message: "Please enter a longitude" },
                ]}
            >
                <Input placeholder="Enter longitude" disabled={loading} />
            </Form.Item>

            <Form.Item label="Notes" name="notes">
                <Input.TextArea
                    placeholder="Enter any notes"
                    disabled={loading}
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    className="bg-[#002D62]"
                    loading={loading}
                    disabled={loading}
                >
                    Update
                </Button>
            </Form.Item>
        </Form>
    </Modal>
);

export default function ViewTrip() {
    // 1. Get all router/params/auth hooks first
    const router = useRouter();
    const params = useParams();
    const { tokens, isAuthenticated, setAuthTokens, clearTokens, userId } =
        useAuth();
    const { RangePicker } = DatePicker;

    // 2. Parse URL params
    const tripId = params?.id ? parseInt(params.id as string) : null;

    // 3. All useState hooks together
    const [tripData, setTripData] = useState<Budgets>();
    const [tripGroup, setTripGroup] = useState<TripGroup>();
    const [isLoading, setIsLoading] = useState(true);
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [destModal, setDestModal] = useState(false);
    const [mapMounted, setMapMounted] = useState(false);
    const [mapKey, setMapKey] = useState(Math.random);
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactionsWithCategories, setTransactionsWithCategories] =
        useState<TransactionWithCategory[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(
        null
    );
    const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editForm] = Form.useForm();
    const [filteredLocations, setFilteredLocations] =
        useState<Location[]>(locations);
    const [isClient, setIsClient] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [loadingTransactionId, setLoadingTransactionId] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [api, contextHolder] = message.useMessage();
    const [loadingLocations, setLoadingLocations] = useState<Set<number>>(new Set());

    const handleModalCancel = () => {
        if (!isLocationLoading) {
            setIsEditModalVisible(false);
            editForm.resetFields();
        }
    };

    const handleCopyLink = async () => {
        try {
            // Attempt to copy the link to clipboard
            await navigator.clipboard.writeText(
                `${process.env.NEXT_PUBLIC_FRONTEND_HOST}/trips/join/${tripId}`
            );
            api.open({
                type: 'success',
                content: 'Invite link copied',
            });
        } catch (err) {
            api.open({
                type: 'error',
                content: 'Failed to copy, please try again.'
            });
        }
    }
        
    useEffect(() => {
        setIsClient(true);
    }, []);

    // 4. Form hook
    const [form] = Form.useForm();


    // 5. Constants
    const budget = 1000;

    // 6. useEffects together
    useEffect(() => {
        async function initializeTrip() {
            try {
                if (!isAuthenticated || !tokens) {
                    const currentPath = window.location.pathname;
                    sessionStorage.setItem("redirectAfterLogin", currentPath);
                    await router.replace("/login");
                    return;
                }

                if (!tripId) {
                    api.open({
                        type: "error",
                        content: "Failed to load trip",
                    });
                    await router.replace("/dashboard");
                    return;
                }

                // Check trip group membership first
                const tripGroups = await getAllTripGroups(
                    tokens,
                    setAuthTokens
                );
                const userTripGroup = tripGroups.find(
                    (group) => group.trip_id === tripId
                );

                if (!userTripGroup) {
                    api.open({
                        type: "error",
                        content: "You are not in this trip",
                    });
                    await router.replace("/dashboard");
                    return;
                }

                // Fetch budgets and other data
                const budgets = await fetchBudgetsByTripIds(
                    tokens,
                    setAuthTokens,
                    [tripId]
                );

                // Check if budgets exist and are valid
                if (!budgets || budgets.length === 0) {
                    api.open({
                        type: "error",
                        content: "No budget data found for this trip",
                    });
                    await router.replace("/dashboard");
                    return;
                }

                // If we get here, we have valid budget data
                setTripGroup(userTripGroup);
                setTripData(budgets[0]);

                // Fetch remaining data in parallel
                const [tripTransactions, tripCategories, fetchedLocations] =
                    await Promise.all([
                        getTransactionsByTripId(tokens, setAuthTokens, tripId),
                        fetchCategories(tokens, setAuthTokens),
                        getLocationsByTripId(tokens, setAuthTokens, tripId),
                    ]);

                setTransactions(tripTransactions);
                setCategories(tripCategories);
                setLocations(fetchedLocations);
            } catch (error) {
                api.open({
                    type: "error",
                    content: "Failed to initialise trip, please try again",
                });
                await router.replace("/dashboard");
            } finally {
                setIsLoading(false);
            }
        }

        initializeTrip();
    }, [isAuthenticated, tripId, router, tokens, setAuthTokens]);

    useEffect(() => {
        if (transactions.length && categories.length) {
            const joined = transactions.map((transaction) => {
                const matchingCategory = categories.find(
                    (category) => category.id === transaction.category_id
                );
                return {
                    ...transaction,
                    key: transaction.id, // Add a key for antd Table
                    category: matchingCategory || { category: "N/A" },
                };
            });
            setTransactionsWithCategories(joined);
        }
    }, [transactions, categories]);

    useEffect(() => {
        setMapKey(Math.random());
    }, []);

    // 7. Event handlers
    const handleLogout = async () => {
        try {
            // Show loading spinner
            setLoadingLogout(true);

            // Call logout API to clear backend cookies
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokens?.accessToken}`, // Use the access token here
                },
                credentials: "include",
            });

            // Clear auth tokens and session data
            clearTokens();
            sessionStorage.removeItem("logoutMessage");
            sessionStorage.setItem(
                "logoutMessage",
                "You have logged out successfully."
            );

            // Clear all cookies from the client
            document.cookie.split(";").forEach((cookie) => {
                const name = cookie.split("=")[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });

            // Redirect to login page
            router.replace("/auth/login");
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            setLoadingLogout(false);
        }
    };

    const handleAddExpense = () => {
        setEditingExpense(null);
        setExpenseModalVisible(true);
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setExpenseModalVisible(true);
    };

    const handleEditLocation = (location: Location) => {
        // Don't allow editing if location is visited
        if (location.visited) {
            Modal.info({
                title: "Cannot Edit Visited Location",
                content: "Locations marked as visited cannot be edited.",
            });
            return;
        }

        // Proceed with editing if not visited
        editForm.setFieldsValue({
            activityName: location.name,
            startDate: dayjs(location.start_date),
            endDate: dayjs(location.end_date),
            lat: location.latitude?.toString(),
            lng: location.longitude?.toString(),
            notes: location.description,
        });
        setSelectedLocation(location);
        setIsEditModalVisible(true);
    };

    const handleEditSubmit = async (values: any) => {
        if (!selectedLocation?.id) return;

        try {
            // Set loading state first
            setIsLocationLoading(true);

            const updateData = {
                name: values.activityName,
                description: values.notes || "",
                latitude: parseFloat(values.lat),
                longitude: parseFloat(values.lng),
                start_date: values.startDate.format("YYYY-MM-DD"),
                end_date: values.endDate.format("YYYY-MM-DD"),
                updated_by: userId,
            };

            // Wait for the API call to complete
            const updatedLocation = await updateLocation(
                selectedLocation.id,
                updateData,
                tokens!,
                setAuthTokens
            );

            // After successful update, update the locations state
            setLocations(
                locations.map((loc) =>
                    loc.id === selectedLocation.id
                        ? { ...loc, ...updatedLocation }
                        : loc
                )
            );

            // Clear form and close modal only after everything is successful
            editForm.resetFields();
            setIsEditModalVisible(false);
        } catch (error) {
            api.open({
                type: "error",
                content: "Failed to update location. Please try again",
            });
        } finally {
            // Always set loading to false at the end
            setIsLocationLoading(false);
        }
    };

    const handleVisitToggle = async (location: Location) => {
        setLoadingLocations((prev) => new Set(prev.add(location.id!))); // Mark as loading
        try {
            const updatedLocation = await updateLocation(
                location.id!,
                {
                    visited: !location.visited,
                    updated_by: userId, // Replace with actual user ID from context
                },
                tokens!,
                setAuthTokens
            );

            // Update locations state with the new status
            setLocations(
                locations.map((loc) =>
                    loc.id === location.id
                        ? { ...loc, visited: !loc.visited }
                        : loc
                )
            );
        } catch (error) {
            api.open({
                type: "error",
                content: "Failed to update location status, please try again",
            });
        } finally {
            setLoadingLocations((prev) => {
                const updated = new Set(prev);
                updated.delete(location.id!); // Mark as not loading
                return updated;
            });
        }
    };

    // Add these handlers
    const handleAddLocation = async (values: any) => {
        try {
            setIsLocationLoading(true);

            // Convert the local dates to UTC midnight to prevent timezone shifting
            const startDate = values.startDate.startOf("day").toISOString();
            const endDate = values.endDate.startOf("day").toISOString();

            const locationData: CreateLocationPayload = {
                trip_id: tripId!,
                name: values.activityName,
                description: values.notes || "",
                latitude: parseFloat(values.lat),
                longitude: parseFloat(values.lng),
                // Set the time to midnight UTC for consistent date handling
                start_date: startDate,
                end_date: endDate,
                visited: false,
                created_by: userId as number,
                updated_by: userId as number,
            };

            const newLocation = await createLocation(
                locationData,
                tokens!,
                setAuthTokens
            );

            setLocations([...locations, newLocation]);
            setDestModal(false);
            form.resetFields();
        } catch (error) {
            api.open({
                type: "error",
                content: "Failed to add location, please try again",
            });
        } finally {
            setIsLocationLoading(false);
        }
    };

    // Add the status update handler function
    const handleStatusUpdate = async (transaction) => {
        setStatusLoading(true)
        setLoadingTransactionId(transaction.id)
        try {
            const newStatus = transaction.status === "paid" ? "unpaid" : "paid";

            const updatedTransaction = await updateTransaction(
                tokens as AuthTokens,
                setAuthTokens,
                transaction.id,
                {
                    user_id: Number(userId),
                    status: newStatus,
                    updated_by: Number(userId), // You might want to get this from your auth context
                }
            );

            // After successful update, refresh the transactions list
            const [updatedTransactions, updatedCategories] = await Promise.all([
                getTransactionsByTripId(
                    tokens as AuthTokens,
                    setAuthTokens,
                    tripId as number
                ),
                fetchCategories(tokens as AuthTokens, setAuthTokens),
            ]);

            setTransactions(updatedTransactions);
            setCategories(updatedCategories);
        } catch (error) {
            api.open({
                type: "error",
                content:
                    "Failed to update transaction status, please try again",
            });
        } finally {
            setStatusLoading(false)
            setLoadingTransactionId(null)
        }
    };

    const handleSubmitExpense = async (values) => {
        try {
            // Wait for the form submission to complete first
            await Promise.all([
                // Let the form complete its submission
                values,
                // Small delay to ensure the backend has processed the new transaction
                new Promise((resolve) => setTimeout(resolve, 100)),
            ]);

            // Fetch both updated transactions and categories
            const [updatedTransactions, updatedCategories] = await Promise.all([
                getTransactionsByTripId(
                    tokens as AuthTokens,
                    setAuthTokens,
                    tripId as number
                ),
                fetchCategories(tokens as AuthTokens, setAuthTokens),
            ]);

            // Update both states
            setTransactions(updatedTransactions);
            setCategories(updatedCategories);

            // Close the modal
            setExpenseModalVisible(false);
        } catch (error) {
            api.open({
                type: "error",
                content: "Failed to submit expense. Please try again",
            });
            // You might want to show an error message here
        }
    };

    const showForm = () => {
        setDestModal(true);
    };

    const closeForm = () => {
        setDestModal(false);
        form.resetFields();
    };

    const submitForm = async (values: any) => {
        const { activityName, startDate, endDate, lat, lng, notes } = values;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            form.setFields([
                { name: "lat", errors: ["Please enter a valid latitude"] },
                { name: "lng", errors: ["Please enter a valid longitude"] },
            ]);
            return;
        }

        if (!startDate || !endDate) {
            api.open({
                type: "error",
                content: "Please enter dates",
            });
            return;
        }

        setMarkers((prevMarkers) => [
            ...prevMarkers,
            { latitude, longitude, activityName, startDate, endDate, notes },
        ]);

        await handleAddLocation(values);
    };

    const renderDateFields = (loading) => {
        const tripStartDate = dayjs(tripData?.trip.start_date)
            .endOf("day")
            .subtract(1, "day")
            .startOf("day")
            .add(1, "day");
        const tripEndDate = dayjs(tripData?.trip.end_date)
            .endOf("day")
            .subtract(1, "day")
            .startOf("day")
            .subtract(1, "day");

        return (
            <>
                <Form.Item
                    label="Start Date"
                    name="startDate"
                    rules={[
                        {
                            required: true,
                            message: "Please select a start date",
                        },
                        {
                            validator: async (_, value) => {
                                if (!value) return;
                                const selectedDate = value.startOf("day");

                                if (
                                    selectedDate.isBefore(
                                        tripStartDate,
                                        "day"
                                    ) ||
                                    selectedDate.isAfter(tripEndDate, "day")
                                ) {
                                    throw new Error(
                                        `Date must be between ${tripStartDate.format(
                                            "YYYY-MM-DD"
                                        )} and ${tripEndDate.format(
                                            "YYYY-MM-DD"
                                        )}, exclusive`
                                    );
                                }
                            },
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                        showTime={false}
                        format="YYYY-MM-DD"
                        disabled={loading}
                        disabledDate={(current) => {
                            if (!current) return false;
                            const currentDate = current.startOf("day");
                            return (
                                currentDate.isBefore(tripStartDate, "day") ||
                                currentDate.isAfter(tripEndDate, "day")
                            );
                        }}
                        />
                </Form.Item>

                <Form.Item
                    label="End Date"
                    name="endDate"
                    dependencies={["startDate"]}
                    rules={[
                        {
                            required: true,
                            message: "Please select an end date",
                        },
                        {
                            validator: async (_, value) => {
                                if (!value) return;
                                const startDate =
                                    form.getFieldValue("startDate");
                                    const selectedDate = value.startOf("day");

                                    if (
                                        startDate &&
                                    selectedDate.isBefore(startDate, "day")
                                ) {
                                    throw new Error(
                                        "End date must be after the start date"
                                    );
                                }

                                if (selectedDate.isAfter(tripEndDate, "day")) {
                                    throw new Error(
                                        `Date must be before ${tripEndDate.format(
                                            "YYYY-MM-DD"
                                        )}, exclusive`
                                    );
                                }
                            },
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                        showTime={false}
                        format="YYYY-MM-DD"
                        disabled={loading}
                        disabledDate={(current) => {
                            if (!current) return false;
                            const startDate = form.getFieldValue("startDate");
                            const currentDate = current.startOf("day");
                            return (
                                (startDate &&
                                    currentDate.isBefore(startDate, "day")) ||
                                currentDate.isAfter(tripEndDate, "day")
                            );
                        }}
                    />
                </Form.Item>
            </>
        );
    };

    // Loading states
    // Replace the existing loading return statement with this:
    if (isLoading) {
        return <LoadingScreen />;
    }
    
    if (!tripData || !tripGroup) {
        return <LoadingScreen />;
    }
    
    if (!tripData || !tripGroup) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading trip details...</div>
            </div>
        );
    }
    
    const columns = [
        {
            title: "Category",
            key: "category",
            render: (record) => record.category?.category || "N/A",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount) => `${amount}`,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status, record) => (
                <Button
                loading={loadingTransactionId === record.id}
                    onClick={() => handleStatusUpdate(record)}
                    type={status === "paid" ? "primary" : "default"}
                    className={`${
                        status === "paid"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                    {status
                        ? status.charAt(0).toUpperCase() + status.slice(1)
                        : "Unpaid"}
                </Button>
            ),
        },
        {
            title: "Date",
            dataIndex: "transaction_date",
            key: "transaction_date",
            render: (date) =>
                date ? new Date(date).toLocaleDateString() : "N/A",
        },
    ];
    
    // Calculate derived values
    const totalExpenses = transactions.reduce((total, curr) => {
        const expense = parseFloat(curr.amount);
        return total + expense;
    }, 0);
    
    const categoryData = {
        labels: ["Accommodation", "Food", "Transport", "Shopping"],
        datasets: [
            {
                label: "Expense Categories",
                data: [500, 200, 150, 100], // Example values
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50"],
                hoverOffset: 4,
            },
        ],
    };
    
    interface TransactionWithCategory {
        amount: string;
        category?: { category: string };
    }
    
    const ExpenseCategoryChart = () => {
        // Group transactions by category and sum the amounts
        const categoryTotals = transactionsWithCategories.reduce(
            (
                acc: { [key: string]: number },
                transaction: TransactionWithCategory
            ) => {
                const categoryName = transaction.category?.category || "Other";
                acc[categoryName] =
                (acc[categoryName] || 0) + Number(transaction.amount);
                return acc;
            },
            {}
        );
        
        // Prepare data for the pie chart
        const chartData = {
            labels: Object.keys(categoryTotals),
            datasets: [
                {
                    label: "Expense Categories",
                    data: Object.values(categoryTotals),
                    backgroundColor: [
                        "#FF6384", // Red
                        "#36A2EB", // Blue
                        "#FFCE56", // Yellow
                        "#4CAF50", // Green
                        "#9C27B0", // Purple
                        "#FF9800", // Orange
                        "#795548", // Brown
                        "#607D8B", // Grey
                    ],
                    hoverOffset: 4,
                },
            ],
        };
        
        return (
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-4">
                    Expense Breakdown by Category
                </h3>
                {transactionsWithCategories.length > 0 ? (
                    <Pie
                    data={chartData}
                    options={{
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            const label = context.label || "";
                                            const value = context.raw || 0;
                                            const total = (
                                                context.dataset.data as number[]
                                            ).reduce((a, b) => a + (b || 0), 0);
                                            const percentage = (
                                                (Number(value) / total) *
                                                100
                                            ).toFixed(1);
                                            return `${label}: ${value} (${percentage}%)`;
                                        },
                                    },
                                },
                            },
                        }}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                        No expenses recorded yet
                    </div>
                )}
            </div>
        );
    };

    const SpendingTrendChart = () => {
        // Group and sum transactions by date
        const dailySpending = transactionsWithCategories.reduce(
            (acc: { [key: string]: number }, transaction: Transaction) => {
                const date = transaction.transaction_date
                    ? new Date(
                          transaction.transaction_date
                      ).toLocaleDateString()
                    : new Date().toLocaleDateString();
                    acc[date] = (acc[date] || 0) + Number(transaction.amount);
                    return acc;
                },
            {}
        );
        
        // Calculate cumulative spending
        let cumulativeSpending = 0;
        const cumulativeData = Object.entries(dailySpending)
        .sort(
                ([dateA], [dateB]) =>
                    new Date(dateA).getTime() - new Date(dateB).getTime()
            )
            .map(([date, amount]) => {
                cumulativeSpending += Number(amount);
                return {
                    date,
                    dailyAmount: amount,
                    cumulativeAmount: cumulativeSpending,
                };
            });
            
        const chartData = {
            labels: cumulativeData.map((item) => item.date),
            datasets: [
                {
                    label: "Daily Spending",
                    data: cumulativeData.map((item) => item.dailyAmount),
                    borderColor: "#36A2EB",
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    yAxisID: "y",
                    tension: 0.4,
                },
                {
                    label: "Cumulative Spending",
                    data: cumulativeData.map((item) => item.cumulativeAmount),
                    borderColor: "#FF6384",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    yAxisID: "y1",
                    tension: 0.4,
                },
            ],
        };

        const options = {
            responsive: true,
            interaction: {
                mode: "index" as const,
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: "Spending Trends",
                },
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            const value = context.raw || 0;
                            return `${context.dataset.label}: ${
                                tripData.currency.code
                            } ${value.toFixed(2)}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    type: "linear" as const,
                    display: true,
                    position: "left" as const,
                    title: {
                        display: true,
                        text: "Daily Spending",
                    },
                },
                y1: {
                    type: "linear" as const,
                    display: true,
                    position: "right" as const,
                    title: {
                        display: true,
                        text: "Cumulative Spending",
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
        };
        
        return (
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-4">
                    Spending Trends Over Time
                </h3>
                {transactionsWithCategories.length > 0 ? (
                    <Line data={chartData} options={options} />
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        No expenses recorded yet
                    </div>
                )}
            </div>
        );
    };

    const remainingBudget = parseInt(tripData.amount) - totalExpenses;

    return (
        <ConfigProvider>
            <div className="bg-gray-100 min-h-screen min-w-screen flex flex-wrap flex-col">
                {/* Header */}
                {contextHolder}
                <header
                    className="bg-[#002D62] text-white py-5 px-6 flex items-center justify-between"
                    style={{
                        backgroundImage: "url(/images/bg1.jpg)",
                        backgroundSize: "cover",
                    }}
                >
                    <Link
                        href={"/dashboard"}
                        className="flex items-center text-white font-semibold"
                    >
                        <ArrowLeftOutlined className="mr-2" />
                        Dashboard
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-white hover:underline focus:outline-none"
                    >
                        Logout
                    </button>
                </header>

                {/* Content */}
                <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 py-8">
                    {/* Trip Name and Description */}
                    <div
                        style={{
                            borderRadius: "10px",
                            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                            border: "none",
                        }}
                        className="p-6 mb-6 bg-white"
                    >
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-1">
                                {tripData.trip.name}
                            </h1>
                            <div>
                                <span
                                    style={{
                                        color:
                                            tripData.trip.status === "cancelled"
                                                ? "red"
                                                : tripData.trip.status ===
                                                  "postponed"
                                                ? "orange"
                                                : tripData.trip.status ===
                                                  "completed"
                                                ? "green"
                                                : "purple",
                                    }}
                                >
                                    {tripData.trip.status
                                        .charAt(0)
                                        .toUpperCase() +
                                        tripData.trip.status.slice(1)}
                                </span>
                            </div>
                        </div>
                        <p className="text-base sm:text-sm text-gray-600 flex items-center mb-2">
                            <span className="font-semibold mr-2">From:</span>
                            {dayjs(tripData.trip.start_date).format(
                                "MMM DD, YYYY"
                            )}
                            <span className="ml-2"> </span>
                            <span className="font-semibold mr-2">To:</span>
                            {dayjs(tripData.trip.end_date).format(
                                "MMM DD, YYYY"
                            )}
                        </p>
                        <p className="text-base sm:text-lg text-gray-600">
                            {tripData.trip.description}
                        </p>
                        <div className="flex items-center justify-start">
                            <p className="text-xs">Invite Link:</p>
                            <div className="flex items-center justify-start gap-2">
                                <Button
                                    type="link"
                                    icon={<CopyOutlined />}
                                    onClick={handleCopyLink}
                                    size="small"
                                    className="text-black"
                                >
                                    <p className="text-xs">Copy Link</p>
                                </Button>
                                <QRCodeModal tripId={tripId} />
                            </div>
                        </div>
                    </div>

                    {/* Itinerary and Map Section (Side by Side) */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-6">
                        {/* Timeline */}
                        <div className="w-full lg:w-1/2 pl-0 bg-white rounded-xl shadow-md lg:pl-2">
                            <FilteredLocationsTimeline
                                locations={locations}
                                onEditLocation={handleEditLocation}
                                onVisitToggle={handleVisitToggle}
                                onLocationsFiltered={setFilteredLocations}
                                loadingLocations={loadingLocations}
                            />
                        </div>

                        {/* Map  */}
                        <div className="w-full lg:w-1/2">
                            <div
                                style={{
                                    borderRadius: "10px",
                                    boxShadow:
                                        "0px 4px 12px rgba(0, 0, 0, 0.1)",
                                    border: "none",
                                }}
                                className="bg-white p-4 lg:p-6 h-full rounded-xl shadow-md"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl lg:text-2xl font-semibold">
                                        Add Destinations
                                    </h2>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={showForm}
                                        className="bg-[#002D62]"
                                    />
                                </div>
                                <p className="mb-4">
                                    Click on a location to create a destination
                                </p>

                                <Map
                                    center={[48.8566, 2.3522]}
                                    zoom={12}
                                    height={400}
                                    onClick={({ latLng }) => {
                                        const [lat, lng] = latLng;
                                        form.setFieldsValue({
                                            lat: lat.toFixed(6),
                                            lng: lng.toFixed(6),
                                        });
                                        setDestModal(true);
                                    }}
                                >
                                    {filteredLocations.map((location) => (
                                        <Marker
                                            key={location.id}
                                            anchor={[
                                                location.latitude || 0,
                                                location.longitude || 0,
                                            ]}
                                            payload={location}
                                            // Render PushpinOutlined icon based on visited status
                                            children={
                                                location.visited ? (
                                                    <Tooltip title="Visited">
                                                        <PushpinOutlined
                                                            style={{
                                                                fontSize: 30,
                                                                color: "green",
                                                            }}
                                                        />
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title="Not Visited">
                                                        <PushpinOutlined
                                                            style={{
                                                                fontSize: 30,
                                                                color: "red",
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )
                                            }
                                            onClick={() => {
                                                setSelectedLocation(location);
                                            }}
                                        />
                                    ))}
                                </Map>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border-none mb-4">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6">
                            Expenses
                        </h2>

                        <div className="flex items-center justify-between mb-6 p-4 bg-gray-100 rounded-xl shadow-md">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">
                                    Total Expenses: ${totalExpenses}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Budget: {tripData.amount}{" "}
                                    {tripData.currency.code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Remaining Budget: {remainingBudget}{" "}
                                    {tripData.currency.code}
                                </p>
                            </div>
                            <Button
                                type="primary"
                                className="bg-[#002D62] text-white hover:bg-[#001C4D] transition duration-200"
                                icon={<PlusOutlined />}
                                onClick={handleAddExpense}
                            >
                                Add Expense
                            </Button>

                            <ExpenseModal
                                visible={expenseModalVisible}
                                onCancel={() => setExpenseModalVisible(false)}
                                onSubmit={handleSubmitExpense}
                                tripId={tripId as number}
                            />
                        </div>

                        <Card bordered={false} className="">
                            <Table
                                columns={columns}
                                dataSource={transactionsWithCategories}
                                pagination={{
                                    pageSize: 4,
                                    hideOnSinglePage: true,
                                    showSizeChanger: false,
                                    showQuickJumper: false,
                                    position: ["bottomCenter"],
                                }}
                                bordered
                                scroll={{ x: "100%" }}
                                className="rounded-xl"
                                rowKey="id"
                            />
                        </Card>
                    </div>

                    <div className="border-none mb-6">
                        {/* Charts Section */}
                        <div className="flex flex-wrap gap-6 mt-6">
                            <div className="flex-1 min-w-[280px] bg-white rounded-xl p-5 shadow-md">
                                <ExpenseCategoryChart />
                            </div>

                            <div className="flex-1 min-w-[280px] bg-white rounded-xl p-5 shadow-md flex flex-col mb-auto">
                                <SpendingTrendChart />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal for Adding Destination */}
                <Modal
                    title="Add Destination"
                    open={destModal}
                    onCancel={closeForm}
                    footer={null}
                    width={600}
                >
                    <Form form={form} layout="vertical" onFinish={submitForm}>
                        <Form.Item
                            label="Activity Name"
                            name="activityName"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter an activity name",
                                },
                            ]}
                        >
                            <Input placeholder="Enter activity name" />
                        </Form.Item>

                        {renderDateFields(false)}

                        <Form.Item
                            label="Latitude"
                            name="lat"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter a latitude",
                                },
                            ]}
                        >
                            <Input placeholder="Enter latitude" />
                        </Form.Item>

                        <Form.Item
                            label="Longitude"
                            name="lng"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter a longitude",
                                },
                            ]}
                        >
                            <Input placeholder="Enter longitude" />
                        </Form.Item>

                        <Form.Item label="Notes" name="notes">
                            <Input.TextArea placeholder="Enter any notes" />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="bg-[#002D62]"
                                loading={isLocationLoading}
                            >
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
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
            <EditLocationModal
                visible={isEditModalVisible}
                onCancel={handleModalCancel}
                onSubmit={handleEditSubmit}
                form={editForm}
                loading={isLocationLoading}
                renderDateFields={() => renderDateFields(isLocationLoading)}
            />
        </ConfigProvider>
    );
}
