'use client';

import React from 'react';
import { palette } from '@/app/theme';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    message = 'Loading...'
}) => {
    const sizeMap = {
        small: 20,
        medium: 40,
        large: 60,
    };

    const spinnerSize = sizeMap[size];

    return (
        <div style={containerStyle}>
            <div
                style={{
                    ...spinnerStyle,
                    width: spinnerSize,
                    height: spinnerSize,
                }}
            />
            {message && <p style={messageStyle}>{message}</p>}
        </div>
    );
};

const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1rem',
};

const spinnerStyle: React.CSSProperties = {
    border: `3px solid ${palette.lightGray}`,
    borderTop: `3px solid ${palette.primaryGold}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
};

const messageStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    color: palette.textMuted,
};

// Add keyframes for spinner animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

export default React.memo(LoadingSpinner);