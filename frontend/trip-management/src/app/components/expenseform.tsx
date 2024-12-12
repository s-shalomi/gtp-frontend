import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
    Suspense,
} from "react";
import {
    Modal,
    Form,
    Button,
    Select,
    DatePicker,
    InputNumber,
    App,
} from "antd";
import { Category, fetchCategories } from "../../api/categories";
import { createTransaction } from "../../api/transactions";
import { fetchCurrencies } from "../../api/currencies";
import { useAuth } from "../../contexts/AuthContext";
import { AuthTokens } from "../../contexts/AuthContext";
import { Currency } from "../../api/currencies";
import dayjs from "dayjs";

const PaidStatus = {
    PAID: "paid",
    UNPAID: "unpaid",
} as const;

interface ExpenseFormValues {
    category: number;
    currency_id: number;
    amount: number;
    date: dayjs.Dayjs;
}

interface ExpenseFormProps {
    form: any;
    isLoadingCategories: boolean;
    isLoadingCurrencies: boolean;
    categories: Category[];
    currencies: Currency[];
    submitting: boolean;
    onCancel: () => void;
    onFinish: (values: ExpenseFormValues) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
    form,
    isLoadingCategories,
    isLoadingCurrencies,
    categories,
    currencies,
    submitting,
    onCancel,
    onFinish,
}) => (
    <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please select a category" }]}
        >
            <Select
                loading={isLoadingCategories}
                placeholder="Select a category"
                disabled={submitting}
            >
                {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                        {cat.category}
                    </Select.Option>
                ))}
            </Select>
        </Form.Item>

        <Form.Item
            label="Currency"
            name="currency_id"
            rules={[{ required: true, message: "Please select a currency" }]}
        >
            <Select
                loading={isLoadingCurrencies}
                placeholder="Select a currency"
                disabled={submitting}
            >
                {currencies.map((currency) => (
                    <Select.Option key={currency.id} value={currency.id}>
                        {currency.code}
                    </Select.Option>
                ))}
            </Select>
        </Form.Item>

        <Form.Item
            label="Amount"
            name="amount"
            rules={[
                { required: true, message: "Please enter the amount" },
                {
                    type: "number",
                    min: 1,
                    message: "Amount must be at least 1",
                },
            ]}
        >
            <InputNumber
                style={{ width: "100%" }}
                placeholder="Enter amount"
                min={1}
                max={99999999.99}
                step={0.01}
                precision={2}
                disabled={submitting}
            />
        </Form.Item>

        <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "Please select the date" }]}
            initialValue={dayjs()}
        >
            <DatePicker style={{ width: "100%" }} disabled={submitting} />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
            <Button onClick={onCancel} className="mr-2" disabled={submitting}>
                Cancel
            </Button>
            <Button
                type="primary"
                htmlType="submit"
                className="bg-[#002D62]"
                loading={submitting}
            >
                Add Expense
            </Button>
        </Form.Item>
    </Form>
);

const ExpenseModal = ({
    visible,
    onCancel,
    onSubmit,
    tripId,
}: {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (response: any) => Promise<void>;
    tripId: number;
}) => {
    const { message: antMessage } = App.useApp();
    const [form] = Form.useForm();
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const { tokens, setAuthTokens, userId } = useAuth();
    const submissionRef = useRef(false);

    useEffect(() => {
        const loadData = async () => {
            if (!visible || !tokens) return;

            setIsLoadingCategories(true);
            setIsLoadingCurrencies(true);
            try {
                const [categoriesData, currenciesData] = await Promise.all([
                    fetchCategories(tokens, setAuthTokens),
                    fetchCurrencies(tokens, setAuthTokens),
                ]);
                setCategories(categoriesData);
                setCurrencies(currenciesData);
            } catch (error) {
                antMessage.error("Failed to load form data");
            } finally {
                setIsLoadingCategories(false);
                setIsLoadingCurrencies(false);
            }
        };

        loadData();
    }, [visible, tokens, setAuthTokens, antMessage]);

    const handleSubmit = useCallback(
        async (values) => {
            if (submissionRef.current || !tokens || !userId) return;
            submissionRef.current = true;
            setSubmitting(true);

            const transactionData = {
                amount: Number(values.amount.toFixed(2)),
                currency_id: values.currency_id,
                category_id: values.category,
                trip_id: tripId,
                status: PaidStatus.UNPAID,
                transaction_date: values.date.toDate(),
                user_id: Number(userId),
                created_by: Number(userId),
                updated_by: Number(userId),
            };

            try {
                const response = await createTransaction(
                    tokens,
                    setAuthTokens,
                    transactionData as any
                );
                if (response) {
                    await onSubmit(response);
                    form.resetFields();
                    onCancel();
                    requestAnimationFrame(() => {
                        antMessage.success("Expense added successfully");
                    });
                }
            } catch (error) {
                antMessage.error(error.message || "Failed to add expense");
                setSubmitting(false);
                submissionRef.current = false;
            }
        },
        [
            tripId,
            tokens,
            setAuthTokens,
            userId,
            onSubmit,
            onCancel,
            form,
            antMessage,
        ]
    );

    const handleCancel = useCallback(() => {
        if (!submitting) {
            form.resetFields();
            onCancel();
        }
    }, [form, onCancel, submitting]);

    return (
        <Suspense fallback={null}>
            <Modal
                title="Add Expense"
                open={visible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
                maskClosable={false}
                afterClose={() => {
                    form.resetFields();
                    setSubmitting(false);
                    submissionRef.current = false;
                }}
            >
                <ExpenseForm
                    form={form}
                    isLoadingCategories={isLoadingCategories}
                    isLoadingCurrencies={isLoadingCurrencies}
                    categories={categories}
                    currencies={currencies}
                    submitting={submitting}
                    onCancel={handleCancel}
                    onFinish={handleSubmit}
                />
            </Modal>
        </Suspense>
    );
};

export default ExpenseModal;
