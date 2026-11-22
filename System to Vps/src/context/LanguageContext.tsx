import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, getNestedTranslation } from '../locales';

interface LanguageContextType {
  language: Language;
  direction: 'rtl' | 'ltr';
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('bct_language') as Language;
    return saved === 'en' ? 'en' : 'ar'; // Default Arabic
  });

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', direction);
    localStorage.setItem('bct_language', language);
    document.title = language === 'ar'
      ? 'بي سي تي للاستشارات التعليمية والتدريب'
      : 'BCT Educational Consulting & Training';
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
  };

  const t = (key: string, paramsOrFallback?: Record<string, string | number> | string): string => {
    const currentDict = translations[language];
    return getNestedTranslation(currentDict, key, paramsOrFallback, language);
  };

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, direction, isRtl, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
