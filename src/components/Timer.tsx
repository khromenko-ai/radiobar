import React, { useState, useEffect } from 'react';
import { uiTranslations, Language } from '../data/content';
import { ElasticPullTrigger } from './ElasticPullTrigger';

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
  containerRef
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
  containerRef?: React.RefObject<HTMLDivElement | null>
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
      <div className="flex flex-col items-center w-full select-none">
        <ElasticPullTrigger 
          label={t.nextMoment}
          onTrigger={handleNextAct || (() => {})}
          containerRef={containerRef}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full select-none">
      <div className="flex items-center justify-center">
        <span className="text-[10px] font-sans tracking-[0.2em] text-text-sub uppercase whitespace-nowrap">
          {t.nextMomentIn} {timeFormatted}
        </span>
      </div>
    </div>
  );
}
