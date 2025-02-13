'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaperForm from '@/components/PaperForm';
import { Paper } from '../types/FixedTypes';
import { useRouter } from 'next/navigation';
import { createPaper } from '../utils/api';
import { useRefresh } from '../hooks/RefreshContext';

const ResultPage: React.FC = () => {
    const searchParams = useSearchParams();
    const {triggerRefresh} = useRefresh()
    // Individual state values
    const router = useRouter()
    const [error, setError] = useState<string | null>(null); // New state for error message
    let parsedAuthors: { "Main Author": string; "Additional Authors": string[] } = 
        { "Main Author": '', "Additional Authors": [] };

    try {
        const authorsInput = searchParams.get('authors');
        parsedAuthors = authorsInput ? JSON.parse(authorsInput) : { "Main Author": '', "Additional Authors": [] };
    } catch (error) {
        console.error('Failed to parse authors:', error);
    }
    const [retrievedPaper, setRetrievedPaper] = useState<Paper>({
        authorName: parsedAuthors["Main Author"] || '',
        doi: searchParams.get('doi') || '',
        journal: searchParams.get('journal') || '',
        date: searchParams.get('publishedOn') || '',
        title: searchParams.get('title') || '',
        additionalAuthors: parsedAuthors["Additional Authors"]
    })
    console.log(retrievedPaper)
    const handleChange = (key: keyof Paper, value: string | string[]) => {
          setRetrievedPaper((prev) => ({ ...prev, [key]: value }))
        }


        
        
    const handleSave = async () => {
            try {
                const response = await createPaper(retrievedPaper);
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
    const handleBack = () => {
        router.back();
    };

    return (
        <div>
        {error && (
            <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
                {error}
            </p>
        )}
        <PaperForm
            authorName={retrievedPaper.authorName}
            setAuthorName={(value) => handleChange('authorName', value)}
            doi={retrievedPaper.doi}
            setDoi={(value) => handleChange('doi', value)}
            title={retrievedPaper.title}
            setTitle={(value) => handleChange('title', value)}
            journal={retrievedPaper.journal}
            setJournal={(value) => handleChange('journal', value)}
            date={retrievedPaper.date}
            setDate={(value) => handleChange('date', value)}
            additionalAuthors={retrievedPaper.additionalAuthors}
            setAdditionalAuthors={(value) => handleChange('additionalAuthors', value)}
            onSave={handleSave}
            onBack={handleBack}
        />
        </div>
    );
};

export default ResultPage;
