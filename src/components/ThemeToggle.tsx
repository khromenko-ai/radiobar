import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ onReset, onDemo }: { onReset: () => void, onDemo: () => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const isLight = e.matches;
      setTheme(isLight ? 'light' : 'dark');
      if (isLight) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    };

    // Set initial theme based on system preference
    handleChange(mediaQuery);

    // Listen for system theme changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleClick = () => {
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
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        if (newTheme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      }
      clickCount.current = 0;
    }, 400);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center text-text-muted hover:text-text-main transition-colors h-4"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={12} strokeWidth={2} /> : <Moon size={12} strokeWidth={2} />}
    </button>
  );
}
