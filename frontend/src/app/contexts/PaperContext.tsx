'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Paper } from '../types/FixedTypes';

interface PaperContextType {
    papers: Paper[];
    setPapers: (papers: Paper[]) => void;
    addPaper: (paper: Paper) => void;
    updatePaper: (index: number, paper: Paper) => void;
    removePaper: (index: number) => void;
    clearPapers: () => void;
    doiErrors: string[];
    setDoiErrors: (errors: string[]) => void;
    clearEverything: () => void
}

const PaperContext = createContext<PaperContextType | undefined>(undefined);

export const PaperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [doiErrors, setDoiErrors] = useState<string[]>([]);

    const addPaper = (paper: Paper) => {
        setPapers(prev => [...prev, paper]);
    };

    const updatePaper = (index: number, paper: Paper) => {
        setPapers(prev => prev.map((p, i) => i === index ? paper : p));
    };

    const removePaper = (index: number) => {
        setPapers(prev => prev.filter((_, i) => i !== index));
    };

    const clearPapers = () => {
        setPapers([]);
    };
    const clearEverything = () => {
        clearPapers();
        setDoiErrors([]);
    }

    return (
        <PaperContext.Provider value={{
            papers,
            setPapers,
            addPaper,
            updatePaper,
            removePaper,
            doiErrors,
            setDoiErrors,
            clearPapers,
            clearEverything
        }}>
            {children}
        </PaperContext.Provider>
    );
};

export const usePaperContext = () => {
    const context = useContext(PaperContext);
    if (context === undefined) {
        throw new Error('usePaperContext must be used within a PaperProvider');
    }
    return context;
};