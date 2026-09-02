import { useState, useEffect } from 'react';
import { uiTranslations, Language } from '../data/content';

export function Timer({ 
  actStartedAt, 
  durationMs, 
  isPaused,
  pausedAt,
  language,
  onComplete,
  isHostControlled,
  isNextActReady,
  handleNextAct,
  pullDistance = 0,
  pullProgress = 0
}: { 
  actStartedAt: number, 
  durationMs: number, 
  isPaused?: boolean;
  pausedAt?: number | null;
  language: Language,
  onComplete: () => void,
  isHostControlled?: boolean,
  isNextActReady?: boolean,
  handleNextAct?: () => void,
  pullDistance?: number,
  pullProgress?: number
}) {
  const [remaining, setRemaining] = useState(durationMs);
  const t = uiTranslations[language];

  useEffect(() => {
    const updateTimer = () => {
      if (isPaused && pausedAt) {
        const elapsed = pausedAt - actStartedAt;
        setRemaining(Math.max(0, durationMs - elapsed));
        return;
      }
      
      const now = Date.now();
      const elapsed = now - actStartedAt;
      const timeLeft = Math.max(0, durationMs - elapsed);
      setRemaining(timeLeft);
      
      if (timeLeft === 0 && !isPaused) {
        onComplete();
      }
    };

    updateTimer(); // Initial check
    const interval = setInterval(updateTimer, 500); // Check every half second
    return () => clearInterval(interval);
  }, [actStartedAt, durationMs, isPaused, pausedAt, onComplete]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (isHostControlled) {
    if (remaining === 0) return <div className="h-16" />;
    return (
      <div className="flex items-center justify-center">
        <span className="text-[10px] tracking-[0.2em] font-sans text-text-sub uppercase whitespace-nowrap transition-colors duration-1000">
          {t.nextMomentIn} {timeFormatted}
        </span>
      </div>
    );
  }

  if (isNextActReady) {
    // The parent container in App.tsx translates up by pullDistance * 0.5.
    // To keep the line anchored to the bottom visually, it needs to grow by exactly that amount.
    // We use scaleY from the top so it visually stretches downwards.
    const scaleFactor = 1 + (pullDistance * 0.9) / 64;

    return (
      <button 
        onClick={handleNextAct} 
        className="group flex flex-col items-center cursor-pointer select-none focus:outline-none"
      >
        <span className={`text-[10px] font-sans tracking-widest uppercase mb-4 transition-colors duration-300 ${
          pullProgress >= 1 ? 'text-text-main font-semibold' : 'text-text-sub group-hover:text-text-main'
        }`}>
          {t.nextMoment}
        </span>
        <div 
          className={`w-[1px] transition-colors ${
            pullProgress >= 1 
              ? 'bg-text-main shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
              : 'bg-border-focus group-hover:bg-text-main'
          }`} 
          style={{
            height: '64px',
            transform: `scaleY(${scaleFactor})`,
            transformOrigin: 'top',
            transition: pullDistance > 0 ? 'background-color 0.2s' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s'
          }}
        />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-end w-full select-none">
      <div className="flex items-center justify-center">
        <span className="text-[10px] font-sans tracking-[0.2em] text-text-sub uppercase whitespace-nowrap">
          {t.nextMomentIn} {timeFormatted}
        </span>
      </div>
      
      <div className="w-[1px] h-16 mt-4 bg-transparent opacity-0" />
    </div>
  );
}
