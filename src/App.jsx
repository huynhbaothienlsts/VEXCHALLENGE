import React, { useEffect, useMemo, useState } from 'react';
import {
  constraints, finalProducts, glossary, pageOrder, priorities, roles, rubricCriteria, stages, testMetrics, timeline,
} from './data/challenge';
import { useProject } from './hooks/useProject';
import {
  AppShell, Callout, Checkbox, Field, PerformanceChart, SectionTitle, StatusControl, TextArea, Timer,
} from './components/Common';

const downloadFile = (name, content, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const safeName = (value) => (value || 'vex-project').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

function Landing({ hasSession, onStart, onContinue }) {
  return (
    <main className="landing" id="main-content">
      <div className="landing-copy">
        <span className="program-label">The Science Exchange Program at LSTS</span>
        <h1>VEX Rapid<br />Innovation Challenge</h1>
        <p className="landing-subtitle">Emergency Supply Delivery Robot</p>
        <div className="landing-facts" aria-label="Challenge facts">
          <span><strong>12</strong> students</span><span><strong>4</strong> schools</span><span><strong>3</strong> international teams</span><span><strong>180</strong> minutes</span>
        </div>
        <p className="landing-mantra">Design. Test. Improve. Defend with evidence.</p>
        <div className="landing-actions">
          <button className="button button-primary button-large" onClick={onStart}>Start the Challenge <span aria-hidden="true">→</span></button>
          {hasSession && <button className="button button-light button-large" onClick={onContinue}>Continue Previous Session</button>}
        </div>
        <p className="device-note">Your work autosaves on this device. Export it to move to another device.</p>
      </div>
      <div className="landing-visual">
        <img src="./challenge-hero.png" alt="Three international students working together with an emergency supply delivery robot" />
        <div className="zone-strip" aria-label="Mission route"><span>Supply zone</span><i>→</i><span>Travel zone</span><i>→</i><span>Delivery zone</span></div>
      </div>
    </main>
  );
}

function DashboardPage({ project, update, goTo }) {
  const completed = stages.filter((stage) => project.stageStatus[stage.id] === 'completed').length;
  return (
    <>
      <SectionTitle eyebrow="Project dashboard" title={`Ready, ${project.team.name || 'engineering team'}?`} intro="Move at your team’s pace. Steps are never locked, and you can return to earlier evidence at any time." />
      <Callout tone="yellow" label="Driving question">How might we adapt a VEX Clawbot to deliver emergency supplies effectively under different real-world priorities?</Callout>
      <section className="dashboard-overview">
        <div><span>Overall progress</span><strong>{completed} of 6 stages complete</strong></div>
        <div><span>Design priority</span><strong>{priorities.find((item) => item.id === project.priority)?.title || 'Not selected yet'}</strong></div>
        <div><span>Time plan</span><strong>180-minute sprint</strong></div>
      </section>
      <div className="stage-list">
        {stages.map((stage, index) => (
          <article className={`stage-row status-${project.stageStatus[stage.id]}`} key={stage.id}>
            <div className="stage-number">{String(index + 1).padStart(2, '0')}</div>
            <div className="stage-main"><span className="stage-time">{stage.time}</span><h2>{stage.label}</h2><ul>{stage.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <StatusControl value={project.stageStatus[stage.id]} onChange={(value) => update(['stageStatus', stage.id], value)} />
            <button className="button" onClick={() => goTo(stage.page)}>Continue →</button>
          </article>
        ))}
      </div>
      <section className="timeline-block">
        <div className="section-heading"><span className="eyebrow">Suggested pacing</span><h2>One sprint, ten activity windows</h2><p>Times guide your work; they do not lock the website.</p></div>
        <div className="timeline-grid">{timeline.map(([time, label]) => <div key={time}><strong>{time}</strong><span>{label}</span></div>)}</div>
      </section>
    </>
  );
}

function BriefPage() {
  return (
    <>
      <SectionTitle eyebrow="01 · Project brief" title="Robots can go where people cannot" intro="A disaster has made several delivery areas unsafe. Your team must adapt a working VEX V5 Clawbot to collect and deliver emergency supplies." action={<Timer minutes={15} label="Brief timer" compact />} />
      <section className="mission-map" aria-label="Emergency supply mission map">
        <div className="mission-zone supply"><span>01</span><strong>Supply Zone</strong><p>Collect cups and pins.</p></div><div className="mission-arrow">→</div>
        <div className="mission-zone travel"><span>02</span><strong>Travel Zone</strong><p>Navigate a safe route.</p></div><div className="mission-arrow">→</div>
        <div className="mission-zone delivery"><span>03</span><strong>Delivery Zone</strong><p>Place supplies at goals.</p></div>
      </section>
      <div className="split-layout">
        <section><span className="eyebrow">Mission language</span><h2>What each game element represents</h2><dl className="definition-list"><div><dt>Cups</dt><dd>Food and medicine</dd></div><div><dt>Pins</dt><dd>Medical tools and urgent supplies</dd></div><div><dt>Goals</dt><dd>Delivery stations</dd></div><div><dt>Field zones</dt><dd>Supply, travel and delivery areas</dd></div></dl></section>
        <section className="dark-panel"><span className="eyebrow">Engineering lens</span><h2>This is an open design challenge.</h2><ul className="clean-list"><li>We use selected Override game elements, not the full competition rules.</li><li>There is no single correct answer.</li><li>Every team must create its own solution.</li><li>Evidence makes a solution convincing.</li></ul></section>
      </div>
      <Callout label="Remember">Your team is improving one focused part of an already working robot—not rebuilding the whole machine.</Callout>
    </>
  );
}

function GoalsPage() {
  const columns = [
    ['Know', 'blue', ['Clawbot components', 'Engineering Design Process', 'Design criteria and constraints', 'Baseline, trial, data and evidence']],
    ['Understand', 'yellow', ['Many engineering solutions can work.', 'Every design involves trade-offs.', 'Data is stronger than opinion.', 'Failure provides information for improvement.', 'A convincing engineering claim requires evidence.']],
    ['Do', 'green', ['Identify a specific problem.', 'Develop a testable hypothesis.', 'Create one focused improvement.', 'Run controlled trials.', 'Compare baseline and prototype performance.', 'Present and defend a solution with evidence.']],
  ];
  return (
    <><SectionTitle eyebrow="Learning goals · KUD" title="Know it. Understand it. Use it." intro="By the end of the challenge, your team should be able to explain both what changed and why the evidence supports that change." />
      <div className="kud-grid">{columns.map(([title, color, items]) => <section className={`kud-column kud-${color}`} key={title}><span className="eyebrow">{title}</span><ol>{items.map((item) => <li key={item}>{item}</li>)}</ol></section>)}</div>
      <Callout tone="yellow" label="Evidence mindset">There is no single correct answer. Your evidence will make your solution convincing.</Callout>
    </>
  );
}

function TeamPage({ project, update }) {
  return (
    <><SectionTitle eyebrow="Team setup · 15 minutes" title="Four people, four shared responsibilities" intro="Roles clarify ownership. They do not limit who may contribute ideas, build, test or speak." action={<Timer minutes={15} label="Team setup" compact />} />
      <div className="form-grid two"><Field label="Team name" value={project.team.name} onChange={(value) => update('team.name', value)} placeholder="Create a team name" /><Field label="Schools represented" hint="LSTS, Bailing, Lishan, KangChiao" value={project.team.schools} onChange={(value) => update('team.schools', value)} placeholder="List your schools" /></div>
      <div className="role-list">{project.team.members.map((member, index) => <section className="role-row" key={member.role}><div className="role-index">0{index + 1}</div><div><h2>{member.role}</h2><p>{roles[index][1]}</p></div><Field label="Student name" value={member.name} onChange={(value) => update(['team', 'members', index, 'name'], value)} placeholder="Name" /><Field label="School" value={member.school} onChange={(value) => update(['team', 'members', index, 'school'], value)} placeholder="School" /></section>)}</div>
      <Checkbox checked={project.team.agreement} onChange={(value) => update('team.agreement', value)}>Everyone contributes ideas, understands the design and participates in the final presentation.</Checkbox>
    </>
  );
}

function PriorityPage({ project, update }) {
  return (
    <><SectionTitle eyebrow="Design priority card" title="Same mission. Three different priorities." intro="Choose the priority your team will defend. You can change it later if it was selected by mistake." />
      <div className="priority-grid">{priorities.map((item) => <article className={`priority-card priority-${item.color} ${project.priority === item.id ? 'selected' : ''}`} key={item.id}><div className="priority-top"><span>{item.label}</span>{project.priority === item.id && <strong>Selected ✓</strong>}</div><h2>{item.title}</h2><p className="priority-mission">{item.mission}</p><div><h3>Design focus</h3><p>{item.focus}</p></div><div><h3>Ask your team</h3><ul>{item.questions.map((question) => <li key={question}>{question}</li>)}</ul></div><div><h3>Success looks like</h3><p>{item.success}</p></div><button className="button" onClick={() => update('priority', item.id)}>{project.priority === item.id ? 'Priority confirmed' : 'Choose this priority'}</button></article>)}</div>
    </>
  );
}

function ConstraintsPage({ project, update }) {
  const complete = project.constraints.every(Boolean);
  return (
    <><SectionTitle eyebrow="Design constraints" title="Keep the challenge focused, fair and safe" intro="Read every constraint together before anyone changes the robot." />
      <div className="constraint-layout"><section className="check-stack">{constraints.map((item, index) => <Checkbox key={item} checked={project.constraints[index]} onChange={(value) => update(['constraints', index], value)}>{item}</Checkbox>)}</section><aside className="stop-check"><span>Stop</span><i>→</i><span>Check</span><i>→</i><span>Test</span><p>Pause before every run. Confirm the attachment is secure, the field is clear and the start position is consistent.</p></aside></div>
      <Checkbox checked={project.constraintsConfirmed} disabled={!complete} onChange={(value) => update('constraintsConfirmed', value)}>Our team has read every constraint and agrees to STOP → CHECK → TEST.</Checkbox>
      {!complete && <p className="inline-warning">Check all seven constraints before confirming.</p>}
    </>
  );
}

function BaselinePage({ project, update }) {
  const setMetric = (key, value) => { update(['baseline', key], value); if (['delivered', 'correct', 'drops', 'time'].includes(key)) update(['tests', 0, key], value); };
  return (
    <><SectionTitle eyebrow="Stage 2 · Baseline · 15 minutes" title="Observe before you redesign" intro="Run the original Clawbot for 60 seconds. Do not modify it yet." action={<Timer minutes={1} label="Robot run" compact />} />
      <div className="baseline-layout"><section><h2>Record the original performance</h2><div className="form-grid three"><Field label="Objects reached" type="number" min="0" value={project.baseline.reached} onChange={(value) => setMetric('reached', value)} /><Field label="Objects delivered" type="number" min="0" value={project.baseline.delivered} onChange={(value) => setMetric('delivered', value)} /><Field label="Correct placements" type="number" min="0" value={project.baseline.correct} onChange={(value) => setMetric('correct', value)} /><Field label="Drops / errors" type="number" min="0" value={project.baseline.drops} onChange={(value) => setMetric('drops', value)} /><Field label="Completion time (seconds)" type="number" min="0" max="60" value={project.baseline.time} onChange={(value) => setMetric('time', value)} /></div><TextArea label="Observed difficulties" value={project.baseline.difficulties} onChange={(value) => update('baseline.difficulties', value)} placeholder="Describe what the team noticed during the run." /></section>
        <section className="observe-panel"><span className="eyebrow">Observe</span><h2>Look for a useful failure</h2>{[['failed', 'What failed?'], ['lostTime', 'Where was time lost?'], ['dropCause', 'What caused drops?'], ['controlDifficulty', 'What was difficult to control?']].map(([key, label]) => <TextArea key={key} label={label} rows={2} value={project.baseline[key]} onChange={(value) => update(['baseline', key], value)} />)}</section></div>
      <Callout tone="yellow" label="Why baseline matters">You need a fair “before” result to show whether the new design is actually better.</Callout>
    </>
  );
}

function InquiryPage({ project, update, goTo }) {
  const q = project.inquiry;
  const sentence = q.ifPart || q.thenPart || q.becausePart ? `If we ${q.ifPart || '__________'}, then the robot will ${q.thenPart || '__________'} because ${q.becausePart || '__________'}.` : '';
  const fields = [['observation', '1. We observed that…'], ['problem', '2. We think the main problem is…'], ['cause', '3. Possible cause…'], ['idea1', '4. Idea 1…'], ['idea2', '5. Idea 2…'], ['selected', '6. Selected idea…'], ['expected', '7. Expected evidence…']];
  return (
    <><SectionTitle eyebrow="Stage 3 · Rapid inquiry · 20 minutes" title="Turn one observation into a testable idea" intro="Observation → Problem → Hypothesis → Design Idea → Expected Evidence" action={<Timer minutes={20} label="Inquiry timer" compact />} />
      <div className="inquiry-path" aria-hidden="true">{['Observe', 'Define', 'Hypothesize', 'Design', 'Predict evidence'].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}</div>
      <div className="form-grid two">{fields.map(([key, label]) => <TextArea key={key} label={label} rows={2} value={q[key]} onChange={(value) => update(['inquiry', key], value)} />)}</div>
      <section className="hypothesis-builder"><div><span className="eyebrow">Hypothesis builder</span><h2>If → then → because</h2><p>A strong hypothesis predicts what will change and explains why.</p></div><div className="hypothesis-fields"><Field label="If we…" value={q.ifPart} onChange={(value) => update('inquiry.ifPart', value)} /><Field label="Then the robot will…" value={q.thenPart} onChange={(value) => update('inquiry.thenPart', value)} /><Field label="Because…" value={q.becausePart} onChange={(value) => update('inquiry.becausePart', value)} /></div>{sentence && <blockquote>{sentence}</blockquote>}</section>
      <button className="button" onClick={() => goTo('plan')}>Continue to design plan →</button>
    </>
  );
}

function DesignPlanPage({ project, update }) {
  const types = [['Attachment', 'Guide, grip or hold objects more effectively.'], ['Claw adjustment', 'Change contact, angle or stability.'], ['Driving strategy', 'Optimize route, approach and action sequence.'], ['Simple control change', 'Adjust speed or add basic assistance.']];
  const safety = ['Robot is powered off while building.', 'Attachment is secure and removable.', 'No sharp or unsafe protrusions.', 'The field is clear before testing.'];
  const checks = ['Can we build it safely?', 'Can we test it fairly?', 'Can we explain why it should work?', 'Does it directly address our hypothesis?'];
  const upload = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 1_500_000) { window.alert('Choose an image smaller than 1.5 MB so local saving remains reliable.'); return; }
    const reader = new FileReader(); reader.onload = () => update('designPlan.sketch', reader.result); reader.readAsDataURL(file);
  };
  return (
    <><SectionTitle eyebrow="Design plan" title="Plan one focused improvement" intro="Choose the smallest change that directly tests your hypothesis." />
      <fieldset className="choice-grid"><legend>Improvement type</legend>{types.map(([name, description]) => <label className={project.designPlan.type === name ? 'choice selected' : 'choice'} key={name}><input type="radio" name="design-type" value={name} checked={project.designPlan.type === name} onChange={() => update('designPlan.type', name)} /><strong>{name}</strong><span>{description}</span></label>)}</fieldset>
      <div className="form-grid two"><TextArea label="Describe your solution" value={project.designPlan.description} onChange={(value) => update('designPlan.description', value)} placeholder="What will you add, adjust or do differently?" /><TextArea label="Parts and materials needed" value={project.designPlan.parts} onChange={(value) => update('designPlan.parts', value)} placeholder="List only supplied parts and materials." /></div>
      <section className="sketch-uploader"><div><span className="eyebrow">Annotated sketch</span><h2>Add a photo of your plan</h2><p>Use arrows or labels on paper first, then photograph the sketch.</p><label className="button button-light">Choose image<input type="file" accept="image/*" onChange={upload} /></label>{project.designPlan.sketch && <button className="button button-quiet" onClick={() => update('designPlan.sketch', '')}>Remove image</button>}</div>{project.designPlan.sketch ? <img src={project.designPlan.sketch} alt="Team’s uploaded annotated design sketch" /> : <div className="sketch-placeholder" aria-label="No sketch uploaded"><span>＋</span>No sketch uploaded</div>}</section>
      <div className="split-layout"><section><h2>Safety before testing</h2><div className="check-stack">{safety.map((item, index) => <Checkbox key={item} checked={project.designPlan.safety[index]} onChange={(value) => update(['designPlan', 'safety', index], value)}>{item}</Checkbox>)}</div></section><section><h2>Design check</h2><div className="check-stack">{checks.map((item, index) => <Checkbox key={item} checked={project.designPlan.checks[index]} onChange={(value) => update(['designPlan', 'checks', index], value)}>{item}</Checkbox>)}</div></section></div>
    </>
  );
}

