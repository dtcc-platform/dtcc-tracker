'use client';

import React, { CSSProperties } from 'react';
import Dropdown from './dropdown';
import { gradients, palette, shadows } from '@/app/theme';

interface ProjectFormProps {
    Pi: string;
    setPi: (value: string) => void;
    ProjectName: string;
    setProjectName: (value: string) => void;
    status: string;
    setStatus: (value: string) => void;
    statuses: string[];
    fundingBody: string;
    setFundingBody: (value: string) => void;
    amount: string;
    setAmount: (value: string) => void;
    fundingbdytypes: string[];
    additionalAuthors: string[];
    setAdditionalAuthors: (value: string[]) => void;
    Documents: string;
    setDocuments: (value: string) => void;
    onSave: () => void;
    onBack: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
    Pi,
    setPi,
    ProjectName,
    setProjectName,
    status,
    setStatus,
    statuses,
    fundingBody,
    setFundingBody,
    amount,
    setAmount,
    fundingbdytypes,
    additionalAuthors,
    setAdditionalAuthors,
    Documents,
    setDocuments,
    onBack,
    onSave,
}) => {
    const addCollaborator = () => {
        setAdditionalAuthors([...additionalAuthors, '']);
    };

    const removeCollaborator = (index: number) => {
        const updated = additionalAuthors.filter((_, i) => i !== index);
        setAdditionalAuthors(updated);
    };

    const handleCollaboratorChange = (index: number, value: string) => {
        const updated = [...additionalAuthors];
        updated[index] = value;
        setAdditionalAuthors(updated);
    };

    const validateForm = () => {
        for (let i = 0; i < additionalAuthors.length; i++) {
            if (!additionalAuthors[i].trim()) {
                alert(`Collaborator ${i + 2} cannot be empty`);
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
                    <span style={formEyebrowStyle}>Project</span>
                    <h1 style={formTitleStyle}>Project Details</h1>
                    <p style={formSubtitleStyle}>Capture the core information for this project submission.</p>
                </header>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={formContentStyle}>
                    <div style={formGridStyle}>
                        <label style={labelStyle}>
                            <span style={labelTextStyle}>PI</span>
                            <input
                                type="text"
                                value={Pi}
                                onChange={(e) => setPi(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Project Name</span>
                            <input
                                type="text"
                                value={ProjectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Documents Link</span>
                            <input
                                type="text"
                                value={Documents}
                                onChange={(e) => setDocuments(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Amount</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Status</span>
                            <Dropdown
                              options={statuses}
                              value={status}
                              onChange={setStatus}
                              placeholder='Select Status'
                              required
                            />
                        </label>

                        <label style={labelStyle}>
                            <span style={labelTextStyle}>Funding Body</span>
                            <Dropdown
                              options={fundingbdytypes}
                              value={fundingBody}
                              onChange={setFundingBody}
                              placeholder='Select Funding Body'
                              required
                            />
                        </label>
                    </div>

                    <div style={collaboratorSectionStyle}>
                        <span style={labelTextStyle}>Collaborators</span>
                        <div style={collaboratorListStyle}>
                            {additionalAuthors.map((author, index) => (
                                <div key={index} style={collaboratorRowStyle}>
                                    <input
                                        type="text"
                                        value={author}
                                        onChange={(e) => handleCollaboratorChange(index, e.target.value)}
                                        style={inputStyle}
                                        placeholder={`Person ${index + 2}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCollaborator(index)}
                                        style={removeButtonStyle}
                                    >
                                        x
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addCollaborator}
                            style={addButtonStyle}
                        >
                            + Add collaborator
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

export default ProjectForm;
