'use client'

import { useRefresh } from '../app/hooks/RefreshContext';

interface Info{
    paperIndex: string
    projectIndex:string
}
export default function InfoPage({paperIndex, projectIndex}: Info) {

  const {papers, projects} = useRefresh() 
  let selectedProject = null;
  if (projectIndex !== undefined) {
    const idx = parseInt(projectIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < projects.length) {
      selectedProject = projects[idx];
    }
  }
  let selectedPaper = null;
  if (paperIndex !== undefined) {
    const idx = parseInt(paperIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < papers.length) {
      selectedPaper = papers[idx];
    }
  }



  return (
    <div style={pageContainerStyle}>
  {selectedProject ? (
    <div style={formContainerStyle}>
      <div style={formBoxStyle}>
        <h2>{selectedProject.title || '-'}</h2>
        <div style={infoContainerStyle}>
          {/* Column 1 */}
          <div style={infoColumnStyle}>
            <p><strong>Author:</strong> {selectedProject.authorName || '-'}</p>
            <p><strong>DOI:</strong> {selectedProject.doi || '-'}</p>
            <p><strong>Category:</strong> {selectedProject.category || '-'}</p>
            <p><strong>Status:</strong> {selectedProject.status || '-'}</p>
            <p><strong>PI:</strong> {selectedProject.pi || '-'}</p>
            <p><strong>Funding Body:</strong> {selectedProject.fundingBody || '-'}</p>
          </div>

          {/* Column 2 */}
          <div style={infoColumnStyle}>
            <p><strong>Funding Program:</strong> {selectedProject.fundingProgram || '-'}</p>
            <p><strong>Funding Call:</strong> {selectedProject.fundingCall || '-'}</p>
            <p><strong>Topic:</strong> {selectedProject.topic || '-'}</p>
            <p><strong>Link:</strong> {selectedProject.link ? (
              <a href={selectedProject.link} target="_blank" rel="noopener noreferrer">{selectedProject.link}</a>
            ) : '-'}
            </p>
            <p><strong>Submission Deadline:</strong> {selectedProject.submissionDeadline || '-'}</p>
            <p><strong>Amount:</strong> {selectedProject.amount || '-'}</p>
          </div>

          {/* Column 3 */}
          <div style={infoColumnStyle}>
            <p><strong>Year:</strong> {selectedProject.year || '-'}</p>
            <p><strong>Period:</strong> {selectedProject.period || '-'}</p>
            <p><strong>Type of Engagement:</strong> {selectedProject.typeOfEngagement || '-'}</p>
            <p><strong>Notes:</strong> {selectedProject.notes || '-'}</p>
            <p><strong>Documents:</strong> {selectedProject.documents || '-'}</p>
            <p><strong>Slug:</strong> {selectedProject.slug || '-'}</p>
          </div>
        </div>
      </div>
    </div>
    ) : selectedPaper ? (
      <div style={formContainerStyle}>
        <div style={formBoxStyle}>
          <h2>{selectedPaper.title || '-'}</h2>
          <div style={infoContainerStyle}>
            <div style={infoColumnStyle}>
              <p><strong>Author:</strong> {selectedPaper.authorName || '-'}</p>
              <p><strong>DOI:</strong> {selectedPaper.doi || '-'}</p>
              <p><strong>Category:</strong> {selectedPaper.date || '-'}</p>
              <p><strong>Status:</strong> {selectedPaper.journal || '-'}</p>
            </div>
          </div>
        </div>
      </div>
  ) : (
    <div>
      <h1>Welcome to the Paper DTCC Tracker</h1>
      <p>Navigate through the left sidebar to either submit a new Project/Paper or view stored ones.</p>
    </div>
  )}
</div>
  );
}

const infoContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '20px',
};

const infoColumnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as 'column', // Explicitly set as 'column'
  gap: '10px',
};

const pageContainerStyle: React.CSSProperties = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
};

const formContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
};

const formBoxStyle: React.CSSProperties = {
  width: '80%',
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};


