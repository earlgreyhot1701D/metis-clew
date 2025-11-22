import { useState, useEffect } from 'react';

interface LocalSessionData {
  sessionCount: number;
  totalPatterns: number;
  totalExplanations: number;
  skillLevel: string;
  dominantPattern: string;
  recentSnippets: Array<{
    id: string;
    title: string;
    language: string;
    code: string;
    timestamp: number;
  }>;
  lastSessionDate: string;
}

const STORAGE_KEY = 'metis_clew_session';

const getDefaultData = (): LocalSessionData => ({
  sessionCount: 0,
  totalPatterns: 0,
  totalExplanations: 0,
  skillLevel: 'beginner',
  dominantPattern: 'visual',
  recentSnippets: [],
  lastSessionDate: '',
});

const loadFromStorage = (): LocalSessionData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load session data:', error);
  }
  return getDefaultData();
};

const saveToStorage = (data: LocalSessionData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save session data:', error);
  }
};

export const useLocalSession = () => {
  const [sessionData, setSessionData] = useState<LocalSessionData>(loadFromStorage);

  useEffect(() => {
    saveToStorage(sessionData);
  }, [sessionData]);

  const trackCodeSubmit = (code: string, language: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    setSessionData((prev) => {
      const isNewSession = prev.lastSessionDate !== today;
      const snippetId = `snippet_${Date.now()}`;
      const title = `${language} code`;
      
      const newSnippet = {
        id: snippetId,
        title,
        language,
        code: code.substring(0, 100),
        timestamp: Date.now(),
      };

      return {
        ...prev,
        sessionCount: isNewSession ? prev.sessionCount + 1 : prev.sessionCount,
        recentSnippets: [newSnippet, ...prev.recentSnippets.slice(0, 4)],
        lastSessionDate: today,
      };
    });
  };

  const trackExplanation = () => {
    setSessionData((prev) => ({
      ...prev,
      totalExplanations: prev.totalExplanations + 1,
      totalPatterns: prev.totalPatterns + 1,
    }));
  };

  const updateSkillLevel = (level: string) => {
    setSessionData((prev) => ({
      ...prev,
      skillLevel: level,
    }));
  };

  return {
    sessionData,
    trackCodeSubmit,
    trackExplanation,
    updateSkillLevel,
  };
};
