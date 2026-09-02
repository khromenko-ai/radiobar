import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { uiTranslations, Language } from '../data/content';
import { CardsIcon } from './CardsIcon';

export function GuestInfoCard({ language, onBack }: { language: Language, onBack: () => void }) {
  const t = uiTranslations[language];
  const [taps, setTaps] = useState<number[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDismissing = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  const opacity = useTransform(x, [-300, 0, 300], [0.4, 1, 0.4]);

  const touchState = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    startScrollTop: 0,
    mode: 'none' as 'none' | 'horizontal_drag' | 'vertical_drag_top' | 'vertical_drag_bottom' | 'scrolling',
    isPointerDown: false,
  });

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

  const triggerDismiss = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    const targetX = direction === 'left' ? -450 : direction === 'right' ? 450 : 0;
    const targetY = direction === 'up' ? -450 : direction === 'down' ? 450 : 0;

    Promise.all([
      animate(x, targetX, { duration: 0.25, ease: [0.22, 1, 0.36, 1] }),
      animate(y, targetY, { duration: 0.25, ease: [0.22, 1, 0.36, 1] }),
    ]).then(() => {
      onBack();
    });
  };

  // Touch Gesture Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDismissing.current || showAuth) return;
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: Date.now(),
      startScrollTop: scrollRef.current?.scrollTop || 0,
      mode: 'none',
      isPointerDown: true,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.current.isPointerDown || isDismissing.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchState.current.startX;
    const dy = touch.clientY - touchState.current.startY;
    touchState.current.lastX = touch.clientX;
    touchState.current.lastY = touch.clientY;

    const scrollEl = scrollRef.current;
    const isAtTop = !scrollEl || scrollEl.scrollTop <= 1;
    const isAtBottom = !scrollEl || (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2);

    if (touchState.current.mode === 'none') {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > 8 && absX > absY) {
        touchState.current.mode = 'horizontal_drag';
      } else if (absY > 8) {
        if (isAtTop && dy > 0) {
          touchState.current.mode = 'vertical_drag_top';
        } else if (isAtBottom && dy < 0) {
          touchState.current.mode = 'vertical_drag_bottom';
        } else {
          touchState.current.mode = 'scrolling';
        }
      }
    }

    if (touchState.current.mode === 'horizontal_drag') {
      if (e.cancelable) e.preventDefault();
      x.set(dx);
    } else if (touchState.current.mode === 'vertical_drag_top' && dy > 0) {
      if (e.cancelable) e.preventDefault();
      y.set(dy * 0.75);
    } else if (touchState.current.mode === 'vertical_drag_bottom' && dy < 0) {
      if (e.cancelable) e.preventDefault();
      y.set(dy * 0.75);
    }
  };

  const handleTouchEnd = () => {
    if (!touchState.current.isPointerDown || isDismissing.current) return;
    touchState.current.isPointerDown = false;

    const currentX = x.get();
    const currentY = y.get();
    const elapsed = Math.max(1, Date.now() - touchState.current.startTime);
    const vx = (touchState.current.lastX - touchState.current.startX) / elapsed * 1000;
    const vy = (touchState.current.lastY - touchState.current.startY) / elapsed * 1000;

    const thresholdDist = 70;
    const thresholdVel = 400;

    if (currentX > thresholdDist || (vx > thresholdVel && touchState.current.mode === 'horizontal_drag')) {
      triggerDismiss('right');
    } else if (currentX < -thresholdDist || (vx < -thresholdVel && touchState.current.mode === 'horizontal_drag')) {
      triggerDismiss('left');
    } else if (currentY > thresholdDist || (vy > thresholdVel && touchState.current.mode === 'vertical_drag_top')) {
      triggerDismiss('down');
    } else if (currentY < -thresholdDist || (vy < -thresholdVel && touchState.current.mode === 'vertical_drag_bottom')) {
      triggerDismiss('up');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 });
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 28 });
    }
    touchState.current.mode = 'none';
  };

  // Mouse Drag Handling for Desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!touchState.current.isPointerDown || isDismissing.current) return;
      const dx = e.clientX - touchState.current.startX;
      const dy = e.clientY - touchState.current.startY;
      touchState.current.lastX = e.clientX;
      touchState.current.lastY = e.clientY;

      const scrollEl = scrollRef.current;
      const isAtTop = !scrollEl || scrollEl.scrollTop <= 1;
      const isAtBottom = !scrollEl || (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2);

      if (touchState.current.mode === 'none') {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX > 6 && absX > absY) {
          touchState.current.mode = 'horizontal_drag';
        } else if (absY > 6) {
          if (isAtTop && dy > 0) {
            touchState.current.mode = 'vertical_drag_top';
          } else if (isAtBottom && dy < 0) {
            touchState.current.mode = 'vertical_drag_bottom';
          } else {
            touchState.current.mode = 'scrolling';
          }
        }
      }

      if (touchState.current.mode === 'horizontal_drag') {
        x.set(dx);
      } else if (touchState.current.mode === 'vertical_drag_top' && dy > 0) {
        y.set(dy * 0.75);
      } else if (touchState.current.mode === 'vertical_drag_bottom' && dy < 0) {
        y.set(dy * 0.75);
      }
    };

    const handleMouseUp = () => {
      if (touchState.current.isPointerDown) {
        handleTouchEnd();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDismissing.current || showAuth) return;
    touchState.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      startTime: Date.now(),
      startScrollTop: scrollRef.current?.scrollTop || 0,
      mode: 'none',
      isPointerDown: true,
    };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 200, transition: { duration: 0.25 } }}
      style={{ x, y, rotate, opacity }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-full h-full max-h-[550px] max-w-[340px] bg-bg-card border border-border-main flex flex-col items-center text-center rounded-2xl shadow-2xl origin-bottom overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      <div 
        ref={scrollRef}
        className="w-full h-full flex flex-col items-center text-center overflow-y-auto overscroll-contain hide-scrollbar px-6 py-6"
        style={{ touchAction: 'pan-y' }}
      >
        <h2 className="text-xl font-serif text-text-main mb-4 tracking-widest flex-shrink-0">{t.infoTitle}</h2>
        <p className="text-sm font-sans text-text-sec leading-relaxed mb-3 px-2 flex-shrink-0">{t.infoDesc1}</p>
        <p className="text-sm font-sans text-text-muted leading-relaxed mb-6 whitespace-pre-wrap px-2 flex-shrink-0">{t.infoDesc2}</p>
        
        <div className="w-8 h-[1px] bg-bg-border mb-6 flex-shrink-0" />
        
        <h3 className="text-[10px] font-sans tracking-[0.2em] text-text-muted uppercase mb-3 flex-shrink-0">{t.howItWorks}</h3>
        <p className="text-xs font-sans text-text-muted leading-relaxed mb-2 px-2 flex-shrink-0">{t.howItWorks1}</p>
        <p className="text-xs font-sans text-text-muted leading-relaxed mb-2 px-2 flex-shrink-0">{t.howItWorks2}</p>
        <p className="text-xs font-sans text-text-muted leading-relaxed mb-2 whitespace-pre-wrap px-2 flex-shrink-0">{t.howItWorks3}</p>

        <div className="mt-0 mb-0 flex-shrink-0">
          <button 
            type="button"
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => {
              e.stopPropagation();
              triggerDismiss('down');
            }} 
            className="opacity-50 hover:opacity-100 transition-opacity p-2 flex items-center justify-center cursor-pointer"
            title="Back to cards"
          >
            <CardsIcon size={24} className="text-text-main" />
          </button>
        </div>

        <div 
          className="relative w-full flex flex-col items-center flex-shrink-0 mt-0 mb-0" 
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div onClick={!showAuth ? handleOrnamentTap : undefined} className={`relative select-none flex items-end justify-center h-8 mb-0 mt-0 w-28 mx-auto ${!showAuth ? 'cursor-pointer' : ''}`}>
            <AnimatePresence>
              {!showAuth && (
                <motion.div
                  key="ornament"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className="absolute inset-x-0 bottom-0 flex items-end justify-center h-full"
                >
                  <div className="w-10 h-[1px] bg-bg-border flex-shrink-0" />
                  
                  <div className="relative flex items-end justify-center mx-2 h-full w-4">
                    <motion.div
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 45 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -bottom-1 w-2 h-2 border border-border-focus hover:border-border-light transition-colors"
                    />
                  </div>

                  <div className="w-10 h-[1px] bg-bg-border flex-shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showAuth && (
                <motion.div
                  key="input-wrap"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="absolute inset-x-0 bottom-0 origin-center flex items-end"
                >
                  <motion.input
                    autoFocus
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={handlePinSubmit}
                    animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="w-full bg-transparent border-b border-border-focus text-center text-text-main text-sm focus:outline-none focus:border-text-main tracking-widest pb-1 z-50 h-8 rounded-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
