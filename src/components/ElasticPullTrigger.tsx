import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

interface ElasticPullTriggerProps {
  label: string;
  onTrigger: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
}

export const ElasticPullTrigger: React.FC<ElasticPullTriggerProps> = ({
  label,
  onTrigger,
  containerRef,
  disabled = false
}) => {
  // Motion value for vertical pull distance (0 = resting, positive = pulled upwards)
  const pullDistance = useMotionValue(0);

  // Responsive spring with smooth damping for rubber-band release
  const springConfig = { damping: 28, stiffness: 300, mass: 0.5 };
  const smoothPull = useSpring(pullDistance, springConfig);

  const [isPastThreshold, setIsPastThreshold] = useState(false);
  const isPastThresholdRef = useRef(false);

  const isDraggingRef = useRef(false);
  const startClientYRef = useRef<number | null>(null);
  const startClientXRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);

  // Dynamic threshold: strictly reaches half of the screen height
  const getThreshold = useCallback(() => {
    if (typeof window !== 'undefined') {
      return Math.max(180, window.innerHeight * 0.48);
    }
    return 280;
  }, []);

  // Update threshold state & optional haptic tick
  useEffect(() => {
    const unsub = pullDistance.on('change', (val) => {
      const threshold = getThreshold();
      const past = val >= threshold;
      if (past !== isPastThresholdRef.current) {
        isPastThresholdRef.current = past;
        setIsPastThreshold(past);
        if (past && typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(20);
          } catch {
            // Ignore
          }
        }
      }
    });
    return () => unsub();
  }, [pullDistance, getThreshold]);

  // Release handler: if past midpoint threshold -> trigger next scene, else smoothly spring back
  const handleRelease = useCallback(() => {
    if (!isDraggingRef.current && pullDistance.get() === 0) return;

    isDraggingRef.current = false;
    startClientYRef.current = null;
    startClientXRef.current = null;

    const currentVal = pullDistance.get();
    const threshold = getThreshold();

    if (currentVal >= threshold) {
      onTrigger();
    }

    // Spring back to 0
    pullDistance.set(0);
    setIsPastThreshold(false);
    isPastThresholdRef.current = false;
  }, [pullDistance, getThreshold, onTrigger]);

  // Direct pointer drag on the trigger area
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startClientYRef.current = e.clientY;
    startClientXRef.current = e.clientX;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || startClientYRef.current === null) return;

    const dy = startClientYRef.current - e.clientY; // positive when dragging UP (scrolling down past end)
    const dx = Math.abs((startClientXRef.current ?? e.clientX) - e.clientX);

    if (Math.abs(dy) > 4 || dx > 4) {
      hasMovedRef.current = true;
    }

    if (dy > 0) {
      const maxPull = typeof window !== 'undefined' ? window.innerHeight * 0.65 : 450;
      const threshold = getThreshold();
      
      let distance = 0;
      if (dy <= threshold) {
        // Direct 1:1 finger tracking up to half screen
        distance = dy;
      } else {
        // Soft elastic resistance beyond half screen
        distance = threshold + (dy - threshold) * 0.35;
      }
      pullDistance.set(Math.min(distance, maxPull));
    } else {
      pullDistance.set(0);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    handleRelease();
  };

  const handlePointerCancel = () => {
    handleRelease();
  };

  // Direct click / tap without pulling
  const handleClick = () => {
    if (disabled) return;
    if (!hasMovedRef.current && pullDistance.get() < 8) {
      onTrigger();
    }
  };

  // Pulling when scrolling container reaches bottom
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    let touchStartY = 0;
    let touchStartX = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || disabled) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const dy = touchStartY - currentY; // finger moving UP
      const dx = Math.abs(touchStartX - currentX);

      // Check if container is at the bottom (within 8px tolerance)
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 8;

      if (isAtBottom && dy > 4 && dy > dx * 0.6) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          hasMovedRef.current = true;
          startClientYRef.current = currentY + pullDistance.get();
          startClientXRef.current = currentX;
        }

        const maxPull = window.innerHeight * 0.65;
        const threshold = getThreshold();
        let distance = 0;
        if (dy <= threshold) {
          distance = dy;
        } else {
          distance = threshold + (dy - threshold) * 0.35;
        }
        pullDistance.set(Math.min(distance, maxPull));
      }
    };

    const onTouchEnd = () => {
      if (isDraggingRef.current) {
        handleRelease();
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerRef, disabled, pullDistance, getThreshold, handleRelease]);

  // Wheel / trackpad scroll pull when at bottom
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    let wheelTimer: any = null;

    const onWheel = (e: WheelEvent) => {
      if (disabled) return;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 8;

      if (isAtBottom && e.deltaY > 0) {
        e.preventDefault();
        const threshold = getThreshold();
        const current = pullDistance.get();
        const next = current + e.deltaY * 0.7;

        if (next >= threshold) {
          onTrigger();
          pullDistance.set(0);
          return;
        }

        pullDistance.set(next);

        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          pullDistance.set(0);
        }, 300);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [containerRef, disabled, pullDistance, getThreshold, onTrigger]);

  const threshold = getThreshold();

  // Dynamic transforms:
  // 1. Line height starts at 0px and stretches downwards in height as pull increases
  const lineHeight = useTransform(smoothPull, (val) => `${val}px`);

  // 2. Smooth continuous brightness & opacity increase from 0% pull to threshold (100%)
  const pullProgress = useTransform(smoothPull, [0, threshold], [0, 1]);
  const textOpacity = useTransform(pullProgress, [0, 1], [0.55, 1]);
  const lineOpacity = useTransform(pullProgress, [0, 1], [0.3, 1]);
  const glowFilter = useTransform(pullProgress, [0, 0.6, 1], [
    'drop-shadow(0 0 0px rgba(255,255,255,0))',
    'drop-shadow(0 0 4px rgba(255,255,255,0.4))',
    'drop-shadow(0 0 10px rgba(255,255,255,0.95))'
  ]);

  return (
    <div 
      className="flex flex-col items-center w-full select-none touch-none cursor-grab active:cursor-grabbing focus:outline-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
    >
      {/* Text Label: Placed EXACTLY at the top, perfectly matching the original position */}
      <motion.div
        style={{ filter: glowFilter }}
        className="flex items-center justify-center transition-transform"
      >
        <motion.span
          style={{ opacity: textOpacity }}
          className={`text-[10px] font-sans tracking-[0.2em] uppercase transition-colors duration-200 whitespace-nowrap ${
            isPastThreshold ? 'text-white font-semibold' : 'text-text-main group-hover:text-white'
          }`}
        >
          {label}
        </motion.span>
      </motion.div>

      {/* Elastic Line: Placed BELOW the text label. Grows in height downwards as page scrolls down */}
      <div className="flex justify-center w-full mt-4 overflow-visible">
        <motion.div
          style={{
            height: lineHeight,
            opacity: lineOpacity,
            filter: glowFilter
          }}
          className={`w-[1px] origin-top transition-colors duration-200 ${
            isPastThreshold 
              ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,1)]' 
              : 'bg-white'
          }`}
        />
      </div>
    </div>
  );
};
