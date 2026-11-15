import { useState, useRef, useEffect } from "react";
import { Globe, Check, Search, X, ChevronDown } from "lucide-react";
import { WORLD_LANGUAGES, type LanguageMeta } from "../../services/i18n";
import { useLanguage } from "../../context/LanguageContext";

export const LanguageSelector: React.FC = () => {
  const { currentLang, currentMeta, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [isOpen]);

  // Filter languages by search query
  const filteredLanguages = WORLD_LANGUAGES.filter((item: LanguageMeta) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.englishName.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title={t("selectLanguage")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold backdrop-blur-md transition-all shadow-sm group"
      >
        <Globe size={15} className="text-sky-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">{currentMeta.flag}</span>
        <span className="font-medium uppercase tracking-wider text-[11px]">
          {currentMeta.code}
        </span>
        <ChevronDown size={13} className="text-slate-400 transition-transform duration-200" />
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#0d1524]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col py-2">
          {/* Header & Search */}
          <div className="p-3 border-b border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-sky-400" />
                <span>{t("selectLanguage")}</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchLanguages")}
                className="w-full bg-white/10 focus:bg-white/15 text-white placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-xl border border-white/10 text-xs outline-none"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5 px-1 py-1">
            {filteredLanguages.map((lang: LanguageMeta) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? "bg-sky-500/20 text-white font-semibold"
                      : "hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0">{lang.flag}</span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white truncate">{lang.name}</span>
                        {lang.rtl && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            RTL
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {lang.englishName} ({lang.code})
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check size={14} className="text-sky-400 shrink-0 ml-2" />}
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                {t("noMatchingLanguages")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
