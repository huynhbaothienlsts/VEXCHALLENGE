import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ACTIVITY_TIMELINE,
  BUILD_STEPS,
  DRIVER_PHASES,
  MATCH_TYPES,
  MISSION,
  NAV_ITEMS,
  START_RULES,
  createTimer,
  makeId,
} from './data/challenge';
import { useProject } from './hooks/useProject';
import { calculateScore, driverFromRemaining, formatTime } from './utils/challenge';

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const downloadText = (filename, content, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function useTimestampTimer(timer, setTimer, options = {}) {
  const { resolveDriver = driverFromRemaining } = options;
  const driverCallback = useRef(options.onDriverChange);
  const endCallback = useRef(options.onEnd);
  const handledDriver = useRef(timer.lastDriver ?? 0);
  const endedForRun = useRef(timer.status === 'ended');
  const getRemaining = useCallback(() => (
    timer.status === 'running' && timer.endAt
      ? Math.max(0, timer.endAt - Date.now())
      : Math.max(0, timer.remainingMs)
  ), [timer.endAt, timer.remainingMs, timer.status]);
  const [remainingMs, setRemainingMs] = useState(getRemaining);

  driverCallback.current = options.onDriverChange;
  endCallback.current = options.onEnd;

  useEffect(() => {
    handledDriver.current = timer.lastDriver ?? 0;
    if (timer.status !== 'running') {
      setRemainingMs(Math.max(0, timer.remainingMs));
      if (timer.status !== 'ended') endedForRun.current = false;
    }
  }, [timer.lastDriver, timer.remainingMs, timer.status]);

  useEffect(() => {
    if (timer.status !== 'running' || !timer.endAt) return undefined;

    const tick = () => {
      const next = Math.max(0, timer.endAt - Date.now());
      setRemainingMs(next);
      const nextDriver = resolveDriver(next, timer.durationMs);

      if (next > 0 && nextDriver !== handledDriver.current) {
        const previousDriver = handledDriver.current;
        handledDriver.current = nextDriver;
        setTimer({ ...timer, remainingMs: next, lastDriver: nextDriver });
        driverCallback.current?.(nextDriver, previousDriver);
      }

      if (next === 0 && !endedForRun.current) {
        endedForRun.current = true;
        setTimer({ ...timer, status: 'ended', remainingMs: 0, endAt: null, lastDriver: resolveDriver(0, timer.durationMs) });
        endCallback.current?.();
      }
    };

    tick();
    const interval = window.setInterval(tick, 125);
    return () => window.clearInterval(interval);
  }, [resolveDriver, setTimer, timer]);

  const start = () => {
    const available = timer.status === 'paused' ? timer.remainingMs : timer.durationMs;
    if (available <= 0 || timer.status === 'running') return;
    endedForRun.current = false;
    const initialDriver = resolveDriver(available, timer.durationMs);
    handledDriver.current = initialDriver;
    setRemainingMs(available);
    setTimer({
      ...timer,
      status: 'running',
      remainingMs: available,
      endAt: Date.now() + available,
      lastDriver: initialDriver,
    });
  };

  const pause = () => {
    if (timer.status !== 'running') return;
    const next = getRemaining();
    setRemainingMs(next);
    setTimer({ ...timer, status: 'paused', remainingMs: next, endAt: null });
  };

  const reset = () => {
    handledDriver.current = 0;
    endedForRun.current = false;
    setRemainingMs(timer.durationMs);
    setTimer(createTimer(timer.durationMs));
  };

  const end = () => {
    endedForRun.current = true;
    setRemainingMs(0);
    setTimer({ ...timer, status: 'ended', remainingMs: 0, endAt: null });
  };

  return {
    remainingMs,
    display: formatTime(remainingMs),
    currentDriver: resolveDriver(remainingMs, timer.durationMs),
    status: timer.status,
    start,
    pause,
    reset,
    end,
  };
}

function Icon({ children }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Header({ currentView, goTo, saveState, matchScore, currentDriver }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => goTo('home')} aria-label="VEX Challenge home">
        <span className="brand-v">V</span><span>VEX <b>Control Center</b></span>
      </button>
      <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'} aria-label="Main navigation">
        {NAV_ITEMS.map(([id, label]) => (
          <button key={id} type="button" className={currentView === id ? 'active' : ''} onClick={() => { goTo(id); setMenuOpen(false); }}>{label}</button>
        ))}
      </nav>
      <div className="header-live" aria-label={`Current score ${matchScore}, Driver ${currentDriver + 1}`}>
        <span>D{currentDriver + 1}</span><strong>{matchScore} pts</strong>
      </div>
      <span className="save-state"><i />{saveState}</span>
    </header>
  );
}

