import React, { useState, useEffect } from 'react';
import { getHostAuth, setHostAuth, useSessions, DinnerSession, clearAllSiteData } from '../lib/store';
import { scenariosData, Language, uiTranslations, getActImage } from '../data/content';
import { useSession } from '../hooks/useSession';
import { buildGuestUrl } from '../lib/store';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CardsIcon } from './CardsIcon';
import { useActTimer } from './Timer';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Copy, Check, Trash2, Radio } from 'lucide-react';

export function HostApp() {
  const { session, updateSession, toggleDevMode } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(getHostAuth());
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleLogin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (pin === 'radiohost') {
        setHostAuth(true);
        setIsAuthenticated(true);
      } else {
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  const exitHostMode = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-text-main font-sans">
        <h1 className="text-sm tracking-[0.3em] text-text-muted mb-12">RADIOHOST</h1>
        <input
          type="password"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={handleLogin}
          className={`bg-transparent border-b border-border-focus text-center text-text-main text-xl focus:outline-none focus:border-text-main w-48 tracking-widest pb-2 transition-transform duration-100 ${isShaking ? 'translate-x-2' : ''}`}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-bg-main text-text-main font-sans overflow-y-auto overflow-x-hidden">
      {selectedSessionId ? (
        <HostSessionControl 
          sessionId={selectedSessionId} 
          onBack={() => setSelectedSessionId(null)} 
          language={session.language}
          onExit={exitHostMode}
          sessionState={session}
          updateGlobalSession={updateSession}
          toggleDevMode={toggleDevMode}
        />
      ) : (
        <HostDashboard 
          onSelectSession={setSelectedSessionId} 
          language={session.language}
          onExit={exitHostMode}
          sessionState={session}
          updateGlobalSession={updateSession}
          toggleDevMode={toggleDevMode}
        />
      )}
    </div>
  );
}

function HostTopBar({ 
  onExit, 
  sessionState, 
  updateGlobalSession, 
  toggleDevMode,
  showBackButton,
  onBack,
  title
}: { 
  onExit: () => void; 
  sessionState: any; 
  updateGlobalSession: any; 
  toggleDevMode: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
}) {
  return (
    <div className="flex justify-between items-center mb-6 pt-2">
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <button 
            onClick={onBack}
            className="text-[10px] tracking-[0.2em] text-text-muted hover:text-text-main uppercase transition-colors mr-2 cursor-pointer"
          >
            ← BACK
          </button>
        )}
        <button 
          onClick={onExit}
          className="flex items-center justify-center text-text-muted hover:text-text-main transition-colors h-5 w-5 select-none cursor-pointer"
          title="Exit to Guest Experience"
        >
          <CardsIcon size={16} />
        </button>
        {title && (
          <span className="text-[10px] tracking-[0.2em] text-text-muted uppercase font-medium">
            {title}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {sessionState.devMode && (
          <div className="w-2 h-2 rounded-full bg-red-500" title="Dev Mode Active" />
        )}
        <FullscreenToggle />
        <ThemeToggle onReset={() => {}} onDemo={toggleDevMode} />
        <LanguageToggle 
          current={sessionState.language} 
          onChange={(l) => updateGlobalSession({ language: l })}
          onDevModeToggle={toggleDevMode}
          onExitSession={() => {
            clearAllSiteData();
            onExit();
          }}
        />
      </div>
    </div>
  );
}

