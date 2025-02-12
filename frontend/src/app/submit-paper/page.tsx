'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPaper, fetchDoiMetadata } from '../utils/api';
import { Paper } from '../types/FixedTypes';
import { useRefresh } from '@/app/hooks/RefreshContext';

const InputPage: React.FC = () => {
    const [manualInput, setManualInput] = useState(false);
    const [error, setError] = useState<string | null>(null); // New state for error message
    const [paper, setPaper] = useState<Paper>({
        authorName: '',
        doi: '',
        journal: '',
        date: '',
        title: ''
    });

    const { triggerRefresh } = useRefresh();
    const router = useRouter();

    const handleChange = (key: keyof Paper, value: string) => {
        setPaper((prev) => ({ ...prev, [key]: value }));
        setError(null); // Clear error when user starts typing
    };

    const handleCancel = () => {
        router.push('/');
    };

    const handleManualInput = () => {
        setManualInput(true);
    };

    const handleBack = () => {
        setManualInput(false);
    };

    const handleSave = async () => {
        try {
            const response = await createPaper(paper);
            console.log(response)
            if (response.error) {
                if (response.error === ("DOI already exists")) {
                    setError("This DOI already exists."); // Set error message
                }
            } else {
                triggerRefresh();
                router.push('/');
            }
        } catch (error) {
            console.error('Error saving paper:', error);
            setError('An error occurred while saving.'); // Generic error
        }
    };

    const handleRetrieve = async () => {    
        const data = await fetchDoiMetadata(paper.doi);
    
        if (data) {
            const queryString = new URLSearchParams({
                journal: data.Journal || '',
                doi: data.DOI || '',
                title: data.Title || '',
                authors: JSON.stringify(data.Authors) || '',
                publishedOn: data.PublishedOn || '',
                publisher: data.Publisher || '',
            }).toString();
    
            router.push(`/result?${queryString}`);
        } else {
            console.error('Failed to retrieve DOI metadata.');
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '20px',
            }}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxWidth: '400px',
                    width: '100%',
                }}
            >
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Register Paper</h1>

                {error && (
                    <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
                        {error}
                    </p>
                )}

                {!manualInput && (
                    <input
                        type="text"
                        placeholder="Enter DOI"
                        name="doi"
                        value={paper.doi}
                        onChange={(e) => handleChange('doi', e.target.value)}
                        style={{
                            display: 'block',
                            width: '100%',
                            marginBottom: '10px',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                        }}
                    />
                )}

                {!manualInput ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                        }}
                    >
                        <button
                            onClick={handleCancel}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#e74c3c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleManualInput}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#3498db',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Manual Input
                        </button>
                        <button
                            onClick={handleRetrieve}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#2ecc71',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Crossref Retrieve
                        </button>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                        }}
                    >
                        <button
                            onClick={handleBack}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#95a5a6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'block',
                                margin: '10px auto',
                            }}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#2ecc71',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'block',
                                margin: '10px auto',
                            }}
                        >
                            Save
                        </button>
                    </div>
                )}

                {manualInput && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                type="text"
                                name="journal"
                                value={paper.journal}
                                onChange={(e) => handleChange('journal', e.target.value)}
                                placeholder="Journal"
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <input
                                type="text"
                                name="doi"
                                value={paper.doi}
                                onChange={(e) => handleChange('doi', e.target.value)}
                                placeholder="DOI"
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <input
                                type="text"
                                name="title"
                                value={paper.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Title"
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <input
                                type="text"
                                name="authors"
                                value={paper.authorName}
                                onChange={(e) => handleChange('authorName', e.target.value)}
                                placeholder="Authors"
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <input
                                type="date"
                                name="publishedOn"
                                value={paper.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                placeholder="Published On"
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InputPage;
