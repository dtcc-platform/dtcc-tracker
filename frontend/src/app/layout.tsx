import './globals.css';
import { ReactNode } from 'react';
import path from 'path';
import fs from 'fs';
import Header from '@/components/header';
import { Paper, Project } from './types/FixedTypes';
import { RefreshProvider } from '@/app/contexts/RefreshContext';
import { AuthProvider } from './contexts/AuthContext';
import ChatButton from '@/components/ChatButton';
export const dynamic = 'force-dynamic';
import { PaperProvider } from './contexts/PaperContext';
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
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const papers = getPapers();

  const HEADER_HEIGHT = 64; // Height of the header in pixels

  return (
    <AuthProvider>
      <RefreshProvider>
        <PaperProvider>
          <html lang="en">
            <body style={{ margin: 0, padding: 0 }}>
              <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                {/* Sidebar */}

                <Header />
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
              <ChatButton></ChatButton>
            </body>
          </html>
        </PaperProvider>
      </RefreshProvider>
    </AuthProvider>
  );
}

