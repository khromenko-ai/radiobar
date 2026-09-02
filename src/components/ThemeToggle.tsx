import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ onReset, onDemo }: { onReset: () => void, onDemo: () => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressed = useRef(false);

  // Apply theme to DOM and state
  const applyTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    // Check if user had a previous manual choice
    const savedManualTheme = localStorage.getItem('user_theme_override') as 'dark' | 'light' | null;

    if (savedManualTheme === 'light' || savedManualTheme === 'dark') {
      applyTheme(savedManualTheme);
    } else {
      applyTheme(mediaQuery.matches ? 'light' : 'dark');
    }

    const handleSystemChange = (e: MediaQueryListEvent) => {
      // System/browser theme changed: clear manual override and follow system
      localStorage.removeItem('user_theme_override');
      applyTheme(e.matches ? 'light' : 'dark');
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const startHold = useCallback(() => {
    clearHold();
    isLongPressed.current = false;

    // Start 10-second hold timer to trigger Dev Mode
    holdTimer.current = setTimeout(() => {
      isLongPressed.current = true;
      onDemo();
    }, 10000);
  }, [clearHold, onDemo]);

  const handleClick = (e: React.MouseEvent) => {
    // If it was a 10s long press, ignore the click event
    if (isLongPressed.current) {
      isLongPressed.current = false;
      return;
    }

    clickCount.current += 1;
    
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    
    clickTimer.current = setTimeout(() => {
      if (clickCount.current >= 5) {
        onDemo();
      } else if (clickCount.current >= 3) {
        onReset();
      } else {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        // Save manual user choice until next manual change or system preference change
        localStorage.setItem('user_theme_override', nextTheme);
      }
      clickCount.current = 0;
    }, 400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={startHold}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onPointerLeave={clearHold}
      onTouchStart={startHold}
      onTouchEnd={clearHold}
      onTouchCancel={clearHold}
      onContextMenu={(e) => e.preventDefault()}
      className="flex items-center justify-center text-text-muted hover:text-text-main transition-colors h-5 w-5 select-none"
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      aria-label="Toggle theme"
      title="Toggle theme (Hold 10s for dev mode)"
    >
      {theme === 'dark' ? (
        <Sun size={15} strokeWidth={1.75} className="block pointer-events-none" />
      ) : (
        <Moon size={15} strokeWidth={1.75} className="block pointer-events-none" />
      )}
    </button>
  );
}


