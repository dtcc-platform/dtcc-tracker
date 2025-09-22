'use client'

import { useRefresh } from '../app/contexts/RefreshContext';
import { CSSProperties } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Paper, Project } from '@/app/types/FixedTypes';
import { gradients, palette, shadows } from '@/app/theme';

interface Info {
  paperIndex: string;
  projectIndex: string;
}

type MaybeProject = Project | null;
type MaybePaper = Paper | null;

export default function InfoPage({ paperIndex, projectIndex }: Info) {
  const { papers, projects } = useRefresh();
  const { isAuthenticated } = useAuth();

  let selectedProject: MaybeProject = null;
  if (projectIndex !== undefined) {
    const idx = parseInt(projectIndex, 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < projects.length) {
      selectedProject = projects[idx];
    }
  }

  let selectedPaper: MaybePaper = null;
  if (paperIndex !== undefined) {
    const idx = parseInt(paperIndex, 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < papers.length) {
      selectedPaper = papers[idx];
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={pageBackgroundStyle}>
      {selectedProject ? (
        <InfoCard
          eyebrow="Project"
          title={selectedProject.projectName || '-'}
          summary={`Led by ${selectedProject.pi || 'N/A'}`}
          details={[
            { label: 'PI', value: selectedProject.pi },
            { label: 'Additional collaborators', value: formatList(selectedProject.additionalAuthors) },
            { label: 'Funding body', value: selectedProject.fundingBody },
            { label: 'Documents link', value: selectedProject.documents },
            { label: 'Amount', value: selectedProject.amount },
            { label: 'Status', value: selectedProject.status },
          ]}
        />
      ) : selectedPaper ? (
        <InfoCard
          eyebrow="Publication"
          title={selectedPaper.title || '-'}
          summary={`Authored by ${selectedPaper.authorName || 'N/A'}`}
          details={[
            { label: 'Primary author', value: selectedPaper.authorName },
            { label: 'Additional authors', value: formatList(selectedPaper.additionalAuthors) },
            { label: 'DOI', value: selectedPaper.doi },
            { label: 'Publication date', value: selectedPaper.date },
            { label: 'Journal', value: selectedPaper.journal },
            { label: 'Publication type', value: selectedPaper.publicationType },
          ]}
        />
      ) : (
        <WelcomeCard />
      )}
    </div>
  );
}

interface InfoCardProps {
  eyebrow: string;
  title: string;
  summary: string;
  details: { label: string; value: string }[];
}

function InfoCard({ eyebrow, title, summary, details }: InfoCardProps) {
  return (
    <section style={cardWrapperStyle}>
      <header style={cardHeaderStyle}>
        <span style={eyebrowStyle}>{eyebrow}</span>
        <h2 style={cardTitleStyle}>{title}</h2>
        <p style={cardSummaryStyle}>{summary}</p>
      </header>
      <div style={detailGridStyle}>
        {details.map((item, index) => (
          <article key={index} style={detailItemStyle}>
            <span style={detailLabelStyle}>{item.label}</span>
            <span style={detailValueStyle}>{formatValue(item.value)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function WelcomeCard() {
  return (
    <section style={welcomeCardStyle}>
      <div style={welcomeContentStyle}>
        <span style={eyebrowStyle}>Digital Twin Cities Centre</span>
        <h1 style={welcomeTitleStyle}>A smarter city starts with a digital twin.</h1>
        <p style={welcomeBodyStyle}>
          Use the navigation to explore submitted projects, review publications, or register new work
          that supports our mission of creating liveable, sustainable cities.
        </p>
      </div>
    </section>
  );
}

function formatList(items?: string[]) {
  if (!items || items.length === 0) {
    return '-';
  }
  return items.join(', ');
}

function formatValue(value?: string | null) {
  if (!value) {
    return '-';
  }
  const trimmed = `${value}`.trim();
  return trimmed.length > 0 ? trimmed : '-';
}

const pageBackgroundStyle: CSSProperties = {
  padding: '2.5rem 0',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
};

const cardWrapperStyle: CSSProperties = {
  width: 'min(960px, 94%)',
  backgroundImage: gradients.card,
  borderRadius: '24px',
  padding: '2.25rem',
  boxShadow: shadows.card,
  border: '1px solid rgba(12, 24, 54, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const eyebrowStyle: CSSProperties = {
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

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 700,
  color: palette.deepNavy,
  letterSpacing: '-0.01em',
};

const cardSummaryStyle: CSSProperties = {
  margin: 0,
  fontSize: '16px',
  color: palette.textMuted,
};

const detailGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.2rem',
};

const detailItemStyle: CSSProperties = {
  backgroundColor: 'rgba(15, 33, 63, 0.06)',
  borderRadius: '14px',
  padding: '0.85rem 1rem',
  border: '1px solid rgba(15, 33, 63, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const detailLabelStyle: CSSProperties = {
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: palette.textMuted,
};

const detailValueStyle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: palette.deepNavy,
  wordBreak: 'break-word',
};

const welcomeCardStyle: CSSProperties = {
  width: 'min(960px, 94%)',
  borderRadius: '28px',
  padding: '3rem 3.25rem',
  backgroundImage: `${gradients.headerSpark}, ${gradients.header}`,
  color: '#ffffff',
  boxShadow: '0 28px 55px rgba(5, 12, 31, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
};

const welcomeContentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  maxWidth: '620px',
};

const welcomeTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '34px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
};

const welcomeBodyStyle: CSSProperties = {
  margin: 0,
  fontSize: '17px',
  lineHeight: 1.6,
  color: 'rgba(255, 255, 255, 0.78)',
};
