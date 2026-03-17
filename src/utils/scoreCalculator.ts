export const calculateScore = (
  timeRemaining: number, 
  baseTimeAllowed: number, 
  modifier: number = 1
): number => {
  const BasePoints = 1000;
  
  // Logic: 50% of points are guaranteed if correct, 50% based on speed relative to allowed time.
  const validTimeRatio = Math.max(0, Math.min(1, timeRemaining / baseTimeAllowed));
  
  const score = (BasePoints * modifier) * (0.5 + 0.5 * validTimeRatio);
  
  return Math.round(score);
};
