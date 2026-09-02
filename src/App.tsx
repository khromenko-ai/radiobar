import React, { useEffect, useState, useRef } from 'react';
import { useSession } from './hooks/useSession';
import { scenariosData, uiTranslations, Language } from './data/content';
import { LanguageToggle } from './components/LanguageToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { ScenarioDeck } from './components/ScenarioDeck';
import { ActCard } from './components/ActCard';
import { Timer } from './components/Timer';
import { GuestInfoCard } from './components/GuestInfoCard';
import { FullscreenToggle } from './components/FullscreenToggle';
import { HostApp } from './components/Host';
import { motion, AnimatePresence } from 'motion/react';
import { useSessions, getSessions, saveSessions } from './lib/store';

function TopActions({ session, updateSession, resetSession, toggleDevMode, leftContent, centerContent }: any) {
  return (
    <>
      {leftContent && (
        <div className="absolute top-4 left-6 z-50 flex items-center h-6">
          {leftContent}
        </div>
      )}
      <div className="absolute top-4 right-6 z-50 flex items-center space-x-4 h-6">
        {session.devMode && (
          <div className="w-2 h-2 rounded-full bg-red-500" title="Dev Mode" />
        )}
        <FullscreenToggle />
        <ThemeToggle onReset={resetSession} onDemo={toggleDevMode} />
        <LanguageToggle 
          current={session.language} 
          onChange={(l: Language) => updateSession({ language: l })}
          onDevModeToggle={toggleDevMode}
        />
      </div>
      {centerContent && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none h-6">
          {centerContent}
        </div>
      )}
    </>
  );
}

