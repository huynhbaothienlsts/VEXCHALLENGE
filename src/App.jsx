import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ACTIVITY_TIMELINE, BUILD_STEPS, DRIVER_PHASES, MATCH_TYPES, MISSION, NAV_ITEMS,
  START_RULES, TEAM_COLORS, createTeamScore, createTimer, makeId,
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

const resizeTeamImage = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file.'));
  if (file.size > 8_000_000) return reject(new Error('Choose an image smaller than 8 MB.'));
  const source = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(1, 1000 / image.width, 700 / image.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(source);
    resolve(canvas.toDataURL('image/webp', 0.78));
  };
  image.onerror = () => { URL.revokeObjectURL(source); reject(new Error('The image could not be opened.')); };
  image.src = source;
});

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
    setTimer({ ...timer, status: 'running', remainingMs: available, endAt: Date.now() + available, lastDriver: initialDriver });
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
    remainingMs, display: formatTime(remainingMs), currentDriver: resolveDriver(remainingMs, timer.durationMs),
    status: timer.status, start, pause, reset, end,
  };
}

function TeamAvatar({ team, index, large = false }) {
  return team.image
    ? <img className={`team-avatar ${large ? 'large' : ''}`} src={team.image} alt={`${team.name} team`} />
    : <span className={`team-avatar team-avatar-fallback ${large ? 'large' : ''}`} style={{ '--team-color': TEAM_COLORS[index] }}>{team.name.slice(0, 2).toUpperCase()}</span>;
}

function Header({ currentView, goTo, saveState, teams, scores, currentDriver }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const bestScore = Math.max(0, ...scores.map((score) => calculateScore(score.cups, score.pins).totalScore));
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => goTo('home')} aria-label="VEX Challenge home">
        <span className="brand-v">V</span><span>VEX <b>Control Center</b></span>
      </button>
      <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'} aria-label="Main navigation">
        {NAV_ITEMS.map(([id, label]) => <button key={id} type="button" className={currentView === id ? 'active' : ''} onClick={() => { goTo(id); setMenuOpen(false); }}>{label}</button>)}
      </nav>
      <div className="header-live" aria-label={`Current Driver ${currentDriver + 1}, leading score ${bestScore}`}>
        <span>D{currentDriver + 1}</span><strong>{bestScore} pts</strong>
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
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.classList.remove('modal-open'); };
  }, [onClose]);
  return (
    <div className="field-modal" role="dialog" aria-modal="true" aria-label="Full field map">
      <div className="field-modal-bar"><strong>Official Challenge Field</strong><div>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.25))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>+</button>
        <button type="button" className="close-field" onClick={onClose}>Close</button>
      </div></div>
      <div className="field-pan"><img src="./images/field.jpg" alt="Challenge field showing the Supply Zone, three team zones, delivery zones and robot starts" style={{ width: `${zoom * 100}%` }} /></div>
    </div>
  );
}

