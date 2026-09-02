import React, { useState, useEffect } from 'react';
import { getHostAuth, setHostAuth, useSessions, DinnerSession } from '../lib/store';
import { scenariosData, Language, uiTranslations, getActImage } from '../data/content';
import { useSession } from '../hooks/useSession';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CardsIcon } from './CardsIcon';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Copy, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-bg-main text-text-main font-sans overflow-y-auto">
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
  toggleDevMode 
}: { 
  onExit: () => void; 
  sessionState: any; 
  updateGlobalSession: any; 
  toggleDevMode: () => void; 
}) {
  return (
    <div className="w-full flex items-center justify-between pt-3 pb-3 select-none">
      <button 
        onClick={onExit}
        className="text-text-sub hover:text-text-main transition-colors p-2 -ml-2 flex items-center justify-center cursor-pointer"
        title="Cards"
      >
        <CardsIcon size={20} />
      </button>
      <div className="flex items-center space-x-4 h-6">
        <FullscreenToggle />
        <ThemeToggle onReset={() => {}} onDemo={toggleDevMode} />
        <LanguageToggle 
          current={sessionState.language} 
          onChange={(l) => updateGlobalSession({ language: l })}
          onDevModeToggle={toggleDevMode}
        />
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
  const { sessions, createSession } = useSessions();
  const [newTable, setNewTable] = useState('');
  const [newScenario, setNewScenario] = useState('first-date');
  const [qrSession, setQrSession] = useState<DinnerSession | null>(null);

  const sessionValues = Object.values(sessions) as DinnerSession[];
  const activeSessions = sessionValues.filter(s => s.status !== 'COMPLETED');
  const completedSessions = sessionValues.filter(s => s.status === 'COMPLETED');

  const handleCreate = () => {
    if (!newTable.trim()) return;
    const id = createSession(newTable.trim(), newScenario);
    setNewTable('');
    onSelectSession(id);
  };

  return (
    <div className="max-w-xl mx-auto p-6 pt-2 pb-24">
      {/* Top Header Bar that scrolls with content */}
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
          <div 
            key={s.id} 
            className="border border-border-main rounded-2xl p-5 bg-bg-sub hover:border-border-focus transition-colors flex justify-between items-center group cursor-pointer"
            onClick={() => onSelectSession(s.id)}
          >
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-base font-serif tracking-wide text-text-main font-medium">{s.tableName}</span>
                <span className={`text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded ${s.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {s.status}
                </span>
              </div>
              <div className="text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1 truncate">
                {scenariosData[language].find(x => x.id === s.scenarioId)?.title}
              </div>
              <div className="text-[10px] tracking-[0.15em] text-text-sub uppercase">
                {t.hostAct} {(s.currentActIndex + 1).toString().padStart(2, '0')}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setQrSession(s);
              }}
              className="p-3 border border-border-main rounded-xl hover:border-border-focus hover:bg-bg-elevated text-text-sub hover:text-text-main transition-colors flex items-center justify-center cursor-pointer"
              title={t.hostQrCode}
            >
              <QrCode size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* COMPLETED SESSIONS */}
      {completedSessions.length > 0 && (
        <>
          <h2 className="text-[10px] tracking-[0.2em] text-text-muted mb-4 uppercase">{t.hostCompletedToday}</h2>
          <div className="flex flex-col space-y-3 mb-10 opacity-60">
            {completedSessions.map(s => (
              <div key={s.id} className="border border-border-main rounded-xl p-4 bg-bg-sub">
                <div className="text-sm font-serif tracking-wide text-text-muted mb-1">{s.tableName}</div>
                <div className="text-[10px] tracking-[0.15em] text-text-sub uppercase">
                  {scenariosData[language].find(x => x.id === s.scenarioId)?.title}
                </div>
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
  const { sessions, updateSession, advanceSession, endSession } = useSessions();
  const session = sessions[sessionId];
  const scenario = scenariosData[language].find(s => s.id === session?.scenarioId);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!session || !scenario) return null;

  const currentAct = scenario.acts[session.currentActIndex];
  const nextAct = scenario.acts[session.currentActIndex + 1];

  // Time calculations
  const durationMs = 10 * 60 * 1000;
  let timeRemaining = durationMs;
  if (session.actStartedAt) {
    if (session.status === 'PAUSED' && session.pausedAt) {
      timeRemaining = Math.max(0, durationMs - (session.pausedAt - session.actStartedAt));
    } else {
      timeRemaining = Math.max(0, durationMs - (now - session.actStartedAt));
    }
  }

  const mins = Math.floor(timeRemaining / 60000).toString().padStart(2, '0');
  const secs = Math.floor((timeRemaining % 60000) / 1000).toString().padStart(2, '0');

  const handlePauseResume = () => {
    if (session.status === 'ACTIVE') {
      updateSession(session.id, { status: 'PAUSED', pausedAt: Date.now() });
    } else if (session.status === 'PAUSED' && session.pausedAt && session.actStartedAt) {
      const elapsed = session.pausedAt - session.actStartedAt;
      updateSession(session.id, { status: 'ACTIVE', actStartedAt: Date.now() - elapsed, pausedAt: null });
    }
  };

  const handleStart = () => {
    updateSession(session.id, { status: 'ACTIVE', actStartedAt: Date.now(), pausedAt: null });
  };

  const handleAdvance = () => {
    if (nextAct) {
      advanceSession(session.id);
    } else {
      if (confirm("End dinner?")) endSession(session.id);
    }
  };

  // Construct official radio.khromenko.com guest URL with moment precision
  const guestUrl = `https://radio.khromenko.com/?session=${session.id}&scenario=${session.scenarioId}&act=${session.currentActIndex}&table=${encodeURIComponent(session.tableName)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto p-6 pt-2 pb-24 flex flex-col">
      {/* Top Header Bar that scrolls with content */}
      <HostTopBar 
        onExit={onExit} 
        sessionState={sessionState} 
        updateGlobalSession={updateGlobalSession} 
        toggleDevMode={toggleDevMode} 
      />

      <div className="mt-1 mb-6">
        <button 
          onClick={onBack} 
          className="text-[10px] tracking-[0.2em] text-text-muted hover:text-text-main transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← {t.hostActiveDinners}
        </button>
      </div>
      
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-2xl font-serif tracking-wide text-text-main">{session.tableName}</h2>
        <span className="text-[10px] font-sans tracking-widest text-text-sub bg-bg-elevated px-2.5 py-1 rounded">{t.hostId} {session.id}</span>
      </div>
      
      <h3 className="text-[10px] tracking-[0.2em] text-text-muted mb-6 uppercase">{scenario.title}</h3>

      {/* SHARE LINK & QR CODE SECTION */}
      <div className="mb-8 bg-bg-sub border border-border-main rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono tracking-tight text-text-muted truncate flex-1 bg-bg-main px-3 py-2 rounded-lg border border-border-main/60 select-all">
            {guestUrl}
          </div>
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-[10px] font-sans tracking-widest text-text-main hover:bg-bg-elevated border border-border-focus px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? t.hostCopied : t.hostCopyLink}
          </button>
        </div>

        {/* FULLSCREEN QR CODE BUTTON */}
        <button
          onClick={() => setShowQrModal(true)}
          className="w-full py-3 bg-bg-elevated hover:bg-bg-hover text-text-main border border-border-main hover:border-border-focus rounded-xl text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-medium"
        >
          <QrCode size={15} />
          {t.hostQrCode}
        </button>
      </div>

      {/* CURRENT MOMENT CARD */}
      <div className="border border-border-main rounded-2xl p-6 bg-bg-sub mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[10px] tracking-[0.2em] text-text-muted uppercase">{t.hostCurrent}</h4>
          <div className={`text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 rounded ${session.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
            {session.status}
          </div>
        </div>

        <div className="text-2xl font-serif tracking-wide mb-1 text-text-main">
          {t.hostAct} {currentAct.number} / {scenario.acts.length.toString().padStart(2, '0')}
        </div>
        <div className="text-[10px] tracking-[0.2em] text-text-muted mb-6 uppercase">{currentAct.theme}</div>
        
        <h4 className="text-[10px] tracking-[0.2em] text-text-sub mb-3 uppercase">{t.hostDish}</h4>
        <div className="flex items-start gap-4 mb-6">
          <img 
            src={getActImage(currentAct)} 
            alt={currentAct.dishName}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-border-main/50 shadow-sm"
          />
          <div className="text-sm font-serif tracking-wide text-text-sec whitespace-pre-wrap leading-relaxed">
            {currentAct.dishName}
          </div>
        </div>

        <div className="border-t border-border-main pt-5 flex justify-between items-center">
          <div>
            <h4 className="text-[10px] tracking-[0.2em] text-text-sub mb-1.5 uppercase">{t.hostTimeRemaining}</h4>
            <div className="text-2xl font-sans tracking-widest text-text-main font-light">
              {session.actStartedAt ? `${mins}:${secs}` : '--:--'}
            </div>
          </div>
          {session.status !== 'WAITING' && (
            <button 
              onClick={() => { if(confirm('Restart act timer?')) updateSession(session.id, { actStartedAt: Date.now(), status: 'ACTIVE', pausedAt: null }) }} 
              className="text-[10px] tracking-[0.15em] text-text-sub hover:text-text-main transition-colors border border-border-main hover:border-border-focus px-3 py-1.5 rounded-lg cursor-pointer uppercase"
            >
              {t.hostRestartTimer}
            </button>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {session.status === 'WAITING' ? (
           <button 
            onClick={handleStart} 
            className="col-span-2 py-4 border border-border-focus text-[10px] tracking-[0.2em] rounded-xl hover:bg-bg-inv hover:text-text-inv transition-colors uppercase font-medium cursor-pointer"
          >
            {t.hostStartExperience}
          </button>
        ) : (
          <>
            <button 
              onClick={handlePauseResume} 
              className="py-4 border border-border-focus text-[10px] tracking-[0.2em] rounded-xl hover:bg-bg-elevated transition-colors uppercase text-text-main font-medium cursor-pointer"
            >
              {session.status === 'PAUSED' ? t.hostResume : t.hostPause}
            </button>
            <button 
              onClick={handleAdvance} 
              className="py-4 border border-border-focus text-[10px] tracking-[0.2em] rounded-xl hover:bg-bg-inv hover:text-text-inv transition-colors uppercase font-medium cursor-pointer"
            >
              {nextAct ? t.hostAdvanceAct : t.hostEndDinner}
            </button>
          </>
        )}
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

      <div className="mt-8 flex justify-center pb-8 opacity-60">
        <button 
          onClick={() => { if(confirm('Reset dinner to start?')) updateSession(session.id, { currentActIndex: 0, status: 'WAITING', actStartedAt: null, pausedAt: null }) }} 
          className="text-[10px] tracking-widest text-text-muted hover:text-red-400 uppercase transition-colors cursor-pointer"
        >
          {t.hostResetToStart}
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

  // Exact URL on radio.khromenko.com pointing to the specific moment
  const guestUrl = `https://radio.khromenko.com/?session=${session.id}&scenario=${session.scenarioId}&act=${session.currentActIndex}&table=${encodeURIComponent(session.tableName)}`;

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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-bg-main border border-border-focus rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl text-text-main"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-sub hover:text-text-main rounded-full hover:bg-bg-elevated transition-colors cursor-pointer"
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <span className="text-[10px] font-sans tracking-[0.25em] text-text-muted uppercase mb-1">
          RADIO DINNER
        </span>
        <h3 className="text-xl font-serif tracking-wide text-text-main mb-1">
          {session.tableName}
        </h3>
        {scenario && (
          <p className="text-[11px] font-sans tracking-wider text-text-sub uppercase mb-5">
            {scenario.title} • {t.hostAct} {currentAct?.number || 'I'}
          </p>
        )}

        {/* QR Code Card (High Contrast White Container for 100% Reliable Camera Scanning) */}
        <div className="p-5 bg-white rounded-2xl shadow-lg mb-5 flex items-center justify-center">
          <QRCodeSVG 
            value={guestUrl} 
            size={220} 
            level="Q"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        {/* Scan instruction */}
        <p className="text-xs font-serif text-text-sec mb-4 max-w-[260px]">
          {t.hostScanQr}
        </p>

        {/* URL Pill */}
        <div className="w-full bg-bg-elevated rounded-xl p-2.5 mb-4 flex items-center justify-between gap-2 border border-border-main">
          <span className="text-[10px] font-mono text-text-muted truncate select-all px-1">
            {guestUrl}
          </span>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 text-[9px] font-sans tracking-widest text-text-main border border-border-focus px-2.5 py-1 rounded-md hover:bg-bg-hover transition-colors whitespace-nowrap cursor-pointer"
          >
            {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            {copied ? t.hostCopied : t.hostCopyLink}
          </button>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 border border-border-focus rounded-xl text-[10px] tracking-[0.2em] uppercase text-text-main hover:bg-bg-inv hover:text-text-inv transition-colors font-medium cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  );
}