function GuestApp() {
  const { session, updateSession, resetSession, startScenario, beginActs, advanceAct, goToAct, endExperience, toggleDevMode } = useSession();
  const { sessions } = useSessions();
  const t = uiTranslations[session.language];
  const hostSession = session.hostSessionId ? sessions[session.hostSessionId] : null;

  // Sync URL session and moment parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session');
    const scenarioParam = params.get('scenario');
    const actParam = params.get('act');
    const tableParam = params.get('table');
    const langParam = params.get('lang');

    if (sid || scenarioParam) {
      const actIdx = actParam !== null ? parseInt(actParam, 10) : 0;
      const targetScenario = scenarioParam || 'first-date';
      const targetLang = (langParam === 'ES' || langParam === 'EN' || langParam === 'RU') ? langParam : session.language;

      if (sid) {
        const storedSessions = getSessions();
        if (!storedSessions[sid]) {
          storedSessions[sid] = {
            id: sid,
            tableName: tableParam ? decodeURIComponent(tableParam) : `Table ${sid}`,
            scenarioId: targetScenario,
            currentActIndex: isNaN(actIdx) ? 0 : actIdx,
            status: 'ACTIVE',
            actStartedAt: Date.now(),
            pausedAt: null
          };
          saveSessions(storedSessions);
        } else if (actParam !== null && !isNaN(actIdx)) {
          storedSessions[sid].currentActIndex = actIdx;
          if (scenarioParam) storedSessions[sid].scenarioId = targetScenario;
          if (tableParam) storedSessions[sid].tableName = decodeURIComponent(tableParam);
          saveSessions(storedSessions);
        }

        updateSession({
          hostSessionId: sid,
          scenarioId: targetScenario,
          currentActIndex: isNaN(actIdx) ? 0 : actIdx,
          state: 'ACTS',
          actStartedAt: Date.now(),
          language: targetLang,
        });
      } else if (scenarioParam) {
        updateSession({
          scenarioId: targetScenario,
          currentActIndex: isNaN(actIdx) ? 0 : actIdx,
          state: 'ACTS',
          actStartedAt: Date.now(),
          language: targetLang,
        });
      }

      // Clean URL after consuming to keep UI elegant
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const activeScenarioId = hostSession ? hostSession.scenarioId : session.scenarioId;
  const activeActIndex = hostSession ? hostSession.currentActIndex : session.currentActIndex;
  const activeActStartedAt = hostSession ? hostSession.actStartedAt : session.actStartedAt;
  const isPaused = hostSession ? hostSession.status === 'PAUSED' : false;
  const pausedAt = hostSession ? hostSession.pausedAt : null;
  const isHostControlled = !!hostSession;

  let activeState = session.state;
  if (hostSession) {
    if (hostSession.status === 'WAITING') activeState = 'INTRO';
    else if (hostSession.status === 'ACTIVE' || hostSession.status === 'PAUSED') activeState = 'ACTS';
    else if (hostSession.status === 'COMPLETED') activeState = 'END';
  }

  const scenario = activeScenarioId ? scenariosData[session.language].find(s => s.id === activeScenarioId) : null;
  const [isNextActReady, setIsNextActReady] = useState(false);

  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const pullAnchorY = useRef<number | null>(null);
  const actsContainerRef = useRef<HTMLDivElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 130;
  const pullProgress = Math.min(1, Math.max(0, pullDistance / PULL_THRESHOLD));
  const wheelTimeoutRef = useRef<any>(null);

  const DURATION_MS = session.devMode ? 10000 : 10 * 60 * 1000;

  // Ensure scroll is at the top whenever act index or state changes
  useEffect(() => {
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeActIndex, activeState]);

  const handleNextAct = () => {
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }
    if (scenario && activeActIndex < scenario.acts.length - 1) {
      advanceAct();
      setIsNextActReady(false);
    } else {
      endExperience();
    }
  };

  const handleGoBack = () => {
    if (isHostControlled) return;
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }
    if (activeState === 'INFO') {
      updateSession({ state: 'HOME' });
    } else if (activeState === 'INTRO') {
      updateSession({ state: 'HOME', scenarioId: null });
    } else if (activeState === 'ACTS') {
      if (activeActIndex === 0) {
        // Return to scenario INTRO ("Первое блюдо")
        updateSession({ state: 'INTRO' });
      } else {
        goToAct(activeActIndex - 1);
      }
    } else if (activeState === 'END') {
      if (scenario) {
        updateSession({ state: 'ACTS', currentActIndex: scenario.acts.length - 1 });
      } else {
        updateSession({ state: 'HOME' });
      }
    }
  };

  const handleGoForward = () => {
    if (isHostControlled) return;
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }
    if (activeState === 'INTRO') {
      // Go forward into ACTS
      beginActs();
    } else if (activeState === 'ACTS') {
      // Check if user has already reached a higher act earlier, or if next act is ready
      const maxReached = session.maxActIndexReached || 0;
      if (scenario && activeActIndex < maxReached) {
        goToAct(activeActIndex + 1);
      } else if (isNextActReady && scenario && activeActIndex < scenario.acts.length - 1) {
        handleNextAct();
      } else if (isNextActReady && scenario && activeActIndex === scenario.acts.length - 1) {
        endExperience();
      }
    }
  };

  // Helper to start gesture tracking
  const onGestureStart = (clientX: number, clientY: number, target: HTMLElement | null) => {
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    isPullingRef.current = false;
    pullAnchorY.current = null;
    setPullDistance(0);

    if (target) {
      const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 4;
      if (isAtBottom) {
        pullAnchorY.current = clientY;
      }
    }
  };

  // Helper for gesture movement with smooth elastic resistance
  const onGestureMove = (clientX: number, clientY: number, target: HTMLElement | null) => {
    if (touchStartY.current === null || touchStartX.current === null) return;

    const isActionReady = (activeState === 'INTRO' && !isHostControlled) ||
                          (activeState === 'ACTS' && isNextActReady && !isHostControlled);

    if (!target) return;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 4;

    if (!isAtBottom) {
      // Normal content scrolling inside card
      pullAnchorY.current = clientY;
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    // When at bottom, start measuring pull distance from the point we reached bottom
    if (pullAnchorY.current === null) {
      pullAnchorY.current = clientY;
    }

    const dy = pullAnchorY.current - clientY; // positive when dragging finger UP
    const dx = Math.abs(clientX - touchStartX.current);

    if (isActionReady && dy > 0 && dy > dx * 0.8) {
      isPullingRef.current = true;
      // Smooth rubberband formula: direct response up to threshold, then soft damping beyond
      let visualDistance = 0;
      if (dy <= PULL_THRESHOLD) {
        visualDistance = dy;
      } else {
        visualDistance = PULL_THRESHOLD + (dy - PULL_THRESHOLD) * 0.45;
      }
      setPullDistance(Math.min(visualDistance, PULL_THRESHOLD + 70));
    } else if (dy <= 0) {
      isPullingRef.current = false;
      setPullDistance(0);
    }
  };

  // Helper for gesture release
  const onGestureEnd = (clientX: number, clientY: number) => {
    if (touchStartY.current === null || touchStartX.current === null) {
      setPullDistance(0);
      isPullingRef.current = false;
      pullAnchorY.current = null;
      return;
    }

    const deltaX = touchStartX.current - clientX;
    const deltaY = touchStartY.current - clientY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const SWIPE_THRESHOLD = 55;

    // Horizontal swipe navigation (left/right) when not engaged in pulling
    if (absX > SWIPE_THRESHOLD && absX > absY * 1.5 && pullDistance < 25) {
      if (deltaX < 0) {
        handleGoBack();
      } else {
        handleGoForward();
      }
    } 
    // Vertical rubber-band trigger
    else if (pullDistance >= PULL_THRESHOLD || pullProgress >= 0.95) {
      if (activeState === 'INTRO' && !isHostControlled) {
        beginActs();
      } else if (activeState === 'ACTS' && isNextActReady && !isHostControlled) {
        handleNextAct();
      }
    }

    setPullDistance(0);
    isPullingRef.current = false;
    touchStartY.current = null;
    touchStartX.current = null;
    pullAnchorY.current = null;
  };

  // Pointer event handlers (Mouse / Trackpad / Stylus)
  const isPointerDownRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // let TouchEvents handle mobile touches to prevent double triggers
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isPointerDownRef.current = true;
    onGestureStart(e.clientX, e.clientY, e.currentTarget as HTMLElement);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!isPointerDownRef.current) return;
    onGestureMove(e.clientX, e.clientY, e.currentTarget as HTMLElement);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    onGestureEnd(e.clientX, e.clientY);
  };

  const handlePointerCancel = () => {
    isPointerDownRef.current = false;
    setPullDistance(0);
    isPullingRef.current = false;
    touchStartY.current = null;
    touchStartX.current = null;
    pullAnchorY.current = null;
  };

  // Touch event handlers (Mobile Safari / Chrome)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      onGestureStart(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget as HTMLElement);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      onGestureMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget as HTMLElement);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length > 0) {
      onGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  };

  const handleTouchCancel = () => {
    setPullDistance(0);
    isPullingRef.current = false;
    touchStartY.current = null;
    touchStartX.current = null;
    pullAnchorY.current = null;
  };

  // Mouse wheel / Trackpad pull handling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const isActionReady = (activeState === 'INTRO' && !isHostControlled) ||
                          (activeState === 'ACTS' && isNextActReady && !isHostControlled);
    if (!isActionReady) return;

    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 5;

    if (e.deltaY > 0 && isAtBottom) {
      setPullDistance(prev => {
        const next = Math.min(prev + e.deltaY * 0.6, PULL_THRESHOLD + 30);
        if (next >= PULL_THRESHOLD) {
          if (activeState === 'INTRO') beginActs();
          else if (activeState === 'ACTS') handleNextAct();
          return 0;
        }
        return next;
      });

      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        setPullDistance(0);
      }, 350);
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-bg-main text-text-main overflow-hidden flex flex-col font-sans relative selection:bg-bg-border selection:text-text-main select-none">
      
      <AnimatePresence mode="wait">
        
        {activeState === 'HOME' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="h-full w-full flex-grow flex flex-col items-center justify-between pt-12 pb-6 px-6 overflow-hidden relative select-none"
          >
            <TopActions session={session} updateSession={updateSession} resetSession={resetSession} toggleDevMode={toggleDevMode} />
            <ScenarioDeck 
              language={session.language} 
              onSelect={(id) => {
                if (id === 'INFO_CARD') {
                  updateSession({ state: 'INFO' });
                } else {
                  startScenario(id);
                }
              }} 
            />

            <div className="text-center mt-2 mb-2 flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-serif tracking-[0.1em] text-text-sec whitespace-pre-wrap leading-[1.2] sm:leading-[1.4]">
                {t.welcomeTitle}
              </h1>
              <p className="text-[11px] sm:text-xs font-sans tracking-widest text-text-sub mt-1.5 sm:mt-2">
                {t.welcomeSubtitle}
              </p>
            </div>
          </motion.div>
        )}

        {activeState === 'INFO' && (
          <motion.div 
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-grow flex flex-col items-center justify-center pt-12 pb-12 px-6 relative overflow-y-auto hide-scrollbar"
          >
            <TopActions session={session} updateSession={updateSession} resetSession={resetSession} toggleDevMode={toggleDevMode} />
            <GuestInfoCard 
              language={session.language} 
              onBack={() => updateSession({ state: 'HOME' })} 
            />
          </motion.div>
        )}

        {activeState === 'INTRO' && scenario && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onWheel={handleWheel}
            className="flex-grow flex flex-col items-center pt-16 px-6 pb-4 text-center relative overflow-y-auto hide-scrollbar w-full"
            style={{ 
              transform: pullDistance > 0 && !isHostControlled ? `translateY(-${pullDistance * 0.9}px)` : 'translateY(0)',
              transition: pullDistance > 0 ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
            onScroll={(e) => {
              (e.currentTarget as HTMLDivElement).style.setProperty('--scroll-y', `${e.currentTarget.scrollTop}px`);
            }}
          >
            <TopActions session={session} updateSession={updateSession} resetSession={resetSession} toggleDevMode={toggleDevMode} />
            <h2 className="text-2xl font-serif tracking-widest mb-12 flex-shrink-0">
              {scenario.title}
            </h2>
            <p className="text-sm font-serif leading-[2.0] text-text-muted whitespace-pre-wrap mb-12 flex-shrink-0">
              {scenario.introText}
            </p>
            <div className="flex flex-col items-center justify-end mt-auto w-full pb-2">
              {isHostControlled ? (
                <div className="text-[10px] font-sans tracking-widest text-text-sub uppercase animate-pulse mb-8">
                  {t.waitFirstCourse}
                </div>
              ) : (
                <button 
                  onClick={beginActs} 
                  className="group flex flex-col items-center cursor-pointer select-none focus:outline-none"
                >
                  <span className={`text-[10px] font-sans tracking-widest uppercase mb-4 transition-colors duration-300 ${
                    pullProgress >= 1 ? 'text-text-main font-semibold' : 'text-text-sub group-hover:text-text-main'
                  }`}>
                    {t.firstCourseReady}
                  </span>
                  <div 
                    className={`w-[1px] transition-colors ${
                      pullProgress >= 1 
                        ? 'bg-text-main shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                        : 'bg-border-focus group-hover:bg-text-main'
                    }`} 
                    style={{
                      height: '64px',
                      transform: `scaleY(${1 + (pullDistance * 0.9) / 64})`,
                      transformOrigin: 'top',
                      transition: pullDistance > 0 ? 'background-color 0.2s' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s'
                    }}
                  />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {activeState === 'ACTS' && scenario && (
          <motion.div 
            key="acts"
            ref={actsContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onWheel={handleWheel}
            className="flex-grow flex flex-col relative overflow-y-auto hide-scrollbar w-full"
            style={{ 
              transform: pullDistance > 0 && !isHostControlled ? `translateY(-${pullDistance * 0.9}px)` : 'translateY(0)',
              transition: pullDistance > 0 ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
            onScroll={(e) => {
              (e.currentTarget as HTMLDivElement).style.setProperty('--scroll-y', `${e.currentTarget.scrollTop}px`);
            }}
          >
            <TopActions 
              session={session} 
              updateSession={updateSession} 
              resetSession={resetSession} 
              toggleDevMode={toggleDevMode}
              leftContent={
                <span className="text-xs font-sans tracking-widest text-text-muted select-none font-medium">
                  {scenario.acts[activeActIndex]?.number}
                </span>
              }
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeActIndex}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="w-full flex-grow flex flex-col min-h-max"
              >
                <ActCard act={scenario.acts[activeActIndex]} language={session.language} />
                
                <div className="w-full pt-8 pb-4 flex justify-center shrink-0">
                  {activeActStartedAt && (!isNextActReady || isHostControlled) && ( 
                    <Timer 
                      actStartedAt={activeActStartedAt} 
                      durationMs={DURATION_MS} 
                      isPaused={isPaused}
                      pausedAt={pausedAt}
                      language={session.language}
                      onComplete={() => setIsNextActReady(true)}
                      isHostControlled={isHostControlled}
                      isNextActReady={false}
                    />
                  )}
                  {isNextActReady && !isHostControlled && (
                    <Timer 
                      actStartedAt={activeActStartedAt || 0}
                      durationMs={DURATION_MS} 
                      isPaused={isPaused}
                      pausedAt={pausedAt}
                      language={session.language}
                      onComplete={() => {}}
                      isHostControlled={isHostControlled}
                      isNextActReady={true}
                      handleNextAct={handleNextAct}
                      pullDistance={pullDistance}
                      pullProgress={pullProgress}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {activeState === 'END' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="flex-grow flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
          >
            <TopActions session={session} updateSession={updateSession} resetSession={resetSession} toggleDevMode={toggleDevMode} />
            <h2 className="text-xl font-serif tracking-widest text-text-main mb-8">
              {t.endTitle}
            </h2>
            <p className="text-xs font-sans tracking-widest text-text-sub">
              {t.endSubtitle}
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [isHostRoute, setIsHostRoute] = useState(false);

  useEffect(() => {
    setIsHostRoute(window.location.pathname.startsWith('/host'));
    const onPopState = () => setIsHostRoute(window.location.pathname.startsWith('/host'));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (isHostRoute) {
    return <HostApp />;
  }

  return <GuestApp />;
}
