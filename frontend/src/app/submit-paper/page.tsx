'use client'
import { CSSProperties, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createPaper, fetchDoiMetadata } from '../utils/api';
import { Paper } from '../types/FixedTypes';
import { useRefresh } from '@/app/contexts/RefreshContext';
import { usePaperContext } from '../contexts/PaperContext';
import { gradients, palette, shadows } from '@/app/theme';

// Dynamic import for PaperForm component
const PaperForm = lazy(() => import('@/components/PaperForm'));
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
        url: '',
        journal: '',
        date: '',
        title: '',
        additionalAuthors: [],
        publicationType: '',
        milestoneProject: ''
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
            if (response.error) {
                if (response.error === ("DOI already exists")) {
                    setError("This DOI already exists."); // Set error message
                }
            } else {
                triggerRefresh();
                router.push('/');
            }
        } catch (error) {
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
            // Set error messages for failed DOIs
            if (failedDois.length > 0) {
                const errorMessages = failedDois.map(doi => `Failed to load metadata for DOI: ${doi}`);
                setDoiErrors(errorMessages);
            } else {
                setDoiErrors([]); // Clear any previous errors
            }


        } else {
            setDoiErrors(['Failed to process any of the provided DOIs']);
        }
        router.push('/result');
    };

    if (manualInput) {
        return (
            <div style={pageWrapperStyle}>
                <Suspense fallback={
                    <div style={loadingStyle}>Loading form...</div>
                }>
                    <PaperForm
                        authorName={paper.authorName}
                        setAuthorName={(value) => handleChange('authorName', value)}
                        doi={paper.doi}
                        setDoi={(value) => handleChange('doi', value)}
                        url={paper.url || ''}
                        setUrl={(value) => handleChange('url', value)}
                        title={paper.title}
                        setTitle={(value) => handleChange('title', value)}
                        journal={paper.journal}
                        setJournal={(value) => handleChange('journal', value)}
                        date={paper.date}
                        setDate={(value) => handleChange('date', value)}
                        publicationType={paper.publicationType}
                        setPublicationType={(value) => handleChange('publicationType', value)}
                        milestoneProject={paper.milestoneProject || ''}
                        setMilestoneProject={(value) => handleChange('milestoneProject', value)}
                        additionalAuthors={paper.additionalAuthors}
                        setAdditionalAuthors={(value) => handleChange('additionalAuthors', value)}
                        onSave={handleSave}
                        onBack={handleBack}
                    />
                </Suspense>
            </div>
        );
    }

    return (
        <div style={pageWrapperStyle}>
            <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                    <span style={cardEyebrowStyle}>Paper submission</span>
                    <h1 style={cardTitleStyle}>Register papers via DOI</h1>
                    <p style={cardSubtitleStyle}>
                        Paste one DOI per line and we will fetch the metadata for you.
                    </p>
                </div>

                {error && (
                    <p style={errorStyle}>{error}</p>
                )}

                <textarea
                    placeholder="Enter one DOI per line"
                    name="doi"
                    value={userDOIInput}
                    onChange={(e) => setUserDOIInput(e.target.value)}
                    style={textareaStyle}
                />

                <p style={helperTextStyle}>
                    Separate multiple DOIs with a new line. Duplicate entries are ignored automatically.
                </p>

                <div style={actionsRowStyle}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        style={cancelButtonStyle}
                    >
                        Cancel
                    </button>
                    <div style={actionsClusterStyle}>
                        <button
                            type="button"
                            onClick={handleManualInput}
                            style={secondaryButtonStyle}
                        >
                            Manual Input
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            style={primaryButtonStyle}
                        >
                            Crossref Retrieve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};


const pageWrapperStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '2.5rem 0 3rem',
};

const cardStyle: CSSProperties = {
    width: 'min(640px, 100%)',
    backgroundImage: gradients.card,
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: shadows.card,
    border: '1px solid rgba(12, 24, 54, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
};

const cardHeaderStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
};

const cardEyebrowStyle: CSSProperties = {
    alignSelf: 'flex-start',
    padding: '0.25rem 0.85rem',
    borderRadius: '999px',
    backgroundColor: 'rgba(15, 33, 63, 0.08)',
    color: palette.deepNavy,
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
};

const cardTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: '30px',
    fontWeight: 700,
    color: palette.deepNavy,
};

const cardSubtitleStyle: CSSProperties = {
    margin: 0,
    fontSize: '15px',
    color: palette.textMuted,
    lineHeight: 1.6,
};

const errorStyle: CSSProperties = {
    margin: 0,
    padding: '0.65rem 1rem',
    borderRadius: '12px',
    backgroundColor: 'rgba(245, 107, 107, 0.12)',
    color: '#b02a37',
    fontWeight: 600,
};

const textareaStyle: CSSProperties = {
    minHeight: '220px',
    padding: '1rem 1.25rem',
    borderRadius: '18px',
    border: '1px solid rgba(15, 33, 63, 0.16)',
    backgroundColor: '#ffffff',
    color: palette.deepNavy,
    fontSize: '15px',
    lineHeight: 1.6,
    resize: 'vertical',
    boxShadow: '0 20px 45px rgba(7, 15, 35, 0.12)',
};

const helperTextStyle: CSSProperties = {
    margin: 0,
    fontSize: '13px',
    color: palette.textMuted,
};

const actionsRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
};

const actionsClusterStyle: CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
};

const cancelButtonStyle: CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#f56b6b',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 18px 32px rgba(245, 107, 107, 0.25)',
};

const secondaryButtonStyle: CSSProperties = {
    padding: '0.75rem 1.6rem',
    borderRadius: '999px',
    border: '1px solid rgba(15, 33, 63, 0.15)',
    backgroundColor: 'rgba(15, 33, 63, 0.06)',
    color: palette.deepNavy,
    fontWeight: 600,
    cursor: 'pointer',
};

const primaryButtonStyle: CSSProperties = {
    padding: '0.75rem 1.8rem',
    borderRadius: '999px',
    border: 'none',
    backgroundImage: gradients.button,
    color: palette.textDark,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 20px 40px rgba(242, 176, 67, 0.32)',
};

const loadingStyle: CSSProperties = {
    padding: '2rem',
    textAlign: 'center',
    color: palette.textMuted,
    fontSize: '14px',
};

export default InputPage;
