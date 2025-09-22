'use client';

import React, { CSSProperties } from 'react';
import Dropdown from './dropdown';
import { gradients, palette, shadows } from '@/app/theme';

interface PaperFormProps {
    authorName: string;
    setAuthorName: (value: string) => void;
    doi: string;
    setDoi: (value: string) => void;
    title: string;
    setTitle: (value: string) => void;
    journal: string;
    setJournal: (value: string) => void;
    date: string;
    setDate: (value: string) => void;
    publicationType: string;
    setPublicationType: (value: string) => void;
    additionalAuthors: string[];
    setAdditionalAuthors: (value: string[]) => void;
    onSave: () => void;
    onBack: () => void;
}

const PaperForm: React.FC<PaperFormProps> = ({
    authorName,
    setAuthorName,
    doi,
    setDoi,
    title,
    setTitle,
    journal,
    setJournal,
    date,
    setDate,
    publicationType,
    setPublicationType,
    additionalAuthors,
    setAdditionalAuthors,
    onSave,
    onBack,
}) => {
    const publicationTypes = ['Article in journal', 'Monograph', 'Conference proceedings', 'Other'];

    const addAuthor = () => {
        setAdditionalAuthors([...additionalAuthors, '']);
    };

    const removeAuthor = (index: number) => {
        const updatedAuthors = additionalAuthors.filter((_, i) => i !== index);
        setAdditionalAuthors(updatedAuthors);
    };

    const handleAuthorChange = (index: number, value: string) => {
        const updatedAuthors = [...additionalAuthors];
        updatedAuthors[index] = value;
        setAdditionalAuthors(updatedAuthors);
    };

    const validateForm = () => {
        if (!authorName.trim()) {
            alert('Author Name is required');
            return false;
        }
        if (!doi.trim()) {
            alert('DOI is required');
            return false;
        }
        if (!title.trim()) {
            alert('Title is required');
            return false;
        }
        if (!journal.trim()) {
            alert('Journal is required');
            return false;
        }
        if (!date) {
            alert('Published Date is required');
            return false;
        }
        if (!publicationType) {
            alert('Publication Type is required');
            return false;
        }

        for (let i = 0; i < additionalAuthors.length; i++) {
            if (!additionalAuthors[i].trim()) {
                alert(`Additional Author ${i + 2} cannot be empty`);
                return false;
            }
        }

        return true;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave();
        }
    };

    return (
        <div style={formWrapperStyle}>
            <div style={formCardStyle}>
                <header style={formHeaderStyle}>
                    <span style={formEyebrowStyle}>Publication</span>
                    <h1 style={formTitleStyle}>Paper Details</h1>
                    <p style={formSubtitleStyle}>Provide the required metadata so we can categorise this publication.</p>
                </header>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={formContentStyle}>
                    <div style={formGridStyle}>
                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Author Name</span>
                            <input
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>DOI</span>
                            <input
                                type="text"
                                value={doi}
                                onChange={(e) => setDoi(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Title</span>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Journal</span>
                            <input
                                type="text"
                                value={journal}
                                onChange={(e) => setJournal(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Published Date</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Publication Type</span>
                            <Dropdown
                              options={publicationTypes}
                              value={publicationType}
                              onChange={setPublicationType}
                              placeholder='Select publication type'
                              required
                            />
                        </label>
                    </div>

                    <div style={collaboratorSectionStyle}>
                        <span style={labelTextStyle}>Additional Authors</span>
                        <div style={collaboratorListStyle}>
                            {additionalAuthors.map((author, index) => (
                                <div key={index} style={collaboratorRowStyle}>
                                    <input
                                        type="text"
                                        value={author}
                                        onChange={(e) => handleAuthorChange(index, e.target.value)}
                                        style={inputStyle}
                                        placeholder={`Author ${index + 2}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAuthor(index)}
                                        style={removeButtonStyle}
                                    >
                                        x
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addAuthor}
                            style={addButtonStyle}
                        >
                            + Add another author
                        </button>
                    </div>

                    <div style={actionRowStyle}>
                        <button
                            type="button"
                            onClick={onBack}
                            style={secondaryButtonStyle}
                        >
                            Back
                        </button>

                        <button
                            type="submit"
                            style={primaryButtonStyle}
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const formWrapperStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 'calc(100vh - 120px)',
    padding: '2.5rem',
};

const formCardStyle: CSSProperties = {
    width: 'min(880px, 100%)',
    backgroundImage: gradients.card,
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: shadows.card,
    border: '1px solid rgba(12, 24, 54, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
};

const formHeaderStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
};

const formEyebrowStyle: CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    backgroundColor: 'rgba(15, 33, 63, 0.08)',
    color: palette.deepNavy,
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    width: 'fit-content',
};

const formTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: '30px',
    fontWeight: 700,
    color: palette.deepNavy,
};

const formSubtitleStyle: CSSProperties = {
    margin: 0,
    fontSize: '16px',
    color: palette.textMuted,
};

const formContentStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
};

const formGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
};

const labelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    color: palette.deepNavy,
};

const labelTextStyle: CSSProperties = {
    fontSize: '13px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 600,
    color: palette.textMuted,
};

const inputStyle: CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(15, 33, 63, 0.16)',
    backgroundColor: '#ffffff',
    fontSize: '15px',
    color: palette.deepNavy,
};

const collaboratorSectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
};

const collaboratorListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
};

const collaboratorRowStyle: CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
};

const removeButtonStyle: CSSProperties = {
    backgroundColor: '#ff6b6b',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.5rem 0.85rem',
    cursor: 'pointer',
    fontWeight: 600,
};

const addButtonStyle: CSSProperties = {
    alignSelf: 'flex-start',
    padding: '0.6rem 1.1rem',
    borderRadius: '999px',
    border: '1px solid rgba(15, 33, 63, 0.18)',
    backgroundColor: 'rgba(15, 33, 63, 0.08)',
    color: palette.deepNavy,
    fontWeight: 600,
    cursor: 'pointer',
};

const actionRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
};

const secondaryButtonStyle: CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '999px',
    border: '1px solid rgba(15, 33, 63, 0.18)',
    backgroundColor: 'transparent',
    color: palette.deepNavy,
    fontWeight: 600,
    cursor: 'pointer',
};

const primaryButtonStyle: CSSProperties = {
    padding: '0.75rem 1.75rem',
    borderRadius: '999px',
    border: 'none',
    backgroundImage: gradients.button,
    color: palette.deepNavy,
    fontWeight: 700,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    boxShadow: '0 18px 35px rgba(242, 176, 67, 0.35)',
};

export default PaperForm;