function BuildPage({ project, update }) {
  const checkpoints = [['20 min', 'Pause: compare the build with the sketch.'], ['35 min', 'Check: secure every attachment and protect moving parts.'], ['40 min', 'Prepare: stop adding features and get ready to test.']];
  return (
    <><SectionTitle eyebrow="Stage 4 · Prototype · 45 minutes" title="Build one change that answers your hypothesis" intro="Keep the robot safe, removable and testable. Record what actually changes during the build." action={<Timer minutes={45} label="Build timer" compact />} />
      <Callout tone="yellow" label="Build principle">One major improvement is enough. A focused prototype produces clearer evidence.</Callout>
      <div className="form-grid two"><TextArea label="What did we change?" value={project.build.changed} onChange={(value) => update('build.changed', value)} /><TextArea label="What problem does it address?" value={project.build.addresses} onChange={(value) => update('build.addresses', value)} /><TextArea label="What result do we predict?" value={project.build.predict} onChange={(value) => update('build.predict', value)} /><TextArea label="Issues encountered during building" value={project.build.issues} onChange={(value) => update('build.issues', value)} /></div>
      <section><span className="eyebrow">Quiet checkpoints</span><h2>Use these prompts when your team reaches them</h2><div className="checkpoint-list">{checkpoints.map(([time, text], index) => <Checkbox key={time} checked={project.build.checkpoints[index]} onChange={(value) => update(['build', 'checkpoints', index], value)}><strong>{time}</strong> — {text}</Checkbox>)}</div></section>
    </>
  );
}

