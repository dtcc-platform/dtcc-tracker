import './globals.css';
import { ReactNode } from 'react';
import { RefreshProvider } from '@/app/contexts/RefreshContext';
import { AuthProvider } from './contexts/AuthContext';
import ChatButton from '@/components/ChatButton';
export const dynamic = 'force-dynamic';
import { PaperProvider } from './contexts/PaperContext';
import { palette } from './theme';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'DTCC Tracker',
  description: 'A Next.js 13+ app for paper submissions.',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RefreshProvider>
        <PaperProvider>
          <html lang='en'>
            <body
              style={{
                margin: 0,
                padding: 0,
                color: palette.textDark,
                backgroundColor: 'transparent',
              }}
            >
              <AppShell>{children}</AppShell>
              {/* <ChatButton /> */}
            </body>
          </html>
        </PaperProvider>
      </RefreshProvider>
    </AuthProvider>
  );
}
