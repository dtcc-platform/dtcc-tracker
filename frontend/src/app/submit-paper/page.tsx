'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPaper, fetchDoiMetadata } from '../utils/api';
import { Paper } from '../types/FixedTypes';
import { useRefresh } from '@/app/contexts/RefreshContext';
import PaperForm from '@/components/PaperForm';
import { usePaperContext } from '../contexts/PaperContext';
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
        publicationType: ''
    });
    const { triggerRefresh } = useRefresh();
    const router = useRouter();
    const { setDoiErrors, setPapers, clearEverything } = usePaperContext();
    const [userDOIInput, setUserDOIInput] = useState('');
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

    const handleSubmit = () => {
        clearEverything();
        const splitDOIs = userDOIInput
            .split("\n")
            .map((doi) => doi.trim())
            .filter((doi) => doi.length > 0);

        const uniqueDOIs = [...new Set(splitDOIs)];
        if(uniqueDOIs.length === 0) {
            return
        }
        if (uniqueDOIs.length > 1) {
            handleRetrieveMultiple(uniqueDOIs);
        } else {
            handleRetrieve(uniqueDOIs[0]);
        }
    }

    const handleRetrieve = async (doi: string) => {
        try {
            const data = await fetchDoiMetadata(doi);
            if (data) {
                // Format the date
                const formattedDate = formatDateToYYYYMMDD(data.PublishedOn || '');

                const paperData: Paper = {
                    authorName: data.Authors?.["Main Author"] || '',
                    doi: data.DOI || '',
                    journal: data.Journal || '',
                    date: formattedDate,
                    title: data.Title || '',
                    additionalAuthors: data.Authors?.["Additional Authors"] || [],
                    publicationType: data.PublicationType || '',
                };

                setPapers([paperData]);
                router.push('/result');
            } else {
                // Handle case where DOI metadata couldn't be retrieved
                const failedPaper: Paper = {
                    authorName: '',
                    doi: doi,
                    journal: '',
                    date: '',
                    title: '',
                    additionalAuthors: [],
                    publicationType: '',
                };

                setPapers([failedPaper]);
                setDoiErrors([`Failed to load metadata for DOI: ${doi}`]);
                router.push('/result');
            }
        } catch (error) {
            console.error('Error retrieving DOI metadata:', error);

            // Create a paper with just the DOI so user can edit manually
            const failedPaper: Paper = {
                authorName: '',
                doi: doi,
                journal: '',
                date: '',
                title: '',
                additionalAuthors: [],
                publicationType: '',
            };

            setPapers([failedPaper]);
            setDoiErrors([`Failed to load metadata for DOI: ${doi}`]);
            router.push('/result');
        }
    };

    const handleRetrieveMultiple = async (dois: string[]) => {
        const failedDois: string[] = [];
        const validPapers: Paper[] = [];

        // Process each DOI individually to catch failures
        for (const doi of dois) {
            try {
                const data = await fetchDoiMetadata(doi);
                if (data) {
                    const paperData: Paper = {
                        authorName: data.Authors?.["Main Author"] || '',
                        doi: data.DOI || '',
                        journal: data.Journal || '',
                        date: formatDateToYYYYMMDD(data.PublishedOn || ''),
                        title: data.Title || '',
                        additionalAuthors: data.Authors?.["Additional Authors"] || [],
                        publicationType: data.PublicationType || '',
                    };
                    validPapers.push(paperData);
                } else {
                    // Metadata retrieval failed, but we still want to include the DOI
                    const failedPaper: Paper = {
                        authorName: '',
                        doi: doi,
                        journal: '',
                        date: '',
                        title: '',
                        additionalAuthors: [],
                        publicationType: '',
                    };
                    validPapers.push(failedPaper);
                    failedDois.push(doi);
                }
            } catch (error) {
                console.error(`Error retrieving metadata for DOI ${doi}:`, error);

                // Include the failed DOI as an empty paper for manual editing
                const failedPaper: Paper = {
                    authorName: '',
                    doi: doi,
                    journal: '',
                    date: '',
                    title: '',
                    additionalAuthors: [],
                    publicationType: '',
                };
                validPapers.push(failedPaper);
                failedDois.push(doi);
            }
        }

        // Always navigate to results page, even if some/all failed
        if (validPapers.length > 0) {
            setPapers(validPapers);
            console.log("VALID PAPERS",validPapers)
            console.log("FAILED DOIS",failedDois)
            // Set error messages for failed DOIs
            if (failedDois.length > 0) {
                const errorMessages = failedDois.map(doi => `Failed to load metadata for DOI: ${doi}`);
                setDoiErrors(errorMessages);
            } else {
                setDoiErrors([]); // Clear any previous errors
            }

            
        } else {
            console.error('No valid papers could be processed');
            setDoiErrors(['Failed to process any of the provided DOIs']);
        }
        router.push('/result');
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
                    publicationType={paper.publicationType}
                    setPublicationType={(value) => handleChange('publicationType', value)}
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

                <textarea
                    placeholder="Enter one DOI per line"
                    name="doi"
                    value={userDOIInput}
                    onChange={(e) => setUserDOIInput(e.target.value)}
                    style={{
                        height: '250px',
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
                        onClick={handleSubmit}
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
