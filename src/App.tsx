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

function TopActions({ 
  session, 
  updateSession, 
  resetSession, 
  toggleDevMode, 
  leftContent, 
  centerContent,
  isHostControlled,
  tableName
}: any) {
  return (
    <>
      <div className="absolute top-4 left-6 z-50 flex items-center h-6">
        {leftContent ? leftContent : (
          isHostControlled && tableName ? (
            <span className="text-[10px] font-sans tracking-[0.2em] text-text-sub uppercase truncate max-w-[140px]">
              {tableName}
            </span>
          ) : null
        )}
      </div>
      <div className="absolute top-4 right-6 z-50 flex items-center space-x-4 h-6">
        {session.devMode && (
          <div className="w-2 h-2 rounded-full bg-red-500" title="Dev Mode" />
        )}
        <FullscreenToggle />
        <ThemeToggle onReset={isHostControlled ? () => {} : resetSession} onDemo={toggleDevMode} />
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
  const { sessions, updateSession: updateHostStoreSession, advanceSession: advanceHostStoreSession } = useSessions();
  const t = uiTranslations[session.language];
  const hostSession = session.hostSessionId ? sessions[session.hostSessionId] : null;
  const isHostControlled = !!session.hostSessionId;

  const lastHostActIndexRef = useRef<number | null>(null);
  const lastHostStatusRef = useRef<string | null>(null);

  // Sync URL session and moment parameters on initial load / QR scan
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
      const validActIdx = isNaN(actIdx) ? 0 : actIdx;

      if (sid) {
        const storedSessions = getSessions();
        if (!storedSessions[sid]) {
          storedSessions[sid] = {
            id: sid,
            tableName: tableParam ? decodeURIComponent(tableParam) : `Table ${sid}`,
            scenarioId: targetScenario,
            currentActIndex: validActIdx,
            status: 'ACTIVE',
            actStartedAt: Date.now(),
            pausedAt: null
          };
          saveSessions(storedSessions);
        } else {
          storedSessions[sid].currentActIndex = validActIdx;
          if (scenarioParam) storedSessions[sid].scenarioId = targetScenario;
          if (tableParam) storedSessions[sid].tableName = decodeURIComponent(tableParam);
          saveSessions(storedSessions);
        }
      }

      lastHostActIndexRef.current = validActIdx;

      updateSession({
        hostSessionId: sid || null,
        scenarioId: targetScenario,
        currentActIndex: validActIdx,
        maxActIndexReached: Math.max(session.maxActIndexReached || 0, validActIdx),
        state: 'ACTS',
        actStartedAt: Date.now(),
        language: targetLang,
      });

      setIsNextActReady(false);

      // Clean URL after consuming to keep UI elegant
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Instant synchronization with hostSession changes
  useEffect(() => {
    if (!hostSession) return;

    // Update scenario if changed by host
    if (hostSession.scenarioId && hostSession.scenarioId !== session.scenarioId) {
      updateSession({ scenarioId: hostSession.scenarioId });
    }

    // If host switched to a new act or moment, immediately jump guest screen to it
    if (hostSession.currentActIndex !== undefined && hostSession.currentActIndex !== lastHostActIndexRef.current) {
      lastHostActIndexRef.current = hostSession.currentActIndex;
      updateSession({
        currentActIndex: hostSession.currentActIndex,
        maxActIndexReached: Math.max(session.maxActIndexReached || 0, hostSession.currentActIndex),
        state: 'ACTS',
      });
      setIsNextActReady(false);
    }

    // Sync status changes from host
    if (hostSession.status !== lastHostStatusRef.current) {
      lastHostStatusRef.current = hostSession.status;
      if (hostSession.status === 'WAITING' && session.state !== 'INTRO') {
        updateSession({ state: 'INTRO' });
      } else if ((hostSession.status === 'ACTIVE' || hostSession.status === 'PAUSED') && session.state !== 'ACTS') {
        updateSession({ state: 'ACTS' });
      } else if (hostSession.status === 'COMPLETED' && session.state !== 'END') {
        updateSession({ state: 'END' });
      }
    }
  }, [hostSession, session.scenarioId, session.currentActIndex, session.state, session.maxActIndexReached]);

  const activeScenarioId = hostSession?.scenarioId || session.scenarioId;
  const activeActIndex = session.currentActIndex;
  const activeActStartedAt = hostSession?.actStartedAt || session.actStartedAt || Date.now();
  const isPaused = hostSession?.status === 'PAUSED';
  const pausedAt = hostSession?.pausedAt || null;

  const scenario = activeScenarioId ? scenariosData[session.language].find(s => s.id === activeScenarioId) : null;
  const [isNextActReady, setIsNextActReady] = useState(false);

  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const introContainerRef = useRef<HTMLDivElement | null>(null);
  const actsContainerRef = useRef<HTMLDivElement | null>(null);

  const DURATION_MS = session.devMode ? 10000 : 10 * 60 * 1000;

  // Maximum act unlocked by host or user progression
  const maxUnlockedActIndex = Math.max(
    session.maxActIndexReached || 0,
    hostSession?.currentActIndex || 0
  );

  // If looking at a past completed act, next moment is immediately available to browse
  const isPastAct = isHostControlled && hostSession && activeActIndex < hostSession.currentActIndex;

  // Reset ready state when changing acts
  useEffect(() => {
    setIsNextActReady(false);
  }, [activeActIndex, activeScenarioId]);

  // Ensure scroll is at the top whenever act index or state changes
  useEffect(() => {
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeActIndex, session.state]);

  const handleStartCourse = () => {
    if (isHostControlled && session.hostSessionId) {
      updateHostStoreSession(session.hostSessionId, {
        status: 'ACTIVE',
        currentActIndex: 0,
        actStartedAt: Date.now(),
        pausedAt: null
      });
    }
    beginActs();
  };

  const handleNextAct = () => {
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }

    // If guest was looking at a past act, advancing moves them toward current unlocked act
    if (activeActIndex < maxUnlockedActIndex) {
      goToAct(activeActIndex + 1);
      setIsNextActReady(false);
      return;
    }

    if (isHostControlled && session.hostSessionId) {
      if (scenario && activeActIndex < scenario.acts.length - 1) {
        advanceHostStoreSession(session.hostSessionId);
      } else {
        updateHostStoreSession(session.hostSessionId, { status: 'COMPLETED' });
      }
      setIsNextActReady(false);
      return;
    }

    if (scenario && activeActIndex < scenario.acts.length - 1) {
      advanceAct();
      setIsNextActReady(false);
    } else {
      endExperience();
    }
  };

  const handleGoBack = () => {
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }

    if (session.state === 'ACTS') {
      if (activeActIndex > 0) {
        // Guest can freely browse back through earlier acts
        goToAct(activeActIndex - 1);
        setIsNextActReady(false);
      } else {
        // Back to intro
        updateSession({ state: 'INTRO' });
      }
    } else if (session.state === 'END') {
      if (scenario) {
        goToAct(scenario.acts.length - 1);
        updateSession({ state: 'ACTS' });
      } else {
        updateSession({ state: isHostControlled ? 'INTRO' : 'HOME' });
      }
    } else if (session.state === 'INFO') {
      updateSession({ state: isHostControlled ? 'INTRO' : 'HOME' });
    } else if (session.state === 'INTRO' && !isHostControlled) {
      updateSession({ state: 'HOME', scenarioId: null });
    }
  };

  const handleGoForward = () => {
    if (actsContainerRef.current) {
      actsContainerRef.current.scrollTop = 0;
    }

    if (session.state === 'INTRO') {
      handleStartCourse();
    } else if (session.state === 'ACTS') {
      // If the guest is browsing a past act, they can move forward freely up to maxUnlockedActIndex
      if (activeActIndex < maxUnlockedActIndex) {
        goToAct(activeActIndex + 1);
        setIsNextActReady(false);
      } else if (session.devMode || isNextActReady || isPastAct) {
        // Bleeding edge act ready
        if (scenario && activeActIndex < scenario.acts.length - 1) {
          handleNextAct();
        } else if (scenario && activeActIndex === scenario.acts.length - 1) {
          endExperience();
        }
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

  // Trackpad horizontal scroll navigation between acts & scenes
  const wheelAccumulatorXRef = useRef(0);
  const wheelNavCooldownRef = useRef(false);

  const handleContainerWheel = (e: React.WheelEvent) => {
    if (session.state === 'HOME') return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 && Math.abs(e.deltaX) > 6) {
      if (wheelNavCooldownRef.current) return;

      wheelAccumulatorXRef.current += e.deltaX;
      const HORIZONTAL_WHEEL_THRESHOLD = 35;

      if (wheelAccumulatorXRef.current > HORIZONTAL_WHEEL_THRESHOLD) {
        handleGoForward();
        wheelNavCooldownRef.current = true;
        wheelAccumulatorXRef.current = 0;
        setTimeout(() => { wheelNavCooldownRef.current = false; }, 400);
      } else if (wheelAccumulatorXRef.current < -HORIZONTAL_WHEEL_THRESHOLD) {
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
        
        {session.state === 'HOME' && !isHostControlled && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="h-full w-full flex-grow flex flex-col items-center justify-between pt-12 pb-6 px-6 overflow-hidden relative select-none"
          >
            <TopActions 
              session={session} 
              updateSession={updateSession} 
              resetSession={resetSession} 
              toggleDevMode={toggleDevMode} 
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
            />
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

        {session.state === 'INFO' && (
          <motion.div 
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-grow flex flex-col items-center justify-center pt-12 pb-12 px-6 relative overflow-y-auto hide-scrollbar"
          >
            <TopActions 
              session={session} 
              updateSession={updateSession} 
              resetSession={resetSession} 
              toggleDevMode={toggleDevMode}
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
            />
            <GuestInfoCard 
              language={session.language} 
              onBack={() => updateSession({ state: isHostControlled ? 'INTRO' : 'HOME' })} 
            />
          </motion.div>
        )}

        {session.state === 'INTRO' && scenario && (
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
            <TopActions 
              session={session} 
              updateSession={updateSession} 
              resetSession={resetSession} 
              toggleDevMode={toggleDevMode}
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
            />
            <h2 className="text-2xl font-serif tracking-widest mb-12 flex-shrink-0">
              {scenario.title}
            </h2>
            <p className="text-sm font-serif leading-[2.0] text-text-muted whitespace-pre-wrap mb-12 flex-shrink-0">
              {scenario.introText}
            </p>
            <div className="flex flex-col items-center justify-end mt-auto w-full pb-2">
              <ElasticPullTrigger 
                label={t.firstCourseReady}
                onTrigger={handleStartCourse}
                containerRef={introContainerRef}
              />
            </div>
          </motion.div>
        )}

        {session.state === 'ACTS' && scenario && (
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
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
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
                  <Timer 
                    actStartedAt={isPastAct ? 0 : activeActStartedAt} 
                    durationMs={DURATION_MS} 
                    isPaused={isPastAct ? false : isPaused}
                    pausedAt={isPastAct ? null : pausedAt}
                    language={session.language}
                    onComplete={() => setIsNextActReady(true)}
                    isNextActReady={isNextActReady || isPastAct}
                    handleNextAct={handleNextAct}
                    containerRef={actsContainerRef}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {session.state === 'END' && (
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
            <TopActions 
              session={session} 
              updateSession={updateSession} 
              resetSession={resetSession} 
              toggleDevMode={toggleDevMode}
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
            />
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
