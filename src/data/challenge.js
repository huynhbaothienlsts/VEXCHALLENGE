export const MISSION = 'Collect as many Cups and Pins as possible from the SUPPLY ZONE and deliver them to your team\'s DELIVERY ZONE.';

export const NAV_ITEMS = [
  ['home', 'Home'], ['teams', 'Teams'], ['mission', 'Mission & Field'], ['build', 'Build & Practice'],
  ['match', 'Match Mode'], ['results', 'Results'], ['certificate', 'Certificate'],
];

export const ACTIVITY_TIMELINE = [
  ['01', 'Get to know your robot', '15 min briefing + 40 min familiarization'],
  ['02', 'Build & improve', '55 min'], ['03', 'Practice', '35 min'],
  ['04', 'Compete', '25 min'], ['05', 'Review results', '10 min'],
];

export const BUILD_STEPS = [
  'Test the Clawbot', 'Identify one problem', 'Make one improvement',
  'Practice with all four drivers', 'Get ready to compete',
];

export const START_RULES = [
  ['01', 'Start at your team marker'], ['02', 'Robot touches the field wall'],
  ['03', 'Move only after the timer starts'], ['04', 'Deliver only to your team zone'],
];

export const MATCH_TYPES = ['Practice Run', 'Match 1', 'Match 2', 'Final Match'];
export const OFFICIAL_MATCH_TYPES = ['Match 1', 'Match 2', 'Final Match'];
export const DRIVER_PHASES = [
  ['Driver 1', '4:00-3:00'], ['Driver 2', '3:00-2:00'],
  ['Driver 3', '2:00-1:00'], ['Driver 4', '1:00-0:00'],
];
export const TEAM_COLORS = ['#28a9ff', '#ffd43b', '#ff5364'];

export const makeId = () => (
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
);

export const createTeam = (index) => ({
  id: `team-${index + 1}`, name: `Team ${index + 1}`, members: ['', '', '', ''], image: '',
});

export const createTeamScore = (teamId) => ({ teamId, cups: 0, pins: 0, scoringUnlocked: false });

export const createTimer = (durationMs = 240_000) => ({
  durationMs, remainingMs: durationMs, status: 'idle', endAt: null, lastDriver: 0,
});

export const createInitialProject = () => {
  const teams = [0, 1, 2].map(createTeam);
  return {
    version: 3,
    currentView: 'home',
    missionAcknowledged: false,
    activeTeamId: teams[0].id,
    teams,
    notesByTeam: Object.fromEntries(teams.map((team) => [team.id, { problem: '', improvement: '', practiceResult: '' }])),
    practice: {
      teamId: teams[0].id,
      mode: 60_000,
      driverIndex: 0,
      timer: createTimer(60_000),
      checklistByTeam: Object.fromEntries(teams.map((team) => [team.id, [false, false, false, false]])),
    },
    match: {
      sessionId: makeId(),
      type: 'Practice Run',
      timer: createTimer(),
      scores: teams.map((team) => createTeamScore(team.id)),
      soundEnabled: true,
      lockScoringAtEnd: true,
      driverSeen: [false, false, false, false],
    },
    results: [],
  };
};

const normalizeTeam = (team, index) => ({
  ...createTeam(index),
  ...(team || {}),
  id: team?.id || `team-${index + 1}`,
  members: Array.from({ length: 4 }, (_, memberIndex) => String(team?.members?.[memberIndex] || '')),
  image: typeof team?.image === 'string' ? team.image : '',
});