function FieldViewer({ onClose }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div className="field-modal" role="dialog" aria-modal="true" aria-label="Full field map">
      <div className="field-modal-bar">
        <strong>Official Challenge Field</strong>
        <div>
          <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.25))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>+</button>
          <button type="button" className="close-field" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="field-pan">
        <img src="./images/field.jpg" alt="Challenge field showing the central Supply Zone, three team zones, three delivery zones, robot starts and student standing positions" style={{ width: `${zoom * 100}%` }} />
      </div>
    </div>
  );
}

function Home({ project, update, goTo }) {
  return (
    <main id="main-content" className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">The Science Exchange Program at LSTS</span>
          <h1>VEX Rapid<br /><em>Innovation</em> Challenge</h1>
          <p className="hero-tagline">Build. Practice. Improve. Compete.</p>
          <p className="mission-line">{MISSION}</p>
          <button className="primary-action" type="button" onClick={() => goTo('mission')}>Start Challenge <span aria-hidden="true">→</span></button>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit" aria-hidden="true" />
          <img src="./images/v5-clawbot.webp" alt="VEX V5 Clawbot ready for the rapid innovation challenge" />
          <span className="hero-label">V5 CLAWBOT</span>
        </div>
        <div className="hero-facts" aria-label="Challenge facts">
          <div><strong>3</strong><span>Teams</span></div>
          <div><strong>4</strong><span>Students / team</span></div>
          <div><strong>4:00</strong><span>Match</span></div>
          <div><strong>5</strong><span>Points / Cup</span></div>
          <div><strong>10</strong><span>Points / Pin</span></div>
        </div>
      </section>

      <section className="team-setup section-wrap" aria-labelledby="team-setup-title">
        <div>
          <span className="eyebrow">Quick setup</span>
          <h2 id="team-setup-title">Who is driving?</h2>
          <p>Names are optional. The order below becomes the match rotation.</p>
        </div>
        <label className="input-field team-name"><span>Team name</span><input value={project.team.name} onChange={(event) => update('team.name', event.target.value)} placeholder="e.g. Team 1" /></label>
        <div className="driver-inputs">
          {project.team.members.map((name, index) => (
            <label className="input-field" key={`member-${index}`}><span>Driver {index + 1}</span><input value={name} onChange={(event) => update(['team', 'members', index], event.target.value)} placeholder={`Student ${index + 1}`} /></label>
          ))}
        </div>
      </section>

      <section className="timeline-section section-wrap" aria-labelledby="timeline-title">
        <div className="timeline-intro">
          <span className="eyebrow">Flexible 180-minute plan</span>
          <h2 id="timeline-title">One fast engineering sprint</h2>
          <p>Suggested pacing only. Teachers can adjust it at any time.</p>
        </div>
        <ol className="activity-timeline">
          {ACTIVITY_TIMELINE.map(([number, title, time]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><small>{time}</small></div></li>)}
        </ol>
      </section>

      <section className="community-banner section-wrap">
        <img src="./images/international-teams.webp" alt="International robotics students gathered together at LSTS" loading="lazy" />
        <div><span className="eyebrow">LSTS · Bailing · Lishan · KangChiao</span><h2>One challenge. Three international teams.</h2></div>
      </section>
    </main>
  );
}

function Mission({ acknowledged, acknowledge, openField, goTo }) {
  return (
    <main id="main-content" className="mission-page page-shell">
      <header className="page-lead">
        <span className="step-tag">01 · Mission & Field</span>
        <h1>Collect. Carry. Deliver.</h1>
        <p>{MISSION}</p>
      </header>

      <section className="field-stage" aria-labelledby="field-title">
        <div className="field-heading"><div><span className="eyebrow">Official layout</span><h2 id="field-title">Know your route</h2></div><button type="button" className="secondary-action" onClick={openField}>View Full Field</button></div>
        <button className="field-image-button" type="button" onClick={openField} aria-label="Open full field map">
          <img src="./images/field.jpg" alt="Challenge field with Supply Zone, Team 1, Team 2, Team 3, all robot starts and delivery zones" />
          <span>Tap to enlarge</span>
        </button>
      </section>

      <section className="rules-strip" aria-label="Starting rules">
        {START_RULES.map(([number, rule]) => <div key={number}><span>{number}</span><strong>{rule}</strong></div>)}
      </section>

      <section className="scoring-explainer">
        <div className="object-visual"><img src="./images/cup-and-pin.jfif" alt="VEX Cup and Pin game objects" loading="lazy" /></div>
        <div className="scoring-copy"><span className="eyebrow">Scoring</span><h2>Two objects. One formula.</h2><p>Total Score = Cups × 5 + Pins × 10</p></div>
        <div className="score-values"><div><span>Cup</span><strong>5</strong><small>points</small></div><div><span>Pin</span><strong>10</strong><small>points</small></div></div>
      </section>

      <div className="page-action-row">
        {acknowledged && <span className="complete-note">✓ Mission understood</span>}
        <button className="primary-action" type="button" onClick={() => { acknowledge(); goTo('build'); }}>I Understand the Mission <span aria-hidden="true">→</span></button>
      </div>
    </main>
  );
}

function TimerControls({ timer, onReset, startLabel = 'Start' }) {
  return (
    <div className="timer-controls">
      {timer.status === 'idle' && <button className="control-start" type="button" onClick={timer.start}>{startLabel}</button>}
      {timer.status === 'running' && <button className="control-pause" type="button" onClick={timer.pause}>Pause</button>}
      {timer.status === 'paused' && <button className="control-start" type="button" onClick={timer.start}>Resume</button>}
      {timer.status === 'ended' && <span className="ended-label">Time ended</span>}
      <button className="control-reset" type="button" onClick={onReset}>Reset</button>
    </div>
  );
}

function BuildPractice({ project, update, practiceTimer, setPracticeMode, onPracticeReset, goTo }) {
  const current = project.practice.mode === 240_000 ? practiceTimer.currentDriver : project.practice.driverIndex;
  const currentName = project.team.members[current] || `Driver ${current + 1}`;
  return (
    <main id="main-content" className="build-page page-shell">
      <header className="page-lead compact-lead">
        <span className="step-tag">02 · Build & Practice</span>
        <h1>Change one thing. Test it fast.</h1>
        <p>Keep the robot working. Improve only the problem that matters most.</p>
      </header>

      <section className="build-flow" aria-label="Build and practice steps">
        {BUILD_STEPS.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>{index < BUILD_STEPS.length - 1 && <i aria-hidden="true">→</i>}</div>)}
      </section>

      <section className="build-workspace">
        <div className="quick-notes">
          <span className="eyebrow">Optional team notes</span>
          {[
            ['problem', 'Our main problem', 'What slows the robot down?'],
            ['improvement', 'Our improvement', 'What did you change?'],
            ['practiceResult', 'What improved after practice', 'What now works better?'],
          ].map(([key, label, placeholder]) => (
            <label className="short-note" key={key}><span>{label}<small>{project.notes[key].length}/200</small></span><textarea rows="2" maxLength="200" value={project.notes[key]} placeholder={placeholder} onChange={(event) => update(['notes', key], event.target.value)} /></label>
          ))}
        </div>

        <section className="practice-console" aria-labelledby="practice-title">
          <div className="console-heading"><div><span className="eyebrow">Practice timer</span><h2 id="practice-title">Give every driver a turn</h2></div><div className="mode-switch" aria-label="Practice timer mode"><button type="button" className={project.practice.mode === 60_000 ? 'active' : ''} onClick={() => setPracticeMode(60_000)}>1 min</button><button type="button" className={project.practice.mode === 240_000 ? 'active' : ''} onClick={() => setPracticeMode(240_000)}>4 min</button></div></div>
          {project.practice.mode === 60_000 && (
            <label className="driver-select">Practice driver<select value={project.practice.driverIndex} disabled={practiceTimer.status === 'running'} onChange={(event) => update('practice.driverIndex', Number(event.target.value))}>{project.team.members.map((name, index) => <option key={`driver-option-${index}`} value={index}>{name || `Driver ${index + 1}`}</option>)}</select></label>
          )}
          <div className={`practice-clock timer-status-${practiceTimer.status}`}><span>{currentName}</span><strong>{practiceTimer.display}</strong></div>
          <TimerControls timer={practiceTimer} onReset={onPracticeReset} startLabel="Start Practice" />
          <div className="driver-checklist">
            {project.practice.checklist.map((checked, index) => (
              <label key={`practice-check-${index}`} className={checked ? 'checked' : ''}><input type="checkbox" checked={checked} onChange={(event) => update(['practice', 'checklist', index], event.target.checked)} /><span>{checked ? '✓' : index + 1}</span><strong>{project.team.members[index] || `Driver ${index + 1}`}<small>practiced</small></strong></label>
            ))}
          </div>
        </section>
      </section>

      <div className="page-action-row"><span className="complete-note">{project.practice.checklist.filter(Boolean).length}/4 drivers practiced</span><button type="button" className="primary-action" onClick={() => goTo('match')}>Ready to Compete <span aria-hidden="true">→</span></button></div>
    </main>
  );
}

