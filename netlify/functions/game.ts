import { getStore } from "@netlify/blobs";
import { randomBytes, randomInt, timingSafeEqual, createHash } from "node:crypto";
import { QUESTIONS, createMatchQuestions, LEVEL_LABELS } from "../lib/questions.mjs";
import { cleanEmail, generateVerificationCode, verifyEmailCode, isEmailVerified } from "../lib/auth.mjs";

/* ── Types ─────────────────────────────────────────────────────── */

type Player = {
  id: string;
  name: string;
  tokenHash: string;
  score: number;
  correct: number;
  joinedAt: number;
  lastSeen: number;
  isHost: boolean;
  email?: string;
};

type Room = {
  code: string;
  hostId: string;
  status: "lobby" | "playing" | "reveal" | "finished";
  players: Player[];
  round: number;
  questionIndex: number;
  startedAt: number;
  updatedAt: number;
  questionStartedAt?: number;
  questionDeadline?: number;
  revealUntil?: number;
  answers: Record<string, number>;
  answerTimes: Record<string, number>;
  revealedQuestion?: number;
  createdAt: number;
  isSolo?: boolean;
  verifiedEmail?: string;
  questions?: any[];
};

type Session = {
  roomCode: string;
  playerId: string;
  token: string;
  name: string;
  verifiedEmail?: string;
};

/* ── Constants ─────────────────────────────────────────────────── */

const ROOM_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const QUESTION_MS = 15_000;
const REVEAL_MS = 4_000;
const MAX_PLAYERS = 8;
const MAX_RETRIES = 3;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/* ── Helpers ───────────────────────────────────────────────────── */

const store = () => getStore({ name: "plx-v0-rooms", consistency: "strong" });

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
    body: JSON.stringify(body),
  };
}

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

function makeToken() {
  return randomBytes(32).toString("base64url");
}

function makeCode() {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

function cleanName(value: unknown): string {
  if (typeof value !== "string") throw new Error("Enter a player name.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 18)
    throw new Error("Player names must be 2–18 characters.");
  if (/[<>]/.test(name)) throw new Error("Please use a simple player name.");
  return name;
}

/* ── Room I/O with ETag-based optimistic concurrency ──────────── */

async function readRoom(
  code: string
): Promise<{ room: Room; etag: string } | null> {
  if (!/^[A-Z0-9]{6}$/.test(code)) return null;
  const found = await store().getWithMetadata(code, {
    type: "json",
    consistency: "strong",
  });
  if (!found || !found.data || !found.etag) return null;
  return { room: found.data as Room, etag: found.etag };
}

async function writeRoom(room: Room, expectedEtag?: string) {
  const s = store();
  const result = await s.setJSON(room.code, room, {
    expiration: { seconds: ROOM_TTL_SECONDS },
    ...(expectedEtag
      ? { onlyIfMatch: expectedEtag }
      : { onlyIfNew: true }),
  });
  if (!result.modified) {
    throw new ConcurrencyError(
      "Room state changed simultaneously — retrying."
    );
  }
  return result.etag;
}

class ConcurrencyError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ConcurrencyError";
  }
}

/* ── Session validation ────────────────────────────────────────── */

function checkSession(room: Room, body: Record<string, unknown>) {
  const playerId =
    typeof body.playerId === "string" ? body.playerId : "";
  const token = typeof body.token === "string" ? body.token : "";
  const player = room.players.find((p) => p.id === playerId);
  if (!player || !token || !safeEqual(player.tokenHash, hash(token)))
    throw new Error("Your session is invalid. Rejoin the room.");
  return player;
}

function sessionFor(room: Room, player: Player, token: string): Session {
  return {
    roomCode: room.code,
    playerId: player.id,
    token,
    name: player.name,
    verifiedEmail: player.email || room.verifiedEmail || undefined,
  };
}

/* ── Public state projection (never leaks correct answers) ─────  */

