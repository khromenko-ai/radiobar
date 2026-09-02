import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uiTranslations, scenariosData, Language, getScenarioImage } from '../data/content';

export function ScenarioDeck({ 
  language, 
  onSelect,
  activeSessionScenarioId
}: { 
  language: Language, 
  onSelect: (id: string) => void,
  activeSessionScenarioId?: string | null
}) {
  const validLang: Language = (language === 'EN' || language === 'ES' || language === 'RU') ? language : 'RU';
  const scenarios = scenariosData[validLang] || scenariosData.RU;
  const t = uiTranslations[validLang] || uiTranslations.RU;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downSwipeCount, setDownSwipeCount] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'down' | 'up' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const wheelAccumulatorRef = useRef(0);
  const wheelCooldownRef = useRef(false);

  const handleDragEnd = (event: any, info: any, scenarioId: string) => {
    setTimeout(() => setIsDragging(false), 50);
    const threshold = 80; // slightly lower threshold for easier swiping

    const velocity = info.velocity;

    const isSwipeUp = info.offset.y < -threshold || velocity.y < -500;
    const isSwipeDown = info.offset.y > threshold || velocity.y > 500;
    const isSwipeLeft = info.offset.x < -threshold || velocity.x < -500;
    const isSwipeRight = info.offset.x > threshold || velocity.x > 500;

    if (isSwipeUp) {
      setExitDirection('up');
      setDownSwipeCount(0);
      setCurrentIndex(prev => prev + 1);
    } else if (isSwipeDown) {
      setExitDirection('down');
      const newCount = downSwipeCount + 1;
      if (newCount >= 3) {
        setTimeout(() => onSelect('INFO_CARD'), 50);
        setDownSwipeCount(0); // reset
      } else {
        setDownSwipeCount(newCount);
      }
      setCurrentIndex(prev => prev + 1);
    } else if (isSwipeLeft) {
      setExitDirection('left');
      setDownSwipeCount(0);
      setCurrentIndex(prev => prev + 1);
    } else if (isSwipeRight) {
      setExitDirection('right');
      setDownSwipeCount(0);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCardTap = (scenarioId: string) => {
    setExitDirection('up');
    onSelect(scenarioId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 6) {
      e.stopPropagation();
      if (wheelCooldownRef.current) return;

      wheelAccumulatorRef.current += e.deltaX;
      if (wheelAccumulatorRef.current > 35) {
        setExitDirection('left');
        setDownSwipeCount(0);
        setCurrentIndex(prev => prev + 1);
        wheelCooldownRef.current = true;
        wheelAccumulatorRef.current = 0;
        setTimeout(() => { wheelCooldownRef.current = false; }, 380);
      } else if (wheelAccumulatorRef.current < -35) {
        setExitDirection('right');
        setDownSwipeCount(0);
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : scenarios.length - 1));
        wheelCooldownRef.current = true;
        wheelAccumulatorRef.current = 0;
        setTimeout(() => { wheelCooldownRef.current = false; }, 380);
      }
    }
  };

  // Stack 3 cards
  const stackItems = [0, 1, 2].map(offset => {
    const absoluteIndex = currentIndex + offset;
    const scenario = scenarios[absoluteIndex % scenarios.length];
    return { ...scenario, absoluteIndex, offset };
  });

  return (
    <div 
      onWheel={handleWheel}
      className="relative w-full flex-1 min-h-[300px] max-h-[500px] my-auto flex items-center justify-center perspective-[1000px] overflow-visible hide-scrollbar"
    >
      <AnimatePresence custom={exitDirection}>
        {stackItems.map((item, i) => {
          const isTop = i === 0;

          return (
            <motion.div
              key={item.absoluteIndex}
              custom={exitDirection}
              layout
              drag={isTop}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.8}
              onDragStart={() => isTop && setIsDragging(true)}
              onDragEnd={(e, info) => isTop && handleDragEnd(e, info, item.id)}
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault();
                  return;
                }
                if (isTop) handleCardTap(item.id);
              }}
              initial={{ 
                opacity: 0, 
                scale: 0.8, 
                y: 80 
              }}
              animate={{ 
                opacity: 1, 
                scale: 1 - i * 0.05, 
                y: i * 16,
                zIndex: 10 - i
              }}
              exit={{ 
                opacity: 0, 
                scale: isTop ? 1 : 0.8, 
                x: isTop && exitDirection === 'left' ? -400 : isTop && exitDirection === 'right' ? 400 : 0,
                y: isTop && exitDirection === 'up' ? -400 : isTop && exitDirection === 'down' ? 400 : 100, 
                transition: { duration: 0.3 }
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute w-full h-[88%] max-h-[440px] max-w-[330px] bg-bg-card border border-border-main flex flex-col items-center justify-center text-center rounded-2xl ${
                isTop 
                  ? 'shadow-[0_8px_24px_-6px_rgba(0,0,0,0.007)] dark:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.45)]' 
                  : 'shadow-[0_4px_12px_-4px_rgba(0,0,0,0.004)] dark:shadow-none'
              } origin-bottom overflow-hidden select-none`}
              style={{
                cursor: isTop ? 'grab' : 'auto'
              }}
              whileTap={{ cursor: isTop ? 'grabbing' : 'auto' }}
            >
              {/* Top Half Photorealistic Hero Image with Bottom Fade (just like Act pages) */}
              <div className="relative w-full h-[50%] overflow-hidden shrink-0 pointer-events-none">
                <img 
                  src={getScenarioImage(item.id)} 
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center scale-100"
                  loading="eager"
                />
                {/* Subtle top shade for pristine contrast in light/dark */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-bg-card/70 via-bg-card/20 to-transparent" />
                
                {/* Smooth Fade Gradient from photo into card body */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg-card via-bg-card/85 to-transparent flex flex-col justify-end items-center px-4 pb-2">
                  <h2 className="text-2xl sm:text-[26px] font-serif text-text-main tracking-wide leading-tight text-center">
                    {item.title}
                  </h2>
                </div>
              </div>

              {/* Bottom Half Content Area */}
              <div className="w-full flex-1 px-6 pb-6 pt-1 flex flex-col items-center justify-between text-center bg-bg-card">
                <p className="text-xs font-sans text-text-muted tracking-wider uppercase font-medium mt-1">
                  {item.subtitle}
                </p>

                {/* Divider Line with Active Marker */}
                {activeSessionScenarioId && item.id === activeSessionScenarioId ? (
                  <div className="flex items-center justify-center my-3 w-28 mx-auto select-none pointer-events-none">
                    <div className="w-8 h-[1px] bg-text-sec/80 flex-shrink-0" />
                    <div className="mx-2 flex items-center justify-center">
                      <div className="w-2 h-2 rotate-45 border border-text-main bg-bg-card" />
                    </div>
                    <div className="w-8 h-[1px] bg-text-sec/80 flex-shrink-0" />
                  </div>
                ) : (
                  <div className="w-12 h-[1px] bg-border-main my-3" />
                )}

                <p className="text-xs sm:text-sm font-sans text-text-sec leading-relaxed max-w-[240px] mb-1">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Indicators */}
      <div className="absolute bottom-0 flex space-x-3">
        {scenarios.map((s, idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${s.id === scenarios[currentIndex % scenarios.length].id ? 'bg-bg-inv' : 'bg-bg-border'}`} 
          />
        ))}
      </div>
    </div>
  );
}