function ScoreCounter({ label, imageClass, count, points, disabled, change }) {
  return (
    <section className={`score-counter ${imageClass}`} aria-label={`${label}: ${count}, ${points} points`}>
      <div><span>{label}</span><strong>{count}</strong><small>{points} points</small></div>
      <div className="counter-buttons">
        <button type="button" aria-label={`Remove one ${label}`} disabled={disabled || count === 0} onClick={() => change(-1)}>−</button>
        <button type="button" aria-label={`Add one ${label}`} disabled={disabled} onClick={() => change(1)}>+</button>
      </div>
    </section>
  );
}

function MatchMode({ project, update, matchTimer, alert, onMatchStart, onMatchReset, onScoreReset, onSave, onSignal, goTo }) {
  const matchArea = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const cups = project.match.cups;
  const pins = project.match.pins;
  const { totalScore: total } = calculateScore(cups, pins);
  const scoringLocked = project.match.timer.status === 'ended' && project.match.lockScoringAtEnd && !project.match.scoringUnlocked;
  const currentName = project.team.members[matchTimer.currentDriver] || `Driver ${matchTimer.currentDriver + 1}`;

  useEffect(() => {
    const track = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', track);
    return () => document.removeEventListener('fullscreenchange', track);
  }, []);

  const changeScore = (key, delta) => {
    if (scoringLocked) return;
    update(['match', key], (value) => Math.max(0, Number(value || 0) + delta));
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await matchArea.current?.requestFullscreen();
    } catch {
      window.alert('Full-screen mode is not available in this browser.');
    }
  };

  return (
    <main id="main-content" className="match-page">
      <section ref={matchArea} className={`match-console ${alert ? `has-${alert.type}-alert` : ''}`}>
        {alert && <div className={`match-alert alert-${alert.type}`} role="alert"><strong>{alert.message}</strong>{alert.detail && <span>{alert.detail}</span>}</div>}
        <header className="match-topbar">
          <div className="match-identity">
            <label><span>Team</span><input value={project.team.name} placeholder="Team name" onChange={(event) => update('team.name', event.target.value)} /></label>
            <label><span>Run</span><select value={project.match.type} onChange={(event) => update('match.type', event.target.value)}>{MATCH_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          </div>
          <div className="match-tools">
            <button type="button" aria-pressed={project.match.soundEnabled} onClick={() => update('match.soundEnabled', (value) => !value)}>{project.match.soundEnabled ? 'Sound on' : 'Sound off'}</button>
            <button type="button" onClick={toggleFullscreen}>{isFullscreen ? 'Exit full screen' : 'Full screen'}</button>
            <button type="button" onClick={() => goTo('mission')}>Field map</button>
          </div>
        </header>

        <div className="driver-stages" aria-label="Driver rotation">
          {DRIVER_PHASES.map(([driver, time], index) => (
            <div key={driver} className={`${index === matchTimer.currentDriver ? 'current' : ''} ${index < matchTimer.currentDriver ? 'complete' : ''}`}><span>{index < matchTimer.currentDriver ? '✓' : `0${index + 1}`}</span><strong>{project.team.members[index] || driver}</strong><small>{time}</small></div>
          ))}
        </div>

        <div className="match-main-grid">
          <section className="match-timer" aria-live="polite" aria-label={`Match timer ${matchTimer.display}, current ${currentName}`}>
            <span className="current-driver-label">Now driving</span>
            <h2>{currentName}</h2>
            <strong className="giant-time">{matchTimer.display}</strong>
            <TimerControls timer={matchTimer} onReset={onMatchReset} />
          </section>

          <section className="score-console" aria-labelledby="score-title">
            <div className="score-heading"><div><span className="eyebrow">Live scoring</span><h2 id="score-title">Team score</h2></div><button type="button" className="reset-score" onClick={onScoreReset}>Reset score</button></div>
            <div className="score-counters">
              <ScoreCounter label="Cups" imageClass="cups" count={cups} points={cups * 5} disabled={scoringLocked} change={(delta) => changeScore('cups', delta)} />
              <ScoreCounter label="Pins" imageClass="pins" count={pins} points={pins * 10} disabled={scoringLocked} change={(delta) => changeScore('pins', delta)} />
            </div>
            <div className="total-score"><span>Total score</span><strong>{total}</strong><small>{cups} × 5 + {pins} × 10</small></div>
            <label className="lock-option"><input type="checkbox" checked={project.match.lockScoringAtEnd} onChange={(event) => update('match.lockScoringAtEnd', event.target.checked)} /><span>Lock scoring at end</span></label>
            {scoringLocked && <button type="button" className="unlock-score" onClick={() => update('match.scoringUnlocked', true)}>Unlock to correct score</button>}
          </section>
        </div>

        <footer className="match-footer">
          <span className="mission-reminder"><b>Mission:</b> Supply Zone → Your Delivery Zone</span>
          <button type="button" className="end-save" onClick={onSave}>End and Save Match</button>
        </footer>
      </section>
    </main>
  );
}