function publicState(room: Room, playerId: string) {
  const now = Date.now();
  const questions = room.questions || QUESTIONS;
  const ordered = [...room.players].sort(
    (a, b) =>
      b.score - a.score ||
      b.correct - a.correct ||
      a.joinedAt - b.joinedAt
  );
  const currentQuestion =
    room.questionIndex < questions.length
      ? questions[room.questionIndex]
      : undefined;
  const reveal = room.status === "reveal" || room.status === "finished";

  return {
    state: {
      roomCode: room.code,
      status: room.status,
      hostId: room.hostId,
      isSolo: Boolean(room.isSolo || room.players.length === 1),
      verifiedEmail: room.verifiedEmail || null,
      round: Math.min(3, Math.floor(room.questionIndex / 5) + 1),
      questionIndex: room.questionIndex,
      totalQuestions: questions.length,
      serverNow: now,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correct: p.correct,
        connected: now - p.lastSeen < 25_000,
        isHost: p.isHost,
        answered:
          room.answers[p.id] !== undefined,
      })),
      leaderboard: ordered.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correct: p.correct,
        connected: now - p.lastSeen < 25_000,
        isHost: p.isHost,
        answered:
          room.answers[p.id] !== undefined,
      })),
      ...(room.status === "playing" || reveal
        ? {
            question: {
              prompt: currentQuestion?.prompt ?? "",
              options: currentQuestion?.options ?? [],
              round: Math.min(
                3,
                Math.floor(room.questionIndex / 5) + 1
              ),
              questionNumber: room.questionIndex + 1,
              deadline: room.questionDeadline ?? now,
              totalQuestions: questions.length,
              level: currentQuestion?.level ?? Math.min(3, Math.floor(room.questionIndex / 5) + 1),
              levelLabel: currentQuestion?.levelLabel ?? LEVEL_LABELS[Math.min(3, Math.floor(room.questionIndex / 5) + 1) as 1 | 2 | 3],
              category: currentQuestion?.category ?? "General",
            },
          }
        : {}),
      ...(reveal && currentQuestion
        ? {
            correctOption: currentQuestion.answer,
            explanation: currentQuestion.explanation,
          }
        : {}),
      ...(room.status === "playing" || room.status === "reveal"
        ? { selectedOption: room.answers[playerId] ?? null }
        : {}),
    },
  };
}

/* ── Room factory ──────────────────────────────────────────────── */

function initialRoom(code: string, player: Player, isSolo = false): Room {
  const now = Date.now();
  return {
    code,
    hostId: player.id,
    status: "lobby",
    players: [player],
    round: 1,
    questionIndex: 0,
    startedAt: 0,
    updatedAt: now,
    answers: {},
    answerTimes: {},
    createdAt: now,
    isSolo: Boolean(isSolo),
    questions: createMatchQuestions(true),
  };
}

/* ── Game phase advancement ────────────────────────────────────── */

function advanceDue(room: Room) {
  const now = Date.now();
  const questions = room.questions || QUESTIONS;

  // Phase: playing → reveal (time expired or everyone answered)
  if (
    room.status === "playing" &&
    room.questionDeadline &&
    (now >= room.questionDeadline ||
      room.players.every((p) => room.answers[p.id] !== undefined))
  ) {
    const q = questions[room.questionIndex];
    for (const p of room.players) {
      const submitted = room.answers[p.id];
      if (submitted === q.answer) {
        const elapsed = Math.max(
          0,
          Math.min(
            QUESTION_MS,
            (room.answerTimes[p.id] ?? room.questionDeadline) -
              (room.questionStartedAt ?? now)
          )
        );
        const remaining = Math.max(0, QUESTION_MS - elapsed);
        const bonus = Math.floor((500 * remaining) / QUESTION_MS);
        p.score += 1000 + bonus;
        p.correct += 1;
      }
    }
    room.status = "reveal";
    room.revealUntil = now + REVEAL_MS;
    room.updatedAt = now;
  }

  // Phase: reveal → next question or finished
  if (
    room.status === "reveal" &&
    room.revealUntil &&
    now >= room.revealUntil
  ) {
    room.questionIndex += 1;
    room.answers = {};
    room.answerTimes = {};
    room.revealedQuestion = undefined;

    if (room.questionIndex >= questions.length) {
      room.status = "finished";
    } else {
      room.status = "playing";
      room.questionStartedAt = now;
      room.questionDeadline = now + QUESTION_MS;
    }
    room.updatedAt = now;
  }
}

/* ── Retry wrapper for optimistic-concurrency actions ─────────── */