function HostSessionWidget({
  session: s,
  durationMs,
  language,
  onSelect,
  onQr,
}: {
  key?: string;
  session: DinnerSession;
  durationMs: number;
  language: Language;
  onSelect: () => void;
  onQr: () => void;
}) {
  const t = uiTranslations[language];
  const { updateSession } = useSessions();
  const { timeFormatted, isExpired } = useActTimer({
    actStartedAt: s.actStartedAt,
    durationMs,
    isPaused: s.status === 'PAUSED',
    pausedAt: s.pausedAt,
  });

  return (
    <div 
      className="border border-border-main rounded-2xl p-5 bg-bg-sub hover:border-border-focus transition-colors flex justify-between items-center group cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-base font-serif tracking-wide text-text-main font-medium">{s.tableName}</span>
          <span className={`text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded ${
            s.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 
            s.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-400' : 
            'bg-zinc-500/10 text-text-sub'
          }`}>
            {s.status}
          </span>
        </div>
        <div className="text-[10px] tracking-[0.15em] text-text-muted uppercase mb-2 truncate">
          {scenariosData[language].find(x => x.id === s.scenarioId)?.title}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.15em] text-text-sub uppercase font-medium">
            {t.hostAct} {(s.currentActIndex + 1).toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] text-border-focus select-none">•</span>
          <span className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded ${
            s.status === 'WAITING' ? 'text-text-muted bg-bg-elevated/50' :
            s.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-400 font-medium' :
            isExpired ? 'bg-text-main/10 text-text-main font-semibold' :
            'bg-bg-elevated text-text-main font-medium border border-border-main/60'
          }`}>
            {s.status === 'WAITING' ? (language === 'RU' ? 'ОЖИДАНИЕ' : (language === 'ES' ? 'EN ESPERA' : 'WAITING')) : timeFormatted}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <select
          value={s.language || 'ES'}
          onChange={(e) => updateSession(s.id, { language: e.target.value as Language })}
          className="bg-bg-main border border-border-main text-[10px] text-text-sec focus:outline-none focus:border-border-focus rounded-xl px-2 py-2.5 uppercase cursor-pointer"
          title="Session Language"
        >
          <option value="ES">ES</option>
          <option value="EN">EN</option>
          <option value="RU">RU</option>
        </select>
        <button
          onClick={onQr}
          className="p-3 border border-border-main rounded-xl hover:border-border-focus hover:bg-bg-elevated text-text-sub hover:text-text-main transition-colors flex items-center justify-center cursor-pointer"
          title={t.hostQrCode}
        >
          <QrCode size={18} />
        </button>
      </div>
    </div>
  );
}

function HostDashboard({ 
  onSelectSession, 
  language,
  onExit,
  sessionState,
  updateGlobalSession,
  toggleDevMode
}: { 
  onSelectSession: (id: string) => void; 
  language: Language;
  onExit: () => void;
  sessionState: any;
  updateGlobalSession: any;
  toggleDevMode: () => void;
}) {
  const t = uiTranslations[language];
  const { sessions, createSession, deleteSession } = useSessions();
  const [newTable, setNewTable] = useState('');
  const [newScenario, setNewScenario] = useState('first-date');
  const [newLanguage, setNewLanguage] = useState<Language>('ES');
  const [qrSession, setQrSession] = useState<DinnerSession | null>(null);

  const durationMs = sessionState.devMode ? 10000 : 10 * 60 * 1000;

  const sessionValues = Object.values(sessions) as DinnerSession[];
  const activeSessions = sessionValues
    .filter(s => s.status !== 'COMPLETED')
    .sort((a, b) => (b.updatedAt || b.actStartedAt || 0) - (a.updatedAt || a.actStartedAt || 0));
  const completedSessions = sessionValues
    .filter(s => s.status === 'COMPLETED')
    .sort((a, b) => (b.completedAt || b.updatedAt || 0) - (a.completedAt || a.updatedAt || 0));

  const handleCreate = () => {
    if (!newTable.trim()) return;
    const id = createSession(newTable.trim(), newScenario, sessionState.devMode, newLanguage);
    setNewTable('');
    onSelectSession(id);
  };

  return (
    <div className="max-w-md mx-auto p-6 min-h-full flex flex-col justify-between pb-20">
      <HostTopBar 
        onExit={onExit} 
        sessionState={sessionState} 
        updateGlobalSession={updateGlobalSession} 
        toggleDevMode={toggleDevMode} 
      />

      <div className="flex justify-between items-center mb-8 mt-2">
        <h1 className="text-xs tracking-[0.3em] text-text-muted font-medium">RADIOHOST</h1>
      </div>

      {/* CREATE NEW DINNER */}
      <div className="mb-10 border border-border-main rounded-2xl p-6 bg-bg-sub shadow-sm">
        <h2 className="text-[10px] tracking-[0.2em] text-text-muted mb-6 uppercase">{t.hostNewDinner}</h2>
        <div className="flex flex-col space-y-5 mb-8">
          <input 
            type="text" 
            placeholder={t.hostTableSession} 
            value={newTable} 
            onChange={e => setNewTable(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="bg-transparent border-b border-border-focus text-sm text-text-main focus:outline-none focus:border-text-main tracking-widest pb-2 uppercase placeholder-[#555]"
          />
          <select 
            value={newScenario} 
            onChange={e => setNewScenario(e.target.value)}
            className="bg-transparent border-b border-border-focus text-sm text-text-sec focus:outline-none focus:border-text-main tracking-widest pb-2 uppercase appearance-none cursor-pointer"
          >
            <option value="first-date" className="bg-bg-elevated">{scenariosData[language].find(x => x.id === 'first-date')?.title}</option>
            <option value="best-friends" className="bg-bg-elevated">{scenariosData[language].find(x => x.id === 'best-friends')?.title}</option>
            <option value="relationship-reboost" className="bg-bg-elevated">{scenariosData[language].find(x => x.id === 'relationship-reboost')?.title}</option>
          </select>
          <select 
            value={newLanguage} 
            onChange={e => setNewLanguage(e.target.value as Language)}
            className="bg-transparent border-b border-border-focus text-sm text-text-sec focus:outline-none focus:border-text-main tracking-widest pb-2 uppercase appearance-none cursor-pointer"
          >
            <option value="ES" className="bg-bg-elevated">ESPAÑOL</option>
            <option value="EN" className="bg-bg-elevated">ENGLISH</option>
            <option value="RU" className="bg-bg-elevated">РУССКИЙ</option>
          </select>
        </div>
        <button 
          onClick={handleCreate}
          disabled={!newTable.trim()}
          className="w-full py-4 border border-border-focus rounded-xl text-[10px] tracking-[0.2em] text-text-main hover:bg-bg-inv hover:text-text-inv transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-main uppercase font-medium cursor-pointer"
        >
          {t.hostStartDinner}
        </button>
      </div>

      {/* ACTIVE SESSIONS */}
      <h2 className="text-[10px] tracking-[0.2em] text-text-muted mb-4 uppercase">{t.hostActiveDinners}</h2>
      {activeSessions.length === 0 && <p className="text-xs text-text-sub tracking-widest mb-10">{t.hostNoActive}</p>}
      
      <div className="flex flex-col space-y-4 mb-10">
        {activeSessions.map(s => (
          <HostSessionWidget
            key={s.id}
            session={s}
            durationMs={durationMs}
            language={language}
            onSelect={() => onSelectSession(s.id)}
            onQr={() => setQrSession(s)}
          />
        ))}
      </div>

      {/* COMPLETED SESSIONS */}
      {completedSessions.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] tracking-[0.2em] text-text-muted uppercase">{t.hostCompletedToday}</h2>
            <span className="text-[9px] font-sans tracking-widest text-text-sub uppercase">
              {language === 'RU' ? 'Автоудаление через 1ч' : (language === 'ES' ? 'Auto-borrado en 1h' : 'Auto-delete in 1h')}
            </span>
          </div>
          <div className="flex flex-col space-y-3 mb-10">
            {completedSessions.map(s => (
              <div 
                key={s.id} 
                className="border border-border-main rounded-xl p-4 bg-bg-sub flex justify-between items-center group cursor-pointer hover:border-border-focus transition-colors"
                onClick={() => onSelectSession(s.id)}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-serif tracking-wide text-text-muted font-medium">{s.tableName}</span>
                    <span className="text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-zinc-500/10 text-text-sub">
                      COMPLETED
                    </span>
                  </div>
                  <div className="text-[10px] tracking-[0.15em] text-text-sub uppercase truncate">
                    {scenariosData[language].find(x => x.id === s.scenarioId)?.title}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  className="p-2.5 border border-border-main rounded-lg hover:border-red-500/40 hover:bg-red-500/10 text-text-sub hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer"
                  title={language === 'RU' ? 'Удалить сессию' : 'Delete session'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* QR MODAL */}
      {qrSession && (
        <QrFullscreenModal 
          session={qrSession} 
          language={language} 
          onClose={() => setQrSession(null)} 
        />
      )}
    </div>
  );
}

function HostSessionControl({ 
  sessionId, 
  onBack, 
  language,
  onExit,
  sessionState,
  updateGlobalSession,
  toggleDevMode
}: { 
  sessionId: string; 
  onBack: () => void; 
  language: Language;
  onExit: () => void;
  sessionState: any;
  updateGlobalSession: any;
  toggleDevMode: () => void;
}) {
  const t = uiTranslations[language];
  const { sessions, updateSession, advanceSession, deleteSession } = useSessions();
  const session = sessions[sessionId];
  const [showQrModal, setShowQrModal] = useState(false);

  // Auto fallback if session was deleted
  if (!session) {
    return (
      <div className="max-w-md mx-auto p-6">
        <HostTopBar 
          onExit={onExit} 
          sessionState={sessionState} 
          updateGlobalSession={updateGlobalSession} 
          toggleDevMode={toggleDevMode}
          showBackButton
          onBack={onBack}
        />
        <p className="text-xs text-text-sub tracking-widest">{t.hostNoActive}</p>
      </div>
    );
  }

  const scenario = scenariosData[language].find(s => s.id === session.scenarioId);
  if (!scenario) return null;

  const durationMs = (session.devMode ?? sessionState.devMode) ? 10000 : 10 * 60 * 1000;
  const { timeFormatted, isExpired } = useActTimer({
    actStartedAt: session.actStartedAt,
    durationMs,
    isPaused: session.status === 'PAUSED',
    pausedAt: session.pausedAt,
  });

  const currentAct = scenario.acts[session.currentActIndex];
  const nextAct = scenario.acts[session.currentActIndex + 1];

  const handleStart = () => {
    updateSession(session.id, { 
      status: 'ACTIVE', 
      actStartedAt: Date.now(),
      pausedAt: null 
    });
  };

  const handlePauseToggle = () => {
    if (session.status === 'PAUSED') {
      const elapsedPaused = session.pausedAt ? Date.now() - session.pausedAt : 0;
      updateSession(session.id, {
        status: 'ACTIVE',
        actStartedAt: (session.actStartedAt || Date.now()) + elapsedPaused,
        pausedAt: null
      });
    } else {
      updateSession(session.id, {
        status: 'PAUSED',
        pausedAt: Date.now()
      });
    }
  };

  const handleNextMoment = () => {
    if (session.currentActIndex < scenario.acts.length - 1) {
      advanceSession(session.id);
    } else {
      updateSession(session.id, { status: 'COMPLETED', completedAt: Date.now() });
    }
  };

  const handleRestartTimer = () => {
    updateSession(session.id, {
      actStartedAt: Date.now(),
      status: 'ACTIVE',
      pausedAt: null
    });
  };

  // Construct guest URL with moment precision and timing snapshot
  const guestUrl = buildGuestUrl(session, sessionState.devMode);

  return (
    <div className="max-w-md mx-auto p-6 min-h-full flex flex-col justify-between pb-24">
      <div>
        <HostTopBar 
          onExit={onExit} 
          sessionState={sessionState} 
          updateGlobalSession={updateGlobalSession} 
          toggleDevMode={toggleDevMode}
          showBackButton
          onBack={onBack}
          title={session.tableName}
        />

        {/* HEADER INFO */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b border-border-main">
          <div className="flex-1 min-w-0 pr-3">
            <span className="text-xl font-serif tracking-wide text-text-main font-medium">{session.tableName}</span>
            <div className="text-[10px] tracking-[0.2em] text-text-sub mt-1 uppercase truncate">
              {scenario.title}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={session.language || 'ES'}
              onChange={(e) => updateSession(session.id, { language: e.target.value as Language })}
              className="bg-bg-sub border border-border-main text-[10px] text-text-sec focus:outline-none focus:border-border-focus rounded-xl px-2.5 py-1.5 uppercase cursor-pointer font-medium"
              title="Session Language"
            >
              <option value="ES">ESPAÑOL</option>
              <option value="EN">ENGLISH</option>
              <option value="RU">РУССКИЙ</option>
            </select>
            <button
              onClick={() => setShowQrModal(true)}
              className="px-2.5 py-1.5 border border-border-focus rounded-xl bg-bg-sub hover:bg-bg-elevated text-text-sec hover:text-text-main transition-colors flex items-center gap-1.5 cursor-pointer text-[10px] tracking-wider uppercase font-medium"
              title={t.hostQrCode}
            >
              <QrCode size={14} />
              <span>QR</span>
            </button>
            <span className={`text-[9px] tracking-widest uppercase px-2 py-1 rounded font-medium ${
              session.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 
              session.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-400' : 
              'bg-zinc-500/10 text-text-sub'
            }`}>
              {session.status}
            </span>
          </div>
        </div>

        {/* CURRENT MOMENT CARD */}
        <div className="border border-border-main rounded-2xl p-6 bg-bg-sub mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] tracking-[0.2em] text-text-muted uppercase font-medium">
              {t.hostAct} {(session.currentActIndex + 1).toString().padStart(2, '0')} / {scenario.acts.length.toString().padStart(2, '0')}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded font-medium ${
                session.status === 'WAITING' ? 'text-text-muted bg-bg-elevated/60' :
                session.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-400' :
                isExpired ? 'bg-text-main/10 text-text-main font-semibold' :
                'bg-bg-elevated text-text-main border border-border-main font-medium'
              }`}>
                {session.status === 'WAITING' ? (language === 'RU' ? 'ОЖИДАНИЕ' : (language === 'ES' ? 'EN ESPERA' : 'WAITING')) : timeFormatted}
              </span>
              {currentAct?.theme && (
                <span className="text-[10px] tracking-[0.2em] text-text-sub font-mono uppercase hidden sm:inline">
                  {currentAct.theme}
                </span>
              )}
            </div>
          </div>

          <h3 className="text-xl font-serif tracking-wide mb-3 text-text-main font-medium">{currentAct?.dishName}</h3>
          <p className="text-xs font-serif leading-relaxed text-text-muted mb-6 whitespace-pre-wrap">{currentAct?.dishDescription}</p>
          
          {/* HOST CUES */}
          <div className="space-y-4 pt-4 border-t border-border-main/50">
            <div>
              <div className="text-[9px] tracking-[0.2em] text-text-sub mb-1.5 uppercase font-medium">{t.hostCurrent}</div>
              <div className="text-xs font-serif text-text-sec leading-relaxed italic">{currentAct?.title}</div>
            </div>
            {currentAct?.instruction && (
              <div>
                <div className="text-[9px] tracking-[0.2em] text-text-sub mb-1.5 uppercase font-medium">{t.theDish}</div>
                <div className="text-xs font-sans text-text-sub leading-relaxed">{currentAct?.instruction}</div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[9px] tracking-[0.2em] text-text-sub uppercase font-medium">{t.hostTimeRemaining}</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono tracking-widest ${
                  session.status === 'PAUSED' ? 'text-yellow-400' :
                  isExpired ? 'text-text-main font-bold' :
                  'text-text-main font-medium'
                }`}>
                  {session.status === 'WAITING' ? (language === 'RU' ? 'ОЖИДАНИЕ СТАРТА' : (language === 'ES' ? 'EN ESPERA' : 'WAITING')) : (isExpired ? (language === 'RU' ? '00:00 (ГОТОВО)' : '00:00 (READY)') : timeFormatted)}
                </span>
                {session.status === 'ACTIVE' && (
                  <button 
                    onClick={handleRestartTimer}
                    className="text-[9px] font-sans tracking-wider text-text-muted hover:text-text-main uppercase transition-colors ml-1 cursor-pointer"
                    title={t.hostRestartTimer}
                  >
                    ↺
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {session.status === 'WAITING' ? (
             <button 
              onClick={handleStart} 
              className="col-span-2 py-4 border border-border-focus rounded-xl text-[10px] tracking-[0.2em] text-text-main hover:bg-bg-inv hover:text-text-inv transition-colors uppercase font-medium cursor-pointer"
            >
              {t.hostStartSession}
            </button>
          ) : (
            <>
              <button 
                onClick={handlePauseToggle} 
                className="py-4 border border-border-main rounded-xl text-[10px] tracking-[0.2em] text-text-muted hover:text-text-main hover:border-border-focus transition-colors uppercase cursor-pointer"
              >
                {session.status === 'PAUSED' ? t.hostResume : t.hostPause}
              </button>
              <button 
                onClick={handleNextMoment} 
                className="py-4 border border-border-focus rounded-xl text-[10px] tracking-[0.2em] text-text-main hover:bg-bg-inv hover:text-text-inv transition-colors uppercase font-medium cursor-pointer"
              >
                {session.currentActIndex === scenario.acts.length - 1 ? t.hostEndDinner : t.hostAdvanceAct}
              </button>
            </>
          )}
        </div>

        {/* QUICK ACT SELECTOR */}
        <div className="border border-border-main rounded-2xl p-4 bg-bg-sub mb-8 shadow-sm">
          <div className="text-[10px] tracking-[0.2em] text-text-muted mb-3 uppercase">
            {t.hostAct} Selector
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {scenario.acts.map((act, idx) => {
              const isCurrent = idx === session.currentActIndex;
              return (
                <button
                  key={act.id}
                  onClick={() => {
                    updateSession(session.id, {
                      currentActIndex: idx,
                      actStartedAt: Date.now(),
                      status: 'ACTIVE',
                      pausedAt: null
                    });
                  }}
                  className={`py-2 text-[11px] font-mono rounded-lg border transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-text-main text-bg-main border-text-main font-semibold' 
                      : 'bg-bg-main text-text-sub border-border-main hover:border-border-focus hover:text-text-main'
                  }`}
                  title={`${act.number}: ${act.theme}`}
                >
                  {act.number}
                </button>
              );
            })}
          </div>
        </div>

        {/* NEXT MOMENT PREVIEW */}
        {nextAct && (
          <div className="border border-border-main rounded-2xl p-6 bg-bg-sub mb-8">
            <h4 className="text-[10px] tracking-[0.2em] text-text-sub mb-4 uppercase">{t.hostNext}</h4>
            <div className="flex items-start gap-4">
              <img 
                src={getActImage(nextAct)} 
                alt={nextAct.dishName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-border-main/50"
              />
              <div>
                <div className="text-sm font-serif tracking-wide mb-1 text-text-muted">{t.hostAct} {nextAct.number} — {nextAct.theme}</div>
                <div className="text-xs font-serif text-text-sub whitespace-pre-wrap leading-relaxed">{nextAct.dishName}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 pb-8 opacity-60">
        <button 
          onClick={() => { if(confirm('Reset dinner to start?')) updateSession(session.id, { currentActIndex: 0, status: 'WAITING', actStartedAt: null, pausedAt: null }) }} 
          className="text-[10px] tracking-widest text-text-muted hover:text-text-main uppercase transition-colors cursor-pointer"
        >
          {t.hostResetToStart}
        </button>
        <button 
          onClick={() => { 
            if(confirm(language === 'RU' ? 'Завершить и удалить эту сессию?' : 'End and delete this session?')) {
              deleteSession(session.id);
              onBack();
            }
          }} 
          className="text-[10px] tracking-widest text-text-muted hover:text-red-400 uppercase transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 size={12} />
          {language === 'RU' ? 'Удалить сессию' : 'Delete Session'}
        </button>
      </div>

      {/* FULLSCREEN QR CODE MODAL */}
      {showQrModal && (
        <QrFullscreenModal 
          session={session} 
          language={language} 
          onClose={() => setShowQrModal(false)} 
        />
      )}
    </div>
  );
}

function QrFullscreenModal({ 
  session, 
  language, 
  onClose 
}: { 
  session: DinnerSession; 
  language: Language; 
  onClose: () => void; 
}) {
  const t = uiTranslations[language];
  const scenario = scenariosData[language].find(s => s.id === session.scenarioId);
  const currentAct = scenario?.acts[session.currentActIndex];
  const [copied, setCopied] = useState(false);

  // Exact URL with moment precision and timing snapshot
  const guestUrl = buildGuestUrl(session, session.devMode);

  const handleCopy = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-bg-main border border-border-main rounded-3xl p-8 flex flex-col items-center shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full border border-border-main hover:border-border-focus text-text-sub hover:text-text-main transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <div className="text-[10px] tracking-[0.25em] text-text-sub uppercase mb-1">{session.tableName}</div>
          <h2 className="text-lg font-serif tracking-wide text-text-main font-medium">{scenario?.title}</h2>
          <div className="text-xs font-serif text-text-muted mt-1">
            {t.hostAct} {currentAct?.number} — {currentAct?.dishName}
          </div>
        </div>

        {/* QR CODE CONTAINER WITH SAFE PADDING FOR SCANNERS */}
        <div className="bg-white p-5 rounded-2xl shadow-inner mb-6 flex items-center justify-center">
          <QRCodeSVG 
            value={guestUrl} 
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-[10px] tracking-[0.15em] text-text-sub text-center uppercase mb-6 leading-relaxed">
          {t.hostScanQr}
        </p>

        {/* COPY DIRECT LINK BUTTON */}
        <button
          onClick={handleCopy}
          className="w-full py-3.5 border border-border-focus rounded-xl text-[10px] tracking-[0.2em] text-text-main hover:bg-bg-inv hover:text-text-inv transition-colors flex items-center justify-center gap-2 uppercase font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span>{t.hostCopied}</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>{t.hostCopyLink}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
