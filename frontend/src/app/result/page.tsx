// Updated ResultPage component with fixed Save All functionality
'use client';

import React, { useState, CSSProperties } from 'react';
import PaperForm from '@/components/PaperForm';
import { Paper } from '../types/FixedTypes';
import { useRouter } from 'next/navigation';
import { createPaper } from '../utils/api';
import { useRefresh } from '../contexts/RefreshContext';
import { usePaperContext } from '../contexts/PaperContext';
import { gradients, palette } from '../theme';

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

const actionButtonGroupStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    flexWrap: 'wrap',
};

const getPrimaryActionButtonStyle = (disabled: boolean): CSSProperties => ({
    padding: '0.85rem 1.85rem',
    borderRadius: '999px',
    border: 'none',
    backgroundImage: disabled ? 'none' : gradients.button,
    backgroundColor: disabled ? 'rgba(17, 35, 71, 0.35)' : undefined,
    color: disabled ? 'rgba(247, 249, 255, 0.75)' : palette.deepNavy,
    fontWeight: 700,
    letterSpacing: '0.02em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '0 18px 35px rgba(242, 176, 67, 0.35)',
    transition: 'transform 0.2s ease, filter 0.2s ease',
    opacity: disabled ? 0.75 : 1,
});

const secondaryActionButtonStyle: CSSProperties = {
    padding: '0.8rem 1.6rem',
    borderRadius: '999px',
    border: '1px solid rgba(17, 35, 71, 0.22)',
    backgroundColor: 'rgba(17, 35, 71, 0.08)',
    color: palette.deepNavy,
    fontWeight: 600,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, filter 0.2s ease',
};

