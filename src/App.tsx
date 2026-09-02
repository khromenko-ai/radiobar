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
import { useSessions, getSessions, saveSessions, fetchSessionById, DinnerSession } from './lib/store';
import { guestP2PNode } from './lib/p2p';

function ScrollToTopOnMount({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [containerRef]);
  return null;
}

function TopActions({ 
  session, 
  updateSession, 
  onReset, 
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
        <ThemeToggle onReset={onReset} onDemo={toggleDevMode} />
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
    const statusParam = params.get('status') as DinnerSession['status'] | null;
    const startedAtParam = params.get('startedAt');
    const pausedAtParam = params.get('pausedAt');
    const devParam = params.get('dev');

    if (sid || scenarioParam) {
      const actIdx = actParam !== null ? parseInt(actParam, 10) : 0;
      const targetScenario = scenarioParam || 'first-date';
      const targetLang = (langParam === 'ES' || langParam === 'EN' || langParam === 'RU') ? langParam : session.language;
      const validActIdx = isNaN(actIdx) ? 0 : actIdx;
      const isDevMode = devParam === '1' || (session.devMode ?? false);
      const parsedStatus: DinnerSession['status'] = statusParam || 'ACTIVE';
      const parsedStartedAt = startedAtParam ? parseInt(startedAtParam, 10) : (parsedStatus === 'WAITING' ? null : Date.now());
      const parsedPausedAt = pausedAtParam ? parseInt(pausedAtParam, 10) : null;

      if (sid) {
        // Immediate local initialization using QR snapshot
        const storedSessions = getSessions();
        const initialSnap: DinnerSession = {
          id: sid,
          tableName: tableParam ? decodeURIComponent(tableParam) : (storedSessions[sid]?.tableName || `Table ${sid}`),
          scenarioId: targetScenario,
          currentActIndex: validActIdx,
          status: parsedStatus,
          actStartedAt: parsedStartedAt,
          pausedAt: parsedPausedAt,
          devMode: isDevMode,
          updatedAt: Date.now()
        };
        storedSessions[sid] = { ...(storedSessions[sid] || {}), ...initialSnap };
        saveSessions(storedSessions);

        lastHostActIndexRef.current = validActIdx;
        lastHostStatusRef.current = parsedStatus;

        updateSession({
          hostSessionId: sid,
          scenarioId: targetScenario,
          currentActIndex: validActIdx,
          maxActIndexReached: validActIdx,
          state: parsedStatus === 'WAITING' ? 'INTRO' : (parsedStatus === 'COMPLETED' ? 'END' : 'ACTS'),
          actStartedAt: parsedStartedAt,
          language: targetLang,
          devMode: isDevMode,
        });

        // Initialize direct Peer-to-Peer connection to host's device
        guestP2PNode.init(sid, (hostLiveSession) => {
          if (hostLiveSession && hostLiveSession.id === sid) {
            const current = getSessions();
            current[sid] = hostLiveSession;
            saveSessions(current);
          }
        });

        // Background server fetch as fallback
        fetchSessionById(sid).then((serverSession) => {
          if (serverSession) {
            lastHostActIndexRef.current = serverSession.currentActIndex;
            lastHostStatusRef.current = serverSession.status;
            updateSession({
              hostSessionId: sid,
              scenarioId: serverSession.scenarioId || targetScenario,
              currentActIndex: serverSession.currentActIndex,
              maxActIndexReached: serverSession.currentActIndex,
              state: serverSession.status === 'WAITING' ? 'INTRO' : (serverSession.status === 'COMPLETED' ? 'END' : 'ACTS'),
              actStartedAt: serverSession.actStartedAt,
              language: targetLang,
              devMode: serverSession.devMode ?? isDevMode,
            });
          }
        });
      } else {
        updateSession({
          scenarioId: targetScenario,
          currentActIndex: validActIdx,
          maxActIndexReached: validActIdx,
          state: 'ACTS',
          actStartedAt: Date.now(),
          language: targetLang,
        });
      }

      setIsNextActReady(false);

      // Clean URL after consuming to keep UI elegant
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Connect guest P2P node whenever hostSessionId changes
  useEffect(() => {
    if (session.hostSessionId) {
      guestP2PNode.init(session.hostSessionId, (hostLiveSession) => {
        if (hostLiveSession && hostLiveSession.id === session.hostSessionId) {
          const current = getSessions();
          current[session.hostSessionId] = hostLiveSession;
          saveSessions(current);
        }
      });
    }
    return () => {
      // Keep connection active during session
    };
  }, [session.hostSessionId]);

  // Instant synchronization with hostSession changes
  useEffect(() => {
    if (!hostSession) return;

    // Update scenario if changed by host
    if (hostSession.scenarioId && hostSession.scenarioId !== session.scenarioId) {
      updateSession({ scenarioId: hostSession.scenarioId });
    }

    // Update language if changed by host
    if (hostSession.language && hostSession.language !== session.language) {
      updateSession({ language: hostSession.language });
    }

    // If host switched to a new act or moment, immediately jump guest screen to it
    if (hostSession.currentActIndex !== undefined && hostSession.currentActIndex !== lastHostActIndexRef.current) {
      lastHostActIndexRef.current = hostSession.currentActIndex;
      updateSession({
        currentActIndex: hostSession.currentActIndex,
        maxActIndexReached: hostSession.currentActIndex, // Clamp strictly to host's current act
        state: hostSession.status === 'WAITING' ? 'INTRO' : (hostSession.status === 'COMPLETED' ? 'END' : 'ACTS'),
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
  }, [hostSession, session.scenarioId, session.currentActIndex, session.state, session.language]);

  const validLanguage: Language = (session.language === 'EN' || session.language === 'ES' || session.language === 'RU') 
    ? session.language 
    : 'RU';
  const t = uiTranslations[validLanguage] || uiTranslations.RU;
  const currentScenarios = scenariosData[validLanguage] || scenariosData.RU;

  const activeScenarioId = hostSession?.scenarioId || session.scenarioId;
  const activeActIndex = session.currentActIndex;
  // Always use hostSession's actStartedAt when connected to a host
  const activeActStartedAt = isHostControlled ? hostSession?.actStartedAt : (session.actStartedAt || Date.now());
  const isPaused = isHostControlled ? (hostSession?.status === 'PAUSED') : false;
  const pausedAt = isHostControlled ? (hostSession?.pausedAt || null) : null;

  const scenario = activeScenarioId ? currentScenarios.find(s => s.id === activeScenarioId) : null;
  const [isNextActReady, setIsNextActReady] = useState(false);

  // Derive safe rendering state immediately
  let effectiveState = session.state;
  if ((effectiveState === 'INTRO' || effectiveState === 'ACTS') && !scenario) {
    effectiveState = 'HOME';
  }
  if (!['HOME', 'INFO', 'INTRO', 'ACTS', 'END'].includes(effectiveState)) {
    effectiveState = 'HOME';
  }

  // Safety fallback: if in INTRO or ACTS without a valid scenario, restore HOME in session state
  useEffect(() => {
    if ((session.state === 'INTRO' || session.state === 'ACTS') && !scenario) {
      updateSession({ state: 'HOME', scenarioId: null });
    }
  }, [session.state, scenario]);

  // Safety fallback: if currentActIndex is out of range, clamp it safely
  useEffect(() => {
    if (session.state === 'ACTS' && scenario && scenario.acts) {
      if (session.currentActIndex >= scenario.acts.length || session.currentActIndex < 0) {
        updateSession({ currentActIndex: 0 });
      }
    }
  }, [session.state, scenario, session.currentActIndex]);

  const handleThemeTripleClick = () => {
    // Triple click on theme button allows navigating to main menu (deck) even during a session
    updateSession({ state: 'HOME' });
  };

  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const introContainerRef = useRef<HTMLDivElement | null>(null);
  const actsContainerRef = useRef<HTMLDivElement | null>(null);

  const effectiveDevMode = hostSession?.devMode ?? session.devMode;
  const DURATION_MS = effectiveDevMode ? 10000 : 10 * 60 * 1000;

  // Maximum act unlocked:
  // In a host-controlled session, guest can NEVER go past hostSession.currentActIndex unless timer expires
  const maxUnlockedActIndex = isHostControlled && hostSession
    ? hostSession.currentActIndex
    : (session.maxActIndexReached || 0);

  // If looking at a past completed act, next moment is immediately available to return to
  const isPastAct = activeActIndex < maxUnlockedActIndex;

  // Reset ready state when changing acts
  useEffect(() => {
    setIsNextActReady(false);
  }, [activeActIndex, activeScenarioId]);

  // Ensure scroll is at the top whenever state changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [session.state]);

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
    // If guest was looking at an earlier past act, advancing moves them toward current active act
    if (isPastAct && activeActIndex < maxUnlockedActIndex) {
      goToAct(activeActIndex + 1);
      setIsNextActReady(false);
      return;
    }

    // Guest is on the current act: only allow advancing if timer is complete (isNextActReady)
    if (!isNextActReady) {
      return;
    }

    if (isHostControlled && session.hostSessionId) {
      // Guests CANNOT advance the host's session.
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
    if (session.state === 'INTRO') {
      handleStartCourse();
      return;
    }

    if (session.state !== 'ACTS' || !scenario) return;

    // If browsing past act, guest can move forward up to the current unlocked act
    if (isPastAct) {
      if (activeActIndex < maxUnlockedActIndex) {
        goToAct(activeActIndex + 1);
        setIsNextActReady(false);
      }
      return;
    }

    // On the current act: guest CANNOT move forward until timer is completed
    if (isNextActReady) {
      if (activeActIndex < scenario.acts.length - 1) {
        handleNextAct();
      } else if (activeActIndex === scenario.acts.length - 1) {
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
      
      <AnimatePresence mode="wait" initial={false}>
        
        {effectiveState === 'HOME' && (
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
              onReset={handleThemeTripleClick} 
              toggleDevMode={toggleDevMode} 
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
            />
            <ScenarioDeck 
              language={validLanguage} 
              activeSessionScenarioId={activeScenarioId}
              onSelect={(id) => {
                if (id === 'INFO_CARD') {
                  updateSession({ state: 'INFO' });
                } else if (id === activeScenarioId) {
                  // Returning to current ongoing session
                  if (hostSession) {
                    if (hostSession.status === 'WAITING') {
                      updateSession({ state: 'INTRO' });
                    } else if (hostSession.status === 'COMPLETED') {
                      updateSession({ state: 'END' });
                    } else {
                      updateSession({ state: 'ACTS' });
                    }
                  } else {
                    updateSession({ 
                      state: (session.currentActIndex > 0 || session.maxActIndexReached > 0) ? 'ACTS' : 'INTRO' 
                    });
                  }
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

        {effectiveState === 'INFO' && (
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
              onReset={handleThemeTripleClick} 
              toggleDevMode={toggleDevMode}
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
            />
            <GuestInfoCard 
              language={validLanguage} 
              onBack={() => updateSession({ state: isHostControlled ? 'INTRO' : 'HOME' })} 
            />
          </motion.div>
        )}

        {effectiveState === 'INTRO' && scenario && (
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
              onReset={handleThemeTripleClick} 
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

        {effectiveState === 'ACTS' && scenario && (
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
              onReset={handleThemeTripleClick} 
              toggleDevMode={toggleDevMode}
              isHostControlled={isHostControlled}
              tableName={hostSession?.tableName}
              leftContent={
                <span className="text-xs font-sans tracking-widest text-text-muted select-none font-medium">
                  {scenario.acts[activeActIndex]?.number}
                </span>
              }
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeActIndex}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="w-full flex-grow flex flex-col min-h-max"
              >
                <ScrollToTopOnMount containerRef={actsContainerRef} />
                <ActCard act={scenario.acts[activeActIndex]} language={validLanguage} />
                
                <div className="w-full pt-8 pb-4 flex justify-center shrink-0">
                  <Timer 
                    actStartedAt={isPastAct ? 0 : activeActStartedAt} 
                    durationMs={DURATION_MS} 
                    isPaused={isPastAct ? false : isPaused}
                    pausedAt={isPastAct ? null : pausedAt}
                    language={validLanguage}
                    onComplete={() => setIsNextActReady(true)}
                    isNextActReady={isNextActReady || isPastAct}
                    handleNextAct={handleNextAct}
                    containerRef={actsContainerRef}
                    isHostControlled={isHostControlled}
                    isPastAct={isPastAct}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {effectiveState === 'END' && (
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
              onReset={handleThemeTripleClick} 
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
