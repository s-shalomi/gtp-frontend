"use client";

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from "react";
import {
    Input,
    Button,
    DatePicker,
    InputNumber,
    message,
    Space,
    Select,
    Radio,
    RadioChangeEvent,
} from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import { AuthTokens, useAuth } from "../../contexts/AuthContext";
import { createTrip, updateTrip } from "../../api/trips";
import { fetchCurrencies } from "../../api/currencies";

interface TripFormData {
    name: string;
    start_date: Dayjs | null;
    end_date: Dayjs | null;
    amount: number;
    description: string;
    currency_id: number;
    trip_id?: number;
    status?: string;
}

interface TripGroupsData {
    trip_id: number;
    user_id: number;
    created_by?: number;
    updated_by: number;
    group_id?: number;
    id?: number;
}

interface BudgetFormData {
    amount: number;
    trip_id: number;
    currency_id: number;
}

interface Currency {
    id: number;
    code: string;
}

interface CreateTripProps {
    editTrip: {
        trip: {
            id: number;
            name: string;
            start_date: string;
            end_date: string;
            description: string;
            status: string;
        };
        amount: number;
        currency: { id: number; code: string };
    } | null;
    setModalVisible: any;
}

const CreateTripForm = forwardRef<unknown, CreateTripProps>(
    ({ editTrip, setModalVisible }, ref) => {
        const router = useRouter();
        const [currencies, setCurrencies] = useState<Currency[]>([]);
        const [messageApi, contextHolder] = message.useMessage();

        const [formData, setFormData] = useState<TripFormData>({
            name: "",
            amount: 0,
            start_date: null,
            end_date: null,
            description: "",
            currency_id: 0,
            status: "incomplete",
        });

        const [formErrors, setFormErrors] = useState({
            name: "",
            amount: "",
            start_date: "",
            end_date: "",
            description: "",
            currency_id: "",
        });

        const [isSubmitted, setIsSubmitted] = useState(false);

        const [tripName, setTripName] = useState("");
        const [startDate, setStartDate] = useState(null);
        const [budget, setBudget] = useState("");
        const [description, setDescription] = useState("");
        const [notes, setNotes] = useState("");
        const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
            }));
        };

        const handleStatusChange = (e: RadioChangeEvent) => {
            setFormData((prev) => ({
                ...prev,
                status: e.target.value,
            }));
        };

        const handleTextChange = (
            e: React.ChangeEvent<HTMLTextAreaElement>
        ) => {
            setFormData((prev) => ({
                ...prev,
                description: e.target.value,
            }));
        };

        const handleStartDateChange = (
            date: Dayjs | null,
            dateString: string
        ) => {
            setFormData((prev) => ({
                ...prev,
                start_date: date ? dayjs(date) : null, // Convert Date to dayjs
            }));
        };

        const handleEndDateChange = (
            date: Dayjs | null,
            dateString: string
        ) => {
            setFormData((prev) => ({
                ...prev,
                end_date: date ? dayjs(date) : null, // Convert Date to dayjs
            }));
        };

        const handleAmountChange = (value: number) => {
            setFormData((prev) => ({
                ...prev,
                amount: value,
            }));
        };

        const handleCurrencyChange = (value: number) => {
            setFormData((prev) => ({
                ...prev,
                currency_id: value,
            }));
        };

        const { tokens, setAuthTokens, userId } = useAuth();

        const resetForm = () => {
            setIsSubmitted(false);
            setFormData({
                name: "",
                amount: 0,
                start_date: null,
                end_date: null,
                description: "",
                currency_id: 0,
                status: "incomplete",
            });
            setFormErrors({
                name: "",
                amount: "",
                start_date: "",
                end_date: "",
                description: "",
                currency_id: "",
            })
        };

        const handleSubmit = async () => {

            const errors = {
                name: formData.name ? "" : "Trip name is required.",
                start_date: formData.start_date
                    ? ""
                    : "Start date is required.",
                end_date: formData.end_date
                    ? formData.start_date &&
                      dayjs(formData.end_date) >= dayjs(formData.start_date)
                        ? ""
                        : "End date must be after start date."
                    : "End date is required.",
                amount:
                    formData.amount > 0
                        ? ""
                        : "Budget must be a positive number.",
                currency_id:
                    formData.currency_id > 0 ? "" : "Please select a currency.",
                description: "",
            };

            setFormErrors(errors);
            setIsSubmitted(true);

            if (Object.values(errors).some((error) => error !== "")) {
                return;
            }

            // if (typeof onSubmit === "function") {
            //     await onSubmit(formData);
            // }

            try {
                const payload = {
                    trip: {
                        name: formData.name,
                        description: formData.description,
                        start_date: formData.start_date!.toISOString(),
                        end_date: formData.end_date!.toISOString(),
                        status: formData.status || "incomplete",
                        created_by: Number(userId),
                        updated_by: Number(userId),
                        creator_id: Number(userId),
                    },
                    budget: {
                        amount: formData.amount,
                        currency_id: formData.currency_id,
                    },
                };

                if (editTrip) {
                    // If editing, call updateTrip
                    await updateTrip(
                        editTrip.trip.id,
                        payload,
                        tokens!,
                        (updatedTokens) => setAuthTokens(updatedTokens, userId!)
                    );
                } else {
                    // If creating, call createTrip
                    await createTrip(payload, tokens!, (updatedTokens) =>
                        setAuthTokens(updatedTokens, userId!)
                    );
                }

                // Wait a small amount of time for backend to process
                await new Promise((resolve) => setTimeout(resolve, 100));

                setModalVisible(false);

                // Trigger parent component to refresh budgets
                if (typeof setModalVisible === "function") {
                    // Look for a refresh function in props
                    if (typeof window !== "undefined") {
                        // Emit a custom event that Dashboard can listen to
                        const event = new CustomEvent("tripUpdated");
                        window.dispatchEvent(event);
                    }
                }
            } catch (error) {
                messageApi.open({
                    type: "error",
                    content: editTrip
                        ? "Failed to update trip. Please try again"
                        : "Failed to create trip. Please try again",
                });
            }
        };

        // Expose methods to the parent via the ref
        useImperativeHandle(ref, () => ({
            handleSubmit,
            resetForm
        }));

        // Fetch currencies when component mounts
        useEffect(() => {
            const loadCurrencies = async () => {
                setIsLoadingCurrencies(true);
                try {
                    const data = await fetchCurrencies(
                        tokens!,
                        (updatedTokens) => setAuthTokens(updatedTokens, userId!)
                    );
                    setCurrencies(data);
                } catch (error) {
                    messageApi.open({
                        type: "error",
                        content: "Failed to load currencies, please try again.",
                    });
                } finally {
                    setIsLoadingCurrencies(false);
                }
            };

            loadCurrencies();
        }, [tokens, setAuthTokens]);

        useEffect(() => {
            if (editTrip) {
                setFormData({
                    name: editTrip.trip.name,
                    amount: Number(editTrip.amount),
                    start_date: dayjs(editTrip.trip.start_date),
                    end_date: dayjs(editTrip.trip.end_date),
                    description: editTrip.trip.description,
                    currency_id: editTrip.currency.id,
                    status: editTrip.trip.status || "incomplete",
                });
                setFormErrors({
                    name: "",
                    amount: "",
                    start_date: "",
                    end_date: "",
                    description: "",
                    currency_id: "",
                })
            } else {
                resetForm();
            }
        }, [editTrip]);

        return (
            <div className="min-h-screen py-8 px-6">
                {contextHolder}
                <p className="text-3xl font-bold text-gray-800 mb-8">
                    {editTrip ? "Edit Trip" : "Create New Trip"}
                </p>

                <form
                    className="space-y-6 bg-white rounded-lg"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    {/* Disclaimer */}
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 italic">
                            Note: The trip start and end dates should account
                            for one day before and one day after your planned
                            duration to ensure flexibility.
                        </p>
                    </div>
                    {/* Trip Name */}
                    <div className="mb-6">
                        <label
                            htmlFor="trip-name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Trip Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Title your trip plan"
                            className="mt-2 block w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066b2] px-4 py-2 text-sm placeholder:text-gray-500"
                        />
                        {isSubmitted && formErrors.name && (
                            <p className="mt-1 text-sm text-red-500">
                                {formErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Start Date */}
                    <div className="mb-6">
                        <label
                            htmlFor="start-date"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Start Date
                        </label>
                        <DatePicker
                            id="start-date"
                            name="start-date"
                            value={formData.start_date}
                            onChange={handleStartDateChange}
                            className="mt-2 block w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066b2] px-4 py-2 text-sm"
                        />
                        {isSubmitted && formErrors.start_date && (
                            <p className="mt-1 text-sm text-red-500">
                                {formErrors.start_date}
                            </p>
                        )}
                    </div>

                    {/* End Date */}
                    <div className="mb-6">
                        <label
                            htmlFor="start-date"
                            className="block text-sm font-medium text-gray-700"
                        >
                            End Date
                        </label>
                        <DatePicker
                            id="end-date"
                            name="end-date"
                            value={formData.end_date}
                            onChange={handleEndDateChange}
                            className="mt-2 block w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066b2] px-4 py-2 text-sm"
                        />
                        {isSubmitted && formErrors.end_date && (
                            <p className="mt-1 text-sm text-red-500">
                                {formErrors.end_date}
                            </p>
                        )}
                    </div>

                    {/* Budget */}
                    <div className="mb-6">
                        <label
                            htmlFor="budget"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Budget
                        </label>
                        <InputNumber
                            id="budget"
                            name="budget"
                            value={formData.amount}
                            onChange={handleAmountChange}
                            className="mt-2 block w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066b2] px-4 py-2 text-sm"
                            placeholder="Enter your budget"
                            precision={2}
                            max={99999999.99}
                            min={0}
                            formatter={(value, info) => {
                                if (value === null || value === undefined) {
                                    return "";
                                }
                                const [whole, decimal] = value
                                    .toString()
                                    .split(".");
                                if (whole && whole.length > 10) {
                                    return (
                                        whole.slice(0, 10) +
                                        (decimal ? "." + decimal : "")
                                    );
                                }
                                return value.toString();
                            }}
                            parser={(value) => {
                                return value
                                    ? Number(value.replace(/[^\d.]/g, ""))
                                    : 0;
                            }}
                        />
                        {isSubmitted && formErrors.amount && (
                            <p className="mt-1 text-sm text-red-500">
                                {formErrors.amount}
                            </p>
                        )}
                    </div>

                    {/* Currency */}
                    <div className="mb-6">
                        <label
                            htmlFor="currency"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Currency
                        </label>
                        <Select
                            id="currency"
                            value={formData.currency_id || undefined}
                            onChange={handleCurrencyChange}
                            className="mt-2 block w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                            placeholder="Select currency"
                            loading={isLoadingCurrencies}
                        >
                            {currencies.map((currency) => (
                                <Select.Option
                                    key={currency.id}
                                    value={currency.id}
                                >
                                    {currency.code.toUpperCase()}
                                </Select.Option>
                            ))}
                        </Select>
                        {isSubmitted && formErrors.currency_id && (
                            <p className="mt-1 text-sm text-red-500">
                                {formErrors.currency_id}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleTextChange}
                            rows={4}
                            placeholder="Describe your trip..."
                            className="mt-2 block w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066b2] px-4 py-2 text-sm placeholder:text-gray-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="trip-status"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Trip Status
                        </label>
                        <Radio.Group
                            onChange={handleStatusChange}
                            value={formData.status}
                            className="mt-2"
                        >
                            <Radio value="incomplete">Ongoing</Radio>
                            <Radio value="postponed">Postpone</Radio>
                            <Radio value="cancelled">Cancel</Radio>
                            <Radio value="completed">Complete</Radio>
                        </Radio.Group>
                    </div>
                </form>
            </div>
        );
    }
);

export default CreateTripForm;
