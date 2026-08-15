import { OFFICIAL_MATCH_TYPES } from '../data/challenge.js';

export const clampCount = (value) => Math.max(0, Math.floor(Number(value) || 0));

export const calculateScore = (cups, pins) => {
  const safeCups = clampCount(cups);
  const safePins = clampCount(pins);
  const cupPoints = safeCups * 5;
  const pinPoints = safePins * 10;
  return { cups: safeCups, pins: safePins, cupPoints, pinPoints, totalScore: cupPoints + pinPoints };
};

export const formatTime = (milliseconds) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export const driverFromRemaining = (remainingMs) => {
  if (remainingMs > 180_000) return 0;
  if (remainingMs > 120_000) return 1;
  if (remainingMs > 60_000) return 2;
  return 3;
};

export const buildTournamentStandings = (teams, results) => {
  const latestOfficialResults = new Map();
  [...results]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .forEach((result) => {
      if (OFFICIAL_MATCH_TYPES.includes(result.matchType) && !latestOfficialResults.has(result.matchType)) {
        latestOfficialResults.set(result.matchType, result);
      }
    });

  const standings = teams.map((team) => {
    const matchScores = Object.fromEntries(OFFICIAL_MATCH_TYPES.map((matchType) => {
      const result = latestOfficialResults.get(matchType);
      const score = result?.teams?.find((item) => item.teamId === team.id)?.totalScore;
      return [matchType, Number.isFinite(Number(score)) ? Math.max(0, Number(score)) : null];
    }));
    return {
      ...team,
      matchScores,
      officialMatchesPlayed: Object.values(matchScores).filter((score) => score !== null).length,
      totalScore: Object.values(matchScores).reduce((sum, score) => sum + (score ?? 0), 0),
    };
  });

  return {
    standings,
    completedMatchTypes: OFFICIAL_MATCH_TYPES.filter((type) => latestOfficialResults.has(type)),
  };
};
