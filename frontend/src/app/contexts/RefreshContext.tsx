'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProjects, fetchPaper, fetchSuperUserPaper } from '@/app/utils/api';
import { Paper,Project } from '@/app/types/FixedTypes';
import { useAuth } from '@/app/contexts/AuthContext';

type RefreshContextType = {
  refreshKey: number;
  triggerRefresh: () => void;
  triggerPapersRefresh: () => void;
  triggerProjectsRefresh: () => void;
  triggerSuperUserPapersRefresh: () => void;
  papers: Paper[];
  projects: Project[]
  superUserPapers: Paper[]
  isLoading: boolean;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [papersKey, setPapersKey] = useState(0);
  const [projectsKey, setProjectsKey] = useState(0);
  const [superUserPapersKey, setSuperUserPapersKey] = useState(0);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [superUserPapers, setSuperUserPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isSuperUser } = useAuth();

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);
  const triggerPapersRefresh = () => setPapersKey((prev) => prev + 1);
  const triggerProjectsRefresh = () => setProjectsKey((prev) => prev + 1);
  const triggerSuperUserPapersRefresh = () => setSuperUserPapersKey((prev) => prev + 1);

  // Fetch papers when papers key changes
  useEffect(() => {
    const fetchPapersData = async () => {
      try {
        const data = await fetchPaper();
        setPapers(data);
      } catch (error) {
        // Error handled silently
      }
    };
    fetchPapersData();
  }, [papersKey, refreshKey]);

  // Fetch projects when projects key changes
  useEffect(() => {
    const fetchProjectsData = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (error) {
        // Error handled silently
      }
    };
    fetchProjectsData();
  }, [projectsKey, refreshKey]);

  // Fetch superuser papers only if user is superuser
  useEffect(() => {
    if (isSuperUser) {
      const fetchSuperUserData = async () => {
        try {
          const data = await fetchSuperUserPaper();
          setSuperUserPapers(data);
        } catch (error) {
          // Error handled silently
        }
      };
      fetchSuperUserData();
    }
  }, [superUserPapersKey, refreshKey, isSuperUser]);

  // Track loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [refreshKey, papersKey, projectsKey, superUserPapersKey]);

  return (
    <RefreshContext.Provider value={{
      refreshKey,
      triggerRefresh,
      triggerPapersRefresh,
      triggerProjectsRefresh,
      triggerSuperUserPapersRefresh,
      papers,
      projects,
      superUserPapers,
      isLoading
    }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = (): RefreshContextType => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};
