'use client'

import { useRefresh } from '../app/hooks/RefreshContext';

interface Info {
    paperIndex: string;
    projectIndex: string;
}

export default function InfoPage({ paperIndex, projectIndex }: Info) {
    const { papers, projects } = useRefresh();
    
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
                    <h2>{selectedProject.projectName || '-'}</h2>
                    <div style={infoContainerStyle}>
                        <div style={infoColumnStyle}>
                            <p><strong>PI:</strong> {selectedProject.pi || '-'}</p>
                            <p><strong>Additional Authors:</strong> {selectedProject.additionalAuthors && selectedProject.additionalAuthors.length > 0 ? selectedProject.additionalAuthors.join(', ') : '-'}</p>
                            <p><strong>Funding Body:</strong> {selectedProject.fundingBody || '-'}</p>
                            <p><strong>Documents Link:</strong> {selectedProject.documents || '-'}</p>
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
                                <p><strong>Additional Authors:</strong> {selectedPaper.additionalAuthors && selectedPaper.additionalAuthors.length > 0 ? selectedPaper.additionalAuthors.join(', ') : '-'}</p>
                                <p><strong>DOI:</strong> {selectedPaper.doi || '-'}</p>
                                <p><strong>Date:</strong> {selectedPaper.date || '-'}</p>
                                <p><strong>Journal:</strong> {selectedPaper.journal || '-'}</p>
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
    flexDirection: 'column' as 'column',
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
