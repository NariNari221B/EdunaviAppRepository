"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type FontSize = "normal" | "large" | "xlarge";

interface ThemeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>("normal");

  // LocalStorageから設定を復元する（ブラウザリロード対応）
  useEffect(() => {
    const saved = localStorage.getItem("edunavi_fontsize") as FontSize;
    if (saved) {
      setFontSize(saved);
    }
  }, []);

  const handleSetFontSize = (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem("edunavi_fontsize", size);
  };

  return (
    <ThemeContext.Provider value={{ fontSize, setFontSize: handleSetFontSize }}>
      <div className={`font-size-wrapper ${fontSize}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
