'use client'

import React from 'react';
import Image from 'next/image';
import Sidebar from './sidebar';
import newLogo from '../../public/dtcc-logo-new.png';
import chalmers_logo from '../../public/chalmers-logo-inverted.png';
import { useRefresh } from '../app/contexts/RefreshContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { gradients, palette } from '@/app/theme';

const Header: React.FC = () => {
  const HEADER_HEIGHT = 64;
  const SIDEBAR_WIDTH = 280;
  const { papers, projects } = useRefresh();
  const { logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <Sidebar papers={papers} projects={projects} />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: `${SIDEBAR_WIDTH}px`,
          right: 0,
          zIndex: 60,
          height: `${HEADER_HEIGHT}px`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          backgroundImage: `${gradients.headerSpark}, ${gradients.header}`,
          color: palette.textLight,
          boxShadow: '0 18px 35px rgba(5, 12, 31, 0.35)',
          borderBottom: `1px solid ${palette.borderSoft}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Image
            src={newLogo}
            alt='DTCC Logo'
            style={{ width: '46px', height: '46px', objectFit: 'contain' }}
          />
          <div
            style={{
              height: '36px',
              width: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.28)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: '0.05em',
              fontSize: '15px',
              textTransform: 'uppercase',
            }}
          >
            <span>Digital Twin</span>
            <span>Cities Centre</span>
          </div>
        </div>
        <div
          style={{
            marginLeft: '32px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            letterSpacing: '0.02em',
          }}
        >
          A smarter city starts with a digital twin.
        </div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <Image
            src={chalmers_logo}
            alt='Chalmers Logo'
            style={{ width: '110px', height: 'auto', objectFit: 'contain' }}
          />
          <button
            onClick={logout}
            style={{
              padding: '0.55rem 1.4rem',
              borderRadius: '999px',
              border: 'none',
              backgroundImage: gradients.button,
              color: palette.textDark,
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              boxShadow: '0 16px 30px rgba(242, 176, 67, 0.35)',
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
