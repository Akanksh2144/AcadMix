import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Permanently enforce Light Theme across the platform
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('acadmix_theme', 'light');
  }, []);

  // Provide inert values so the 30+ dashboard imports don't break
  return (
    <ThemeContext.Provider value={{ isDark: false, toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
