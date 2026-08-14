export const MISSION = 'Collect as many Cups and Pins as possible from the SUPPLY ZONE and deliver them to your team\'s DELIVERY ZONE.';

export const NAV_ITEMS = [
  ['home', 'Home'],
  ['mission', 'Mission & Field'],
  ['build', 'Build & Practice'],
  ['match', 'Match Mode'],
  ['results', 'Results'],
];

export const ACTIVITY_TIMELINE = [
  ['01', 'Get to know your robot', '15 min briefing + 40 min familiarization'],
  ['02', 'Build & improve', '55 min'],
  ['03', 'Practice', '35 min'],
  ['04', 'Compete', '25 min'],
  ['05', 'Review results', '10 min'],
];

export const BUILD_STEPS = [
  'Test the Clawbot',
  'Identify one problem',
  'Make one improvement',
  'Practice with all four drivers',
  'Get ready to compete',
];

export const START_RULES = [
  ['01', 'Start at your team marker'],
  ['02', 'Robot touches the field wall'],
  ['03', 'Move only after the timer starts'],
  ['04', 'Deliver only to your team zone'],
];

export const MATCH_TYPES = ['Practice Run', 'Match 1', 'Match 2', 'Final Match'];

export const DRIVER_PHASES = [
  ['Driver 1', '4:00–3:00'],
  ['Driver 2', '3:00–2:00'],
  ['Driver 3', '2:00–1:00'],
  ['Driver 4', '1:00–0:00'],
];

export const makeId = () => (
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
);

export const createTimer = (durationMs = 240_000) => ({
  durationMs,
  remainingMs: durationMs,
  status: 'idle',
  endAt: null,
  lastDriver: 0,
});

export const createInitialProject = () => ({
  version: 2,
  currentView: 'home',
  missionAcknowledged: false,
  team: {
    name: '',
    members: ['', '', '', ''],
  },
  notes: {
    problem: '',
    improvement: '',
    practiceResult: '',
  },
  practice: {
    mode: 60_000,
    driverIndex: 0,
    timer: createTimer(60_000),
    checklist: [false, false, false, false],
  },
  match: {
    sessionId: makeId(),
    type: 'Practice Run',
    timer: createTimer(),
    cups: 0,
    pins: 0,
    soundEnabled: true,
    lockScoringAtEnd: true,
    scoringUnlocked: false,
    driverSeen: [false, false, false, false],
  },
  results: [],
});

export const normalizeProject = (value) => {
  const fresh = createInitialProject();
  if (!value || value.version !== 2) return fresh;

  return {
    ...fresh,
    ...value,
    team: { ...fresh.team, ...value.team },
    notes: { ...fresh.notes, ...value.notes },
    practice: {
      ...fresh.practice,
      ...value.practice,
      timer: { ...fresh.practice.timer, ...value.practice?.timer },
      checklist: Array.isArray(value.practice?.checklist) ? value.practice.checklist.slice(0, 4) : fresh.practice.checklist,
    },
    match: {
      ...fresh.match,
      ...value.match,
      timer: { ...fresh.match.timer, ...value.match?.timer },
      driverSeen: Array.isArray(value.match?.driverSeen) ? value.match.driverSeen.slice(0, 4) : fresh.match.driverSeen,
      cups: Math.max(0, Number(value.match?.cups) || 0),
      pins: Math.max(0, Number(value.match?.pins) || 0),
    },
    results: Array.isArray(value.results) ? value.results : [],
  };
};
