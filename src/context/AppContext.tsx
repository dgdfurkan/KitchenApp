import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ingredient, WeeklyPlan, Settings } from '../types';

interface AppContextType {
  inventory: Ingredient[];
  setInventory: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  weeklyPlan: WeeklyPlan;
  setWeeklyPlan: React.Dispatch<React.SetStateAction<WeeklyPlan>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  resetDailyUsage: () => void;
  incrementUsage: () => void;
  clearAllData: () => void;
}

const defaultSettings: Settings = {
  usageCount: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
};

const defaultPlan: WeeklyPlan = { days: [] };

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [inventory, setInventory] = useState<Ingredient[]>(() => {
    const stored = localStorage.getItem('inventory');
    return stored ? JSON.parse(stored) : [];
  });

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(() => {
    const stored = localStorage.getItem('weeklyPlan');
    return stored ? JSON.parse(stored) : defaultPlan;
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem('settings');
    const today = new Date().toISOString().split('T')[0];
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.lastResetDate !== today) {
        return { ...parsed, usageCount: 0, lastResetDate: today };
      }
      return parsed;
    }
    return defaultSettings;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const resetDailyUsage = () => {
    setSettings(prev => ({ ...prev, usageCount: 0, lastResetDate: new Date().toISOString().split('T')[0] }));
  };

  const incrementUsage = () => {
    setSettings(prev => ({ ...prev, usageCount: prev.usageCount + 1 }));
  };

  const clearAllData = () => {
    setInventory([]);
    setWeeklyPlan(defaultPlan);
    setSettings(defaultSettings);
    localStorage.clear();
  };

  return (
    <AppContext.Provider value={{
      inventory,
      setInventory,
      weeklyPlan,
      setWeeklyPlan,
      settings,
      setSettings,
      resetDailyUsage,
      incrementUsage,
      clearAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
