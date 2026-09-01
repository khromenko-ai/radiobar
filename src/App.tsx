import React, { useEffect, useState, useRef } from 'react';
import { useSession } from './hooks/useSession';
import { scenariosData, uiTranslations, Language } from './data/content';
import { LanguageToggle } from './components/LanguageToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { ScenarioDeck } from './components/ScenarioDeck';
import { ActCard } from './components/ActCard';
import { Timer } from './components/Timer';
import { GuestInfoCard } from './components/GuestInfoCard';
import { HostApp } from './components/Host';
import { motion, AnimatePresence } from 'motion/react';
import { useSessions } from './lib/store';

function TopActions({ session, updateSession, resetSession, toggleDevMode, centerContent }: any) {
  return (
    <>
      <div className="absolute top-8 right-8 z-50 flex items-center">
        <LanguageToggle 
          current={session.language} 
          onChange={(l: Language) => updateSession({ language: l })} 
        />
      </div>
      {centerContent && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none">
          {centerContent}
        </div>
      )}
      <div className="absolute top-8 left-8 z-50 flex items-center">
        <ThemeToggle onReset={resetSession} onDemo={toggleDevMode} />
      </div>
    </>
  );
}

function GuestApp() {
  const { session, updateSession, resetSession, startScenario, beginActs, advanceAct, goToAct, endExperience, toggleDevMode } = useSession();
  const { sessions } = useSessions();
  const t = uiTranslations[session.language];
  const hostSession = session.hostSessionId ? sessions[session.hostSessionId] : null;

  // Sync URL session parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session');
    if (sid && sid !== session.hostSessionId) {
      updateSession({ hostSessionId: sid });
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
  const actsContainerRef = useRef<HTMLDivElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const pullProgress = Math.min(1, Math.max(0, pullDistance / 60));

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    setPullDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const dy = touchStartY.current - e.touches[0].clientY;
    const dx = Math.abs(touchStartX.current - e.touches[0].clientX);

    const isActionReady = (activeState === 'INTRO' && !isHostControlled) ||
                          (activeState === 'ACTS' && isNextActReady && !isHostControlled);

    if (isActionReady && dy > 0 && dy > dx) {
      setPullDistance(Math.min(dy, 100));
    } else if (dy <= 0) {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) {
      setPullDistance(0);
      return;
    }
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const SWIPE_THRESHOLD = 50;

    // Horizontal swipes (deltaX > 0: right-to-left [FORWARD]; deltaX < 0: left-to-right [BACK])
    if (absX > SWIPE_THRESHOLD && absX > absY) {
      if (deltaX < 0) {
        // Left-to-Right swipe -> Back
        handleGoBack();
      } else {
        // Right-to-Left swipe -> Forward
        handleGoForward();
      }
    } 
    // Vertical swipe up (>= 60px)
    else if (deltaY >= 60 && deltaY > absX) {
      if (activeState === 'INTRO' && !isHostControlled) {
        beginActs();
      } else if (activeState === 'ACTS' && isNextActReady && !isHostControlled) {
        handleNextAct();
      }
    }

    setPullDistance(0);
    touchStartY.current = null;
    touchStartX.current = null;
  };

  const handleTouchCancel = () => {
    setPullDistance(0);
    touchStartY.current = null;
    touchStartX.current = null;
  };

  return (
    <div className="min-h-screen w-full bg-bg-main text-text-main overflow-hidden flex flex-col font-sans relative selection:bg-bg-border selection:text-text-main">
      
      {session.devMode && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 text-[8px] text-red-500 tracking-widest z-50">
          {t.devMode}
        </div>
      )}
      
      <AnimatePresence mode="wait">
        
        {activeState === 'HOME' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="flex-grow flex flex-col items-center pt-20 pb-12 px-6 overflow-hidden w-full relative"
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

            <div className="text-center mt-12 mb-4">
              <h1 className="text-xl font-serif tracking-[0.1em] text-text-sec whitespace-pre-wrap leading-[1.6]">
                {t.welcomeTitle}
              </h1>
              <p className="text-xs font-sans tracking-widest text-text-sub mt-2">
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
            className="flex-grow flex flex-col items-center pt-24 px-6 pb-4 text-center relative overflow-y-auto hide-scrollbar w-full"
          >
            <TopActions session={session} updateSession={updateSession} resetSession={resetSession} toggleDevMode={toggleDevMode} />
            <h2 className="text-2xl font-serif tracking-widest mb-12 flex-shrink-0">
              {scenario.title}
            </h2>
            <p className="text-sm font-serif leading-[2.5] text-text-muted whitespace-pre-wrap mb-12 flex-shrink-0">
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
                  className="group flex flex-col items-center cursor-pointer select-none focus:outline-none transition-transform duration-150 ease-out"
                  style={{
                    transform: `translateY(-${pullDistance * 0.35}px)`
                  }}
                >
                  <span className={`text-[10px] font-sans tracking-widest uppercase mb-4 transition-colors duration-300 ${
                    pullProgress >= 1 ? 'text-text-main font-medium' : 'text-text-sub group-hover:text-text-main'
                  }`}>
                    {t.firstCourseReady}
                  </span>
                  <div 
                    className={`w-[1px] transition-all duration-300 ${
                      pullProgress >= 1 ? 'bg-bg-inv h-20' : 'bg-bg-hover group-hover:bg-bg-inv h-16'
                    }`} 
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
            className="flex-grow flex flex-col relative overflow-y-auto hide-scrollbar w-full"
          >
            <TopActions 
              session={session} 
              updateSession={updateSession} 
              resetSession={resetSession} 
              toggleDevMode={toggleDevMode}
              centerContent={
                <span className="text-xs font-sans tracking-widest text-text-muted select-none">
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
