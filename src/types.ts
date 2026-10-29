/* PLX-V0 — Shared public types (frontend) */

export type PublicPlayer = {
  id: string;
  name: string;
  score: number;
  correct: number;
  connected: boolean;
  isHost: boolean;
  answered: boolean;
  email?: string;
};

export type PublicQuestion = {
  prompt: string;
  options: string[];
  round: number;
  questionNumber: number;
  deadline: number;
  totalQuestions: number;
  level: number;
  levelLabel: string;
  category: string;
};

export type PublicState = {
  roomCode: string;
  status: "lobby" | "playing" | "reveal" | "finished";
  players: PublicPlayer[];
  hostId: string;
  question?: PublicQuestion;
  selectedOption?: number | null;
  correctOption?: number | null;
  explanation?: string;
  round: number;
  questionIndex: number;
  totalQuestions: number;
  questionEndsAt?: number;
  leaderboard: PublicPlayer[];
  message?: string;
  serverNow: number;
  isSolo?: boolean;
  verifiedEmail?: string | null;
};

export type ApiError = { error: string };
