import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, detectLanguage, setLanguage, getTranslation, languages } from './index';

interface TranslationContextType {
  t: any;
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  availableLanguages: typeof languages;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(detectLanguage());

  useEffect(() => {
    setLanguage(currentLanguage);
  }, [currentLanguage]);

  const setCurrentLanguage = (lang: Language) => {
    setCurrentLanguageState(lang);
    setLanguage(lang);
  };

  const value: TranslationContextType = {
    t: getTranslation(currentLanguage),
    currentLanguage,
    setCurrentLanguage,
    availableLanguages: languages
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

