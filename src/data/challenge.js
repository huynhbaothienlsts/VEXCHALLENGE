export const STORAGE_KEY = 'lsts-vex-rapid-innovation-v1';

export const roles = [
  ['Design Lead', 'Keeps the team focused on the problem, coordinates ideas and leads sketching.'],
  ['Mechanical Engineer', 'Builds the improvement and checks that every attachment is secure and safe.'],
  ['Driver & Test Engineer', 'Drives consistently, starts each run the same way and manages fair trials.'],
  ['Data & Communication Lead', 'Records evidence, checks the notebook and coordinates the final pitch.'],
];

export const priorities = [
  {
    id: 'speed', label: 'Team Speed', title: 'Rapid Response', color: 'red',
    mission: 'Deliver the highest number of supplies in 60 seconds.',
    focus: 'Fast collection, short routes and an efficient action sequence.',
    questions: ['Where is time lost?', 'Can one action move more than one supply?', 'What is the shortest reliable route?'],
    success: 'More supplies delivered within the same 60-second run.',
  },
  {
    id: 'precision', label: 'Team Precision', title: 'Safe Delivery', color: 'blue',
    mission: 'Place supplies accurately with the fewest drops and errors.',
    focus: 'Stable grip, controlled placement and repeatable driver actions.',
    questions: ['What causes drops?', 'Which approach angle is easiest to control?', 'How can placement become more repeatable?'],
    success: 'More correct placements with fewer drops or errors.',
  },
  {
    id: 'versatility', label: 'Team Versatility', title: 'Multi-Purpose Response', color: 'green',
    mission: 'Handle different objects or delivery locations with one solution.',
    focus: 'Adaptable contact points, varied routes and minimal reconfiguration.',
    questions: ['Can it handle both cups and pins?', 'Can it reach more than one station?', 'What changes when the object changes?'],
    success: 'One solution handles different supplies or delivery locations.',
  },
];

export const constraints = [
  'Do not rebuild the drivetrain or main frame.',
  'Make only one major improvement.',
  'Use only the supplied parts and materials.',
  'Keep attachments secure, removable and safe.',
  'Start every trial from the same position.',
  'Complete each trial within 60 seconds.',
  'Do not copy another team’s solution.',
];

export const stages = [
  { id: 'setup', label: 'Brief & Team Setup', short: 'Setup', time: '0–30 min', page: 'brief', deliverables: ['Understand the mission', 'Assign four roles', 'Choose a design priority'] },
  { id: 'baseline', label: 'Baseline', short: 'Baseline', time: '30–45 min', page: 'baseline', deliverables: ['Run the original Clawbot', 'Record baseline data', 'Identify one observed difficulty'] },
  { id: 'inquiry', label: 'Inquire & Plan', short: 'Plan', time: '45–65 min', page: 'inquiry', deliverables: ['Define one problem', 'Write a testable hypothesis', 'Plan one focused improvement'] },
  { id: 'build', label: 'Build', short: 'Build', time: '65–110 min', page: 'build', deliverables: ['Build safely', 'Record the change', 'Predict the result'] },
  { id: 'testing', label: 'Test & Improve', short: 'Test', time: '110–150 min', page: 'testing', deliverables: ['Complete three controlled trials', 'Analyze evidence', 'Run the Final Test'] },
  { id: 'present', label: 'Present & Reflect', short: 'Present', time: '150–180 min', page: 'presentation', deliverables: ['Prepare a 3-minute pitch', 'Check the rubric', 'Complete reflection'] },
];

export const timeline = [
  ['0–15', 'Project Brief'], ['15–30', 'Team Setup & Robot Exploration'], ['30–45', 'Baseline Test'],
  ['45–65', 'Rapid Inquiry & Design Planning'], ['65–110', 'Prototype Building'], ['110–135', 'Three Testing Trials'],
  ['135–150', 'Final Improvement & Final Test'], ['150–165', 'Presentation Preparation'],
  ['165–177', 'Team Demonstrations'], ['177–180', 'Reflection'],
];

