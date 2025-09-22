'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Paper, Project } from '@/app/types/FixedTypes';
import { deleteProject, deletePaper } from '@/app/utils/api';
import { useRefresh } from '../app/contexts/RefreshContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { gradients, palette } from '@/app/theme';

interface SidebarProps {
  papers: Paper[];
  projects: Project[];
}

const SIDEBAR_WIDTH = 280;

function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '');
  const normalized = sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized;
  const numeric = parseInt(normalized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const sidebarMutedOverlay = hexToRgba(palette.textMuted, 0.8);
const sidebarMutedGradient = `linear-gradient(180deg, ${hexToRgba(palette.textMuted, 0.26)} 0%, ${hexToRgba(palette.textMuted, 0.42)} 100%)`;


export default function Sidebar({ papers, projects }: SidebarProps) {
  const [expandedSection, setExpandedSection] = useState<'papers' | 'projects' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'papers' | 'projects' | null>(null);
  const [reporting, setReporting] = useState(false);
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  const { user, isSuperUser } = useAuth();

  const toggleSection = (section: 'papers' | 'projects') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openConfirmation = (index: number, type: 'papers' | 'projects') => {
    setDeleteIndex(index);
    setDeleteType(type);
    setShowConfirm(true);
  };

  const closeConfirmation = () => {
    setShowConfirm(false);
    setDeleteIndex(null);
    setDeleteType(null);
  };

  const handleDelete = async () => {
    if (deleteIndex === null || deleteType === null) return;
    try {
      if (deleteType === 'projects') {
        router.push('/');
        await deleteProject(projects[deleteIndex].id!);
      }
      if (deleteType === 'papers') {
        router.push('/');
        await deletePaper(papers[deleteIndex].id!);
      }

      closeConfirmation();
      triggerRefresh();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={sidebarShellStyle}>
      <aside style={sidebarContainerStyle}>
        <div style={welcomeBannerStyle}>
          <span style={welcomeLabelStyle}>Welcome</span>
          <span style={welcomeUserStyle}>{user || 'Guest'}</span>
          <p style={welcomeHelperStyle}>Manage submissions and track the work of the centre.</p>
        </div>

        <nav style={navStyle}>
          <Link href="/submit-paper">
            <button style={primaryButtonStyle}>Register paper</button>
          </Link>
          <Link href="/submit-project">
            <button style={primaryButtonStyle}>Register project</button>
          </Link>
        </nav>

        <div style={dividerStyle} />

        <div style={expandableContainerStyle}>
          <button style={sectionButtonStyle} onClick={() => toggleSection('papers')}>
            Papers
          </button>
          {expandedSection === 'papers' && (
            <div style={scrollableContentStyle}>
              {papers && papers.length > 0 ? (
                papers.map((paper, index) => (
                  <div key={index} style={paperItemStyle}>
                    <div style={titleContainerStyle}>
                      <Link href={`/?paperIndex=${index}`} style={titleStyle}>
                        {isSuperUser && paper.submittedBy
                          ? `${paper.submittedBy}/${paper.title}`
                          : paper.title}
                      </Link>
                      <div style={iconContainerStyle}>
                        <Link href={`/edit-paper/${index}`} style={iconButtonStyle}>
                          <PencilIcon />
                        </Link>
                        <button
                          style={iconButtonStyle}
                          onClick={() => openConfirmation(index, 'papers')}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={emptyStateStyle}>No papers yet.</p>
              )}
            </div>
          )}
        </div>

        <div style={expandableContainerStyle}>
          <button style={sectionButtonStyle} onClick={() => toggleSection('projects')}>
            Projects
          </button>
          {expandedSection === 'projects' && (
            <div style={scrollableContentStyle}>
              {projects && projects.length > 0 ? (
                projects.map((project, index) => (
                  <div key={index} style={paperItemStyle}>
                    <div style={titleContainerStyle}>
                      <Link href={`/?projectIndex=${index}`} style={titleStyle}>
                        {isSuperUser && project.submittedBy
                          ? `${project.submittedBy}/${project.projectName}`
                          : project.projectName}
                      </Link>
                      <div style={iconContainerStyle}>
                        <Link href={`/edit-project/${index}`} style={iconButtonStyle}>
                          <PencilIcon />
                        </Link>
                        <button
                          style={iconButtonStyle}
                          onClick={() => openConfirmation(index, 'projects')}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={emptyStateStyle}>No projects yet.</p>
              )}
            </div>
          )}
        </div>

        {isSuperUser && (
          <div style={superUserSectionStyle}>
            <div style={superUserDividerStyle} />
            <button
              type="button"
              style={sectionButtonStyle}
              onClick={() => router.push('/admin')}
            >
              Users
            </button>
          </div>
        )}

        {isSuperUser && (
          <div style={expandableContainerStyle}>
            <button style={sectionButtonStyle} onClick={() => setReporting(!reporting)}>
              Reporting
            </button>
            {reporting && (
              <div style={scrollableContentStyle}>
                <div style={paperItemStyle}>
                  <div style={titleContainerStyle}>
                    <Link href="/reporting-papers" style={titleStyle}>
                      Papers
                    </Link>
                  </div>
                </div>
                <div style={paperItemStyle}>
                  <div style={titleContainerStyle}>
                    <Link href="/reporting-projects" style={titleStyle}>
                      Projects
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {showConfirm && (
          <div style={popupOverlayStyle}>
            <div style={popupStyle}>
              <h3 style={popupHeadingStyle}>Confirm deletion</h3>
              <p style={popupBodyStyle}>
                This action will permanently remove the selected
                {deleteType === 'papers' ? ' paper.' : ' project.'}
              </p>
              <div style={popupButtonContainerStyle}>
                <button style={popupButtonSecondaryStyle} onClick={closeConfirmation}>
                  Cancel
                </button>
                <button style={popupButtonDangerStyle} onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M16.862 3.487a2.754 2.754 0 1 1 3.892 3.895L7.825 20.31 3 21l.69-4.83 13.172-12.683Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const sidebarShellStyle: React.CSSProperties = {
  width: `${SIDEBAR_WIDTH}px`,
  flexShrink: 0,
};

const sidebarContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  width: `${SIDEBAR_WIDTH}px`,
  backgroundColor: sidebarMutedOverlay,
  backgroundImage: sidebarMutedGradient,
  padding: '1.75rem 1.5rem 2rem',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  color: palette.textLight,
  borderRight: '1px solid rgba(255, 255, 255, 0.12)',
  overflowY: 'auto',
  zIndex: 55,
};

const superUserSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const superUserDividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'rgba(255, 255, 255, 0.22)',
  opacity: 0.85,
};

const superUserButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  borderRadius: '12px',
  border: 'none',
  backgroundImage: gradients.button,
  color: palette.textDark,
  fontWeight: 600,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  boxShadow: '0 18px 30px rgba(242, 176, 67, 0.35)',
  textAlign: 'left',
};

const welcomeBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: '18px',
  border: `1px solid ${palette.borderSoft}`,
  padding: '1.05rem 1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  boxShadow: '0 18px 35px rgba(5, 12, 31, 0.3)',
  backdropFilter: 'blur(12px)',
};

const welcomeLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.65)',
};

const welcomeUserStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#ffffff',
};

const welcomeHelperStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.6)',
  lineHeight: 1.4,
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  cursor: 'pointer',
  borderRadius: '14px',
  backgroundImage: gradients.button,
  border: 'none',
  color: palette.midnight,
  fontWeight: 600,
  letterSpacing: '0.02em',
  boxShadow: '0 18px 30px rgba(242, 176, 67, 0.35)',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'rgba(255, 255, 255, 0.18)',
  margin: '0.5rem 0 0.25rem',
};

const expandableContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const sectionButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  cursor: 'pointer',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: palette.gold,
  fontWeight: 600,
  letterSpacing: '0.01em',
  textAlign: 'left',
};

const scrollableContentStyle: React.CSSProperties = {
  overflowY: 'auto',
  backgroundColor: 'rgba(5, 11, 31, 0.42)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  padding: '0.75rem',
  borderRadius: '14px',
  maxHeight: '260px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  backdropFilter: 'blur(18px)',
};

const paperItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '0.35rem 0.4rem',
  borderRadius: '10px',
  backgroundColor: 'transparent',
};

const titleContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
};

const titleStyle: React.CSSProperties = {
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontSize: '14px',
  color: '#f1f5ff',
};

const iconContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexShrink: 0,
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: palette.gold,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const emptyStateStyle: React.CSSProperties = {
  fontStyle: 'italic',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '13px',
};

const popupOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(5, 11, 31, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const popupStyle: React.CSSProperties = {
  backgroundImage: gradients.card,
  padding: '2rem',
  borderRadius: '18px',
  textAlign: 'center',
  boxShadow: '0 28px 55px rgba(5, 12, 31, 0.35)',
  border: '1px solid rgba(7, 15, 35, 0.12)',
  maxWidth: '360px',
};

const popupHeadingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  color: palette.textDark,
};

const popupBodyStyle: React.CSSProperties = {
  fontSize: '14px',
  color: palette.textMuted,
  margin: '0.75rem 0 1.5rem',
  lineHeight: 1.5,
};

const popupButtonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
};

const popupButtonSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'rgba(27, 35, 55, 0.1)',
  color: palette.textDark,
  padding: '0.6rem 1.4rem',
  border: '1px solid rgba(27, 35, 55, 0.2)',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 600,
};

const popupButtonDangerStyle: React.CSSProperties = {
  backgroundColor: '#f56b6b',
  color: '#fff',
  padding: '0.6rem 1.4rem',
  border: 'none',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 600,
};
