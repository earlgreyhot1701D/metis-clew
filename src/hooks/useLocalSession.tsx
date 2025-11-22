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

// Skill progression thresholds
const SKILL_THRESHOLDS = {
  beginner: { min: 0, max: 9 },
  intermediate: { min: 10, max: 49 },
  advanced: { min: 50, max: Infinity },
};

const calculateSkillLevel = (explanations: number): string => {
  if (explanations >= SKILL_THRESHOLDS.advanced.min) return 'advanced';
  if (explanations >= SKILL_THRESHOLDS.intermediate.min) return 'intermediate';
  return 'beginner';
};

const getProgressToNextLevel = (explanations: number, currentLevel: string): number | null => {
  if (currentLevel === 'advanced') return null; // Max level
  
  const nextLevel = currentLevel === 'beginner' ? 'intermediate' : 'advanced';
  const nextThreshold = SKILL_THRESHOLDS[nextLevel as keyof typeof SKILL_THRESHOLDS].min;
  const currentThreshold = SKILL_THRESHOLDS[currentLevel as keyof typeof SKILL_THRESHOLDS].min;
  const range = nextThreshold - currentThreshold;
  const progress = explanations - currentThreshold;
  
  return Math.min(100, Math.round((progress / range) * 100));
};

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

  const trackExplanation = (): { leveledUp: boolean; newLevel: string } => {
    let levelUpInfo = { leveledUp: false, newLevel: sessionData.skillLevel };
    
    setSessionData((prev) => {
      const newExplanations = prev.totalExplanations + 1;
      const newPatterns = prev.totalPatterns + 1;
      const newSkillLevel = calculateSkillLevel(newExplanations);
      
      levelUpInfo = {
        leveledUp: prev.skillLevel !== newSkillLevel,
        newLevel: newSkillLevel,
      };
      
      return {
        ...prev,
        totalExplanations: newExplanations,
        totalPatterns: newPatterns,
        skillLevel: newSkillLevel,
      };
    });
    
    return levelUpInfo;
  };
  
  const getProgress = () => {
    return getProgressToNextLevel(sessionData.totalExplanations, sessionData.skillLevel);
  };
  
  const getNextLevelInfo = () => {
    const currentLevel = sessionData.skillLevel;
    if (currentLevel === 'advanced') return null;
    
    const nextLevel = currentLevel === 'beginner' ? 'intermediate' : 'advanced';
    const nextThreshold = SKILL_THRESHOLDS[nextLevel as keyof typeof SKILL_THRESHOLDS].min;
    const remaining = nextThreshold - sessionData.totalExplanations;
    
    return {
      nextLevel,
      threshold: nextThreshold,
      remaining: Math.max(0, remaining),
    };
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
    getProgress,
    getNextLevelInfo,
  };
};
