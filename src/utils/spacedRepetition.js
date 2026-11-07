/**
 * Spaced Repetition Engine using the SuperMemo SM-2 Algorithm
 * Designed to help developers retain DSA patterns and problem approaches.
 */

export const SM2_DEFAULTS = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

/**
 * Calculates next review parameters based on user performance quality rating (0 - 5).
 * Quality scale:
 * 5: Perfect recall / solved effortlessly
 * 4: Solved with minor hesitation
 * 3: Solved with difficulty or after hints ("needs_practice")
 * 2: Failed to solve completely, but understood solution
 * 1: Completely forgot the pattern
 * 0: Complete blackout
 *
 * @param {number} quality (0 - 5)
 * @param {object} previous { repetitions, interval, easeFactor }
 * @returns {object} { repetitions, interval, easeFactor, nextReviewDate, dueDateFormatted }
 */
export function calculateNextReview(quality = 4, previous = {}) {
  let {
    repetitions = SM2_DEFAULTS.repetitions,
    interval = SM2_DEFAULTS.interval,
    easeFactor = SM2_DEFAULTS.easeFactor
  } = previous;

  // Constrain quality between 0 and 5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  if (q >= 3) {
    if (repetitions === 0) {
      interval = 1; // 1 day
    } else if (repetitions === 1) {
      interval = 6; // 6 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Reset repetitions if failed
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3; // SM-2 standard lower bound
  }

  const now = new Date();
  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    repetitions,
    interval,
    easeFactor: Number(easeFactor.toFixed(3)),
    nextReviewDate: nextReviewDate.toISOString(),
    isDue: false,
    daysUntilDue: interval
  };
}

/**
 * Evaluates whether a question is currently due for review.
 * @param {string|number|Date} nextReviewDate
 * @returns {boolean}
 */
export function isQuestionDue(nextReviewDate) {
  if (!nextReviewDate) return false;
  const reviewTime = new Date(nextReviewDate).getTime();
  return Date.now() >= reviewTime;
}

/**
 * Filters a collection of saved question records to find those currently due for spaced review.
 * @param {Object} recordsMap - Dictionary of question progress records
 * @returns {Array} Array of question records sorted by overdue urgency
 */
export function getDueReviewQuestions(recordsMap = {}) {
  const records = Object.values(recordsMap || {});
  const now = Date.now();

  return records
    .filter(record => {
      // Questions explicitly marked as needs_practice or having an overdue nextReviewDate
      if (record.status === 'needs_practice') return true;
      if (record.nextReviewDate && new Date(record.nextReviewDate).getTime() <= now) return true;
      return false;
    })
    .sort((a, b) => {
      const timeA = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
      const timeB = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;
      return timeA - timeB;
    });
}

