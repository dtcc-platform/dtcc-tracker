import React from 'react'

interface PaperFormProps {
  authorName: string
  setAuthorName: (value: string) => void
  doi: string
  setDoi: (value: string) => void
  title: string
  setTitle: (value: string) => void
  journal: string
  setJournal: (value: string) => void
  date: string
  setDate: (value: string) => void
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
  journal,
  setJournal,
  date,
  setDate,
  onSubmit,
  message,
}: PaperFormProps) {
  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <form onSubmit={onSubmit} style={formStyle}>
          <h2 style={headerStyle}>Project Information </h2>
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
              <label style={labelStyle}>Journal</label>
              <input
                type="text"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                required
                style={inputStyle}
              />
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={inputStyle}
              />
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

