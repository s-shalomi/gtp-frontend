'use client';

import React from 'react';
import { Alert, Button } from 'antd';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen p-8 flex items-center justify-center">
                    <Alert
                        message="Something went wrong"
                        description="An error occurred while loading this page."
                        type="error"
                        showIcon
                        action={
                            <Button onClick={() => window.location.reload()} type="primary">
                                Try Again
                            </Button>
                        }
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;