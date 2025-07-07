'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPaper, fetchDoiMetadata } from '../utils/api';
import { Paper } from '../types/FixedTypes';
import { useRefresh } from '@/app/hooks/RefreshContext';
import PaperForm from '@/components/PaperForm';


const InputPage: React.FC = () => {
    const [manualInput, setManualInput] = useState(false);
    const [error, setError] = useState<string | null>(null); // New state for error message
    const [paper, setPaper] = useState<Paper>({
        authorName: '',
        doi: '',
        journal: '',
        date: '',
        title: '',
        additionalAuthors: [],
    });
    const [additionalAuthors, setAdditionalAuthors] = useState<string[]>([]);
    const { triggerRefresh } = useRefresh();
    const router = useRouter();

    const handleChange = (key: keyof Paper, value: string | string[]) => {
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
                height: '100%',
                backgroundColor: '#f5f5f5',
                padding: '20px',
                width: '100%',
            }}
        >
            {manualInput ? (
                <PaperForm
                    authorName={paper.authorName}
                    setAuthorName={(value) => handleChange('authorName', value)}
                    doi={paper.doi}
                    setDoi={(value) => handleChange('doi', value)}
                    title={paper.title}
                    setTitle={(value) => handleChange('title', value)}
                    journal={paper.journal}
                    setJournal={(value) => handleChange('journal', value)}
                    date={paper.date}
                    setDate={(value) => handleChange('date', value)}
                    additionalAuthors={paper.additionalAuthors}
                    setAdditionalAuthors={(value) => handleChange('additionalAuthors', value)}
                    onSave={handleSave}
                    onBack={handleBack}
                />
            ) : (<div
                style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxWidth: '400px',
                    width: '100%',
                }}
            >
                {error && (
                    <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
                        {error}
                    </p>
                )}

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
            </div>)}
        </div>
    );
};

export default InputPage;