function TestingPage({ project, update }) {
  const [metric, setMetric] = useState('delivered');
  return (
    <><SectionTitle eyebrow="Stage 5 · Testing · 25 + 15 minutes" title="Turn your prototype into evidence" intro="Use the same driver, start position and 60-second limit for every controlled trial." action={<Timer minutes={1} label="Robot run" compact />} />
      <div className="table-wrap"><table className="data-table"><caption>Testing data — edit each cell directly</caption><thead><tr><th>Test</th><th>Objects delivered</th><th>Correct placements</th><th>Drops / errors</th><th>Time (s)</th><th>Notes</th></tr></thead><tbody>{project.tests.map((row, rowIndex) => <tr key={row.name}><th scope="row">{row.name}</th>{['delivered', 'correct', 'drops', 'time'].map((key) => <td key={key}><input aria-label={`${row.name} ${testMetrics.find(([id]) => id === key)?.[1]}`} type="number" min="0" max={key === 'time' ? 60 : undefined} value={row[key]} onChange={(event) => update(['tests', rowIndex, key], event.target.value)} /></td>)}<td><input aria-label={`${row.name} notes`} value={row.notes} onChange={(event) => update(['tests', rowIndex, 'notes'], event.target.value)} /></td></tr>)}</tbody></table></div>
      <PerformanceChart tests={project.tests} metric={metric} setMetric={setMetric} />
      <Callout label="Fair-test check">Change one variable at a time. Record the result immediately after every run.</Callout>
    </>
  );
}

