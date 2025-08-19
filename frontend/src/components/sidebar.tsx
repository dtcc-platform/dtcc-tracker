'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Paper, Project } from '@/app/types/FixedTypes'
import { deleteProject, deletePaper } from '@/app/utils/api'
import { useRefresh } from '../app/contexts/RefreshContext'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
interface SidebarProps {
  papers: Paper[]
  projects: Project[]
}

export default function Sidebar({ papers, projects }: SidebarProps) {
  const [expandedSection, setExpandedSection] = useState<'papers' | 'projects' | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [deleteType, setDeleteType] = useState<'papers' | 'projects' | null>(null)
  const [reporting, setReporting] = useState(false)
  const router = useRouter()
  const { triggerRefresh } = useRefresh()
  const toggleSection = (section: 'papers' | 'projects') => {
    setExpandedSection(expandedSection === section ? null : section)
  }
  const { user, isSuperUser } = useAuth()
  const openConfirmation = (index: number, type: 'papers' | 'projects') => {
    setDeleteIndex(index)
    setDeleteType(type)
    setShowConfirm(true)
  }
  console.log('super user check', isSuperUser)
  const closeConfirmation = () => {
    setShowConfirm(false)
    setDeleteIndex(null)
    setDeleteType(null)
  }

  const handleDelete = async () => {
    if (deleteIndex === null || deleteType === null) return
    try {
      if (deleteType === "projects") {
        router.push('/')
        await deleteProject(projects[deleteIndex].id!)
      }
      if (deleteType === "papers") {
        router.push('/')
        await deletePaper(papers[deleteIndex].id!)
      }

      closeConfirmation()
      triggerRefresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div style={sidebarContainerStyle}>
      <div style={{ height: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Welcome, {user}</div>

      <nav style={navStyle}>
        <Link href="/submit-paper">
          <button style={buttonStyle}>Register paper</button>
        </Link>
        <Link href="/submit-project">
          <button style={buttonStyle}>Register project</button>
        </Link>
      </nav>

      <hr style={{ margin: '1rem 0' }} />
      {/* Expandable Papers Section */}
      <div style={expandableContainerStyle}>
        <button style={expandableButtonStyle} onClick={() => toggleSection('papers')}>
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
                        : paper.title
                      }
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
              <p style={{ fontStyle: 'italic' }}>No papers yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Expandable Projects Section */}
      <div style={expandableContainerStyle}>
        <button style={expandableButtonStyle} onClick={() => toggleSection('projects')}>
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
                        : project.projectName
                      }
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
              <p style={{ fontStyle: 'italic' }}>No projects yet.</p>
            )}
          </div>
        )}
      </div>

      <hr style={{ margin: '1rem 0' }} />

      <div style={expandableContainerStyle}>
        {isSuperUser && <button style={expandableButtonStyle} onClick={() => window.location.href = '/admin'}>
          Users
        </button>}
      </div>
      <div style={expandableContainerStyle}>
        {isSuperUser && <button style={expandableButtonStyle}
          onClick={() => setReporting(!reporting)}
        >
          Reporting
        </button>}
        {reporting && (
          <div style={scrollableContentStyle}>
            <div style={paperItemStyle}>
              <div style={titleContainerStyle}>
                <Link href={`/reporting-papers`} style={titleStyle}>
                  Papers
                </Link>
                <div style={iconContainerStyle}>
                </div>
              </div>
            </div>
            <div style={paperItemStyle}>
              <div style={titleContainerStyle}>
                <Link href={`/reporting-projects`} style={titleStyle}>
                  Projects
                </Link>
                <div style={iconContainerStyle}>
                </div>
              </div>
            </div>
          </div>

        )}
      </div>



      {/* Confirmation Popup */}
      {showConfirm && (
        <div style={popupOverlayStyle}>
          <div style={popupStyle}>
            <p>Are you sure you want to delete this item?</p>
            <div style={popupButtonContainerStyle}>
              <button style={popupButtonRedStyle} onClick={handleDelete}>Yes</button>
              <button style={popupButtonBlueStyle} onClick={closeConfirmation}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Icon Components
function PencilIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16.862 3.487a2.754 2.754 0 1 1 3.892 3.895L7.825 20.31 3 21l.69-4.83 13.172-12.683Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function TrashIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const paperItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column", // No error now
  padding: "10px",
  borderBottom: "1px solid #ddd",
};

const titleContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between', // Ensures title and icons are on the same line
  alignItems: 'center', // Keeps items vertically aligned
  gap: '10px',
  overflow: 'hidden', // Prevents long titles from breaking layout
};

const titleStyle = {
  flex: '1', // Allows the title to take up remaining space
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis', // Adds "..." for long text
};

const iconContainerStyle = {
  display: 'flex',
  gap: '5px',
  flexShrink: '0', // Ensures icons do not shrink
};

const iconButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};


const sidebarContainerStyle: React.CSSProperties = {
  width: '250px',
  height: '100vh',
  backgroundColor: '#f5f5f5',
  padding: '0rem 1rem 1rem 1rem',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  cursor: 'pointer',
  backgroundColor: '#0070f3',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 500,
  fontSize: '15px'
}

const expandableContainerStyle: React.CSSProperties = {
  marginBottom: '1rem',
}

const expandableButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  cursor: 'pointer',
  backgroundColor: '#0070f3',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '15px'
}

const scrollableContentStyle: React.CSSProperties = {
  overflowY: 'auto',
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  padding: '0.5rem',
  marginTop: '0.5rem',
  borderRadius: '4px',
}
const popupOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
}

const popupStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '1rem',
  borderRadius: '8px',
  textAlign: 'center',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
}

const popupButtonContainerStyle: React.CSSProperties = {
  marginTop: '1rem',
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
}

const popupButtonRedStyle: React.CSSProperties = {
  backgroundColor: '#ff4d4f',
  color: 'white',
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
}

const popupButtonBlueStyle: React.CSSProperties = {
  backgroundColor: '#0070f3',
  color: 'white',
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
}
