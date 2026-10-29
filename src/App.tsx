import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Crown,
  Gamepad2,
  Link2,
  LoaderCircle,
  LogOut,
  PartyPopper,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wifi,
  X,
} from "lucide-react";
import type { PublicState } from "./types";

/* ── Config ────────────────────────────────────────────────────── */
const API = "/.netlify/functions/game";
const SESSION_KEY = "plx-v0-session";
const POLL_MS = 900;

type Session = {
  roomCode: string;
  playerId: string;
  token: string;
  name: string;
};

const letters = ["A", "B", "C", "D"];
const optionColors = ["coral", "yellow", "mint", "purple"];
const ROUND_NAMES = ["", "Warm-up", "Brain Rush", "Final Showdown"];

/* ── Session persistence ───────────────────────────────────────── */
function getSession(): Session | null {
  try {
    const v = localStorage.getItem(SESSION_KEY);
    return v ? (JSON.parse(v) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

/* ── API caller ────────────────────────────────────────────────── */
async function callApi(
  action: string,
  body: Record<string, unknown> = {},
  session?: Session
) {
  const response = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action,
      ...body,
      ...(session
        ? {
            roomCode: session.roomCode,
            playerId: session.playerId,
            token: session.token,
          }
        : {}),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      (data as { error?: string }).error || `Request failed (${response.status})`
    );
  return data as Record<string, unknown>;
}

/* ── Simple confetti ───────────────────────────────────────────── */
function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    "#6c42e8",
    "#ff6b6b",
    "#ffd166",
    "#06d6a0",
    "#5e60ce",
    "#ff9f1c",
    "#e63946",
    "#a8dadc",
  ];
  const particles = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: Math.random() * 8 + 4,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 3 + 2,
    spin: Math.random() * 0.2 - 0.1,
    angle: Math.random() * Math.PI * 2,
    opacity: 1,
  }));

  let frame = 0;
  const maxFrames = 180;

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.angle += p.spin;
      if (frame > maxFrames - 40) {
        p.opacity = Math.max(0, p.opacity - 0.025);
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (frame < maxFrames) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════════════════
   App Component
   ═══════════════════════════════════════════════════════════════ */

function App() {
  /* ── State ───────────────────────────────────────────────────── */
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [state, setState] = useState<PublicState | null>(null);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [prevScore, setPrevScore] = useState(0);
  const [scoreDelta, setScoreDelta] = useState(0);
  const inFlight = useRef(false);
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const confettiFired = useRef(false);

  /* ── Refresh (poll server state) ─────────────────────────────── */
  const refresh = useCallback(async (s: Session, silent = true) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await callApi("state", {}, s);
      setState(data.state as PublicState);
      setError("");
    } catch (e) {
      if (!silent)
        setError(e instanceof Error ? e.message : "Could not reconnect.");
    } finally {
      inFlight.current = false;
    }
  }, []);

  /* ── Timer tick ──────────────────────────────────────────────── */
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, []);

  /* ── Polling loop ────────────────────────────────────────────── */
  useEffect(() => {
    if (!session) {
      setState(null);
      return;
    }
    let active = true;
    const poll = async () => {
      if (active) await refresh(session);
    };
    void poll();
    const id = window.setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(session, false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session, refresh]);

  /* ── Confetti on finish ──────────────────────────────────────── */
  useEffect(() => {
    if (
      state?.status === "finished" &&
      !confettiFired.current &&
      confettiRef.current
    ) {
      confettiFired.current = true;
      launchConfetti(confettiRef.current);
    }
    if (state?.status !== "finished") {
      confettiFired.current = false;
    }
  }, [state?.status]);

  /* ── Score delta tracking ────────────────────────────────────── */
  const player = state?.players.find((p) => p.id === session?.playerId);
  useEffect(() => {
    if (player) {
      const delta = player.score - prevScore;
      if (delta > 0) {
        setScoreDelta(delta);
        const t = setTimeout(() => setScoreDelta(0), 1200);
        return () => clearTimeout(t);
      }
      setPrevScore(player.score);
    }
  }, [player?.score, prevScore, player]);

  /* ── Generic action handler ──────────────────────────────────── */
  const act = async (action: string, body: Record<string, unknown> = {}) => {
    if (!session) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const data = await callApi(action, body, session);
      if (data.session) {
        setSession(data.session as Session);
        saveSession(data.session as Session);
      }
      if (data.state) setState(data.state as PublicState);
      if (data.message) setNotice(data.message as string);
      await refresh((data.session as Session | undefined) ?? session, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Room actions ────────────────────────────────────────────── */
  const startSoloWarmup = async () => {
    setLoading(true);
    setError("");
    try {
      const playerName = name.trim() || "Warm-up Player";
      const data = await callApi("create", {
        name: playerName,
        isSolo: true,
        autoStart: true,
      });
      setSession(data.session as Session);
      saveSession(data.session as Session);
      setState(data.state as PublicState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start solo warmup.");
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await callApi("create", { name: name.trim() });
      setSession(data.session as Session);
      saveSession(data.session as Session);
      setState(data.state as PublicState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create room.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await callApi("join", {
        name: name.trim(),
        code: joinCode.trim().toUpperCase(),
      });
      setSession(data.session as Session);
      saveSession(data.session as Session);
      setState(data.state as PublicState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join room.");
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    if (session) {
      try {
        await callApi("leave", {}, session);
      } catch {
        /* graceful offline exit */
      }
    }
    setSession(null);
    saveSession(null);
    setState(null);
    setError("");
    setNotice("");
  };

  const copyCode = async () => {
    if (!state) return;
    try {
      await navigator.clipboard.writeText(state.roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice(`Room code: ${state.roomCode}`);
    }
  };

  const shareRoom = async () => {
    if (!state) return;
    const text = `Join my PLX-V0 Quiz Battle! Room code: ${state.roomCode}`;
    try {
      if (navigator.share)
        await navigator.share({ title: "PLX-V0 Quiz Battle", text });
      else await navigator.clipboard.writeText(text);
      setNotice("Invite ready to share!");
    } catch {
      /* user dismissed share sheet */
    }
  };

  /* ── Computed values ─────────────────────────────────────────── */
  const isHost = !!player?.isHost;
  const serverOffset = state ? state.serverNow - Date.now() : 0;
  const seconds = state?.question
    ? Math.max(
        0,
        Math.ceil((state.question.deadline - (now + serverOffset)) / 1000)
      )
    : 0;
  const progress = state
    ? state.status === "finished"
      ? 100
      : ((state.questionIndex +
          (state.status === "reveal" ? 1 : 0)) /
          state.totalQuestions) *
        100
    : 0;
  const ordered = useMemo(
    () => state?.leaderboard ?? [],
    [state?.leaderboard]
  );
  const questionLocked =
    !!player?.answered ||
    (state?.selectedOption !== undefined && state?.selectedOption !== null);
  const roundName = ROUND_NAMES[state?.round ?? 0] || "";

  /* ═════════════════════════════════════════════════════════════
     RENDER: Landing / Create-or-Join
     ═════════════════════════════════════════════════════════════ */

  if (!session || !state)
    return (
      <main className="page landing">
        <header className="topbar">
          <a className="brand" href="#">
            <span className="brand-mark">
              <Gamepad2 size={22} />
            </span>{" "}
            PLX<span className="brand-dot">•</span>V0
          </a>
          <span className="top-pill">
            <span className="live-dot" /> MULTIPLAYER PARTY
          </span>
        </header>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} /> YOUR FRIENDS. YOUR BRAIN. YOUR BATTLE.
            </div>
            <h1>
              Big brain.
              <br />
              <span className="gradient-text">Bigger bragging.</span>
            </h1>
            <p className="hero-sub">
              A tiny quiz battle with big party energy. Gather your crew, race
              the clock, and claim the crown.
            </p>
            <div className="feature-row">
              <span>
                <Users size={16} /> 2–8 players
              </span>
              <span>
                <Clock3 size={16} /> 15 seconds
              </span>
              <span>
                <Trophy size={16} /> 1 winner
              </span>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="float-card card-star">
                <Sparkles size={22} />
              </div>
              <div className="float-card card-trophy">
                <Trophy size={40} />
              </div>
              <div className="float-card card-bolt">⚡</div>
              <div className="big-blob">
                <span>?</span>
              </div>
              <div className="float-card card-confetti">✦</div>
              <div className="art-caption">LET THE GAMES BEGIN</div>
            </div>
          </div>
          <div className="entry-card">
            <div className="entry-heading">
              <span className="entry-icon">
                <PartyPopper size={24} />
              </span>
              <div>
                <h2>Jump into the fun</h2>
                <p>Make a room or join your people.</p>
              </div>
            </div>
            <label className="field-label" htmlFor="player-name">
              YOUR PLAYER NAME
            </label>
            <input
              id="player-name"
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quiz Wizard"
              autoComplete="nickname"
            />
            <div className="entry-actions">
              <button
                className="btn btn-primary full"
                disabled={loading}
                onClick={() => void startSoloWarmup()}
              >
                {loading ? (
                  <LoaderCircle className="spin" />
                ) : (
                  <Sparkles size={18} />
                )}{" "}
                Start Solo Warm-up <ArrowRight size={18} />
              </button>
              <button
                className="btn btn-secondary full"
                disabled={loading || name.trim().length < 2}
                onClick={() => void createRoom()}
              >
                {loading ? (
                  <LoaderCircle className="spin" />
                ) : (
                  <Plus size={18} />
                )}{" "}
                Create Multiplayer Room
              </button>
            </div>
            <div className="or-divider">
              <span /> OR <span />
            </div>
            <label className="field-label" htmlFor="room-code">
              HAVE A ROOM CODE?
            </label>
            <div className="join-row">
              <input
                id="room-code"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="ABC123"
                maxLength={6}
              />
              <button
                className="btn btn-dark"
                disabled={
                  loading ||
                  name.trim().length < 2 ||
                  joinCode.length !== 6
                }
                onClick={() => void joinRoom()}
              >
                {loading ? (
                  <LoaderCircle className="spin" />
                ) : (
                  <ArrowRight size={19} />
                )}{" "}
                Join
              </button>
            </div>
            <p className="tiny-note">
              <ShieldCheck size={14} /> Free to play · No account needed · Play
              from anywhere
            </p>
            {error && (
              <div className="alert alert-error">
                <X size={16} />
                {error}
              </div>
            )}
          </div>
        </section>
        <footer className="landing-footer">
          <span>BUILT FOR FRIEND GROUPS EVERYWHERE</span>
          <span>GOOD VIBES. QUESTIONABLE ANSWERS.</span>
        </footer>
      </main>
    );

  /* ═════════════════════════════════════════════════════════════
     RENDER: Lobby
     ═════════════════════════════════════════════════════════════ */

  if (state.status === "lobby")
    return (
      <main className="page game-page">
        <header className="topbar">
          <a className="brand" href="#">
            <span className="brand-mark">
              <Gamepad2 size={22} />
            </span>{" "}
            PLX<span className="brand-dot">•</span>V0
          </a>
          <button className="text-button" onClick={() => void leaveRoom()}>
            <LogOut size={16} /> Leave room
          </button>
        </header>
        <section className="lobby-layout">
          <div className="lobby-main">
            <div className="eyebrow">
              <span className="live-dot" /> ROOM IS OPEN
            </div>
            <h1>
              Waiting for
              <br />
              <span className="gradient-text">your crew.</span>
            </h1>
            <p className="hero-sub">
              Send the code to your favorite people. The more brains, the more
              chaos.
            </p>
            <div className="room-code-card">
              <div>
                <span className="field-label">YOUR ROOM CODE</span>
                <div className="room-code">{state.roomCode}</div>
                <span className="muted">Share it with friends to join</span>
              </div>
              <div className="code-actions">
                <button
                  className="btn btn-light"
                  onClick={() => void copyCode()}
                >
                  <Link2 size={17} />
                  {copied ? "Copied!" : "Copy code"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => void shareRoom()}
                >
                  Invite <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="rule-strip">
              <span>
                <Clock3 size={17} /> 15 sec per question
              </span>
              <span>
                <Trophy size={17} /> 3 rounds · 15 questions
              </span>
              <span>
                <Sparkles size={17} /> Speed bonus points
              </span>
            </div>
          </div>
          <aside className="players-card">
            <div className="players-card-head">
              <div>
                <h2>
                  Your crew{" "}
                  <span className="count-badge">
                    {state.players.length}/8
                  </span>
                </h2>
                <p>At least 2 players needed</p>
              </div>
              <span className="players-icon">
                <Users size={21} />
              </span>
            </div>
            <div className="player-list">
              {state.players.map((p, i) => (
                <div className="player-row" key={p.id}>
                  <div className={`avatar avatar-${i % 8}`}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="player-meta">
                    <strong>
                      {p.name}{" "}
                      {p.id === session.playerId && (
                        <span className="you-tag">YOU</span>
                      )}
                    </strong>
                    <span>
                      {p.isHost ? "Room host" : "Player"} ·{" "}
                      {p.connected ? "Connected" : "Reconnecting…"}
                    </span>
                  </div>
                  {p.isHost && <Crown className="host-crown" size={19} />}
                </div>
              ))}
            </div>
            {isHost ? (
              <button
                className="btn btn-primary full start-btn"
                disabled={loading}
                onClick={() => void act("start")}
              >
                {state.players.length === 1 ? (
                  <>
                    <Sparkles size={18} /> Start Solo Warm-up <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <PartyPopper size={18} /> Start the Battle <ArrowRight size={18} />
                  </>
                )}
              </button>
            ) : (
              <div className="waiting-note">
                <span className="pulse-dot" /> Waiting for the host to start…
              </div>
            )}
            {isHost && state.players.length === 1 && (
              <p className="center-note">
                Play solo for a quick warmup, or share the room code with friends!
              </p>
            )}
            <div className="game-rules-mini">
              <strong>HOW TO WIN</strong>
              <p>
                Answer 15 general-knowledge questions. Correct answers earn
                up to 1,500 points. Highest score takes the crown.
              </p>
            </div>
          </aside>
        </section>
        {error && <div className="toast toast-error">{error}</div>}
        {notice && <div className="toast">{notice}</div>}
      </main>
    );

  /* ═════════════════════════════════════════════════════════════
     RENDER: Results / Winner
     ═════════════════════════════════════════════════════════════ */

  if (state.status === "finished")
    return (
      <main className="page game-page results-page">
        <canvas ref={confettiRef} className="confetti-canvas" />
        <header className="topbar">
          <a className="brand" href="#">
            <span className="brand-mark">
              <Gamepad2 size={22} />
            </span>{" "}
            PLX<span className="brand-dot">•</span>V0
          </a>
          <button className="text-button" onClick={() => void leaveRoom()}>
            <LogOut size={16} /> Exit game
          </button>
        </header>
        <section className="results-wrap">
          <div className="winner-confetti" aria-hidden="true">
            ✦　✹　✦　✧　✹　✦
          </div>
          {state.isSolo ? (
            <>
              <div className="eyebrow centered">
                <Sparkles size={15} /> SOLO PRACTICE SESSION
              </div>
              <h1 className="results-title">Warm-up Complete!</h1>
              <div className="winner-card">
                <div className="winner-crown">
                  <Trophy size={35} />
                </div>
                <div className="winner-avatar">
                  {ordered[0]?.name.slice(0, 1).toUpperCase() ?? "🎯"}
                </div>
                <h2>{ordered[0]?.name ?? "Player"}</h2>
                <div className="winner-score">
                  {(ordered[0]?.score ?? 0).toLocaleString()}{" "}
                  <span>POINTS</span>
                </div>
                <div className="solo-eval-badge">
                  {(ordered[0]?.correct ?? 0) >= 14
                    ? "🏆 Flawless Mastermind!"
                    : (ordered[0]?.correct ?? 0) >= 11
                    ? "⚡ Quiz Whiz — High Speed!"
                    : (ordered[0]?.correct ?? 0) >= 8
                    ? "🧠 Great Warm-up — Sharp Brain!"
                    : "🌱 Good Practice Session!"}
                </div>
                <p>
                  {ordered[0]?.correct ?? 0} of 15 questions answered correctly.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow centered">
                <PartyPopper size={15} /> THAT&apos;S A WRAP
              </div>
              <h1 className="results-title">The crown goes to...</h1>
              <div className="winner-card">
                <div className="winner-crown">
                  <Crown size={35} />
                </div>
                <div className="winner-avatar">
                  {ordered[0]?.name.slice(0, 1).toUpperCase() ?? "?"}
                </div>
                <h2>{ordered[0]?.name ?? "No winner"}</h2>
                <div className="winner-score">
                  {(ordered[0]?.score ?? 0).toLocaleString()}{" "}
                  <span>POINTS</span>
                </div>
                <p>
                  {ordered[0]?.correct ?? 0} correct answers · Absolutely iconic.
                </p>
              </div>
            </>
          )}
          <div className="final-leaderboard">
            <h2>
              <Trophy size={20} /> Final leaderboard
            </h2>
            {ordered.map((p, i) => (
              <div
                className={`leader-row ${i === 0 ? "leader-first" : ""}`}
                key={p.id}
              >
                <span className="rank">
                  {i === 0 ? <Crown size={17} /> : `#${i + 1}`}
                </span>
                <div className={`avatar avatar-${i % 8}`}>
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <strong>
                  {p.name}
                  {p.id === session.playerId ? (
                    <span className="you-tag">YOU</span>
                  ) : null}
                </strong>
                <span className="correct-count">{p.correct}/15 correct</span>
                <b>{p.score.toLocaleString()}</b>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => void leaveRoom()}
          >
            <RefreshCw size={17} /> Play another time
          </button>
        </section>
      </main>
    );

  /* ═════════════════════════════════════════════════════════════
     RENDER: Live Quiz (playing / reveal)
     ═════════════════════════════════════════════════════════════ */

  const question = state.question;
  return (
    <main className="page game-page quiz-page">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">
            <Gamepad2 size={22} />
          </span>{" "}
          PLX<span className="brand-dot">•</span>V0
        </a>
        <div className="quiz-top-right">
          <span className="room-mini">
            ROOM <strong>{state.roomCode}</strong>
          </span>
          <span className="players-mini">
            <Users size={16} />
            {state.players.length}
          </span>
          <button className="text-button" onClick={() => void leaveRoom()}>
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <section className="quiz-wrap">
        {/* Meta bar */}
        <div className="quiz-meta">
          <div className="round-label">
            ROUND {question?.round ?? state.round}{" "}
            {roundName && (
              <>
                <span>·</span> {roundName}
              </>
            )}{" "}
            <span>·</span> QUESTION {Math.min(state.questionIndex + 1, 15)} OF
            15
          </div>
          <div className="score-chip" style={{ position: "relative" }}>
            <Trophy size={15} />
            {(player?.score ?? 0).toLocaleString()} <span>PTS</span>
            {scoreDelta > 0 && (
              <span className="score-pop" key={player?.score}>
                +{scoreDelta.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Reveal banner */}
        {state.status === "reveal" && (
          <div className="reveal-banner">
            <Check size={18} /> Answer revealed!{" "}
            <span>Next question starting soon…</span>
          </div>
        )}

        {/* Question card */}
        <div className="question-card" key={state.questionIndex}>
          <div className="question-top">
            <div className="question-badges">
              <span className={`level-pill level-${question?.level ?? 1}`}>
                {question?.levelLabel ?? `Level ${question?.round ?? 1}`}
              </span>
              <span className="category-pill">
                <Sparkles size={13} /> {question?.category?.toUpperCase() ?? "GENERAL"}
              </span>
              {state.isSolo && (
                <span className="solo-pill">
                  🎯 SOLO WARM-UP
                </span>
              )}
            </div>
            <div
              className={`timer ${
                seconds <= 3
                  ? "timer-critical"
                  : seconds <= 5
                  ? "timer-low"
                  : ""
              }`}
            >
              <Clock3 size={17} />
              <strong>{seconds.toString().padStart(2, "0")}</strong>
              <span>SEC</span>
            </div>
          </div>
          <div className="question-number">
            QUESTION {(state.questionIndex % 5) + 1}
            <span> / 5</span>
          </div>
          <h1>{question?.prompt ?? "Get ready!"}</h1>
          <div className="answer-grid">
            {(question?.options ?? []).map((option, i) => {
              const selected = state.selectedOption === i;
              const correct =
                state.status === "reveal" && state.correctOption === i;
              const wrong =
                state.status === "reveal" && selected && !correct;
              return (
                <button
                  key={`${state.questionIndex}-${i}`}
                  className={`answer-option ${optionColors[i]} ${
                    selected ? "answer-selected" : ""
                  } ${correct ? "answer-correct" : ""} ${
                    wrong ? "answer-wrong" : ""
                  }`}
                  disabled={
                    loading ||
                    state.status !== "playing" ||
                    questionLocked ||
                    seconds <= 0
                  }
                  onClick={() => void act("answer", { option: i })}
                >
                  <span className="option-letter">{letters[i]}</span>
                  <span>{option}</span>
                  {correct && <Check size={20} />}
                  {wrong && <X size={20} />}
                </button>
              );
            })}
          </div>

          {/* Footer during play */}
          {state.status === "playing" && (
            <div className="question-footer">
              <span>
                <ShieldCheck size={15} /> Answer locks once submitted
              </span>
              <span>
                {state.players.filter((p) => p.answered).length}/
                {state.players.length} answered
              </span>
            </div>
          )}

          {/* Explanation during reveal */}
          {state.status === "reveal" && (
            <div className="explanation-box">
              <div className="explanation-icon">
                <Check size={17} />
              </div>
              <div>
                <strong>
                  {state.selectedOption === state.correctOption
                    ? "Nice one! 🎉"
                    : state.selectedOption === null ||
                      state.selectedOption === undefined
                    ? "You didn't answer in time."
                    : "Better luck next time!"}
                </strong>
                <p>{state.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Live scoreboard */}
        <div className="live-scoreboard">
          <div className="scoreboard-heading">
            <h2>
              <Wifi size={17} /> Live leaderboard
            </h2>
            <span>UPDATING LIVE</span>
          </div>
          <div className="scoreboard-list">
            {ordered.map((p, i) => (
              <div className="scoreboard-player" key={p.id}>
                <span className="score-rank">{i + 1}</span>
                <div className={`avatar avatar-${i % 8}`}>
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="score-name">
                  {p.name}
                  {p.id === session.playerId && <small> YOU</small>}
                </span>
                <span className="answered-state">
                  {state.status === "reveal" || p.answered ? (
                    <Check size={14} />
                  ) : (
                    <span className="answer-wait-dot" />
                  )}
                </span>
                <strong>{p.score.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Toasts */}
      {error && <div className="toast toast-error">{error}</div>}
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}

export default App;
