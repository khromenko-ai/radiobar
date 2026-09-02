import React, { useEffect, useState, useRef } from 'react';
import { useSession } from './hooks/useSession';
import { scenariosData, uiTranslations, Language } from './data/content';
import { LanguageToggle } from './components/LanguageToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { ScenarioDeck } from './components/ScenarioDeck';
import { ActCard } from './components/ActCard';
import { Timer } from './components/Timer';
import { ElasticPullTrigger } from './components/ElasticPullTrigger';
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
  const introContainerRef = useRef<HTMLDivElement | null>(null);
  const actsContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Horizontal swipe navigation (left/right between acts)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    if (e.changedTouches.length === 0) return;

    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const SWIPE_THRESHOLD = 60;
    if (absX > SWIPE_THRESHOLD && absX > absY * 1.5) {
      if (deltaX < 0) {
        handleGoBack();
      } else {
        handleGoForward();
      }
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  const handleTouchCancel = () => {
    touchStartY.current = null;
    touchStartX.current = null;
  };

  // Trackpad horizontal scroll (two fingers left/right) navigation between acts & scenes
  const wheelAccumulatorXRef = useRef(0);
  const wheelNavCooldownRef = useRef(false);

  const handleContainerWheel = (e: React.WheelEvent) => {
    if (activeState === 'HOME') return; // Handled by ScenarioDeck
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 && Math.abs(e.deltaX) > 6) {
      if (wheelNavCooldownRef.current) return;

      wheelAccumulatorXRef.current += e.deltaX;
      const HORIZONTAL_WHEEL_THRESHOLD = 35;

      if (wheelAccumulatorXRef.current > HORIZONTAL_WHEEL_THRESHOLD) {
        // Swiped left (next)
        handleGoForward();
        wheelNavCooldownRef.current = true;
        wheelAccumulatorXRef.current = 0;
        setTimeout(() => { wheelNavCooldownRef.current = false; }, 400);
      } else if (wheelAccumulatorXRef.current < -HORIZONTAL_WHEEL_THRESHOLD) {
        // Swiped right (back)
        handleGoBack();
        wheelNavCooldownRef.current = true;
        wheelAccumulatorXRef.current = 0;
        setTimeout(() => { wheelNavCooldownRef.current = false; }, 400);
      }
    }
  };

  return (
    <div 
      onWheel={handleContainerWheel}
      className="h-screen h-[100dvh] w-full bg-bg-main text-text-main overflow-hidden flex flex-col font-sans relative selection:bg-bg-border selection:text-text-main select-none hide-scrollbar"
    >
      
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
            ref={introContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="flex-grow flex flex-col items-center pt-16 px-6 pb-4 text-center relative overflow-y-auto hide-scrollbar w-full"
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
                <ElasticPullTrigger 
                  label={t.firstCourseReady}
                  onTrigger={beginActs}
                  containerRef={introContainerRef}
                />
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
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="flex-grow flex flex-col relative overflow-y-auto hide-scrollbar w-full"
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
                      containerRef={actsContainerRef}
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
