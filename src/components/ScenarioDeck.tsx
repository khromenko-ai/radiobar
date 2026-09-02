import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uiTranslations, scenariosData, Language } from '../data/content';

export function ScenarioDeck({ 
  language, 
  onSelect 
}: { 
  language: Language, 
  onSelect: (id: string) => void 
}) {
  const scenarios = scenariosData[language];
  const t = uiTranslations[language];
  
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
      className="relative w-full flex-1 min-h-[300px] max-h-[500px] my-auto flex items-center justify-center perspective-[1000px] overflow-hidden hide-scrollbar"
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
                opacity: 1 - i * 0.15, 
                scale: 1 - i * 0.05, 
                y: i * 16,
                zIndex: 10 - i
              }}
              exit={(direction) => ({ 
                opacity: 0, 
                scale: isTop ? 1 : 0.8, 
                x: isTop && direction === 'left' ? -400 : isTop && direction === 'right' ? 400 : 0,
                y: isTop && direction === 'up' ? -400 : isTop && direction === 'down' ? 400 : 100, 
                transition: { duration: 0.3 }
              })}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute w-full h-[88%] max-h-[440px] max-w-[330px] bg-bg-card border border-border-main p-6 sm:p-8 flex flex-col items-center justify-center text-center rounded-2xl shadow-2xl origin-bottom"
              style={{
                cursor: isTop ? 'grab' : 'auto'
              }}
              whileTap={{ cursor: isTop ? 'grabbing' : 'auto' }}
            >
              <h2 className="text-2xl sm:text-3xl font-serif text-text-main mb-3 sm:mb-4 tracking-wide leading-tight">
                {item.title}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-text-muted mb-6 sm:mb-10 tracking-wider uppercase">
                {item.subtitle}
              </p>
              <div className="w-8 h-[1px] bg-bg-border mb-6 sm:mb-10" />
              <p className="text-xs sm:text-sm font-sans text-text-sec leading-relaxed max-w-[240px]">
                {item.description}
              </p>
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
