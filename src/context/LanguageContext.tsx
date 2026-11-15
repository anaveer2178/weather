import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  WORLD_LANGUAGES,
  translate,
  type TranslationKey,
  type LanguageMeta,
} from "../services/i18n";

interface LanguageContextType {
  currentLang: string;
  currentMeta: LanguageMeta;
  setLanguage: (code: string) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const STORAGE_KEY_LANG = "weather_lang_pref_v1";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [currentLang, setCurrentLang] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved && WORLD_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
      // Check browser language
      if (typeof navigator !== "undefined" && navigator.language) {
        const browserCode = navigator.language.split("-")[0];
        const match = WORLD_LANGUAGES.find((l) => l.code === browserCode);
        if (match) return match.code;
      }
    } catch {}
    return "en";
  });

  const currentMeta =
    WORLD_LANGUAGES.find((l) => l.code === currentLang) || WORLD_LANGUAGES[0];
  const isRtl = !!currentMeta.rtl;

  const setLanguage = (code: string) => {
    if (WORLD_LANGUAGES.some((l) => l.code === code)) {
      setCurrentLang(code);
      try {
        localStorage.setItem(STORAGE_KEY_LANG, code);
      } catch {}
    }
  };

  const t = (key: TranslationKey): string => {
    return translate(key, currentLang);
  };

  // Sync RTL and lang attribute on document
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = currentLang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    }
  }, [currentLang, isRtl]);

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        currentMeta,
        setLanguage,
        t,
        isRtl,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
};
