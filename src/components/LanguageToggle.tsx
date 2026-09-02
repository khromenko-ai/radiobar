import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Globe } from 'lucide-react';
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
  onDevModeToggle
}: { 
  current: Language, 
  onChange: (l: Language) => void,
  onDevModeToggle?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hold timer for the selected language option (5 seconds)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldCompletedRef = useRef(false);
  const [holdProgress, setHoldProgress] = useState(false);

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

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(false);
  }, []);

  const startHold = useCallback((isSelected: boolean) => {
    clearHold();
    isHoldCompletedRef.current = false;

    if (isSelected && onDevModeToggle) {
      setHoldProgress(true);
      holdTimerRef.current = setTimeout(() => {
        isHoldCompletedRef.current = true;
        setHoldProgress(false);
        onDevModeToggle();
        setIsOpen(false);
      }, 3000);
    }
  }, [clearHold, onDevModeToggle]);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center text-text-muted hover:text-text-main transition-colors h-5 w-5 select-none focus:outline-none",
          isOpen ? "text-text-main" : ""
        )}
        aria-label="Change language"
        title="Language"
      >
        <Globe size={15} strokeWidth={1.75} className="block" />
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
                  onPointerDown={(e) => {
                    // Prevent default context menu on iOS/Android long press
                    startHold(isSelected);
                  }}
                  onPointerUp={clearHold}
                  onPointerLeave={clearHold}
                  onPointerCancel={clearHold}
                  onTouchStart={(e) => {
                    startHold(isSelected);
                  }}
                  onTouchEnd={clearHold}
                  onTouchCancel={clearHold}
                  onContextMenu={(e) => {
                    if (isSelected) {
                      e.preventDefault();
                    }
                  }}
                  onClick={(e) => {
                    if (isHoldCompletedRef.current) {
                      isHoldCompletedRef.current = false;
                      return;
                    }
                    onChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-right px-4 py-2 text-xs font-sans transition-all flex items-center justify-end select-none relative",
                    isSelected 
                      ? "text-text-main font-bold tracking-wide bg-border-main/20 active:bg-border-main/40" 
                      : "text-text-muted hover:text-text-main hover:bg-border-main/10 active:bg-border-main/20 font-normal"
                  )}
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                  {holdProgress && isSelected && (
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