function Home({ goTo }) {
  return (
    <main id="main-content" className="home-page">
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">The Science Exchange Program at LSTS</span><h1>VEX Rapid<br /><em>Innovation</em> Challenge</h1><p className="hero-tagline">Build. Practice. Improve. Compete.</p><p className="mission-line">{MISSION}</p><div className="hero-actions"><button className="primary-action" type="button" onClick={() => goTo('teams')}>Set Up Teams <span aria-hidden="true">→</span></button><button className="text-action" type="button" onClick={() => goTo('mission')}>View mission</button></div></div>
        <div className="hero-visual"><div className="hero-orbit" aria-hidden="true" /><img src="./images/v5-clawbot.webp" alt="VEX V5 Clawbot ready for the challenge" /><span className="hero-label">V5 CLAWBOT</span></div>
        <div className="hero-facts" aria-label="Challenge facts"><div><strong>3</strong><span>Teams together</span></div><div><strong>4</strong><span>Drivers / team</span></div><div><strong>4:00</strong><span>Match</span></div><div><strong>5</strong><span>Points / Cup</span></div><div><strong>10</strong><span>Points / Pin</span></div></div>
      </section>
      <section className="dual-purpose section-wrap"><div><span className="eyebrow">For each team</span><h2>Build and practice independently.</h2><p>Enter one roster on the team device, improve the Clawbot and rotate all four drivers.</p><button type="button" onClick={() => goTo('build')}>Open Practice Mode →</button></div><div><span className="eyebrow">For teachers</span><h2>Run all three teams together.</h2><p>Enter all rosters once, control the shared match and score each delivery zone live.</p><button type="button" onClick={() => goTo('match')}>Open Match Control →</button></div></section>
      <section className="timeline-section section-wrap"><div className="timeline-intro"><span className="eyebrow">Flexible 180-minute plan</span><h2>One fast engineering sprint</h2><p>Suggested pacing only. Teachers can adjust it at any time.</p></div><ol className="activity-timeline">{ACTIVITY_TIMELINE.map(([number, title, time]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><small>{time}</small></div></li>)}</ol></section>
      <section className="community-banner section-wrap"><img src="./images/international-teams.webp" alt="International robotics students gathered at LSTS" loading="lazy" /><div><span className="eyebrow">LSTS · Bailing · Lishan · KangChiao</span><h2>One field. Three international teams.</h2></div></section>
    </main>
  );
}

function TeamsPage({ project, update, goTo }) {
  const [imageError, setImageError] = useState('');
  const uploadImage = async (index, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try { setImageError(''); update(['teams', index, 'image'], await resizeTeamImage(file)); }
    catch (error) { setImageError(error.message); }
  };
  const removeImage = (index) => {
    if (window.confirm(`Remove the photo for ${project.teams[index].name}?`)) update(['teams', index, 'image'], '');
  };
  return (
    <main id="main-content" className="teams-page page-shell">
      <header className="page-lead compact-lead"><span className="step-tag">01 · Teams</span><h1>Three teams. One shared field.</h1><p>Teachers can enter all 12 students. A team device only needs its own column.</p></header>
      <section className="team-purpose-note"><div><b>Teacher setup</b><span>Complete all three columns before Match Mode.</span></div><div><b>Team setup</b><span>Complete one column and select “Use on this device”.</span></div><span className="saved-badge">● Saved on this device</span></section>
      {imageError && <p className="form-error" role="alert">{imageError}</p>}
      <section className="team-photo-grid" aria-label="Team photos">
        {project.teams.map((team, index) => <article className="team-photo-card" key={team.id} style={{ '--team-color': TEAM_COLORS[index] }}><TeamAvatar team={team} index={index} large /><div><strong>{team.name || `Team ${index + 1}`}</strong><span>{team.members.filter(Boolean).length}/4 students</span></div><label className="upload-team-photo">{team.image ? 'Change photo' : 'Upload team photo'}<input type="file" accept="image/*" onChange={(event) => uploadImage(index, event)} /></label>{team.image && <button type="button" className="remove-photo" onClick={() => removeImage(index)}>Remove</button>}</article>)}
      </section>
      <section className="roster-table-wrap" aria-labelledby="roster-title"><div className="roster-heading"><div><span className="eyebrow">Roster matrix</span><h2 id="roster-title">Driver order for the match</h2></div><span>Columns = teams · Rows = driver minutes</span></div><div className="roster-table" role="table" aria-label="Three team driver roster">
        <div className="roster-row roster-header" role="row"><div role="columnheader">Driver order</div>{project.teams.map((team, index) => <label role="columnheader" key={team.id}><span>Team {index + 1} name</span><input aria-label={`Team ${index + 1} name`} value={team.name} onChange={(event) => update(['teams', index, 'name'], event.target.value)} /></label>)}</div>
        {[0, 1, 2, 3].map((driverIndex) => <div className="roster-row" role="row" key={`driver-${driverIndex}`}><div className="driver-row-label" role="rowheader"><b>Driver {driverIndex + 1}</b><span>Minute {driverIndex + 1}</span></div>{project.teams.map((team, teamIndex) => <label role="cell" key={`${team.id}-${driverIndex}`}><span className="mobile-team-label">{team.name || `Team ${teamIndex + 1}`}</span><input aria-label={`${team.name || `Team ${teamIndex + 1}`} Driver ${driverIndex + 1}`} value={team.members[driverIndex]} placeholder="Student name" onChange={(event) => update(['teams', teamIndex, 'members', driverIndex], event.target.value)} /></label>)}</div>)}
      </div></section>
      <section className="device-team-select"><div><span className="eyebrow">Team device setting</span><h2>Which team is using this device?</h2><p>This selection loads the correct names in Build & Practice.</p></div><div>{project.teams.map((team, index) => <button key={team.id} className={project.activeTeamId === team.id ? 'active' : ''} type="button" onClick={() => { update('activeTeamId', team.id); update('practice.teamId', team.id); }}><TeamAvatar team={team} index={index} /><span>{team.name || `Team ${index + 1}`}</span>{project.activeTeamId === team.id && <b>✓ Using this team</b>}</button>)}</div></section>
      <div className="page-action-row"><span className="complete-note">{project.teams.reduce((sum, team) => sum + team.members.filter(Boolean).length, 0)}/12 students entered</span><button className="primary-action" type="button" onClick={() => goTo('mission')}>Continue to Mission <span aria-hidden="true">→</span></button></div>
    </main>
  );
}

function Mission({ acknowledged, acknowledge, openField, goTo }) {
  return (
    <main id="main-content" className="mission-page page-shell"><header className="page-lead"><span className="step-tag">02 · Mission & Field</span><h1>Collect. Carry. Deliver.</h1><p>{MISSION}</p></header>
      <section className="field-stage"><div className="field-heading"><div><span className="eyebrow">Official layout</span><h2>Three teams compete at once</h2></div><button type="button" className="secondary-action" onClick={openField}>View Full Field</button></div><button className="field-image-button" type="button" onClick={openField} aria-label="Open full field map"><img src="./images/field.jpg" alt="Challenge field with Supply Zone, three team zones, starts and delivery zones" /><span>Tap to enlarge</span></button></section>
      <section className="rules-strip" aria-label="Starting rules">{START_RULES.map(([number, rule]) => <div key={number}><span>{number}</span><strong>{rule}</strong></div>)}</section>
      <section className="scoring-explainer"><div className="object-visual"><img src="./images/cup-and-pin.jfif" alt="VEX Cup and Pin game objects" /></div><div className="scoring-copy"><span className="eyebrow">Same scoring for every team</span><h2>Two objects. One formula.</h2><p>Total Score = Cups × 5 + Pins × 10</p></div><div className="score-values"><div><span>Cup</span><strong>5</strong><small>points</small></div><div><span>Pin</span><strong>10</strong><small>points</small></div></div></section>
      <div className="page-action-row">{acknowledged && <span className="complete-note">✓ Mission understood</span>}<button className="primary-action" type="button" onClick={() => { acknowledge(); goTo('build'); }}>I Understand the Mission <span aria-hidden="true">→</span></button></div>
    </main>
  );
}

function TimerControls({ timer, onReset, startLabel = 'Start' }) {
  return <div className="timer-controls">{timer.status === 'idle' && <button className="control-start" type="button" onClick={timer.start}>{startLabel}</button>}{timer.status === 'running' && <button className="control-pause" type="button" onClick={timer.pause}>Pause</button>}{timer.status === 'paused' && <button className="control-start" type="button" onClick={timer.start}>Resume</button>}{timer.status === 'ended' && <span className="ended-label">Time ended</span>}<button className="control-reset" type="button" onClick={onReset}>Reset</button></div>;
}

function BuildPractice({ project, update, practiceTimer, setPracticeMode, onPracticeReset, goTo }) {
  const team = project.teams.find((item) => item.id === project.practice.teamId) || project.teams[0];
  const teamIndex = project.teams.findIndex((item) => item.id === team.id);
  const notes = project.notesByTeam[team.id] || { problem: '', improvement: '', practiceResult: '' };
  const checklist = project.practice.checklistByTeam[team.id] || [false, false, false, false];
  const current = project.practice.mode === 240_000 ? practiceTimer.currentDriver : project.practice.driverIndex;
  const currentName = team.members[current] || `Driver ${current + 1}`;
  return (
    <main id="main-content" className="build-page page-shell"><header className="page-lead compact-lead practice-lead"><div><span className="step-tag">03 · Build & Practice</span><h1>Change one thing. Test it fast.</h1><p>This page uses the roster selected on the Teams page.</p></div><label className="practice-team-picker"><span>Practicing as</span><select value={team.id} disabled={practiceTimer.status === 'running'} onChange={(event) => { update('practice.teamId', event.target.value); update('activeTeamId', event.target.value); }}>{project.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></header>
      <section className="practice-team-banner" style={{ '--team-color': TEAM_COLORS[teamIndex] }}><TeamAvatar team={team} index={teamIndex} large /><div><span>Loaded from Teams</span><h2>{team.name}</h2><p>{team.members.map((name, index) => name || `Driver ${index + 1}`).join(' · ')}</p></div><button type="button" onClick={() => goTo('teams')}>Edit roster</button></section>
      <section className="build-flow" aria-label="Build and practice steps">{BUILD_STEPS.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>{index < BUILD_STEPS.length - 1 && <i aria-hidden="true">→</i>}</div>)}</section>
      <section className="build-workspace"><div className="quick-notes"><span className="eyebrow">Optional team notes</span>{[['problem', 'Our main problem', 'What slows the robot down?'], ['improvement', 'Our improvement', 'What did you change?'], ['practiceResult', 'What improved after practice', 'What now works better?']].map(([key, label, placeholder]) => <label className="short-note" key={key}><span>{label}<small>{notes[key].length}/200</small></span><textarea rows="2" maxLength="200" value={notes[key]} placeholder={placeholder} onChange={(event) => update(['notesByTeam', team.id, key], event.target.value)} /></label>)}</div>
        <section className="practice-console"><div className="console-heading"><div><span className="eyebrow">Practice timer</span><h2>Give every driver a turn</h2></div><div className="mode-switch" aria-label="Practice timer mode"><button type="button" className={project.practice.mode === 60_000 ? 'active' : ''} onClick={() => setPracticeMode(60_000)}>1 min</button><button type="button" className={project.practice.mode === 240_000 ? 'active' : ''} onClick={() => setPracticeMode(240_000)}>4 min</button></div></div>
          {project.practice.mode === 60_000 && <label className="driver-select">Practice driver<select value={project.practice.driverIndex} disabled={practiceTimer.status === 'running'} onChange={(event) => update('practice.driverIndex', Number(event.target.value))}>{team.members.map((name, index) => <option key={`driver-${index}`} value={index}>{name || `Driver ${index + 1}`}</option>)}</select></label>}
          <div className={`practice-clock timer-status-${practiceTimer.status}`}><span>{team.name} · {currentName}</span><strong>{practiceTimer.display}</strong></div><TimerControls timer={practiceTimer} onReset={onPracticeReset} startLabel="Start Practice" />
          <div className="driver-checklist">{checklist.map((checked, index) => <label key={`check-${index}`} className={checked ? 'checked' : ''}><input type="checkbox" checked={checked} onChange={(event) => update(['practice', 'checklistByTeam', team.id, index], event.target.checked)} /><span>{checked ? '✓' : index + 1}</span><strong>{team.members[index] || `Driver ${index + 1}`}<small>practiced</small></strong></label>)}</div>
        </section></section>
      <div className="page-action-row"><span className="complete-note">{checklist.filter(Boolean).length}/4 drivers practiced</span><button type="button" className="primary-action" onClick={() => goTo('match')}>Ready to Compete <span aria-hidden="true">→</span></button></div>
    </main>
  );
}

function MiniCounter({ label, count, disabled, onChange }) {
  return <div className="mini-counter"><span>{label}<small>{label === 'Cups' ? '× 5' : '× 10'}</small></span><button type="button" aria-label={`Remove one ${label}`} disabled={disabled || count === 0} onClick={() => onChange(-1)}>−</button><strong>{count}</strong><button type="button" aria-label={`Add one ${label}`} disabled={disabled} onClick={() => onChange(1)}>+</button></div>;
}

function MatchMode({ project, update, matchTimer, alert, onMatchStart, onMatchReset, onScoresReset, onSave, goTo }) {
  const matchArea = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  useEffect(() => { const track = () => setIsFullscreen(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', track); return () => document.removeEventListener('fullscreenchange', track); }, []);
  const toggleFullscreen = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await matchArea.current?.requestFullscreen(); } catch { window.alert('Full-screen mode is not available in this browser.'); } };
  const changeScore = (teamId, key, delta) => {
    const index = project.match.scores.findIndex((score) => score.teamId === teamId);
    const score = project.match.scores[index];
    const locked = project.match.timer.status === 'ended' && project.match.lockScoringAtEnd && !score.scoringUnlocked;
    if (!locked) update(['match', 'scores', index, key], (value) => Math.max(0, Number(value || 0) + delta));
  };
  return (
    <main id="main-content" className="match-page"><section ref={matchArea} className={`match-console three-team-match ${alert ? `has-${alert.type}-alert` : ''}`}>
      {alert && <div className={`match-alert alert-${alert.type}`} role="alert"><strong>{alert.message}</strong>{alert.detail && <span>{alert.detail}</span>}</div>}
      <header className="match-topbar"><div className="match-identity"><label><span>Run</span><select value={project.match.type} onChange={(event) => update('match.type', event.target.value)}>{MATCH_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><b>3 teams · 12 drivers · 1 shared timer</b></div><div className="match-tools"><button type="button" aria-pressed={project.match.soundEnabled} onClick={() => update('match.soundEnabled', (value) => !value)}>{project.match.soundEnabled ? 'Sound on' : 'Sound off'}</button><button type="button" onClick={toggleFullscreen}>{isFullscreen ? 'Exit full screen' : 'Full screen'}</button><button type="button" onClick={() => goTo('mission')}>Field map</button></div></header>
      <div className="driver-stages">{DRIVER_PHASES.map(([driver, time], index) => <div key={driver} className={`${index === matchTimer.currentDriver ? 'current' : ''} ${index < matchTimer.currentDriver ? 'complete' : ''}`}><span>{index < matchTimer.currentDriver ? '✓' : `0${index + 1}`}</span><strong>{driver}</strong><small>{time}</small></div>)}</div>
      <section className="match-rosters" aria-label="All team driver rosters">{project.teams.map((team, teamIndex) => <article key={team.id} style={{ '--team-color': TEAM_COLORS[teamIndex] }}><div><TeamAvatar team={team} index={teamIndex} /><strong>{team.name}</strong></div><ol>{team.members.map((name, driverIndex) => <li key={`${team.id}-${driverIndex}`} className={driverIndex === matchTimer.currentDriver ? 'current' : ''}><span>D{driverIndex + 1}</span>{name || `Driver ${driverIndex + 1}`}</li>)}</ol></article>)}</section>
      <div className="match-main-grid"><section className="match-timer" aria-live="polite"><span className="current-driver-label">All teams · Driver {matchTimer.currentDriver + 1}</span><h2>DRIVE</h2><strong className="giant-time">{matchTimer.display}</strong><TimerControls timer={{ ...matchTimer, start: onMatchStart }} onReset={onMatchReset} /></section>
        <section className="multi-score-console"><div className="score-heading"><div><span className="eyebrow">Live scoring</span><h2>Three delivery zones</h2></div><button type="button" className="reset-score" onClick={onScoresReset}>Reset all</button></div><div className="team-score-stack">{project.teams.map((team, teamIndex) => {
          const scoreIndex = project.match.scores.findIndex((item) => item.teamId === team.id);
          const score = project.match.scores[scoreIndex] || createTeamScore(team.id);
          const total = calculateScore(score.cups, score.pins).totalScore;
          const locked = project.match.timer.status === 'ended' && project.match.lockScoringAtEnd && !score.scoringUnlocked;
          return <article className="team-live-score" key={team.id} style={{ '--team-color': TEAM_COLORS[teamIndex] }}><div className="live-team-name"><TeamAvatar team={team} index={teamIndex} /><strong>{team.name}</strong></div><MiniCounter label="Cups" count={score.cups} disabled={locked} onChange={(delta) => changeScore(team.id, 'cups', delta)} /><MiniCounter label="Pins" count={score.pins} disabled={locked} onChange={(delta) => changeScore(team.id, 'pins', delta)} /><div className="team-total"><span>Total</span><strong>{total}</strong></div>{locked && <button className="score-unlock" type="button" onClick={() => update(['match', 'scores', scoreIndex, 'scoringUnlocked'], true)}>Unlock</button>}</article>;
        })}</div><label className="lock-option"><input type="checkbox" checked={project.match.lockScoringAtEnd} onChange={(event) => update('match.lockScoringAtEnd', event.target.checked)} /><span>Lock all scoring when the match ends</span></label></section>
      </div><footer className="match-footer"><span className="mission-reminder"><b>Mission:</b> Supply Zone → Each team’s Delivery Zone</span><button type="button" className="end-save" onClick={onSave}>End and Save Match</button></footer>
    </section></main>
  );
}

const rankTeams = (teams) => {
  const sorted = [...teams].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.map((team) => ({ ...team, rank: sorted.findIndex((item) => item.totalScore === team.totalScore) + 1 }));
};

function Results({ project, saveCurrent, startNew, clearResults, goTo }) {
  const latest = project.results[0];
  const latestRanked = latest ? rankTeams(latest.teams) : [];
  const maxScore = latestRanked[0]?.totalScore ?? 0;
  const winners = latestRanked.filter((team) => team.totalScore === maxScore);
  const teamById = (id) => project.teams.find((team) => team.id === id) || { name: 'Team', image: '' };
  const exportCsv = () => {
    if (!project.results.length) return;
    const headings = ['Match', 'Run number', 'Date/time', 'Rank', 'Team', 'Cups', 'Cup points', 'Pins', 'Pin points', 'Total score', 'Driver participation'];
    const rows = project.results.flatMap((result) => rankTeams(result.teams).map((team) => [result.matchType, result.matchNumber, new Date(result.createdAt).toLocaleString(), team.rank, team.teamName, team.cups, team.cupPoints, team.pins, team.pinPoints, team.totalScore, `${team.driverParticipation}/4`]));
    downloadText('vex-three-team-results.csv', `\uFEFF${[headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`, 'text/csv;charset=utf-8');
  };
  const overall = project.teams.map((team) => {
    const scores = project.results.flatMap((result) => result.teams.filter((item) => item.teamId === team.id).map((item) => item.totalScore));
    return { ...team, totalScore: scores.length ? Math.max(...scores) : 0 };
  });
  return (
    <main id="main-content" className="results-page page-shell"><header className="page-lead compact-lead results-lead"><div><span className="step-tag">05 · Results</span><h1>Results & Rankings</h1><p>One saved match contains scores for all three teams.</p></div><div className="result-actions"><button type="button" onClick={saveCurrent}>Save Result</button><button type="button" onClick={() => window.print()}>Print</button><button type="button" onClick={exportCsv} disabled={!project.results.length}>Export CSV</button></div></header>
      {latest ? <><section className="winner-celebration"><div className="confetti-mark" aria-hidden="true">★</div><div><span className="eyebrow">Match complete</span><h2>{winners.length === 1 ? `Congratulations, ${winners[0].teamName}!` : `Congratulations, ${winners.map((team) => team.teamName).join(' & ')}!`}</h2><p>{winners.length === 1 ? `Highest score: ${maxScore} points` : `Joint winners with ${maxScore} points - no tie-break rule applied.`}</p></div><div className="winner-photos">{winners.map((winner) => { const team = teamById(winner.teamId); const index = project.teams.findIndex((item) => item.id === winner.teamId); return <TeamAvatar key={winner.teamId} team={team} index={index} large />; })}</div></section>
        <section className="latest-ranking"><div className="results-heading"><div><span className="eyebrow">Latest saved match</span><h2>{latest.matchType} · Run {latest.matchNumber}</h2></div><span>{new Date(latest.createdAt).toLocaleString()}</span></div><div className="podium-list">{latestRanked.map((result) => { const team = teamById(result.teamId); const index = project.teams.findIndex((item) => item.id === result.teamId); return <article key={result.teamId} className={`rank-${result.rank}`}><span className="rank-number">#{result.rank}</span><TeamAvatar team={team} index={index} large /><div><h3>{result.teamName}</h3><p>{result.cups} Cups · {result.pins} Pins · Drivers {result.driverParticipation}/4</p></div><strong>{result.totalScore}<small>points</small></strong></article>; })}</div></section>
      </> : <section className="empty-results"><span className="icon">🏁</span><h2>No saved matches yet</h2><p>Start a four-minute match and score all three teams.</p><button className="primary-action" type="button" onClick={startNew}>Start First Match</button></section>}
      {project.results.length > 0 && <><section className="overall-board"><div className="results-heading"><div><span className="eyebrow">Best score per team</span><h2>Overall leaderboard</h2></div><span>Ties share the same rank</span></div><ol className="leaderboard">{rankTeams(overall).map((team) => <li key={team.id}><span className="rank">#{rankTeams(overall).find((item) => item.id === team.id).rank}</span><TeamAvatar team={team} index={project.teams.findIndex((item) => item.id === team.id)} /><strong>{team.name}</strong><b>{team.totalScore} pts</b></li>)}</ol></section>
        <section className="history-section"><div className="results-heading"><div><span className="eyebrow">Saved on this device</span><h2>Match history</h2></div><span>{project.results.length} match{project.results.length === 1 ? '' : 'es'}</span></div>{project.results.map((result) => <article className="match-history-card" key={result.id}><header><strong>{result.matchType} · Run {result.matchNumber}</strong><span>{new Date(result.createdAt).toLocaleString()}</span></header><div>{rankTeams(result.teams).map((team) => <p key={team.teamId}><b>#{team.rank} {team.teamName}</b><span>{team.cups} Cups · {team.pins} Pins</span><strong>{team.totalScore} pts</strong></p>)}</div></article>)}</section></>}
      <div className="results-bottom-actions"><button type="button" className="primary-action" onClick={startNew}>Start New Match</button><button type="button" onClick={() => goTo('certificate')}>Create Certificates</button><button type="button" className="danger-quiet" disabled={!project.results.length} onClick={clearResults}>Clear Results</button></div>
    </main>
  );
}

function CertificateCard({ student }) {
  return <article className="certificate-page"><img src="./images/certificate-template.png" alt="LSTS VEX V5 Certificate of Participation template" /><div className="certificate-student-name">{student.name}</div><div className="certificate-team-name">{student.teamName}</div></article>;
}

function CertificatePage({ teams, goTo }) {
  const students = useMemo(() => teams.flatMap((team, teamIndex) => team.members.map((name, driverIndex) => ({ id: `${team.id}-${driverIndex}`, name: name.trim(), teamId: team.id, teamName: team.name, teamIndex })).filter((student) => student.name)), [teams]);
  const [selectedId, setSelectedId] = useState(students[0]?.id || '');
  const [printStudents, setPrintStudents] = useState(null);
  const selected = students.find((student) => student.id === selectedId) || students[0];
  useEffect(() => { if (students.length && !students.some((student) => student.id === selectedId)) setSelectedId(students[0].id); }, [selectedId, students]);
  useEffect(() => { const afterPrint = () => setPrintStudents(null); window.addEventListener('afterprint', afterPrint); return () => window.removeEventListener('afterprint', afterPrint); }, []);
  const print = (targets) => { setPrintStudents(targets); window.setTimeout(() => window.print(), 120); };
  const visibleCertificates = printStudents || (selected ? [selected] : []);
  return (
    <main id="main-content" className={`certificate-page-shell page-shell ${printStudents ? 'is-printing-certificates' : ''}`}><header className="page-lead compact-lead certificate-lead"><div><span className="step-tag">06 · Certificate</span><h1>Celebrate every student.</h1><p>Names and teams are loaded directly from the Teams page.</p></div>{students.length > 0 && <button className="primary-action" type="button" onClick={() => print(students)}>Save All as One PDF</button>}</header>
      {students.length ? <section className="certificate-workspace"><aside className="student-certificate-list"><div><span className="eyebrow">Participants</span><h2>{students.length} certificates</h2></div>{teams.map((team, teamIndex) => <div className="certificate-team-group" key={team.id}><h3 style={{ '--team-color': TEAM_COLORS[teamIndex] }}>{team.name}</h3>{students.filter((student) => student.teamId === team.id).map((student) => <div className={selected?.id === student.id ? 'selected' : ''} key={student.id}><button type="button" onClick={() => setSelectedId(student.id)}><span>{student.name}</span><small>Driver {Number(student.id.split('-').at(-1)) + 1}</small></button><button type="button" className="student-pdf-button" aria-label={`Save certificate PDF for ${student.name}`} onClick={() => print([student])}>PDF</button></div>)}</div>)}</aside>
        <section className="certificate-preview"><div className="certificate-preview-bar"><div><span>Preview</span><strong>{selected?.name}</strong></div><button type="button" onClick={() => print([selected])}>Save This Certificate as PDF</button></div><div className="certificate-screen-frame">{selected && <CertificateCard student={selected} />}</div><p>In the print window, choose <b>Save as PDF</b>. Use A4, Portrait, Scale 100% and Margins: None.</p></section>
      </section> : <section className="empty-results"><span className="icon">🎓</span><h2>No student names yet</h2><p>Enter student names on the Teams page before creating certificates.</p><button className="primary-action" type="button" onClick={() => goTo('teams')}>Open Teams</button></section>}
      <div className="certificate-print-stack" aria-hidden={!printStudents}>{visibleCertificates.map((student) => <CertificateCard key={student.id} student={student} />)}</div>
    </main>
  );
}

export default function App() {
  const { project, setProject, update, saveState } = useProject();
  const [fieldOpen, setFieldOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const alertTimeout = useRef(null);
  const audioContext = useRef(null);
  const goTo = useCallback((view) => { update('currentView', view); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [update]);
  const setMatchTimer = useCallback((value) => update('match.timer', value), [update]);
  const setPracticeTimer = useCallback((value) => update('practice.timer', value), [update]);
  const playSignal = useCallback((kind = 'change') => {
    if (!project.match.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext.current ||= new AudioContextClass();
      const context = audioContext.current;
      const tone = (frequency, start, length) => { const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = frequency; oscillator.type = 'square'; gain.gain.setValueAtTime(0.0001, context.currentTime + start); gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + start + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + length); oscillator.connect(gain).connect(context.destination); oscillator.start(context.currentTime + start); oscillator.stop(context.currentTime + start + length + 0.02); };
      if (kind === 'end') { tone(520, 0, 0.2); tone(390, 0.28, 0.42); } else tone(740, 0, 0.18);
    } catch { /* Visual alerts remain available. */ }
  }, [project.match.soundEnabled]);
  const showAlert = useCallback((type, message, detail, duration = 3200) => { window.clearTimeout(alertTimeout.current); setAlert({ type, message, detail, id: Date.now() }); alertTimeout.current = window.setTimeout(() => setAlert(null), duration); }, []);
  useEffect(() => () => { window.clearTimeout(alertTimeout.current); audioContext.current?.close?.(); }, []);
  const markDriverSeen = useCallback((index) => update(['match', 'driverSeen', index], true), [update]);
  const matchTimer = useTimestampTimer(project.match.timer, setMatchTimer, {
    onDriverChange: (nextDriver) => { markDriverSeen(nextDriver); playSignal('change'); showAlert('change', 'CHANGE DRIVER!', `All teams: pass controllers to Driver ${nextDriver + 1}`); },
    onEnd: () => { markDriverSeen(3); playSignal('end'); showAlert('end', 'MATCH ENDED', 'Stop all robots and confirm the three scores.', 5000); },
  });
  const practiceTeam = project.teams.find((team) => team.id === project.practice.teamId) || project.teams[0];
  const practiceResolveDriver = useCallback((remaining, duration) => duration === 240_000 ? driverFromRemaining(remaining) : project.practice.driverIndex, [project.practice.driverIndex]);
  const practiceTimer = useTimestampTimer(project.practice.timer, setPracticeTimer, {
    resolveDriver: practiceResolveDriver,
    onDriverChange: (nextDriver, previousDriver) => { update(['practice', 'checklistByTeam', practiceTeam.id, previousDriver], true); playSignal('change'); showAlert('change', 'CHANGE DRIVER!', practiceTeam.members[nextDriver] || `Driver ${nextDriver + 1}`); },
    onEnd: () => { if (project.practice.mode === 240_000) update(['practice', 'checklistByTeam', practiceTeam.id], [true, true, true, true]); else update(['practice', 'checklistByTeam', practiceTeam.id, project.practice.driverIndex], true); playSignal('end'); },
  });
  const startMatch = () => { markDriverSeen(matchTimer.currentDriver); playSignal('change'); matchTimer.start(); };
  const resetMatch = () => { if (!window.confirm('Reset the shared 4-minute timer? Team scores will stay unchanged.')) return; matchTimer.reset(); update('match.driverSeen', [false, false, false, false]); update('match.scores', project.teams.map((team) => ({ ...(project.match.scores.find((score) => score.teamId === team.id) || createTeamScore(team.id)), scoringUnlocked: false }))); setAlert(null); };
  const resetScores = () => { if (!window.confirm('Reset Cups, Pins and Total Score for all three teams?')) return; update('match.scores', project.teams.map((team) => createTeamScore(team.id))); };
  const setPracticeMode = (durationMs) => { if (project.practice.timer.status === 'running' && !window.confirm('Change practice mode and reset the timer?')) return; update('practice.mode', durationMs); update('practice.timer', createTimer(durationMs)); };
  const resetPractice = () => { if (!window.confirm('Reset this practice timer?')) return; practiceTimer.reset(); setAlert(null); };
  const saveCurrentResult = useCallback((navigate = true) => {
    setProject((current) => {
      const existingIndex = current.results.findIndex((result) => result.sessionId === current.match.sessionId);
      const existing = current.results[existingIndex];
      const matchNumber = existing?.matchNumber || current.results.length + 1;
      const teams = current.teams.map((team) => {
        const score = current.match.scores.find((item) => item.teamId === team.id) || createTeamScore(team.id);
        const calculated = calculateScore(score.cups, score.pins);
        return { teamId: team.id, teamName: team.name || 'Unnamed Team', members: [...team.members], cups: calculated.cups, cupPoints: calculated.cupPoints, pins: calculated.pins, pinPoints: calculated.pinPoints, totalScore: calculated.totalScore, driverParticipation: current.match.driverSeen.filter(Boolean).length };
      });
      const result = { id: existing?.id || makeId(), sessionId: current.match.sessionId, matchType: current.match.type, matchNumber, teams, createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      const results = existingIndex >= 0 ? current.results.map((item, index) => index === existingIndex ? result : item) : [result, ...current.results];
      return { ...current, currentView: navigate ? 'results' : current.currentView, results };
    });
  }, [setProject]);
  const endAndSave = () => { if (project.match.timer.status !== 'ended') { if (!window.confirm(project.match.timer.status === 'running' ? 'End the match now and save all three team scores?' : 'Save all three team scores for this run?')) return; matchTimer.end(); playSignal('end'); } saveCurrentResult(true); };
  const startNewMatch = () => { const hasScore = project.match.scores.some((score) => score.cups || score.pins); if (hasScore && !window.confirm('Start a new match? All current team scores will reset to 0.')) return; update('match', { ...project.match, sessionId: makeId(), timer: createTimer(), scores: project.teams.map((team) => createTeamScore(team.id)), driverSeen: [false, false, false, false] }); setAlert(null); goTo('match'); };
  const clearResults = () => { if (window.confirm('Clear all saved match results from this device? This cannot be undone.')) update('results', []); };
  const view = project.currentView;
  return <div className={`app view-${view}`}><a className="skip-link" href="#main-content">Skip to main content</a><Header currentView={view} goTo={goTo} saveState={saveState} teams={project.teams} scores={project.match.scores} currentDriver={matchTimer.currentDriver} />
    {view === 'home' && <Home goTo={goTo} />}
    {view === 'teams' && <TeamsPage project={project} update={update} goTo={goTo} />}
    {view === 'mission' && <Mission acknowledged={project.missionAcknowledged} acknowledge={() => update('missionAcknowledged', true)} openField={() => setFieldOpen(true)} goTo={goTo} />}
    {view === 'build' && <BuildPractice project={project} update={update} practiceTimer={practiceTimer} setPracticeMode={setPracticeMode} onPracticeReset={resetPractice} goTo={goTo} />}
    {view === 'match' && <MatchMode project={project} update={update} matchTimer={matchTimer} alert={alert} onMatchStart={startMatch} onMatchReset={resetMatch} onScoresReset={resetScores} onSave={endAndSave} goTo={goTo} />}
    {view === 'results' && <Results project={project} saveCurrent={() => saveCurrentResult(false)} startNew={startNewMatch} clearResults={clearResults} goTo={goTo} />}
    {view === 'certificate' && <CertificatePage teams={project.teams} goTo={goTo} />}
    {fieldOpen && <FieldViewer onClose={() => setFieldOpen(false)} />}
  </div>;
}