function AnalysisPage({ project, update }) {
  const fields = [['improved', 'What improved most?'], ['consistent', 'Was the result consistent?'], ['supports', 'Does the evidence support your hypothesis?'], ['limitation', 'What limitation still remains?'], ['finalChange', 'What will you change before the Final Test?'], ['why', 'Why did you choose this change?']];
  return (
    <><SectionTitle eyebrow="Analyze → decide → retest" title="Make one final evidence-based improvement" intro="Compare patterns across trials before touching the robot again." />
      <Callout tone="yellow" label="Decision rule">Change only what your evidence tells you to change.</Callout>
      <div className="analysis-grid">{fields.map(([key, label], index) => <div key={key}><span>0{index + 1}</span><TextArea label={label} value={project.analysis[key]} onChange={(value) => update(['analysis', key], value)} /></div>)}</div>
    </>
  );
}

function PresentationOverlay({ project, onClose }) {
  const priority = priorities.find((item) => item.id === project.priority);
  const sections = [['01', 'Our Challenge', project.presentation.challenge], ['02', 'Our Observation', project.presentation.observation], ['03', 'Our Hypothesis', project.presentation.hypothesis], ['04', 'Our Solution', project.presentation.solution], ['05', 'Our Evidence', project.presentation.evidence], ['06', 'Limitations & Next Improvement', project.presentation.limitations]];
  return (
    <div className="presentation-overlay" role="dialog" aria-modal="true" aria-label="Presentation view"><button className="presentation-close" onClick={onClose}>Close presentation ×</button><header><span>{project.team.name || 'Our Team'} · {priority?.title || 'VEX Rapid Innovation'}</span><h1>Our evidence-based design story</h1></header><div className="presentation-sections">{sections.map(([number, title, body]) => <section key={title}><span>{number}</span><h2>{title}</h2><p>{body || 'Add this section in the Presentation Builder.'}</p></section>)}</div><footer>3-minute pitch · 1-minute questions · Every member speaks</footer></div>
  );
}

