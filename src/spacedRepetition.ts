/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from "./types";

/**
 * Computes the next interval, ease factor, repetitions, and scheduled due date
 * for a flashcard based on the quality response rating (0 to 5) using the SuperMemo-2 (SM-2) algorithm.
 * 
 * Rating meanings:
 * 0 - "Total blackout", complete failure to recall.
 * 1 - "Incorrect response", where the correct one seemed familiar.
 * 2 - "Incorrect response", but easily recognized once shown.
 * 3 - "Correct response", recalled with serious difficulty / slow recall.
 * 4 - "Correct response", recalled after a brief hesitation.
 * 5 - "Perfect response", instantaneous and fluent recall.
 * 
 * Returns a partial Card object of updated spaced repetition elements.
 */
export function calculateSM2(card: Card, rating: number): {
  interval: number;
  eaFactor: number;
  repetitions: number;
  nextDue: string;
  masteryLevel: number;
} {
  let interval = card.interval;
  let eaFactor = card.eaFactor;
  let repetitions = card.repetitions;

  // Enforce boundary check for rating
  const q = Math.min(Math.max(rating, 0), 5);

  if (q >= 3) {
    // Correct response answers
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * eaFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response answers
    repetitions = 0;
    interval = 1; // resets sequence back to daily review
  }

  // Adjust EF based on answer quality
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const factorDiff = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  eaFactor = Number((eaFactor + factorDiff).toFixed(2));

  // Maintain minimum bounds of 1.3 for ease factor to ensure exponential growth carries over
  if (eaFactor < 1.3) {
    eaFactor = 1.3;
  }

  // Calculate next due date (interval is in days)
  const additionMs = interval * 24 * 60 * 60 * 1000;
  const nextDue = new Date(Date.now() + additionMs).toISOString();

  // Maps spaced repetition characteristics into 0-5 Mastery levels:
  // Level 0: Learning / Reset (repetitions = 0)
  // Level 1: Familiar (Repetitions = 1, interval = 1)
  // Level 2: Capable (Repetitions = 2, interval = 6)
  // Level 3: Proficient (Repetitions >= 3, interval <= 15)
  // Level 4: Highly Proficient (Repetitions >= 4, interval <= 30)
  // Level 5: Fully Mastered (Repetitions >= 5, interval > 30)
  let masteryLevel = 0;
  if (repetitions === 0) {
    masteryLevel = 0;
  } else if (repetitions === 1) {
    masteryLevel = 1;
  } else if (repetitions === 2) {
    masteryLevel = 2;
  } else if (repetitions === 3) {
    masteryLevel = 3;
  } else if (repetitions === 4) {
    masteryLevel = 4;
  } else {
    masteryLevel = 5;
  }

  return {
    interval,
    eaFactor,
    repetitions,
    nextDue,
    masteryLevel
  };
}
