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
  const springConfig = { damping: 26, stiffness: 280, mass: 0.6 };
  const smoothPull = useSpring(pullDistance, springConfig);

  const [isPastThreshold, setIsPastThreshold] = useState(false);
  const isPastThresholdRef = useRef(false);

  // Track light vs dark mode
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      if (typeof document !== 'undefined') {
        setIsLight(document.documentElement.classList.contains('light'));
      }
    };
    checkTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isDraggingRef = useRef(false);
  const startClientYRef = useRef<number | null>(null);
  const startClientXRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);

  // Dynamic threshold: reaches ~40% of screen height
  const getThreshold = useCallback(() => {
    if (typeof window !== 'undefined') {
      return Math.max(160, Math.min(260, window.innerHeight * 0.38));
    }
    return 200;
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

  // Synchronize elastic pull upward motion to the container content
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const unsub = smoothPull.on('change', (val) => {
      const children = Array.from(container.children) as HTMLElement[];
      const transformVal = val > 0.5 ? `translate3d(0, ${-val}px, 0)` : '';
      const transitionVal = isDraggingRef.current ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      for (const child of children) {
        child.style.transform = transformVal;
        child.style.transition = transitionVal;
      }
    });

    return () => {
      unsub();
      const children = Array.from(container.children) as HTMLElement[];
      for (const child of children) {
        child.style.transform = '';
        child.style.transition = '';
      }
    };
  }, [containerRef, smoothPull]);

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

    const dy = startClientYRef.current - e.clientY; // positive when dragging UP
    const dx = Math.abs((startClientXRef.current ?? e.clientX) - e.clientX);

    if (Math.abs(dy) > 4 || dx > 4) {
      hasMovedRef.current = true;
    }

    if (dy > 0) {
      const maxPull = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 380;
      const threshold = getThreshold();
      
      let distance = 0;
      if (dy <= threshold) {
        // Direct finger tracking up to threshold
        distance = dy;
      } else {
        // Soft elastic resistance beyond threshold
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
    let bottomAnchorY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        bottomAnchorY = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || disabled) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const totalDy = touchStartY - currentY; // finger moving UP
      const dx = Math.abs(touchStartX - currentX);

      // Check if container is at the bottom (within 12px tolerance)
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 12;

      if (isAtBottom && totalDy > 0 && totalDy > dx * 0.5) {
        if (bottomAnchorY === null) {
          bottomAnchorY = currentY;
          isDraggingRef.current = true;
          hasMovedRef.current = true;
        }

        const pullDy = bottomAnchorY - currentY;
        if (pullDy > 0) {
          const maxPull = window.innerHeight * 0.6;
          const threshold = getThreshold();
          let distance = 0;
          if (pullDy <= threshold) {
            distance = pullDy;
          } else {
            distance = threshold + (pullDy - threshold) * 0.35;
          }
          pullDistance.set(Math.min(distance, maxPull));
        } else {
          pullDistance.set(0);
        }
      } else {
        if (bottomAnchorY !== null) {
          bottomAnchorY = null;
          pullDistance.set(0);
        }
      }
    };

    const onTouchEnd = () => {
      bottomAnchorY = null;
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
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 12;

      if (isAtBottom && e.deltaY > 0) {
        const threshold = getThreshold();
        const current = pullDistance.get();
        const next = current + e.deltaY * 0.6;

        if (next >= threshold) {
          onTrigger();
          pullDistance.set(0);
          return;
        }

        pullDistance.set(next);

        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          pullDistance.set(0);
        }, 250);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      container.removeEventListener('wheel', onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [containerRef, disabled, pullDistance, getThreshold, onTrigger]);

  const threshold = getThreshold();

  // Dynamic transforms:
  // 1. Fallback translateY only when containerRef is not attached
  const triggerTranslateY = useTransform(smoothPull, (val) => containerRef?.current ? 0 : -val);

  // 2. Elastic Line stretches upwards between baseline and rising label
  const lineHeight = useTransform(smoothPull, (val) => `${val + 16}px`);

  // 3. Smooth continuous brightness & opacity increase from 0% pull to threshold (100%)
  const pullProgress = useTransform(smoothPull, [0, threshold], [0, 1]);
  const textOpacity = useTransform(pullProgress, [0, 1], [0.55, 1]);
  const lineOpacity = useTransform(pullProgress, [0, 1], [0.35, 1]);
  const glowFilter = useTransform(pullProgress, (val) => {
    if (val <= 0.05) {
      return isLight ? 'drop-shadow(0 0 0px rgba(0,0,0,0))' : 'drop-shadow(0 0 0px rgba(255,255,255,0))';
    }
    if (isLight) {
      const alpha = Math.min(0.8, val * 0.8);
      const blur = Math.round(val * 8);
      return `drop-shadow(0 0 ${blur}px rgba(0,0,0,${alpha}))`;
    } else {
      const alpha = Math.min(0.95, val * 0.95);
      const blur = Math.round(val * 10);
      return `drop-shadow(0 0 ${blur}px rgba(255,255,255,${alpha}))`;
    }
  });

  return (
    <div 
      className="flex flex-col items-center w-full select-none touch-none cursor-grab active:cursor-grabbing focus:outline-none group relative py-2"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
    >
      {/* Elastic band element: rising upwards as user drags up */}
      <motion.div 
        style={{ y: triggerTranslateY }}
        className="flex flex-col items-center w-full will-change-transform"
      >
        {/* Text Label: Rises UP with the finger */}
        <motion.div
          style={{ filter: glowFilter }}
          className="flex items-center justify-center"
        >
          <motion.span
            style={{ opacity: textOpacity }}
            className={`text-[10px] font-sans tracking-[0.2em] uppercase transition-colors duration-200 whitespace-nowrap ${
              isLight
                ? (isPastThreshold ? 'text-black font-semibold' : 'text-text-main group-hover:text-black')
                : (isPastThreshold ? 'text-white font-semibold' : 'text-text-main group-hover:text-white')
            }`}
          >
            {label}
          </motion.span>
        </motion.div>

        {/* Elastic Rubber Line: Stretches from the rising label down to the baseline */}
        <div className="flex justify-center w-full mt-3 overflow-visible">
          <motion.div
            style={{
              height: lineHeight,
              opacity: lineOpacity,
              filter: glowFilter
            }}
            className={`w-[1px] origin-top transition-colors duration-200 ${
              isLight
                ? (isPastThreshold 
                    ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.8)]' 
                    : 'bg-black')
                : (isPastThreshold 
                    ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,1)]' 
                    : 'bg-white')
            }`}
          />
        </div>
      </motion.div>
    </div>
  );
};