function PresentationPage({ project, update }) {
  const [presenting, setPresenting] = useState(false);
  const sections = [['challenge', '1. Our Challenge'], ['observation', '2. Our Observation'], ['hypothesis', '3. Our Hypothesis'], ['solution', '4. Our Solution'], ['evidence', '5. Our Evidence'], ['limitations', '6. Limitations and Next Improvement']];
  const questions = ['What evidence shows that your solution improved the robot?', 'What was the most important design decision?', 'What trade-off did your team make?', 'How reliable was your solution?', 'What would you improve if you had another hour?'];
  return (
    <><SectionTitle eyebrow="Stage 6 · Presentation builder" title="Tell the story of your design in three minutes" intro="Choose only the strongest evidence. Every member must speak during at least one part." action={<button className="button" onClick={() => setPresenting(true)}>Open Presentation View</button>} />
      <div className="presentation-builder">{sections.map(([key, label]) => <TextArea key={key} label={label} rows={3} value={project.presentation[key]} onChange={(value) => update(['presentation', key], value)} placeholder="Write one or two short points." />)}</div>
      <div className="presentation-rules"><div><strong>3 min</strong><span>Pitch + live demonstration</span></div><div><strong>1 min</strong><span>Questions and defense</span></div><div><strong>4 voices</strong><span>Every team member participates</span></div></div>
      <Checkbox checked={project.presentation.participation} onChange={(value) => update('presentation.participation', value)}>Every member has an assigned speaking or demonstration part.</Checkbox>
      <section className="question-bank"><span className="eyebrow">Defense practice</span><h2>Be ready for these questions</h2><ol>{questions.map((question) => <li key={question}>{question}</li>)}</ol></section>
      {presenting && <PresentationOverlay project={project} onClose={() => setPresenting(false)} />}
    </>
  );
}

