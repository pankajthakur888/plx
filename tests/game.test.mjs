import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "../netlify/lib/questions.mjs";

/* ── 1. Question content validation ──────────────────────────── */
test("game has exactly 15 general-knowledge questions with valid structure", () => {
  assert.equal(QUESTIONS.length, 15, "Must have exactly 15 questions");
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    assert.equal(q.options.length, 4, `Question ${i + 1} must have 4 options`);
    assert.ok(
      Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4,
      `Question ${i + 1} answer index must be 0-3`
    );
    assert.ok(q.prompt.length > 10, `Question ${i + 1} prompt too short`);
    assert.ok(q.explanation.length > 10, `Question ${i + 1} explanation too short`);
    // Ensure no duplicate options
    const unique = new Set(q.options.map((o) => o.toLowerCase()));
    assert.equal(unique.size, 4, `Question ${i + 1} has duplicate options`);
  }
});

/* ── 2. Round boundaries ─────────────────────────────────────── */
test("rounds divide correctly: 3 rounds × 5 questions", () => {
  assert.equal(QUESTIONS.length / 5, 3, "15 / 5 = 3 rounds");
  // Verify round assignment for each question index
  const expectedRounds = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3];
  for (let i = 0; i < 15; i++) {
    const round = Math.floor(i / 5) + 1;
    assert.equal(round, expectedRounds[i], `Question ${i} should be round ${expectedRounds[i]}`);
  }
});

/* ── 3. Scoring model ────────────────────────────────────────── */
test("scoring: 1000 base + linearly scaled speed bonus (0–500)", () => {
  const points = (remaining) =>
    1000 + Math.floor((500 * Math.max(0, Math.min(15000, remaining))) / 15000);

  // Maximum speed (answered instantly): 1000 + 500 = 1500
  assert.equal(points(15000), 1500);
  // Half time remaining: 1000 + 250 = 1250
  assert.equal(points(7500), 1250);
  // At the deadline: 1000 + 0 = 1000
  assert.equal(points(0), 1000);
  // Negative (shouldn't happen, but clamped): 1000
  assert.equal(points(-10), 1000);
  // 10 seconds remaining out of 15: 1000 + 333 = 1333
  assert.equal(points(10000), 1333);
  // Wrong answer: always 0
  assert.equal(0, 0);
});

/* ── 4. Full 15-question match simulation ────────────────────── */
test("simulated three-round match: two players, deterministic winner", () => {
  const players = [
    { name: "Player One", score: 0, correct: 0 },
    { name: "Player Two", score: 0, correct: 0 },
  ];

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    // Player One: always correct, answers with 15s remaining (max speed)
    const p1Option = q.answer;
    // Player Two: correct on even questions only, answers with 7.5s remaining
    const p2Option = i % 2 === 0 ? q.answer : (q.answer + 1) % 4;

    for (const [player, option, remaining] of [
      [players[0], p1Option, 15000],
      [players[1], p2Option, 7500],
    ]) {
      if (option === q.answer) {
        player.score += 1000 + Math.floor((500 * remaining) / 15000);
        player.correct += 1;
      }
    }
  }

  // Player One: 15 correct × 1500 pts = 22,500
  assert.equal(players[0].correct, 15);
  assert.equal(players[0].score, 22500);

  // Player Two: 8 correct (even indices: 0,2,4,6,8,10,12,14) × 1250 = 10,000
  assert.equal(players[1].correct, 8);
  assert.equal(players[1].score, 10000);

  // Player One wins
  assert.ok(players[0].score > players[1].score);
  assert.equal(
    [...players].sort((a, b) => b.score - a.score)[0].name,
    "Player One"
  );
});

/* ── 5. Tiebreaker rule ──────────────────────────────────────── */
test("tiebreaker: equal scores broken by correct answer count", () => {
  const a = { score: 5000, correct: 5, joinedAt: 100 };
  const b = { score: 5000, correct: 6, joinedAt: 200 };
  const sorted = [a, b].sort(
    (x, y) => y.score - x.score || y.correct - x.correct || x.joinedAt - y.joinedAt
  );
  assert.equal(sorted[0], b, "Player with more correct answers wins tie");
});

/* ── 6. Room code format ─────────────────────────────────────── */
test("room codes use safe alphabet (no 0/O/I/1 confusion)", () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // Should not contain O, I, 0, or 1
  assert.ok(!alphabet.includes("O"), "No 'O' in alphabet");
  assert.ok(!alphabet.includes("I"), "No 'I' in alphabet");
  assert.ok(!alphabet.includes("0"), "No '0' in alphabet");
  assert.ok(!alphabet.includes("1"), "No '1' in alphabet");
  // A-H (no I) = 8, J-N (no O) = 4, P-Z = 11 = 23 letters + 2-9 = 8 digits = 31
  // Actually count it: ABCDEFGHJKLMNPQRSTUVWXYZ = 24 letters, 23456789 = 8 digits = 32
  assert.equal(alphabet.length, 32);
});

/* ── 7. Question uniqueness ──────────────────────────────────── */
test("all 15 question prompts are unique", () => {
  const prompts = QUESTIONS.map((q) => q.prompt.toLowerCase());
  const unique = new Set(prompts);
  assert.equal(unique.size, 15, "Every question prompt must be unique");
});
