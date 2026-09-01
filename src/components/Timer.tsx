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
    return (
      <button 
        onClick={handleNextAct} 
        className="group flex flex-col items-center cursor-pointer select-none focus:outline-none transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(-${pullDistance * 0.35}px)`
        }}
      >
        <span className={`text-[10px] font-sans tracking-widest uppercase mb-4 transition-colors duration-300 ${
          pullProgress >= 1 ? 'text-text-main font-medium' : 'text-text-sub group-hover:text-text-main'
        }`}>
          {t.nextMoment}
        </span>
        <div 
          className={`w-[1px] transition-all duration-300 ${
            pullProgress >= 1 ? 'bg-bg-inv h-20' : 'bg-bg-hover group-hover:bg-bg-inv h-16'
          }`} 
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