const migrateV2 = (value) => {
  const fresh = createInitialProject();
  const firstTeam = normalizeTeam({
    id: 'team-1', name: value.team?.name || 'Team 1', members: value.team?.members || ['', '', '', ''],
  }, 0);
  const teams = [firstTeam, fresh.teams[1], fresh.teams[2]];
  const legacyScore = {
    ...createTeamScore('team-1'),
    cups: Math.max(0, Number(value.match?.cups) || 0),
    pins: Math.max(0, Number(value.match?.pins) || 0),
  };
  const migratedResults = Array.isArray(value.results) ? value.results.map((result, index) => ({
    id: result.id || makeId(),
    sessionId: result.sessionId || `legacy-${index + 1}`,
    matchType: result.matchType || 'Practice Run',
    matchNumber: result.matchNumber || index + 1,
    createdAt: result.createdAt || new Date().toISOString(),
    updatedAt: result.updatedAt || result.createdAt || new Date().toISOString(),
    teams: [
      {
        teamId: 'team-1', teamName: result.teamName || firstTeam.name, members: [...firstTeam.members],
        cups: Math.max(0, Number(result.cups) || 0), cupPoints: Math.max(0, Number(result.cupPoints) || 0),
        pins: Math.max(0, Number(result.pins) || 0), pinPoints: Math.max(0, Number(result.pinPoints) || 0),
        totalScore: Math.max(0, Number(result.totalScore) || 0),
        driverParticipation: Math.max(0, Math.min(4, Number(result.driverParticipation) || 0)),
      },
      ...teams.slice(1).map((team) => ({
        teamId: team.id, teamName: team.name, members: [...team.members], cups: 0, cupPoints: 0,
        pins: 0, pinPoints: 0, totalScore: 0, driverParticipation: 0,
      })),
    ],
  })) : [];
  return {
    ...fresh,
    currentView: NAV_ITEMS.some(([id]) => id === value.currentView) ? value.currentView : 'home',
    missionAcknowledged: Boolean(value.missionAcknowledged),
    teams,
    notesByTeam: { ...fresh.notesByTeam, 'team-1': { ...fresh.notesByTeam['team-1'], ...(value.notes || {}) } },
    practice: {
      ...fresh.practice,
      mode: value.practice?.mode || fresh.practice.mode,
      driverIndex: Number(value.practice?.driverIndex) || 0,
      timer: { ...fresh.practice.timer, ...(value.practice?.timer || {}) },
      checklistByTeam: {
        ...fresh.practice.checklistByTeam,
        'team-1': Array.isArray(value.practice?.checklist) ? value.practice.checklist.slice(0, 4) : [false, false, false, false],
      },
    },
    match: {
      ...fresh.match,
      sessionId: value.match?.sessionId || makeId(),
      type: value.match?.type || fresh.match.type,
      timer: { ...fresh.match.timer, ...(value.match?.timer || {}) },
      scores: [legacyScore, createTeamScore('team-2'), createTeamScore('team-3')],
      soundEnabled: value.match?.soundEnabled !== false,
      lockScoringAtEnd: value.match?.lockScoringAtEnd !== false,
      driverSeen: Array.isArray(value.match?.driverSeen) ? value.match.driverSeen.slice(0, 4) : [false, false, false, false],
    },
    results: migratedResults,
  };
};

export const normalizeProject = (value) => {
  if (value?.version === 2) return migrateV2(value);
  const fresh = createInitialProject();
  if (!value || value.version !== 3) return fresh;

  const teams = Array.from({ length: 3 }, (_, index) => normalizeTeam(value.teams?.[index], index));
  const teamIds = teams.map((team) => team.id);
  const activeTeamId = teamIds.includes(value.activeTeamId) ? value.activeTeamId : teamIds[0];
  const practiceTeamId = teamIds.includes(value.practice?.teamId) ? value.practice.teamId : activeTeamId;

  return {
    ...fresh,
    ...value,
    activeTeamId,
    teams,
    notesByTeam: Object.fromEntries(teams.map((team) => [team.id, {
      problem: '', improvement: '', practiceResult: '', ...(value.notesByTeam?.[team.id] || {}),
    }])),
    practice: {
      ...fresh.practice,
      ...(value.practice || {}),
      teamId: practiceTeamId,
      timer: { ...fresh.practice.timer, ...(value.practice?.timer || {}) },
      checklistByTeam: Object.fromEntries(teams.map((team) => [
        team.id,
        Array.isArray(value.practice?.checklistByTeam?.[team.id])
          ? value.practice.checklistByTeam[team.id].slice(0, 4)
          : [false, false, false, false],
      ])),
    },
    match: {
      ...fresh.match,
      ...(value.match || {}),
      timer: { ...fresh.match.timer, ...(value.match?.timer || {}) },
      scores: teams.map((team) => {
        const score = value.match?.scores?.find((item) => item.teamId === team.id);
        return {
          ...createTeamScore(team.id), ...(score || {}),
          cups: Math.max(0, Number(score?.cups) || 0),
          pins: Math.max(0, Number(score?.pins) || 0),
        };
      }),
      driverSeen: Array.isArray(value.match?.driverSeen) ? value.match.driverSeen.slice(0, 4) : [false, false, false, false],
    },
    results: Array.isArray(value.results) ? value.results : [],
  };
};
