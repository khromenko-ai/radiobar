import React, { useState, useEffect } from 'react';
import { uiTranslations, Language } from '../data/content';
import { ElasticPullTrigger } from './ElasticPullTrigger';

export function useActTimer({
  actStartedAt,
  durationMs,
  isPaused,
  pausedAt,
  onComplete,
}: {
  actStartedAt?: number | null;
  durationMs: number;
  isPaused?: boolean;
  pausedAt?: number | null;
  onComplete?: () => void;
}) {
  const calculateRemaining = () => {
    if (actStartedAt === 0) return 0;
    if (!actStartedAt) return durationMs;
    if (isPaused && pausedAt) {
      const elapsed = pausedAt - actStartedAt;
      return Math.max(0, durationMs - elapsed);
    }
    const elapsed = Date.now() - actStartedAt;
    return Math.max(0, durationMs - elapsed);
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);

  useEffect(() => {
    const updateTimer = () => {
      const timeLeft = calculateRemaining();
      setRemaining(timeLeft);
      if (timeLeft <= 0 && onComplete) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [actStartedAt, durationMs, isPaused, pausedAt, onComplete]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isExpired = remaining <= 0;

  return { remaining, minutes, seconds, timeFormatted, isExpired };
}

export function Timer({ 
  actStartedAt, 
  durationMs, 
  isPaused,
  pausedAt,
  language,
  onComplete,
  isNextActReady,
  handleNextAct,
  containerRef,
  isHostControlled,
  isPastAct
}: { 
  actStartedAt: number, 
  durationMs: number, 
  isPaused?: boolean;
  pausedAt?: number | null;
  language: Language,
  onComplete: () => void,
  isHostControlled?: boolean,
  isPastAct?: boolean,
  isNextActReady?: boolean,
  handleNextAct?: () => void,
  containerRef?: React.RefObject<HTMLDivElement | null>
}) {
  const { remaining, timeFormatted, isExpired } = useActTimer({
    actStartedAt,
    durationMs,
    isPaused,
    pausedAt,
    onComplete
  });

  const validLang: Language = (language === 'EN' || language === 'ES' || language === 'RU') ? language : 'RU';
  const t = uiTranslations[validLang] || uiTranslations.RU;

  if (isNextActReady || isExpired) {
    if (isHostControlled && !isPastAct) {
      return (
        <div className="flex flex-col items-center w-full select-none">
          <div className="flex items-center justify-center">
            <span className="text-[10px] font-sans tracking-[0.2em] text-text-sub uppercase whitespace-nowrap">
              {t.hostWaiting || "WAITING"}
            </span>
          </div>
        </div>
      );
    }

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