async function withRetry<T>(
  roomCode: string,
  fn: (room: Room, etag: string, player: Player) => Promise<T>,
  body: Record<string, unknown>
): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const found = await readRoom(roomCode);
    if (!found) throw new Error("Room not found or expired.");
    const player = checkSession(found.room, body);
    player.lastSeen = Date.now();
    advanceDue(found.room);
    try {
      return await fn(found.room, found.etag, player);
    } catch (e) {
      if (e instanceof ConcurrencyError && attempt < MAX_RETRIES - 1) {
        // Brief pause before retry
        await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Too many concurrent updates. Please try again.");
}

/* ── Request handler ───────────────────────────────────────────── */

export default async (request: Request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return json(204, "");
  }
  if (request.method !== "POST") {
    return json(405, { error: "Use POST for game actions." });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Request body must be valid JSON." });
  }

  const action = typeof body.action === "string" ? body.action : "";

  try {
    /* ── Send email verification code ────────────────────────── */
    if (action === "send_verification") {
      const result = generateVerificationCode(body.email);
      return json(200, {
        ok: true,
        email: result.email,
        expiresAt: result.expiresAt,
        message: `Verification code sent to ${result.email}.`,
        previewCode: result.code,
      });
    }

    /* ── Verify email code ────────────────────────────────────── */
    if (action === "verify_email") {
      const result = verifyEmailCode(body.email, body.code as string);
      return json(200, {
        ok: true,
        email: result.email,
        emailToken: result.emailToken,
        message: "Email verified successfully!",
      });
    }

    /* ── Create room ──────────────────────────────────────────── */
    if (action === "create") {
      const name = cleanName(body.name);
      const isSolo = Boolean(body.isSolo);
      let verifiedEmail: string | undefined = undefined;

      if (isSolo) {
        const email = cleanEmail(body.email);
        const emailToken = typeof body.emailToken === "string" ? body.emailToken : "";
        const verificationCode = typeof body.verificationCode === "string" ? body.verificationCode : "";

        if (emailToken && isEmailVerified(email, emailToken)) {
          verifiedEmail = email;
        } else if (verificationCode) {
          const verifyRes = verifyEmailCode(email, verificationCode);
          verifiedEmail = verifyRes.email;
        } else {
          throw new Error("Email ID verification is required for Solo Warm-up.");
        }
      }

      for (let attempt = 0; attempt < 8; attempt++) {
        const code = makeCode();
        const token = makeToken();
        const player: Player = {
          id: randomBytes(12).toString("hex"),
          name,
          tokenHash: hash(token),
          score: 0,
          correct: 0,
          joinedAt: Date.now(),
          lastSeen: Date.now(),
          isHost: true,
          email: verifiedEmail,
        };
        const room = initialRoom(code, player, isSolo);
        if (verifiedEmail) {
          room.verifiedEmail = verifiedEmail;
        }

        if (isSolo && body.autoStart) {
          const now = Date.now();
          room.status = "playing";
          room.startedAt = now;
          room.questionStartedAt = now;
          room.questionDeadline = now + QUESTION_MS;
          room.updatedAt = now;
        }

        try {
          await writeRoom(room);
          return json(200, {
            session: sessionFor(room, player, token),
            ...publicState(room, player.id),
          });
        } catch (e) {
          if (e instanceof ConcurrencyError) continue;
          throw e;
        }
      }
      throw new Error("Could not reserve a room code. Please try again.");
    }

    /* ── Join room ────────────────────────────────────────────── */
    if (action === "join") {
      const code =
        typeof body.code === "string"
          ? body.code.toUpperCase()
          : "";
      const name = cleanName(body.name);
      const token = makeToken();

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const found = await readRoom(code);
        if (!found)
          throw new Error(
            "That room is unavailable or the game has started."
          );
        const room = found.room;
        if (room.status !== "lobby")
          throw new Error(
            "That room is unavailable or the game has started."
          );
        if (room.players.length >= MAX_PLAYERS)
          throw new Error(
            "This room is full (8 players maximum)."
          );
        if (
          room.players.some(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          )
        )
          throw new Error(
            "That name is already taken in this room."
          );

        const player: Player = {
          id: randomBytes(12).toString("hex"),
          name,
          tokenHash: hash(token),
          score: 0,
          correct: 0,
          joinedAt: Date.now(),
          lastSeen: Date.now(),
          isHost: false,
        };
        room.players.push(player);
        room.updatedAt = Date.now();

        try {
          await writeRoom(room, found.etag);
          return json(200, {
            session: sessionFor(room, player, token),
            ...publicState(room, player.id),
          });
        } catch (e) {
          if (
            e instanceof ConcurrencyError &&
            attempt < MAX_RETRIES - 1
          ) {
            await new Promise((r) =>
              setTimeout(r, 50 * (attempt + 1))
            );
            continue;
          }
          throw e;
        }
      }
      throw new Error(
        "Too many people joining at once. Please try again."
      );
    }

    /* ── Authenticated actions (with retry) ───────────────────── */

    const roomCode =
      typeof body.roomCode === "string"
        ? body.roomCode.toUpperCase()
        : "";

    /* ── State polling ────────────────────────────────────────── */
    if (action === "state") {
      return await withRetry(
        roomCode,
        async (room, etag, player) => {
          const now = Date.now();
          const heartbeatDue = now - player.lastSeen >= 10_000;
          if (
            room.status !== room.status ||
            heartbeatDue
          ) {
            room.updatedAt = now;
            try {
              await writeRoom(room, etag);
            } catch {
              // Write failures on state poll are non-critical
            }
          }
          return json(200, publicState(room, player.id));
        },
        body
      );
    }

    /* ── Leave room ───────────────────────────────────────────── */
    if (action === "leave") {
      return await withRetry(
        roomCode,
        async (room, etag, player) => {
          if (room.status === "lobby") {
            room.players = room.players.filter(
              (p) => p.id !== player.id
            );
            if (player.isHost && room.players.length) {
              room.hostId = room.players[0].id;
              room.players[0].isHost = true;
            }
            if (!room.players.length) {
              await store().delete(room.code);
              return json(200, { message: "Room closed." });
            }
            room.updatedAt = Date.now();
            await writeRoom(room, etag);
          }
          return json(200, { message: "You left the room." });
        },
        body
      );
    }

    /* ── Start game ───────────────────────────────────────────── */
    if (action === "start") {
      return await withRetry(
        roomCode,
        async (room, etag, player) => {
          if (player.id !== room.hostId)
            throw new Error(
              "Only the room host can start the game."
            );
          if (room.status !== "lobby")
            throw new Error("This game has already started.");

          if (room.players.length === 1) {
            room.isSolo = true;
          }

          if (room.isSolo && !room.verifiedEmail) {
            const email = typeof body.email === "string" ? cleanEmail(body.email) : null;
            const emailToken = typeof body.emailToken === "string" ? body.emailToken : "";
            const verificationCode = typeof body.verificationCode === "string" ? body.verificationCode : "";

            if (email && emailToken && isEmailVerified(email, emailToken)) {
              room.verifiedEmail = email;
              player.email = email;
            } else if (email && verificationCode) {
              const verifyRes = verifyEmailCode(email, verificationCode);
              room.verifiedEmail = verifyRes.email;
              player.email = verifyRes.email;
            } else {
              throw new Error("Email ID verification is required for Solo Warm-up.");
            }
          }

          const now = Date.now();
          room.status = "playing";
          room.startedAt = now;
          room.questionStartedAt = now;
          room.questionDeadline = now + QUESTION_MS;
          room.updatedAt = now;

          await writeRoom(room, etag);
          return json(200, publicState(room, player.id));
        },
        body
      );
    }

    /* ── Submit answer ────────────────────────────────────────── */
    if (action === "answer") {
      return await withRetry(
        roomCode,
        async (room, etag, player) => {
          if (room.status !== "playing")
            throw new Error(
              "This question is no longer accepting answers."
            );
          if (Date.now() >= (room.questionDeadline ?? 0))
            throw new Error("Time is up for this question.");

          const option = body.option;
          if (
            !Number.isInteger(option) ||
            (option as number) < 0 ||
            (option as number) > 3
          )
            throw new Error(
              "Choose one of the four answers."
            );
          if (room.answers[player.id] !== undefined)
            throw new Error("Your answer is already locked.");

          room.answers[player.id] = option as number;
          room.answerTimes[player.id] = Date.now();
          room.updatedAt = Date.now();

          await writeRoom(room, etag);
          return json(200, publicState(room, player.id));
        },
        body
      );
    }

    return json(400, { error: "Unknown action." });
  } catch (e) {
    return json(400, {
      error:
        e instanceof Error ? e.message : "Game action failed.",
    });
  }
};
