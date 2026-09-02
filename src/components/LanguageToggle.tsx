import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Globe, LogOut } from 'lucide-react';
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

export function LanguageToggle({ 
  current, 
  onChange,
  onDevModeToggle,
  onExitSession
}: { 
  current: Language, 
  onChange: (l: Language) => void,
  onDevModeToggle?: () => void,
  onExitSession?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExitButton, setShowExitButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Globe hold timer (3 seconds)
  const globeHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGlobeHoldCompletedRef = useRef(false);
  const [isGlobeHolding, setIsGlobeHolding] = useState(false);

  // Hold timer for the selected language option (for dev mode)
  const langHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLangHoldCompletedRef = useRef(false);
  const [langHoldProgress, setLangHoldProgress] = useState(false);

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

  useEffect(() => {
    return () => {
      if (globeHoldTimerRef.current) clearTimeout(globeHoldTimerRef.current);
      if (langHoldTimerRef.current) clearTimeout(langHoldTimerRef.current);
    };
  }, []);

  const clearGlobeHold = useCallback(() => {
    if (globeHoldTimerRef.current) {
      clearTimeout(globeHoldTimerRef.current);
      globeHoldTimerRef.current = null;
    }
    setIsGlobeHolding(false);
  }, []);

  const startGlobeHold = useCallback(() => {
    clearGlobeHold();
    isGlobeHoldCompletedRef.current = false;
    setIsGlobeHolding(true);

    globeHoldTimerRef.current = setTimeout(() => {
      isGlobeHoldCompletedRef.current = true;
      setIsGlobeHolding(false);
      setShowExitButton(true);
      setIsOpen(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 40, 60]);
        } catch (e) {}
      }
    }, 3000);
  }, [clearGlobeHold]);

  const clearLangHold = useCallback(() => {
    if (langHoldTimerRef.current) {
      clearTimeout(langHoldTimerRef.current);
      langHoldTimerRef.current = null;
    }
    setLangHoldProgress(false);
  }, []);

  const startLangHold = useCallback((isSelected: boolean) => {
    clearLangHold();
    isLangHoldCompletedRef.current = false;

    if (isSelected && onDevModeToggle) {
      setLangHoldProgress(true);
      langHoldTimerRef.current = setTimeout(() => {
        isLangHoldCompletedRef.current = true;
        setLangHoldProgress(false);
        onDevModeToggle();
        setIsOpen(false);
      }, 3000);
    }
  }, [clearLangHold, onDevModeToggle]);

  const exitLabels: Record<Language, string> = {
    RU: 'Выход',
    EN: 'Exit',
    ES: 'Salir',
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onPointerDown={(e) => {
          if (e.button === 0) {
            startGlobeHold();
          }
        }}
        onPointerUp={clearGlobeHold}
        onPointerLeave={clearGlobeHold}
        onPointerCancel={clearGlobeHold}
        onTouchStart={() => {
          startGlobeHold();
        }}
        onTouchEnd={clearGlobeHold}
        onTouchCancel={clearGlobeHold}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
        onClick={() => {
          if (isGlobeHoldCompletedRef.current) {
            isGlobeHoldCompletedRef.current = false;
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "relative flex items-center justify-center text-text-muted hover:text-text-main transition-colors h-6 w-6 select-none focus:outline-none cursor-pointer",
          isOpen ? "text-text-main" : ""
        )}
        aria-label="Change language or hold 3s to exit session"
        title="Language"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        <Globe size={15} strokeWidth={1.75} className="block relative z-10" />
        
        {/* Visual feedback while holding the globe */}
        {isGlobeHolding && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-red-500/80 pointer-events-none"
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-36 bg-bg-card border border-border-main shadow-xl rounded-xl py-1.5 z-50 backdrop-blur-md overflow-hidden"
          >
            {LANGUAGES.map((lang) => {
              const isSelected = current === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onPointerDown={() => startLangHold(isSelected)}
                  onPointerUp={clearLangHold}
                  onPointerLeave={clearLangHold}
                  onPointerCancel={clearLangHold}
                  onTouchStart={() => startLangHold(isSelected)}
                  onTouchEnd={clearLangHold}
                  onTouchCancel={clearLangHold}
                  onContextMenu={(e) => {
                    if (isSelected) {
                      e.preventDefault();
                    }
                  }}
                  onClick={() => {
                    if (isLangHoldCompletedRef.current) {
                      isLangHoldCompletedRef.current = false;
                      return;
                    }
                    onChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-right px-4 py-2 text-xs font-sans transition-all flex items-center justify-end select-none relative cursor-pointer",
                    isSelected 
                      ? "text-text-main font-bold tracking-wide bg-border-main/20 active:bg-border-main/40" 
                      : "text-text-muted hover:text-text-main hover:bg-border-main/10 active:bg-border-main/20 font-normal"
                  )}
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                  {langHoldProgress && isSelected && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 shrink-0"
                    />
                  )}
                  <span className="relative z-10">{lang.label}</span>
                </button>
              );
            })}

            {showExitButton && (
              <>
                <div className="my-1 border-t border-border-main/60 mx-2" />
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowExitButton(false);
                    if (onExitSession) {
                      onExitSession();
                    }
                  }}
                  className="w-full text-right px-4 py-2 text-xs font-sans text-red-400 hover:text-red-300 hover:bg-red-950/20 active:bg-red-950/40 transition-all flex items-center justify-between select-none cursor-pointer"
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                  <LogOut size={13} className="shrink-0 opacity-80" />
                  <span className="font-semibold tracking-wide">
                    {exitLabels[current] || 'Выход'}
                  </span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

