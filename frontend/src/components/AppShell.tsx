'use client';

import { CSSProperties, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from './header';
import { gradients } from '@/app/theme';

const HEADER_HEIGHT = 64;
const AUTH_ROUTES = new Set(['/login', '/forgot-password']);

const authMainStyle: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  margin: 0,
};

const appContainerStyle: CSSProperties = {
  display: 'flex',
  height: '100vh',
  width: '100%',
  backgroundColor: 'transparent',
};

const appMainStyle: CSSProperties = {
  flex: 1,
  height: '100%',
  overflowY: 'auto',
  background: gradients.subtle,
  padding: '3rem',
  paddingTop: `calc(${HEADER_HEIGHT}px + 2rem)`,
  paddingBottom: '4rem',
  boxSizing: 'border-box',
};

const contentWrapperStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname ?? '');

  if (isAuthRoute) {
    return <main style={authMainStyle}>{children}</main>;
  }

  return (
    <div style={appContainerStyle}>
      <Header />
      <main style={appMainStyle}>
        <div style={contentWrapperStyle}>{children}</div>
      </main>
    </div>
  );
}
