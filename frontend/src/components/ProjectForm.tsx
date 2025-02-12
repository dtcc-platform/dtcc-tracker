import React from 'react'
import Dropdown from '@/components/dropdown'

interface PaperFormProps {
  authorName: string
  setAuthorName: (value: string) => void
  doi: string
  setDoi: (value: string) => void
  title: string
  setTitle: (value: string) => void
  category: string
  setCategory: (value: string) => void
  categories: string[]
  status: string
  setStatus: (value: string) => void
  statuses: string[]
  pi: string
  setPi: (value: string) => void
  fundingBody: string
  setFundingBody: (value: string) => void
  fundingProgram: string
  setFundingProgram: (value: string) => void
  fundingCall: string
  setFundingCall: (value: string) => void
  topic: string
  setTopic: (value: string) => void
  link: string
  setLink: (value: string) => void
  submissionDeadline: string
  setSubmissionDeadline: (value: string) => void
  amount: string
  setAmount: (value: string) => void
  year: string
  setYear: (value: string) => void
  period: string
  setPeriod: (value: string) => void
  typeOfEngagement: string
  setTypeOfEngagement: (value: string) => void
  typesOfEngagement: string[]
  notes: string
  setNotes: (value: string) => void
  documents: string
  setDocuments: (value: string) => void
  slug: string
  setSlug: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  message: string
}

export default function ProjectForm({
  authorName,
  setAuthorName,
  doi,
  setDoi,
  title,
  setTitle,
  category,
  setCategory,
  categories,
  status,
  setStatus,
  statuses,
  pi,
  setPi,
  fundingBody,
  setFundingBody,
  fundingProgram,
  setFundingProgram,
  fundingCall,
  setFundingCall,
  topic,
  setTopic,
  link,
  setLink,
  submissionDeadline,
  setSubmissionDeadline,
  amount,
  setAmount,
  year,
  setYear,
  period,
  setPeriod,
  typeOfEngagement,
  setTypeOfEngagement,
  typesOfEngagement,
  notes,
  setNotes,
  documents,
  setDocuments,
  slug,
  setSlug,
  onSubmit,
  message,
}: PaperFormProps) {
  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <form onSubmit={onSubmit} style={formStyle}>
          <h2 style={headerStyle}>Project Information </h2>
          <div style={gridContainerStyle}>
            {/* Column 1 */}
            <div style={gridColumnStyle}>
              <label style={labelStyle}>Author Name*</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                style={inputStyle}
              />
              <label style={labelStyle}>DOI*</label>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                required
                style={inputStyle}
              />
              <label style={labelStyle}>Title*</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={inputStyle}
              />
              <label style={labelStyle}>Category</label>
              <Dropdown
                options={categories}
                value={category}
                onChange={setCategory}
              />
              <label style={labelStyle}>Status</label>
              <Dropdown
                options={statuses}
                value={status}
                onChange={setStatus}
              />
            </div>

            {/* Column 2 */}
            <div style={gridColumnStyle}>
              <label style={labelStyle}>PI</label>
              <input
                type="text"
                value={pi}
                onChange={(e) => setPi(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Funding Body</label>
              <input
                type="text"
                value={fundingBody}
                onChange={(e) => setFundingBody(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Funding Program</label>
              <input
                type="text"
                value={fundingProgram}
                onChange={(e) => setFundingProgram(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Funding Call</label>
              <input
                type="text"
                value={fundingCall}
                onChange={(e) => setFundingCall(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Column 3 */}
            <div style={gridColumnStyle}>
              <label style={labelStyle}>Link</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Submission Deadline</label>
              <input
                type="date"
                value={submissionDeadline || ''}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>Period</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Notes, Documents, and Slug */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, height: '100px' }}
            />
            <label style={labelStyle}>Documents</label>
            <input
              type="text"
              value={documents}
              onChange={(e) => setDocuments(e.target.value)}
              style={inputStyle}
            />
            <label style={labelStyle}>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button
            type="button"
            style={{
              ...buttonStyle,
              backgroundColor: '#ccc',
              color: '#000',
              border: '1px solid #aaa',
            }}
            onClick={() => window.location.href = '/'}
          >
            Cancel
          </button>
          <button type="submit" style={buttonStyle}>
            Save
          </button>
        </div>
        </form>
        {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  backgroundColor: '#f4f4f4',
  minHeight: '100vh',
};

const formBoxStyle: React.CSSProperties = {
  width: '90%',
  maxWidth: '1200px',
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const gridContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '1rem',
};

const gridColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  width: '100%',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '1.5rem',
};