function Results({ project, saveCurrent, startNew, clearResults }) {
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const sorted = useMemo(() => [...project.results].sort((a, b) => b.totalScore - a.totalScore), [project.results]);
  const latest = project.results[0];

  const rankFor = (score) => sorted.findIndex((result) => result.totalScore === score) + 1;
  const exportCsv = () => {
    if (!project.results.length) return;
    const headings = ['Rank', 'Team', 'Match type', 'Match number', 'Cups', 'Cup points', 'Pins', 'Pin points', 'Total score', 'Driver participation', 'Improvement used', 'Date/time'];
    const rows = sorted.map((result) => [rankFor(result.totalScore), result.teamName, result.matchType, result.matchNumber, result.cups, result.cupPoints, result.pins, result.pinPoints, result.totalScore, `${result.driverParticipation}/4`, result.improvement, new Date(result.createdAt).toLocaleString()]);
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    downloadText('vex-challenge-results.csv', `\uFEFF${csv}`, 'text/csv;charset=utf-8');
  };

  return (
    <main id="main-content" className="results-page page-shell">
      <header className="page-lead compact-lead results-lead">
        <div><span className="step-tag">04 · Results</span><h1>Results Board</h1><p>Every saved run stays on this device.</p></div>
        <div className="result-actions"><button type="button" onClick={saveCurrent}>Save Result</button><button type="button" onClick={() => window.print()}>Print Result</button><button type="button" onClick={exportCsv} disabled={!project.results.length}>Export CSV</button></div>
      </header>

      {latest ? (
        <section className="latest-result" aria-labelledby="latest-title">
          <div><span className="eyebrow">Latest saved run</span><h2 id="latest-title">{latest.teamName}</h2><p>{latest.matchType} · Run {latest.matchNumber} · {new Date(latest.createdAt).toLocaleString()}</p><p><b>Improvement:</b> {latest.improvement || 'No note recorded'}</p></div>
          <div className="result-breakdown"><span>{latest.cups} Cups <b>{latest.cupPoints}</b></span><span>{latest.pins} Pins <b>{latest.pinPoints}</b></span><span>Drivers <b>{latest.driverParticipation}/4</b></span></div>
          <div className="latest-total"><span>Total</span><strong>{latest.totalScore}</strong></div>
        </section>
      ) : (
        <section className="empty-results"><Icon>🏁</Icon><h2>No saved matches yet</h2><p>Run the Match Timer, record Cups and Pins, then save the result.</p><button className="primary-action" type="button" onClick={startNew}>Start First Match</button></section>
      )}

      {project.results.length > 0 && (
        <>
          <section className="leaderboard-section">
            <div className="results-heading"><div><span className="eyebrow">Optional ranking</span><h2>Leaderboard</h2></div><button type="button" onClick={() => setShowLeaderboard((show) => !show)}>{showLeaderboard ? 'Hide leaderboard' : 'Show leaderboard'}</button></div>
            {showLeaderboard && <ol className="leaderboard">{sorted.map((result) => <li key={result.id}><span className="rank">#{rankFor(result.totalScore)}</span><strong>{result.teamName}</strong><small>{result.matchType}</small><b>{result.totalScore} pts</b></li>)}</ol>}
          </section>

          <section className="history-section" aria-labelledby="history-title">
            <div className="results-heading"><div><span className="eyebrow">Saved on this device</span><h2 id="history-title">Match history</h2></div><span>{project.results.length} result{project.results.length === 1 ? '' : 's'}</span></div>
            <div className="table-scroll"><table><thead><tr><th>Team / run</th><th>Cups</th><th>Pins</th><th>Drivers</th><th>Improvement</th><th>Total</th><th>Time</th></tr></thead><tbody>{project.results.map((result) => <tr key={result.id}><td><strong>{result.teamName}</strong><small>{result.matchType} · #{result.matchNumber}</small></td><td>{result.cups}<small>{result.cupPoints} pts</small></td><td>{result.pins}<small>{result.pinPoints} pts</small></td><td>{result.driverParticipation}/4</td><td>{result.improvement || '—'}</td><td className="table-total">{result.totalScore}</td><td>{new Date(result.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}

      <div className="results-bottom-actions"><button type="button" className="primary-action" onClick={startNew}>Start New Match</button><button type="button" className="danger-quiet" disabled={!project.results.length} onClick={clearResults}>Clear Results</button></div>
    </main>
  );
}

export default function App() {
  const { project, setProject, update, saveState } = useProject();
  const [fieldOpen, setFieldOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const alertTimeout = useRef(null);
  const audioContext = useRef(null);

  const goTo = useCallback((view) => {
    update('currentView', view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [update]);

  const setMatchTimer = useCallback((value) => update('match.timer', value), [update]);
  const setPracticeTimer = useCallback((value) => update('practice.timer', value), [update]);

  const playSignal = useCallback((kind = 'change') => {
    if (!project.match.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext.current ||= new AudioContextClass();
      const context = audioContext.current;
      const tone = (frequency, start, length) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        gain.gain.setValueAtTime(0.0001, context.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + length);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + start);
        oscillator.stop(context.currentTime + start + length + 0.02);
      };
      if (kind === 'end') { tone(520, 0, 0.2); tone(390, 0.28, 0.42); }
      else tone(740, 0, 0.18);
    } catch {
      // Sound is optional; visual alerts remain available.
    }
  }, [project.match.soundEnabled]);

  const showAlert = useCallback((type, message, detail, duration = 3200) => {
    window.clearTimeout(alertTimeout.current);
    setAlert({ type, message, detail, id: Date.now() });
    alertTimeout.current = window.setTimeout(() => setAlert(null), duration);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(alertTimeout.current);
    audioContext.current?.close?.();
  }, []);

  const markDriverSeen = useCallback((index) => {
    update(['match', 'driverSeen', index], true);
  }, [update]);

  const matchTimer = useTimestampTimer(project.match.timer, setMatchTimer, {
    onDriverChange: (nextDriver) => {
      markDriverSeen(nextDriver);
      playSignal('change');
      showAlert('change', 'CHANGE DRIVER!', project.team.members[nextDriver] || `Driver ${nextDriver + 1}`);
    },
    onEnd: () => {
      markDriverSeen(3);
      playSignal('end');
      showAlert('end', 'MATCH ENDED', 'Stop the robot and confirm the score.', 5000);
    },
  });

  const practiceResolveDriver = useCallback((remaining, duration) => (
    duration === 240_000 ? driverFromRemaining(remaining) : project.practice.driverIndex
  ), [project.practice.driverIndex]);

  const practiceTimer = useTimestampTimer(project.practice.timer, setPracticeTimer, {
    resolveDriver: practiceResolveDriver,
    onDriverChange: (nextDriver, previousDriver) => {
      update(['practice', 'checklist', previousDriver], true);
      playSignal('change');
      showAlert('change', 'CHANGE DRIVER!', project.team.members[nextDriver] || `Driver ${nextDriver + 1}`);
    },
    onEnd: () => {
      if (project.practice.mode === 240_000) update('practice.checklist', [true, true, true, true]);
      else update(['practice', 'checklist', project.practice.driverIndex], true);
      playSignal('end');
      showAlert('practice', 'PRACTICE ENDED', 'Check the robot, then choose the next driver.');
    },
  });

  const { totalScore } = calculateScore(project.match.cups, project.match.pins);

  const onMatchStart = () => {
    markDriverSeen(matchTimer.currentDriver);
    playSignal('change');
    matchTimer.start();
  };

  const resetMatchTimer = () => {
    if (!window.confirm('Reset the 4-minute match timer? The score will stay unchanged.')) return;
    matchTimer.reset();
    update('match.driverSeen', [false, false, false, false]);
    update('match.scoringUnlocked', false);
    setAlert(null);
  };

  const resetScore = () => {
    if (!window.confirm('Reset Cups, Pins and Total Score to 0?')) return;
    update('match.cups', 0);
    update('match.pins', 0);
  };

  const setPracticeMode = (durationMs) => {
    if (project.practice.timer.status === 'running' && !window.confirm('Change practice mode and reset the current practice timer?')) return;
    update('practice.mode', durationMs);
    update('practice.timer', createTimer(durationMs));
  };

  const resetPractice = () => {
    if (!window.confirm('Reset this practice timer?')) return;
    practiceTimer.reset();
    setAlert(null);
  };

  const saveCurrentResult = useCallback((navigate = true) => {
    setProject((current) => {
      const existingIndex = current.results.findIndex((result) => result.sessionId === current.match.sessionId);
      const existing = current.results[existingIndex];
      const teamResults = current.results.filter((result) => result.teamName === (current.team.name.trim() || 'Unnamed Team'));
      const seen = current.match.driverSeen;
      const score = calculateScore(current.match.cups, current.match.pins);
      const result = {
        id: existing?.id || makeId(),
        sessionId: current.match.sessionId,
        teamName: current.team.name.trim() || 'Unnamed Team',
        matchType: current.match.type,
        matchNumber: existing?.matchNumber || teamResults.length + 1,
        cups: current.match.cups,
        cupPoints: score.cupPoints,
        pins: current.match.pins,
        pinPoints: score.pinPoints,
        totalScore: score.totalScore,
        driverParticipation: seen.filter(Boolean).length,
        improvement: current.notes.improvement.trim(),
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const results = existingIndex >= 0
        ? current.results.map((item, index) => (index === existingIndex ? result : item))
        : [result, ...current.results];
      return { ...current, currentView: navigate ? 'results' : current.currentView, results };
    });
  }, [setProject]);

  const endAndSave = () => {
    if (project.match.timer.status !== 'ended') {
      const message = project.match.timer.status === 'running'
        ? 'End the match now and save the current score?'
        : 'Save this run with the current score?';
      if (!window.confirm(message)) return;
      matchTimer.end();
      playSignal('end');
      showAlert('end', 'MATCH ENDED', 'Result saved on this device.', 2500);
    }
    saveCurrentResult(true);
  };

  const startNewMatch = () => {
    if ((project.match.cups > 0 || project.match.pins > 0) && !window.confirm('Start a new match? The current score will reset to 0.')) return;
    update('match', {
      ...project.match,
      sessionId: makeId(),
      timer: createTimer(),
      cups: 0,
      pins: 0,
      scoringUnlocked: false,
      driverSeen: [false, false, false, false],
    });
    setAlert(null);
    goTo('match');
  };

  const clearResults = () => {
    if (!window.confirm('Clear all saved match results from this device? This cannot be undone.')) return;
    update('results', []);
  };

  const view = project.currentView;
  return (
    <div className={`app view-${view}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header currentView={view} goTo={goTo} saveState={saveState} matchScore={totalScore} currentDriver={matchTimer.currentDriver} />
      {view === 'home' && <Home project={project} update={update} goTo={goTo} />}
      {view === 'mission' && <Mission acknowledged={project.missionAcknowledged} acknowledge={() => update('missionAcknowledged', true)} openField={() => setFieldOpen(true)} goTo={goTo} />}
      {view === 'build' && <BuildPractice project={project} update={update} practiceTimer={practiceTimer} setPracticeMode={setPracticeMode} onPracticeReset={resetPractice} goTo={goTo} />}
      {view === 'match' && <MatchMode project={project} update={update} matchTimer={{ ...matchTimer, start: onMatchStart }} alert={alert} onMatchStart={onMatchStart} onMatchReset={resetMatchTimer} onScoreReset={resetScore} onSave={endAndSave} onSignal={playSignal} goTo={goTo} />}
      {view === 'results' && <Results project={project} saveCurrent={() => saveCurrentResult(false)} startNew={startNewMatch} clearResults={clearResults} />}
      {fieldOpen && <FieldViewer onClose={() => setFieldOpen(false)} />}
    </div>
  );
}
