export const calculateScore = (
  timeRemaining: number, 
  baseTimeAllowed: number, 
  modifier: number = 1
): number => {
  const BasePoints = 1000;
  
  // Logic: 70% of points are guaranteed if correct, 30% based on speed relative to allowed time.
  // AverageTime in formula is basically the maximum base time to evaluate against, 
  // so `TimeRemaining / baseTimeAllowed` gives a ratio of 0 to 1.
  
  // Safety checks
  const validTimeRatio = Math.max(0, Math.min(1, timeRemaining / baseTimeAllowed));
  
  const score = (BasePoints * modifier) * (0.7 + 0.3 * validTimeRatio);
  
  return Math.round(score);
};