function RubricPage({ project, update }) {
  const rated = rubricCriteria.filter(([id]) => project.rubric[id].score).length;
  return (
    <><SectionTitle eyebrow="Readiness self-check" title="Robot performance is only one part of the story" intro="Rate your current evidence from 1–4. This helps your team prepare; it is not an official teacher score." />
      <div className="rubric-summary"><strong>{rated} / 6</strong><span>criteria reviewed</span></div>
      <div className="rubric-list">{rubricCriteria.map(([id, title, weight, expected]) => <section className="rubric-row" key={id}><div><span className="weight">{weight}%</span><h2>{title}</h2><p>{expected}</p></div><fieldset><legend>Self-rating</legend>{[1, 2, 3, 4].map((score) => <label key={score}><input type="radio" name={`rubric-${id}`} value={score} checked={Number(project.rubric[id].score) === score} onChange={() => update(['rubric', id, 'score'], score)} /><span>{score}</span></label>)}</fieldset><TextArea label="Evidence notes" rows={2} value={project.rubric[id].evidence} onChange={(value) => update(['rubric', id, 'evidence'], value)} placeholder="What proves this rating?" /></section>)}</div>
      <Callout tone="yellow" label="Important">Use this rubric to find missing evidence—not to calculate a final competition score.</Callout>
    </>
  );
}

