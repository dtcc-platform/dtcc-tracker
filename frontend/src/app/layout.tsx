import './globals.css';
import { ReactNode } from 'react';
import path from 'path';
import fs from 'fs';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { Paper, Project } from './types/FixedTypes';
import { RefreshProvider } from '@/app/hooks/RefreshContext';
import { AuthProvider } from './hooks/AuthContext';

export const dynamic = 'force-dynamic';

function getPapers(): Project[] {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'papers.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as Project[];
  } catch (error) {
    console.error('Error reading papers.json:', error);
    return [];
  }
}

export const metadata = {
  title: 'DTCC Tracker',
  description: 'A Next.js 13+ app for paper submissions.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const papers = getPapers();

  const HEADER_HEIGHT = 64; // Height of the header in pixels

  return (
    <AuthProvider>
      <RefreshProvider>
      <html lang="en">
        <body style={{ margin: 0, padding: 0 }}>
          <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            
              <Header></Header>
              {/* Page content */}
              <main
                style={{
                  paddingTop: `${HEADER_HEIGHT}px`, // Ensure content starts below the header
                  flex: 1,
                  overflow: 'auto',
                }}
              >
                {children}
              </main>
          </div>
        </body>
      </html>
      </RefreshProvider>
    </AuthProvider>
  );
}

