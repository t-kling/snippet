/**
 * SM-2 Spaced Repetition Algorithm
 * Modified quality ratings:
 * - Unfamiliar: 0
 * - Hard: 2
 * - Good: 3.5
 * - Easy: 5
 */

function calculateNextReview(quality, easeFactor, interval, repetitions) {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Update ease factor
  newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // Calculate next interval
  if (quality < 3) {
    // Failed or hard - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

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