export const testRows = ['Baseline', 'Trial 1', 'Trial 2', 'Trial 3', 'Final Test'];
export const testMetrics = [
  ['delivered', 'Objects delivered'], ['correct', 'Correct placements'], ['drops', 'Drops / errors'], ['time', 'Completion time (s)'],
];

export const rubricCriteria = [
  ['problem', 'Problem & Hypothesis', 15, 'The problem is specific; the hypothesis is logical and testable.'],
  ['creativity', 'Creativity & Originality', 20, 'The solution is distinct and fits the team’s assigned priority.'],
  ['testing', 'Testing & Use of Data', 20, 'Baseline, three trials and accurate evidence guide decisions.'],
  ['performance', 'Product Performance', 15, 'The robot completes the mission and shows relevant improvement.'],
  ['collaboration', 'International Collaboration', 15, 'Responsibilities are shared; every member contributes and listens.'],
  ['presentation', 'Presentation & Defense', 15, 'The pitch is clear; the demonstration and answers use evidence.'],
];

export const finalProducts = [
  'Adapted Clawbot', 'Annotated sketch', 'Research question and hypothesis', 'Baseline and three trials',
  'Final Test', 'Mini poster or one-slide presentation', 'Live demonstration',
  'Three-minute evidence pitch', 'One-minute response to questions',
];

const emptyTest = (name) => ({ name, delivered: '', correct: '', drops: '', time: '', notes: '' });

export const createInitialProject = () => ({
  version: 1,
  started: false,
  currentPage: 'home',
  lastSaved: null,
  team: {
    name: '', schools: '', agreement: false,
    members: roles.map(([role]) => ({ name: '', school: '', role })),
  },
  priority: '',
  constraints: constraints.map(() => false),
  constraintsConfirmed: false,
  stageStatus: Object.fromEntries(stages.map((stage) => [stage.id, 'not-started'])),
  baseline: {
    reached: '', delivered: '', correct: '', drops: '', time: '', difficulties: '',
    failed: '', lostTime: '', dropCause: '', controlDifficulty: '',
  },
  inquiry: {
    observation: '', problem: '', cause: '', idea1: '', idea2: '', selected: '', expected: '',
    ifPart: '', thenPart: '', becausePart: '',
  },
  designPlan: {
    type: '', description: '', parts: '', sketch: '',
    safety: [false, false, false, false], checks: [false, false, false, false],
  },
  build: { changed: '', addresses: '', predict: '', issues: '', checkpoints: [false, false, false] },
  tests: testRows.map(emptyTest),
  analysis: { improved: '', consistent: '', supports: '', limitation: '', finalChange: '', why: '' },
  presentation: {
    challenge: '', observation: '', hypothesis: '', solution: '', evidence: '', limitations: '', participation: false,
  },
  rubric: Object.fromEntries(rubricCriteria.map(([id]) => [id, { score: '', evidence: '' }])),
  reflection: { learned: '', contribution: '', improvement: '' },
  finalChecklist: finalProducts.map(() => false),
});

export const pageOrder = ['dashboard', 'brief', 'goals', 'team', 'priority', 'constraints', 'baseline', 'inquiry', 'plan', 'build', 'testing', 'analysis', 'presentation', 'rubric', 'reflection', 'summary'];

export const glossary = [
  ['Baseline', 'Performance data from the original Clawbot before any modification.'],
  ['Constraint', 'A rule or limit that the design must follow.'],
  ['Controlled trial', 'A fair test where important conditions stay the same.'],
  ['Criterion', 'A feature used to judge whether a design is successful.'],
  ['Evidence', 'Recorded observations or data used to support a claim.'],
  ['Hypothesis', 'A testable prediction that connects a change to an expected result and reason.'],
  ['Prototype', 'A build created to test an idea.'],
  ['Trade-off', 'A choice that improves one quality but may reduce another.'],
];
