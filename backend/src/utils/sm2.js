/**
 * Improved SM-2 Spaced Repetition Algorithm
 * Features:
 * - Adaptive difficulty with graceful forgetting
 * - Better handling of "Hard" ratings (doesn't fully reset)
 * - Randomization to prevent card clumping (±10%)
 * - More gradual ease factor adjustments
 *
 * Modified quality ratings:
 * - Again (Unfamiliar): 0
 * - Hard: 2
 * - Good: 3.5
 * - Easy: 5
 */

function calculateNextReview(quality, easeFactor, interval, repetitions) {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // More gradual ease factor adjustments
  // Prevents ease factor from dropping too quickly
  if (quality === 0) {
    // Again - reduce ease but not too harshly
    newEaseFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (quality === 2) {
    // Hard - slight reduction
    newEaseFactor = Math.max(1.3, easeFactor - 0.10);
  } else if (quality === 3.5) {
    // Good - small increase
    newEaseFactor = Math.min(2.5, easeFactor + 0.05);
  } else if (quality === 5) {
    // Easy - larger increase
    newEaseFactor = Math.min(2.5, easeFactor + 0.15);
  }

  // Calculate next interval with improved logic
  if (quality === 0) {
    // Again - reset but preserve some progress (graceful forgetting)
    // Don't fully reset if card was already mature
    if (repetitions >= 3) {
      newRepetitions = Math.max(1, Math.floor(repetitions / 2));
      newInterval = Math.max(1, Math.floor(interval * 0.25)); // Keep 25% of interval
    } else {
      newRepetitions = 0;
      newInterval = 1;
    }
  } else if (quality === 2) {
    // Hard - reduce interval but don't reset completely
    // This is the key improvement over basic SM-2
    if (repetitions === 0) {
      newRepetitions = 1;
      newInterval = 2; // Give a bit more time than usual
    } else {
      newRepetitions = repetitions; // Don't reduce repetitions
      newInterval = Math.max(2, Math.floor(interval * 0.7)); // Reduce by 30%
    }
  } else {
    // Good or Easy
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = quality === 5 ? 3 : 1; // Easy cards start faster
    } else if (newRepetitions === 2) {
      newInterval = quality === 5 ? 8 : 6;
    } else {
      // Apply ease factor with bonus for Easy
      const multiplier = quality === 5 ? newEaseFactor * 1.2 : newEaseFactor;
      newInterval = Math.round(interval * multiplier);
    }
  }

  // Add randomization (±10%) to prevent card clumping
  // This creates more natural review distribution
  const randomFactor = 0.9 + Math.random() * 0.2; // Random between 0.9 and 1.1
  newInterval = Math.max(1, Math.round(newInterval * randomFactor));

  // Cap maximum interval at 180 days to ensure regular reviews
  newInterval = Math.min(newInterval, 180);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
  };
}

function getNextReviewDate(intervalDays) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

module.exports = {
  calculateNextReview,
  getNextReviewDate,
};
