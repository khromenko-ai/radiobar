import React, { useState, useRef, useEffect } from 'react';
import { Globe, LogOut, Terminal } from 'lucide-react';
import { Language } from '../data/content';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LanguageOption {
  code: Language;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'ES', label: 'Español' },
  { code: 'EN', label: 'English' },
  { code: 'RU', label: 'Русский' },
];

const devModeLabels: Record<Language, string> = {
  RU: 'Dev режим',
  EN: 'Dev Mode',
  ES: 'Modo Dev',
};

const exitLabels: Record<Language, string> = {
  RU: 'Выход',
  EN: 'Exit',
  ES: 'Salir',
};

export function LanguageToggle({ 
  current, 
  onChange,
  onDevModeToggle,
  onExitSession,
  isDevMode
}: { 
  current: Language, 
  onChange: (l: Language) => void,
  onDevModeToggle?: () => void,
  onExitSession?: () => void,
  isDevMode?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "relative flex items-center justify-center text-text-muted hover:text-text-main transition-colors h-6 w-6 select-none focus:outline-none cursor-pointer",
          isOpen ? "text-text-main" : ""
        )}
        aria-label="Change language or access debug options"
        title="Menu"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        <Globe size={15} strokeWidth={1.75} className="block relative z-10" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-28 bg-bg-card border border-border-main shadow-xl rounded-xl py-1.5 z-50 backdrop-blur-md overflow-hidden"
          >
            {LANGUAGES.map((lang) => {
              const isSelected = current === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-right px-2.5 py-1.5 text-xs font-sans transition-all flex items-center justify-end gap-1.5 select-none relative cursor-pointer",
                    isSelected 
                      ? "text-text-main font-bold tracking-wide bg-border-main/20 active:bg-border-main/40" 
                      : "text-text-muted hover:text-text-main hover:bg-border-main/10 active:bg-border-main/20 font-normal"
                  )}
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                  <span className="flex-1 text-right relative z-10">{lang.label}</span>
                  <span className="w-3.5 shrink-0" />
                </button>
              );
            })}

            {/* Permanent Dev Mode and Exit buttons for debugging */}
            {(onDevModeToggle || onExitSession) && (
              <div className="my-1 border-t border-border-main/60 mx-1.5" />
            )}

            {onDevModeToggle && (
              <button
                type="button"
                onClick={() => {
                  onDevModeToggle();
                }}
                className={cn(
                  "w-full text-right px-2.5 py-1.5 text-xs font-sans transition-all flex items-center justify-end gap-1.5 select-none cursor-pointer whitespace-nowrap",
                  isDevMode 
                    ? "text-text-main font-bold hover:bg-border-main/10 active:bg-border-main/20" 
                    : "text-text-muted hover:text-text-main hover:bg-border-main/10 active:bg-border-main/20 font-normal"
                )}
                title={isDevMode ? "Dev mode active (10s timers)" : "Dev mode inactive (10m timers)"}
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              >
                <span className={cn("flex-1 text-right tracking-wide text-[11px]", isDevMode ? "font-bold" : "font-normal")}>
                  {devModeLabels[current] || 'Dev режим'}
                </span>
                <span className="w-3.5 flex items-center justify-center shrink-0">
                  <Terminal size={11} className={cn("shrink-0", isDevMode ? "opacity-100" : "opacity-60")} />
                </span>
              </button>
            )}

            {onExitSession && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onExitSession();
                }}
                className="w-full text-right px-2.5 py-1.5 text-xs font-sans text-red-400 hover:text-red-300 hover:bg-red-950/20 active:bg-red-950/40 transition-all flex items-center justify-end gap-1.5 select-none cursor-pointer whitespace-nowrap"
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              >
                <span className="flex-1 text-right font-semibold tracking-wide text-[11px]">
                  {exitLabels[current] || 'Выход'}
                </span>
                <span className="w-3.5 flex items-center justify-center shrink-0">
                  <LogOut size={11} className="shrink-0 opacity-80" />
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