function ReflectionPage({ project, update }) {
  return (
    <><SectionTitle eyebrow="Final reflection · 3 minutes" title="Use evidence to make the next version better" intro="Pause after the demonstration. Capture one learning, one contribution and one next step." action={<Timer minutes={3} label="Reflection timer" compact />} />
      <div className="reflection-grid"><TextArea label="One thing I learned…" rows={5} value={project.reflection.learned} onChange={(value) => update('reflection.learned', value)} /><TextArea label="One contribution I made…" rows={5} value={project.reflection.contribution} onChange={(value) => update('reflection.contribution', value)} /><TextArea label="One improvement I would make…" rows={5} value={project.reflection.improvement} onChange={(value) => update('reflection.improvement', value)} /></div>
      <blockquote className="closing-quote">Good engineering is not just making a robot work. <strong>It is using evidence to make the next version better.</strong></blockquote>
    </>
  );
}

function SummaryPage({ project, update, exportCsv }) {
  const [metric, setMetric] = useState('delivered');
  const priority = priorities.find((item) => item.id === project.priority);
  const hypothesis = project.inquiry.ifPart || project.inquiry.thenPart || project.inquiry.becausePart ? `If we ${project.inquiry.ifPart || '—'}, then the robot will ${project.inquiry.thenPart || '—'} because ${project.inquiry.becausePart || '—'}.` : '—';
  return (
    <div className="summary-page"><SectionTitle eyebrow="Team project summary" title={project.team.name || 'Untitled team project'} intro="Review the complete evidence story, check final products, then print or save as PDF." action={<div className="summary-actions"><button className="button" onClick={() => window.print()}>Print / Save PDF</button><button className="button button-light" onClick={exportCsv}>Export testing CSV</button></div>} />
      <section className="summary-hero"><div><span>Design priority</span><strong>{priority?.title || 'Not selected'}</strong><p>{priority?.mission}</p></div><div><span>Schools</span><strong>{project.team.schools || '—'}</strong></div><div><span>Members</span><strong>{project.team.members.filter((member) => member.name).map((member) => member.name).join(', ') || '—'}</strong></div></section>
      <div className="summary-grid"><section><span className="eyebrow">Baseline observation</span><p>{project.baseline.difficulties || project.inquiry.observation || '—'}</p></section><section><span className="eyebrow">Problem</span><p>{project.inquiry.problem || '—'}</p></section><section className="wide"><span className="eyebrow">Hypothesis</span><p>{hypothesis}</p></section><section><span className="eyebrow">Solution</span><p>{project.designPlan.description || project.build.changed || '—'}</p></section><section><span className="eyebrow">Limitation</span><p>{project.analysis.limitation || '—'}</p></section><section className="wide"><span className="eyebrow">Next improvement</span><p>{project.analysis.finalChange || project.reflection.improvement || '—'}</p></section></div>
      {project.designPlan.sketch && <section className="summary-sketch"><span className="eyebrow">Annotated sketch</span><img src={project.designPlan.sketch} alt="Team’s annotated design sketch" /></section>}
      <div className="table-wrap"><table className="data-table summary-table"><caption>Testing evidence</caption><thead><tr><th>Test</th><th>Delivered</th><th>Correct</th><th>Drops / errors</th><th>Time</th><th>Notes</th></tr></thead><tbody>{project.tests.map((row) => <tr key={row.name}><th>{row.name}</th><td>{row.delivered || '—'}</td><td>{row.correct || '—'}</td><td>{row.drops || '—'}</td><td>{row.time || '—'}</td><td>{row.notes || '—'}</td></tr>)}</tbody></table></div>
      <PerformanceChart tests={project.tests} metric={metric} setMetric={setMetric} />
      <section><span className="eyebrow">Final product checklist</span><h2>What your team must produce</h2><div className="final-checklist">{finalProducts.map((item, index) => <Checkbox key={item} checked={project.finalChecklist[index]} onChange={(value) => update(['finalChecklist', index], value)}>{item}</Checkbox>)}</div></section>
      <section className="summary-reflection"><span className="eyebrow">Reflection</span><div><p><strong>Learned:</strong> {project.reflection.learned || '—'}</p><p><strong>Contribution:</strong> {project.reflection.contribution || '—'}</p><p><strong>Would improve:</strong> {project.reflection.improvement || '—'}</p></div></section>
    </div>
  );
}

