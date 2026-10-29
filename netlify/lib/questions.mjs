/**
 * PLX-V0 — Question Bank with Levels & Categories
 *
 * 500+ Curated Questions:
 * - Level 1: Warm-up (Easy)          — 170+ questions
 * - Level 2: Brain Rush (Medium)      — 170+ questions
 * - Level 3: Final Showdown (Hard)    — 170+ questions
 */

import { LEVEL_LABELS, QUESTION_BANK } from "./questions-bank.mjs";

export { LEVEL_LABELS, QUESTION_BANK };

/**
 * Standard 15 baseline match questions (5 per round/level).
 * Maintained for deterministic baseline testing and fallback.
 */
export const QUESTIONS = [
  ...QUESTION_BANK[1].slice(0, 5),
  ...QUESTION_BANK[2].slice(0, 5),
  ...QUESTION_BANK[3].slice(0, 5),
];

/**
 * Helper to generate a fresh 15-question match drawing 5 questions
 * from each level (Level 1, Level 2, Level 3).
 *
 * With 500+ total questions in the bank, every game is fresh!
 */
export function createMatchQuestions(shuffle = true) {
  if (!shuffle) return [...QUESTIONS];

  const pickRandom = (arr, count) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  };

  return [
    ...pickRandom(QUESTION_BANK[1], 5),
    ...pickRandom(QUESTION_BANK[2], 5),
    ...pickRandom(QUESTION_BANK[3], 5),
  ];
}
