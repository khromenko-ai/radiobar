import React, { useState, useEffect } from 'react';
import { getHostAuth, setHostAuth, useSessions, DinnerSession } from '../lib/store';
import { scenariosData, Language, uiTranslations, getActImage } from '../data/content';
import { useSession } from '../hooks/useSession';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { CardsIcon } from './CardsIcon';

export function HostApp() {
  const { session, updateSession } = useSession();
  const t = uiTranslations[session.language];
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
    <>
      <div className="fixed top-8 left-8 z-50 flex items-center space-x-6">
        <button 
          onClick={exitHostMode}
          className="text-text-sub hover:text-text-main transition-colors p-1"
          title="Cards"
        >
          <CardsIcon size={20} />
        </button>
        <ThemeToggle onReset={() => {}} onDemo={() => {}} />
      </div>
      <div className="fixed top-8 right-8 z-50">
        <LanguageToggle 
          current={session.language} 
          onChange={(l) => updateSession({ language: l })} 
        />
      </div>
      {selectedSessionId ? (
        <HostSessionControl sessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} language={session.language} />
      ) : (
        <HostDashboard onSelectSession={setSelectedSessionId} language={session.language} />
      )}
    </>
  );
}

function HostDashboard({ onSelectSession, language }: { onSelectSession: (id: string) => void, language: Language }) {
  const t = uiTranslations[language];
  const { sessions, createSession } = useSessions();
  const [newTable, setNewTable] = useState('');
  const [newScenario, setNewScenario] = useState('first-date');

  const sessionValues = Object.values(sessions) as DinnerSession[];
  const activeSessions = sessionValues.filter(s => s.status !== 'COMPLETED');
  const completedSessions = sessionValues.filter(s => s.status === 'COMPLETED');

  const handleCreate = () => {
    if (!newTable) return;
    const id = createSession(newTable, newScenario);
    setNewTable('');
    onSelectSession(id);
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans p-6 pt-20 overflow-y-auto">
      <div className="flex justify-between items-center mb-12 mt-4">
        <h1 className="text-xs tracking-[0.3em] text-text-muted">RADIOHOST</h1>
      </div>

      <div className="mb-12 border border-border-main rounded-2xl p-6 bg-bg-sub">
        <h2 className="text-[10px] tracking-[0.2em] text-text-muted mb-6 uppercase">{t.hostNewDinner}</h2>
        <div className="flex flex-col space-y-6 mb-8">
          <input 
            type="text" 
            placeholder={t.hostTableSession} 
            value={newTable} 
            onChange={e => setNewTable(e.target.value)}
            className="bg-transparent border-b border-border-focus text-sm text-text-main focus:outline-none focus:border-text-main tracking-widest pb-2 uppercase placeholder-[#444]"
          />
          <select 
            value={newScenario} 
            onChange={e => setNewScenario(e.target.value)}
            className="bg-transparent border-b border-border-focus text-sm text-text-sec focus:outline-none focus:border-text-main tracking-widest pb-2 uppercase appearance-none"
          >
            <option value="first-date" className="bg-bg-elevated">{scenariosData[language].find(x => x.id === 'first-date')?.title}</option>
            <option value="best-friends" className="bg-bg-elevated">{scenariosData[language].find(x => x.id === 'best-friends')?.title}</option>
            <option value="relationship-reboost" className="bg-bg-elevated">{scenariosData[language].find(x => x.id === 'relationship-reboost')?.title}</option>
          </select>
        </div>
        <button 
          onClick={handleCreate}
          disabled={!newTable}
          className="w-full py-4 border border-border-focus rounded-xl text-[10px] tracking-[0.2em] text-text-main hover:bg-bg-inv hover:text-text-inv transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-main uppercase"
        >
          {t.hostStartDinner}
        </button>
      </div>

      <h2 className="text-[10px] tracking-[0.2em] text-text-muted mb-6 uppercase">{t.hostActiveDinners}</h2>
      {activeSessions.length === 0 && <p className="text-xs text-text-sub tracking-widest mb-12">{t.hostNoActive}</p>}
      <div className="flex flex-col space-y-4 mb-12">
        {activeSessions.map(s => (
          <div 
            key={s.id} 
            onClick={() => onSelectSession(s.id)}
            className="border border-border-main rounded-2xl p-6 bg-bg-sub cursor-pointer hover:border-border-focus transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-serif tracking-widest text-text-main">{s.tableName}</span>
              <span className={`text-[10px] tracking-widest uppercase ${s.status === 'ACTIVE' ? 'text-green-500/80' : 'text-yellow-500/80'}`}>
                {s.status}
              </span>
            </div>
            <div className="text-[10px] tracking-[0.2em] text-text-muted uppercase mb-2">
              {scenariosData[language].find(x => x.id === s.scenarioId)?.title}
            </div>
            <div className="text-[10px] tracking-[0.2em] text-text-sub uppercase">
              {t.hostAct} {(s.currentActIndex + 1).toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      {completedSessions.length > 0 && (
        <>
          <h2 className="text-[10px] tracking-[0.2em] text-text-muted mb-6 uppercase">{t.hostCompletedToday}</h2>
          <div className="flex flex-col space-y-4 mb-12 opacity-50">
            {completedSessions.map(s => (
              <div key={s.id} className="border border-border-main rounded-2xl p-6 bg-bg-main">
                <div className="text-sm font-serif tracking-widest text-text-muted mb-2">{s.tableName}</div>
                <div className="text-[10px] tracking-[0.2em] text-text-sub uppercase">
                  {scenariosData[language].find(x => x.id === s.scenarioId)?.title}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HostSessionControl({ sessionId, onBack, language }: { sessionId: string, onBack: () => void, language: Language }) {
  const t = uiTranslations[language];
  const { sessions, updateSession, advanceSession, endSession } = useSessions();
  const session = sessions[sessionId];
  const scenario = scenariosData[language].find(s => s.id === session?.scenarioId);
  const [now, setNow] = useState(Date.now());

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

  const shareUrl = `${window.location.origin}/?session=${session.id}`;

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans p-6 pt-20 flex flex-col overflow-y-auto">
      <div className="mt-4 mb-8">
        <button onClick={onBack} className="text-[10px] tracking-[0.2em] text-text-muted hover:text-text-main transition-colors">
          ← {t.hostActiveDinners}
        </button>
      </div>
      
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-2xl font-serif tracking-widest">{session.tableName}</h2>
        <span className="text-[10px] font-sans tracking-widest text-text-sub bg-bg-elevated px-2 py-1 rounded">{t.hostId} {session.id}</span>
      </div>
      
      <h3 className="text-[10px] tracking-[0.2em] text-text-muted mb-8 uppercase">{scenario.title}</h3>

      {/* SHARE LINK */}
      <div className="mb-8 flex items-center justify-between bg-bg-elevated rounded-lg p-3">
        <div className="text-[10px] tracking-widest text-text-muted truncate mr-4">
          {shareUrl}
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="text-[10px] tracking-widest text-text-sec hover:text-text-main border border-border-focus px-3 py-1 rounded whitespace-nowrap"
        >
          {t.hostCopyLink}
        </button>
      </div>

      {/* CURRENT */}
      <div className="border border-border-main rounded-2xl p-6 bg-bg-sub mb-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[10px] tracking-[0.2em] text-text-muted uppercase">{t.hostCurrent}</h4>
          <div className={`text-[10px] tracking-[0.2em] uppercase ${session.status === 'ACTIVE' ? 'text-green-500/80' : 'text-yellow-500/80'}`}>
            {session.status}
          </div>
        </div>

        <div className="text-2xl font-serif tracking-wide mb-2 text-text-main">
          {t.hostAct} {currentAct.number} / {scenario.acts.length.toString().padStart(2, '0')}
        </div>
        <div className="text-[10px] tracking-[0.2em] text-text-muted mb-8 uppercase">{currentAct.theme}</div>
        
        <h4 className="text-[10px] tracking-[0.2em] text-text-sub mb-3 uppercase">{t.hostDish}</h4>
        <div className="flex items-start gap-4 mb-8">
          <img 
            src={getActImage(currentAct)} 
            alt={currentAct.dishName}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border-main/50"
          />
          <div className="text-sm font-serif tracking-wide text-text-sec whitespace-pre-wrap leading-relaxed">
            {currentAct.dishName}
          </div>
        </div>

        <div className="border-t border-border-main pt-6 flex justify-between items-center">
          <div>
            <h4 className="text-[10px] tracking-[0.2em] text-text-sub mb-2 uppercase">{t.hostTimeRemaining}</h4>
            <div className="text-2xl font-sans tracking-widest text-text-main">{session.actStartedAt ? `${mins}:${secs}` : '--:--'}</div>
          </div>
          {session.status !== 'WAITING' && (
            <button 
              onClick={() => { if(confirm('Restart act timer?')) updateSession(session.id, { actStartedAt: Date.now(), status: 'ACTIVE', pausedAt: null }) }} 
              className="text-[10px] tracking-[0.2em] text-text-sub hover:text-text-main transition-colors"
            >
              RESTART TIMER
            </button>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        {session.status === 'WAITING' ? (
           <button onClick={handleStart} className="col-span-2 py-4 border border-border-focus text-[10px] tracking-[0.2em] rounded-xl hover:bg-bg-inv hover:text-text-inv transition-colors uppercase">
            START EXPERIENCE
          </button>
        ) : (
          <>
            <button onClick={handlePauseResume} className="py-4 border border-border-focus text-[10px] tracking-[0.2em] rounded-xl hover:bg-bg-elevated transition-colors uppercase text-text-main">
              {session.status === 'PAUSED' ? t.hostResume : t.hostPause}
            </button>
            <button onClick={handleAdvance} className="py-4 border border-border-focus text-[10px] tracking-[0.2em] rounded-xl hover:bg-bg-inv hover:text-text-inv transition-colors uppercase">
              {nextAct ? t.hostAdvanceAct : t.hostEndDinner}
            </button>
          </>
        )}
      </div>

      {/* NEXT */}
      {nextAct && (
        <div className="border border-border-main rounded-2xl p-6 bg-bg-sub">
          <h4 className="text-[10px] tracking-[0.2em] text-text-sub mb-6 uppercase">{t.hostNext}</h4>
          <div className="flex items-start gap-4">
            <img 
              src={getActImage(nextAct)} 
              alt={nextAct.dishName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border-main/50"
            />
            <div>
              <div className="text-sm font-serif tracking-widest mb-1 text-text-muted">{t.hostAct} {nextAct.number} — {nextAct.theme}</div>
              <div className="text-xs font-serif text-text-sub whitespace-pre-wrap leading-relaxed">{nextAct.dishName}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-center pb-8 opacity-50">
        <button onClick={() => { if(confirm('Reset dinner to start?')) updateSession(session.id, { currentActIndex: 0, status: 'WAITING', actStartedAt: null, pausedAt: null }) }} className="text-[10px] tracking-widest text-text-muted hover:text-red-500 uppercase transition-colors">
          RESET TO START
        </button>
      </div>
    </div>
  );
}
