'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProjects, fetchPaper } from '@/app/utils/api';
import { Paper,Project } from '@/app/types/FixedTypes';

type RefreshContextType = {
  refreshKey: number;
  triggerRefresh: () => void;
  papers: Paper[]; // Include the papers in the context
  projects: Project[]
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const papersData = await fetchPaper();
        setPapers(papersData);
        const projectData = await fetchProjects();
        setProjects(projectData)
      } catch (error) {
        console.error('Error fetching papers:', error);
      }
    };
    fetchData();
  }, [refreshKey]);

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh, papers, projects }}>
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