const ResultPage: React.FC = () => {
    const { papers, updatePaper, removePaper, doiErrors, setDoiErrors } = usePaperContext();
    const { triggerRefresh } = useRefresh();
    const router = useRouter();
    const [errors, setErrors] = useState<{ [key: number]: string }>({});
    const [savingStates, setSavingStates] = useState<{ [key: number]: boolean }>({});
    const [isSavingAll, setIsSavingAll] = useState(false);

    const handleChange = (paperIndex: number, key: keyof Paper, value: string | string[]) => {
        const currentPaper = papers[paperIndex];
        if (!currentPaper) return;

        // If changing the date, format it
        if (key === 'date' && typeof value === 'string') {
            value = formatDateToYYYYMMDD(value);
        }

        const updatedPaper = { ...currentPaper, [key]: value };
        updatePaper(paperIndex, updatedPaper);
    };

    const handleSave = async (paperIndex: number) => {
        const paperToSave = papers[paperIndex];
        if (!paperToSave) return;

        setSavingStates(prev => ({ ...prev, [paperIndex]: true }));
        setErrors(prev => ({ ...prev, [paperIndex]: '' }));

        try {
            const response = await createPaper(paperToSave);
            console.log(response);
            if (response.error) {
                if (response.error === "DOI already exists") {
                    setErrors(prev => ({ ...prev, [paperIndex]: "This DOI already exists." }));
                } else {
                    setErrors(prev => ({ ...prev, [paperIndex]: response.error }));
                }
                return false; // Return false to indicate failure
            } else {
                removePaper(paperIndex);
                triggerRefresh();
                
                if (papers.length === 1) { // Check if this was the last paper
                    router.push('/');
                }
                return true; // Return true to indicate success
            }
        } catch (error) {
            console.error('Error saving paper:', error);
            setErrors(prev => ({ ...prev, [paperIndex]: 'An error occurred while saving.' }));
            return false;
        } finally {
            setSavingStates(prev => ({ ...prev, [paperIndex]: false }));
        }
    };

    const handleRemove = (paperIndex: number) => {
        removePaper(paperIndex);
        if (papers.length === 1) { // Check if this was the last paper
            router.push('/');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleSaveAll = async () => {
        setIsSavingAll(true);
        setErrors({}); // Clear all errors
        
        try {
            // Save all papers sequentially to avoid index conflicts
            const saveResults = [];
            for (let i = 0; i < papers.length; i++) {
                const paperToSave = papers[i];
                if (!paperToSave) continue;

                setSavingStates(prev => ({ ...prev, [i]: true }));
                
                try {
                    const response = await createPaper(paperToSave);
                    if (response.error) {
                        if (response.error === "DOI already exists") {
                            setErrors(prev => ({ ...prev, [i]: "This DOI already exists." }));
                        } else {
                            setErrors(prev => ({ ...prev, [i]: response.error }));
                        }
                        saveResults.push(false);
                    } else {
                        saveResults.push(true);
                    }
                } catch (error) {
                    console.error('Error saving paper:', error);
                    setErrors(prev => ({ ...prev, [i]: 'An error occurred while saving.' }));
                    saveResults.push(false);
                } finally {
                    setSavingStates(prev => ({ ...prev, [i]: false }));
                }
            }

            // Remove all successfully saved papers at once
            // We need to remove from the end to avoid index shifting issues
            const successfulIndices = saveResults.map((success, index) => success ? index : -1).filter(index => index !== -1);
            successfulIndices.reverse().forEach(index => {
                removePaper(index);
            });

            // If all papers were saved successfully, redirect to home
            if (saveResults.every(result => result === true)) {
                triggerRefresh();
                router.push('/');
            } else {
                // If some papers failed, just refresh the data for the remaining papers
                triggerRefresh();
            }
            
        } catch (error) {
            console.error('Error in save all:', error);
        } finally {
            setIsSavingAll(false);
        }
    };

    if (papers.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>No papers to display.</p>
                <button type="button" onClick={handleBack} style={secondaryActionButtonStyle}>Go Back</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1>Review Papers ({papers.length})</h1>
                <div style={actionButtonGroupStyle}>
                    <button
                        onClick={handleSaveAll}
                        disabled={isSavingAll}
                        style={getPrimaryActionButtonStyle(isSavingAll)}
                    >
                        {isSavingAll ? 'Saving All...' : 'Save All'}
                    </button>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={secondaryActionButtonStyle}
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* Display DOI errors */}
            {doiErrors && doiErrors.length > 0 && (
                <div style={{ 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffeaa7', 
                    borderRadius: '4px', 
                    padding: '15px', 
                    marginBottom: '20px',
                    color: '#856404'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>⚠️ Metadata Retrieval Issues</h3>
                    {doiErrors.map((error, index) => (
                        <p key={index} style={{ margin: '5px 0', fontSize: '14px' }}>
                            • {error}
                        </p>
                    ))}
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>
                        You can manually fill in the information for these papers below.
                    </p>
                    <button 
                        onClick={() => setDoiErrors([])}
                        style={{ 
                            marginTop: '10px',
                            padding: '5px 10px', 
                            backgroundColor: '#856404', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '3px',
                            fontSize: '12px'
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {papers.map((paper: Paper, index : number) => (
                <div key={index} style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    marginBottom: '20px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2>Paper {index + 1}</h2>
                        <button 
                            onClick={() => handleRemove(index)}
                            style={{ 
                                padding: '5px 10px', 
                                backgroundColor: '#dc3545', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}
                        >
                            Remove
                        </button>
                    </div>
                    
                    {errors[index] && (
                        <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
                            {errors[index]}
                        </p>
                    )}
                    
                    <PaperForm
                        authorName={paper.authorName}
                        setAuthorName={(value) => handleChange(index, 'authorName', value)}
                        doi={paper.doi}
                        setDoi={(value) => handleChange(index, 'doi', value)}
                        title={paper.title}
                        setTitle={(value) => handleChange(index, 'title', value)}
                        journal={paper.journal}
                        setJournal={(value) => handleChange(index, 'journal', value)}
                        date={paper.date}
                        setDate={(value) => handleChange(index, 'date', value)}
                        publicationType={paper.publicationType}
                        setPublicationType={(value) => handleChange(index, 'publicationType', value)}
                        additionalAuthors={paper.additionalAuthors}
                        setAdditionalAuthors={(value) => handleChange(index, 'additionalAuthors', value)}
                        onSave={() => handleSave(index)}
                        onBack={handleBack} 
                    />
                </div>
            ))}
        </div>
    );
};

export default ResultPage;