function HelpPage() {
  return (
    <><SectionTitle eyebrow="Help & glossary" title="Quick support while you work" intro="Use these definitions and troubleshooting prompts without leaving your current project." />
      <div className="help-grid"><section><h2>If your team is stuck…</h2><ol className="steps"><li><strong>Return to the evidence.</strong><span>Which baseline or trial result is weakest?</span></li><li><strong>Name one problem.</strong><span>A specific problem leads to a testable change.</span></li><li><strong>Change one variable.</strong><span>Keep the driver, start and time limit consistent.</span></li><li><strong>Ask every voice.</strong><span>Invite each member to explain what they notice.</span></li></ol></section><section><h2>Glossary</h2><dl className="glossary">{glossary.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl></section></div>
      <Callout tone="yellow" label="Local storage">Work is saved only in this browser on this device. Use Export Project before changing devices or clearing browser data.</Callout>
    </>
  );
}

function App() {
  const { project, update, replaceProject, resetProject, saveState } = useProject();
  const [showLanding, setShowLanding] = useState(true);
  const page = project.currentPage || 'dashboard';

  useEffect(() => {
    if (!pageOrder.includes(page) && page !== 'help') update('currentPage', 'dashboard');
  }, []);

  const goTo = (id) => {
    update('currentPage', id);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.setTimeout(() => document.getElementById('main-content')?.focus(), 0);
  };
  const start = () => { update('started', true); update('currentPage', 'dashboard'); setShowLanding(false); };
  const exportProject = () => downloadFile(`${safeName(project.team.name)}.json`, JSON.stringify({ ...project, exportedAt: new Date().toISOString() }, null, 2), 'application/json');
  const exportCsv = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [['Test', 'Objects delivered', 'Correct placements', 'Drops/errors', 'Completion time', 'Notes'], ...project.tests.map((row) => [row.name, row.delivered, row.correct, row.drops, row.time, row.notes])];
    downloadFile(`${safeName(project.team.name)}-testing.csv`, rows.map((row) => row.map(escape).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  };
  const importProject = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => { try { const value = JSON.parse(reader.result); if (!value || typeof value !== 'object' || !Array.isArray(value.tests)) throw new Error(); replaceProject(value); setShowLanding(false); window.alert('Project imported successfully.'); } catch { window.alert('This file is not a valid VEX project export.'); } event.target.value = ''; }; reader.readAsText(file);
  };
  const reset = () => { if (window.confirm('Reset this project? All locally saved answers, images and progress on this device will be deleted. Export first if you may need them later.')) { resetProject(); setShowLanding(true); } };

  const pageView = useMemo(() => {
    const props = { project, update, goTo };
    return {
      dashboard: <DashboardPage {...props} />, brief: <BriefPage />, goals: <GoalsPage />, team: <TeamPage {...props} />,
      priority: <PriorityPage {...props} />, constraints: <ConstraintsPage {...props} />, baseline: <BaselinePage {...props} />,
      inquiry: <InquiryPage {...props} />, plan: <DesignPlanPage {...props} />, build: <BuildPage {...props} />,
      testing: <TestingPage {...props} />, analysis: <AnalysisPage {...props} />, presentation: <PresentationPage {...props} />,
      rubric: <RubricPage {...props} />, reflection: <ReflectionPage {...props} />,
      summary: <SummaryPage {...props} exportCsv={exportCsv} />, help: <HelpPage />,
    }[page] || <DashboardPage {...props} />;
  }, [page, project]);

  if (showLanding) return <Landing hasSession={project.started} onStart={start} onContinue={() => setShowLanding(false)} />;
  return <AppShell project={project} page={page} goTo={goTo} saveState={saveState} onExport={exportProject} onImport={importProject} onReset={reset}>{pageView}</AppShell>;
}

export default App;
