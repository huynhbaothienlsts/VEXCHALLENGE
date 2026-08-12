import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pageOrder, stages, testMetrics } from '../data/challenge';

export function Field({ label, hint, value, onChange, type = 'text', min, max, placeholder, required = false }) {
  const id = useMemo(() => `field-${crypto.randomUUID()}`, []);
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</span>
      {hint && <span className="field-hint">{hint}</span>}
      <input id={id} type={type} min={min} max={max} value={value ?? ''} placeholder={placeholder} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function TextArea({ label, hint, value, onChange, placeholder, rows = 3 }) {
  const id = useMemo(() => `field-${crypto.randomUUID()}`, []);
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      <textarea id={id} rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function Checkbox({ checked, onChange, children, disabled = false }) {
  return (
    <label className={`check-row ${checked ? 'is-checked' : ''}`}>
      <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="check-box" aria-hidden="true">{checked ? '✓' : ''}</span>
      <span>{children}</span>
    </label>
  );
}

export function Callout({ tone = 'blue', label, children }) {
  return <aside className={`callout callout-${tone}`}><strong>{label}</strong><span>{children}</span></aside>;
}

export function SectionTitle({ eyebrow, title, intro, action }) {
  return (
    <header className="page-title">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{intro && <p>{intro}</p>}</div>
      {action}
    </header>
  );
}

export function Timer({ minutes = 1, label = 'Stage timer', compact = false }) {
  const initial = Math.max(1, Math.round(minutes * 60));
  const [remaining, setRemaining] = useState(initial);
  const [running, setRunning] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    endRef.current = Date.now() + remaining * 1000;
    const tick = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) setRunning(false);
    }, 250);
    return () => window.clearInterval(tick);
  }, [running]);

  const reset = () => { setRunning(false); setRemaining(initial); };
  const display = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  return (
    <section className={`timer ${compact ? 'timer-compact' : ''} ${remaining === 0 ? 'timer-ended' : ''}`} aria-label={label} aria-live="polite">
      <div><span className="timer-label">{label}</span><strong className="timer-display">{display}</strong></div>
      <div className="timer-actions">
        <button className="button button-small" type="button" onClick={() => setRunning((value) => !value)} disabled={remaining === 0}>{running ? 'Pause' : 'Start'}</button>
        <button className="button button-small button-quiet" type="button" onClick={reset}>Reset</button>
      </div>
      {remaining === 0 && <p className="timer-note">Time is up. Finish safely, then record your result.</p>}
    </section>
  );
}

export function PerformanceChart({ tests, metric, setMetric, print = false }) {
  const metricInfo = testMetrics.find(([id]) => id === metric) ?? testMetrics[0];
  const points = tests.map((row, index) => ({ index, label: row.name, value: row[metric] === '' ? null : Number(row[metric]) }));
  const values = points.filter((point) => Number.isFinite(point.value)).map((point) => point.value);
  const max = Math.max(1, ...values);
  return (
    <section className="chart-panel" aria-labelledby="chart-title">
      <div className="chart-heading">
        <div><span className="eyebrow">Evidence view</span><h2 id="chart-title">Performance comparison</h2></div>
        {!print && (
          <label className="metric-select">Metric
            <select value={metric} onChange={(event) => setMetric(event.target.value)}>
              {testMetrics.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="bar-chart" role="img" aria-label={`${metricInfo[1]} for ${points.filter((point) => point.value !== null).length} recorded tests`}>
        {points.map((point) => {
          const height = point.value === null ? 0 : Math.max(4, (point.value / max) * 100);
          return (
            <div className="bar-column" key={point.label}>
              <div className="bar-value">{point.value ?? '—'}</div>
              <div className="bar-track"><div className={`bar ${point.value === null ? 'bar-empty' : ''}`} style={{ height: `${height}%` }} /></div>
              <div className="bar-label">{point.label.replace(' ', '\n')}</div>
            </div>
          );
        })}
      </div>
      {values.length === 0 && <p className="empty-note">Enter test data to build the chart. No sample values are added.</p>}
    </section>
  );
}

export function ProgressBar({ project }) {
  const completed = stages.filter((stage) => project.stageStatus[stage.id] === 'completed').length;
  const percentage = Math.round((completed / stages.length) * 100);
  return (
    <div className="top-progress" aria-label={`Project progress: ${percentage}%`}>
      <div className="progress-copy"><span>{project.team.name || 'Your team'}</span><strong>{percentage}% complete</strong></div>
      <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
    </div>
  );
}

export function PageNavigation({ page, goTo }) {
  const index = pageOrder.indexOf(page);
  if (index < 0) return null;
  return (
    <nav className="page-nav" aria-label="Page navigation">
      <button className="button button-quiet" type="button" disabled={index === 0} onClick={() => goTo(pageOrder[index - 1])}>← Previous</button>
      <span>{index + 1} / {pageOrder.length}</span>
      <button className="button" type="button" disabled={index === pageOrder.length - 1} onClick={() => goTo(pageOrder[index + 1])}>Next →</button>
    </nav>
  );
}

export function AppShell({ project, page, goTo, saveState, children, onExport, onImport, onReset }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const groups = [
    ['Get started', [['dashboard', 'Project dashboard'], ['brief', 'Project brief'], ['goals', 'Learning goals'], ['team', 'Team setup'], ['priority', 'Design priority'], ['constraints', 'Constraints']]],
    ['Engineer', [['baseline', 'Baseline'], ['inquiry', 'Rapid inquiry'], ['plan', 'Design plan'], ['build', 'Build checkpoint'], ['testing', 'Testing data'], ['analysis', 'Analyze & improve']]],
    ['Communicate', [['presentation', 'Presentation'], ['rubric', 'Self-check rubric'], ['reflection', 'Reflection'], ['summary', 'Project summary']]],
  ];
  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button className="icon-button" aria-expanded={menuOpen} aria-label="Open navigation" onClick={() => setMenuOpen((value) => !value)}>☰</button>
        <button className="brand-button" onClick={() => goTo('dashboard')}>VEX <span>Innovation Lab</span></button>
        <span className="save-dot" title={saveState} aria-label={saveState} />
      </header>
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark">V</span><div><strong>VEX Rapid Innovation</strong><span>Interactive notebook</span></div></div>
        <nav aria-label="Project sections">
          {groups.map(([group, links]) => (
            <div className="nav-group" key={group}><span>{group}</span>
              {links.map(([id, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { goTo(id); setMenuOpen(false); }}>{label}</button>)}
            </div>
          ))}
          <div className="nav-group"><span>Support</span><button className={page === 'help' ? 'active' : ''} onClick={() => { goTo('help'); setMenuOpen(false); }}>Help & glossary</button></div>
        </nav>
        <div className="sidebar-tools">
          <span className="save-status"><i />{saveState}</span>
          <div><button onClick={onExport}>Export</button><label className="import-label">Import<input type="file" accept="application/json,.json" onChange={onImport} /></label><button onClick={onReset}>Reset</button></div>
          <small>Stored on this device only. It does not sync automatically.</small>
        </div>
      </aside>
      {menuOpen && <button className="menu-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <div className="workspace">
        <ProgressBar project={project} />
        <main id="main-content" tabIndex="-1" className="page">{children}</main>
        <PageNavigation page={page} goTo={goTo} />
      </div>
    </div>
  );
}

export function StatusControl({ value, onChange }) {
  return (
    <label className="status-control">Status
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="not-started">Not Started</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </label>
  );
}
