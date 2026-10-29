import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomInt, timingSafeEqual, createHash } from "node:crypto";
import { QUESTIONS, createMatchQuestions, LEVEL_LABELS } from "./netlify/lib/questions.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

/* ── Constants & Types ─────────────────────────────────────────── */
const QUESTION_MS = 15_000;
const REVEAL_MS = 4_000;
const MAX_PLAYERS = 8;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * In-memory room storage for standalone / Docker server
 * Map<string, Room>
 */
const rooms = new Map();

function hash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a, b) {
  if (!a || !b) return false;
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

function cleanName(value) {
  if (typeof value !== "string") throw new Error("Enter a player name.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 18) {
    throw new Error("Player names must be 2–18 characters.");
  }
  if (/[<>]/.test(name)) throw new Error("Please use a simple player name.");
  return name;
}

function initialRoom(code, player, isSolo = false) {
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

function checkSession(room, body) {
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  const token = typeof body.token === "string" ? body.token : "";
  const player = room.players.find((p) => p.id === playerId);
  if (!player || !token || !safeEqual(player.tokenHash, hash(token))) {
    throw new Error("Your session is invalid. Rejoin the room.");
  }
  return player;
}

function sessionFor(room, player, token) {
  return {
    roomCode: room.code,
    playerId: player.id,
    token,
    name: player.name,
  };
}

function advanceDue(room) {
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

function publicState(room, playerId) {
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
        answered: room.answers[p.id] !== undefined,
      })),
      leaderboard: ordered.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correct: p.correct,
        connected: now - p.lastSeen < 25_000,
        isHost: p.isHost,
        answered: room.answers[p.id] !== undefined,
      })),
      ...(room.status === "playing" || reveal
        ? {
            question: {
              prompt: currentQuestion?.prompt ?? "",
              options: currentQuestion?.options ?? [],
              round: Math.min(3, Math.floor(room.questionIndex / 5) + 1),
              questionNumber: room.questionIndex + 1,
              deadline: room.questionDeadline ?? now,
              totalQuestions: questions.length,
              level: currentQuestion?.level ?? Math.min(3, Math.floor(room.questionIndex / 5) + 1),
              levelLabel: currentQuestion?.levelLabel ?? LEVEL_LABELS[Math.min(3, Math.floor(room.questionIndex / 5) + 1)],
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

/* ── Game API Action Router ────────────────────────────────────── */
function handleGameAction(body) {
  const action = typeof body.action === "string" ? body.action : "";

  if (action === "create") {
    const name = cleanName(body.name);
    const isSolo = Boolean(body.isSolo);
    let code = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = makeCode();
      if (!rooms.has(candidate)) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Could not reserve a room code. Please try again.");

    const token = makeToken();
    const player = {
      id: randomBytes(12).toString("hex"),
      name,
      tokenHash: hash(token),
      score: 0,
      correct: 0,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isHost: true,
    };
    const room = initialRoom(code, player, isSolo);

    // If solo mode was requested with immediate start, jump right into playing
    if (isSolo && body.autoStart) {
      const now = Date.now();
      room.status = "playing";
      room.startedAt = now;
      room.questionStartedAt = now;
      room.questionDeadline = now + QUESTION_MS;
      room.updatedAt = now;
    }

    rooms.set(code, room);
    return {
      session: sessionFor(room, player, token),
      ...publicState(room, player.id),
    };
  }

  if (action === "join") {
    const code = typeof body.code === "string" ? body.code.toUpperCase() : "";
    const room = rooms.get(code);
    if (!room) throw new Error("That room is unavailable or the game has started.");
    if (room.status !== "lobby") throw new Error("That room is unavailable or the game has started.");
    if (room.players.length >= MAX_PLAYERS) throw new Error("This room is full (8 players maximum).");

    const name = cleanName(body.name);
    if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("That name is already taken in this room.");
    }

    const token = makeToken();
    const player = {
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

    return {
      session: sessionFor(room, player, token),
      ...publicState(room, player.id),
    };
  }

  const roomCode = typeof body.roomCode === "string" ? body.roomCode.toUpperCase() : "";
  const room = rooms.get(roomCode);
  if (!room) throw new Error("Room not found or expired.");

  const player = checkSession(room, body);
  player.lastSeen = Date.now();
  advanceDue(room);

  if (action === "state") {
    return publicState(room, player.id);
  }

  if (action === "leave") {
    if (room.status === "lobby") {
      room.players = room.players.filter((p) => p.id !== player.id);
      if (player.isHost && room.players.length) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }
      if (!room.players.length) {
        rooms.delete(room.code);
        return { message: "Room closed." };
      }
      room.updatedAt = Date.now();
    }
    return { message: "You left the room." };
  }

  if (action === "start") {
    if (player.id !== room.hostId) throw new Error("Only the room host can start the game.");
    if (room.status !== "lobby") throw new Error("This game has already started.");

    if (room.players.length === 1) {
      room.isSolo = true;
    }

    const now = Date.now();
    room.status = "playing";
    room.startedAt = now;
    room.questionStartedAt = now;
    room.questionDeadline = now + QUESTION_MS;
    room.updatedAt = now;
    return publicState(room, player.id);
  }

  if (action === "answer") {
    if (room.status !== "playing") throw new Error("This question is no longer accepting answers.");
    if (Date.now() >= (room.questionDeadline ?? 0)) throw new Error("Time is up for this question.");

    const option = body.option;
    if (!Number.isInteger(option) || option < 0 || option > 3) {
      throw new Error("Choose one of the four answers.");
    }
    if (room.answers[player.id] !== undefined) {
      throw new Error("Your answer is already locked.");
    }

    room.answers[player.id] = option;
    room.answerTimes[player.id] = Date.now();
    room.updatedAt = Date.now();
    return publicState(room, player.id);
  }

  throw new Error("Unknown action.");
}

/* ── HTTP Server & Static File Handling ────────────────────────── */
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // Handle Game API
  if (
    req.method === "POST" &&
    (pathname === "/.netlify/functions/game" || pathname === "/api/game")
  ) {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 64) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const body = JSON.parse(raw);
        const result = handleGameAction(body);
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ error: err.message || "Game action failed." }));
      }
    });
    return;
  }

  // Static File Serving (GET and HEAD)
  if (req.method === "GET" || req.method === "HEAD") {
    let filePath = path.join(DIST_DIR, pathname === "/" ? "index.html" : pathname);
    
    // Normalize path to prevent directory traversal
    const safePath = path.normalize(filePath);
    if (!safePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(safePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
          "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
          "Content-Length": stats.size,
        });
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        fs.createReadStream(safePath).pipe(res);
      } else {
        // SPA Fallback: serve dist/index.html
        const indexPath = path.join(DIST_DIR, "index.html");
        fs.stat(indexPath, (err2, stats2) => {
          if (err2 || !stats2.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Frontend build not found. Run 'npm run build' first.");
            return;
          }
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
            "Content-Length": stats2.size,
          });
          if (req.method === "HEAD") {
            res.end();
            return;
          }
          fs.createReadStream(indexPath).pipe(res);
        });
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🎮 PLX-V0 Game Server running at http://0.0.0.0:${PORT}`);
  console.log(`👉 Open http://localhost:${PORT} in your browser`);
});

