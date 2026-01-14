import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const FONTS = {
  inter: { name: 'Inter', value: 'inter', bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  system: { name: 'System', value: 'system', bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif" },
  georgia: { name: 'Georgia', value: 'georgia', bodyFont: "'Georgia', 'Times New Roman', serif" },
  palatino: { name: 'Palatino', value: 'palatino', bodyFont: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  lora: { name: 'Lora', value: 'lora', bodyFont: "'Lora', Georgia, serif" },
};

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [font, setFont] = useState(() => {
    return localStorage.getItem('font') || 'inter';
  });

  const [showWhyMadeThis, setShowWhyMadeThis] = useState(() => {
    const saved = localStorage.getItem('showWhyMadeThis');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply font to document
    document.documentElement.setAttribute('data-font', font);
    localStorage.setItem('font', font);
  }, [font]);

  useEffect(() => {
    localStorage.setItem('showWhyMadeThis', showWhyMadeThis);
  }, [showWhyMadeThis]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeFont = (newFont) => {
    if (FONTS[newFont]) {
      setFont(newFont);
    }
  };

  const toggleShowWhyMadeThis = () => {
    setShowWhyMadeThis(prev => !prev);
  };

  const value = {
    theme,
    font,
    showWhyMadeThis,
    toggleTheme,
    changeFont,
    toggleShowWhyMadeThis,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
