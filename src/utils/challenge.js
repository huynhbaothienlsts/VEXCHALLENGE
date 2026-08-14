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
