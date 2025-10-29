'use client';

import React, { Component, ReactNode } from 'react';
import { palette } from '@/app/theme';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to error reporting service in production
        if (process.env.NODE_ENV === 'production') {
            // Send to error tracking service like Sentry
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={errorContainerStyle}>
                    <h2 style={errorTitleStyle}>Oops! Something went wrong</h2>
                    <p style={errorMessageStyle}>
                        We're sorry, but something unexpected happened. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={retryButtonStyle}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const errorContainerStyle: React.CSSProperties = {
    padding: '3rem',
    textAlign: 'center',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
};

const errorTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: palette.deepNavy,
};

const errorMessageStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    color: palette.textMuted,
    maxWidth: '500px',
};

const retryButtonStyle: React.CSSProperties = {
    padding: '0.75rem 2rem',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: palette.primaryGold,
    color: palette.deepNavy,
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
};

export default ErrorBoundary;