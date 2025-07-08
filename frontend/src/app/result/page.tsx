'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaperForm from '@/components/PaperForm';
import { Paper } from '../types/FixedTypes';
import { useRouter } from 'next/navigation';
import { createPaper } from '../utils/api';
import { useRefresh } from '../hooks/RefreshContext';

// Function to format date to yyyy-mm-dd
const formatDateToYYYYMMDD = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
        if (isNaN(date.getTime())) {
        const yyyymmddPattern = /^\d{4}-\d{2}-\d{2}$/;
        if (yyyymmddPattern.test(dateString)) {
            return dateString;
        }
        const ddmmyyyySlashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const ddmmyyyyMatch = dateString.match(ddmmyyyySlashPattern);
        if (ddmmyyyyMatch) {
            return `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`;
        }
        const ddmmyyyyDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
        const ddmmyyyyDashMatch = dateString.match(ddmmyyyyDashPattern);
        if (ddmmyyyyDashMatch) {
            return `${ddmmyyyyDashMatch[3]}-${ddmmyyyyDashMatch[2]}-${ddmmyyyyDashMatch[1]}`;
        }
        return dateString;
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${year}-${month}-${day}`;
};

const ResultPage: React.FC = () => {
    const searchParams = useSearchParams();
    const {triggerRefresh} = useRefresh()
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

    // Format the date when initializing the state
    const originalDate = searchParams.get('publishedOn') || '';
    const formattedDate = formatDateToYYYYMMDD(originalDate);

    const [retrievedPaper, setRetrievedPaper] = useState<Paper>({
        authorName: parsedAuthors["Main Author"] || '',
        doi: searchParams.get('doi') || '',
        journal: searchParams.get('journal') || '',
        date: formattedDate,
        title: searchParams.get('title') || '',
        additionalAuthors: parsedAuthors["Additional Authors"],
        publicationType: searchParams.get('publicationType') || '',
    })
    
    console.log(retrievedPaper)
    console.log('Original date:', originalDate)
    console.log('Formatted date:', retrievedPaper.date)
    
    const handleChange = (key: keyof Paper, value: string | string[]) => {
        // If changing the date, format it
        if (key === 'date' && typeof value === 'string') {
            value = formatDateToYYYYMMDD(value);
        }
        setRetrievedPaper((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        try {
            const response = await createPaper(retrievedPaper);
            console.log(response)
            if (response.error) {
                if (response.error === ("DOI already exists")) {
                    setError("This DOI already exists."); 
                }
            } else {
                triggerRefresh();
                router.push('/');
            }
        } catch (error) {
            console.error('Error saving paper:', error);
            setError('An error occurred while saving.'); 
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
            publicationType={retrievedPaper.publicationType}
            setPublicationType={(value) => handleChange('publicationType', value)}
            additionalAuthors={retrievedPaper.additionalAuthors}
            setAdditionalAuthors={(value) => handleChange('additionalAuthors', value)}
            onSave={handleSave}
            onBack={handleBack}
        />
        </div>
    );
};

export default ResultPage;