import React, { useState } from 'react';
import { motion } from 'motion/react';
import { uiTranslations, Language } from '../data/content';
import { CardsIcon } from './CardsIcon';

export function GuestInfoCard({ language, onBack }: { language: Language, onBack: () => void }) {
  const t = uiTranslations[language];
  const [taps, setTaps] = useState<number[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'down' | 'up' | null>(null);

  const handleOrnamentTap = () => {
    const now = Date.now();
    setTaps(prev => {
      const recentTaps = [...prev, now].filter(time => now - time < 2000);
      if (recentTaps.length >= 3) {
        setShowAuth(true);
        return [];
      }
      return recentTaps;
    });
  };

  const handlePinSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (pin === 'radiohost') {
        localStorage.setItem('immersive_host_auth', 'true');
        window.location.href = '/host';
      } else {
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    const velocity = info.velocity;

    const isSwipeUp = info.offset.y < -threshold || velocity.y < -500;
    const isSwipeDown = info.offset.y > threshold || velocity.y > 500;
    const isSwipeLeft = info.offset.x < -threshold || velocity.x < -500;
    const isSwipeRight = info.offset.x > threshold || velocity.x > 500;

    if (isSwipeUp) setExitDirection('up');
    else if (isSwipeDown) setExitDirection('down');
    else if (isSwipeLeft) setExitDirection('left');
    else if (isSwipeRight) setExitDirection('right');

    if (isSwipeUp || isSwipeDown || isSwipeLeft || isSwipeRight) {
      setTimeout(onBack, 50);
    }
  };

  return (
    <motion.div 
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.8, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.9, 
        x: exitDirection === 'left' ? -400 : exitDirection === 'right' ? 400 : 0,
        y: exitDirection === 'up' ? -400 : exitDirection === 'down' ? 400 : 300, 
        transition: { duration: 0.3 } 
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-full h-full max-h-[550px] max-w-[340px] bg-bg-card border border-border-main flex flex-col items-center text-center rounded-2xl shadow-2xl origin-bottom overflow-hidden"
    >
      <div className="w-full h-full flex flex-col items-center text-center overflow-y-auto hide-scrollbar px-8 py-8">
        <h2 className="text-2xl font-serif text-text-main mb-6 tracking-widest flex-shrink-0">{t.infoTitle}</h2>
        <p className="text-sm font-sans text-text-sec leading-relaxed mb-4 px-2 flex-shrink-0">{t.infoDesc1}</p>
        <p className="text-sm font-sans text-text-muted leading-relaxed mb-8 whitespace-pre-wrap px-2 flex-shrink-0">{t.infoDesc2}</p>
        
        <div className="w-8 h-[1px] bg-bg-border mb-8 flex-shrink-0" />
        
        <h3 className="text-[10px] font-sans tracking-[0.2em] text-text-muted uppercase mb-4 flex-shrink-0">{t.howItWorks}</h3>
        <p className="text-xs font-sans text-text-muted leading-relaxed mb-2 px-2 flex-shrink-0">{t.howItWorks1}</p>
        <p className="text-xs font-sans text-text-muted leading-relaxed mb-2 px-2 flex-shrink-0">{t.howItWorks2}</p>
        <p className="text-xs font-sans text-text-muted leading-relaxed mb-6 whitespace-pre-wrap px-2 flex-shrink-0">{t.howItWorks3}</p>

        <div className="mt-2 mb-2 flex-shrink-0">
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => { setExitDirection('down'); setTimeout(onBack, 50); }} className="opacity-50 hover:opacity-100 transition-opacity p-3 flex items-center justify-center">
            <CardsIcon size={24} className="text-text-main" />
          </button>
        </div>

        <div className="relative w-full flex flex-col items-center flex-shrink-0 min-h-[50px] pb-2" onPointerDown={(e) => e.stopPropagation()}>
          <div onClick={handleOrnamentTap} className="cursor-pointer py-3 px-8 select-none flex items-center justify-center gap-4 w-full">
            <div className="w-8 h-[1px] bg-bg-border flex-shrink-0" />
            <div className="w-2 h-2 rotate-45 border border-border-focus hover:border-border-light transition-colors flex-shrink-0" />
            <div className="w-8 h-[1px] bg-bg-border flex-shrink-0" />
          </div>
          
          {showAuth && (
            <motion.input
              autoFocus
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={handlePinSubmit}
              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="absolute -top-8 bg-bg-card border-b border-border-focus text-center text-text-main text-sm focus:outline-none focus:border-text-main w-24 tracking-widest pb-1 z-50"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
